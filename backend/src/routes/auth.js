const express  = require("express");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { PrismaClient } = require("@prisma/client");
const redis    = require("../lib/redis");
const { sendOtpEmail } = require("../lib/mailer");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function safeUser(user) {
  const { password, otpCode, otpExpiresAt, ...rest } = user;
  return rest;
}

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required." });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(401).json({ error: "Invalid email or password." });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid email or password." });

    if (user.status === "suspended") return res.status(403).json({ error: "Account suspended." });

    const token = signToken(user);
    res.json({ token, user: safeUser(user) });
  } catch (err) { next(err); }
});

// POST /api/auth/register
router.post("/register", async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone = "" } = req.body;
    if (!firstName || !lastName || !email || !password)
      return res.status(400).json({ error: "All fields are required." });

    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) return res.status(409).json({ error: "Email already registered." });

    const hash = await bcrypt.hash(password, 10);
    const otp  = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    const user = await prisma.user.create({
      data: { firstName, lastName, email: email.toLowerCase(), password: hash, phone, otpCode: otp, otpExpiresAt },
    });

    // Send verification email via SMTP
    try {
      await sendOtpEmail(user.email, otp, "verification");
    } catch (emailErr) {
      console.error("Registration email failed:", emailErr.message);
      if (process.env.NODE_ENV !== "production") {
        console.log(`[dev] OTP for ${email}: ${otp}`);
      }
    }

    res.status(201).json({ user_id: user.id, email: user.email });
  } catch (err) { next(err); }
});

// POST /api/auth/verify-email
router.post("/verify-email", async (req, res, next) => {
  try {
    const { userId, code } = req.body;
    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user) return res.status(404).json({ error: "User not found." });

    if (!user.otpCode || user.otpCode !== code)
      return res.status(400).json({ error: "Invalid verification code." });

    if (user.otpExpiresAt < new Date())
      return res.status(400).json({ error: "Code expired. Please resend." });

    await prisma.user.update({
      where: { id: user.id },
      data:  { otpCode: null, otpExpiresAt: null },
    });

    const token = signToken(user);
    res.json({ token, user: safeUser(user) });
  } catch (err) { next(err); }
});

// POST /api/auth/resend-otp
router.post("/resend-otp", async (req, res, next) => {
  try {
    const { userId } = req.body;
    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user) return res.status(404).json({ error: "User not found." });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({ where: { id: user.id }, data: { otpCode: otp, otpExpiresAt } });

    try {
      await sendOtpEmail(user.email, otp, "verification");
    } catch (emailErr) {
      console.error("Resend email failed:", emailErr.message);
      if (process.env.NODE_ENV !== "production") {
        console.log(`[dev] OTP for ${user.email}: ${otp}`);
      }
    }

    res.json({ message: "Code resent." });
  } catch (err) { next(err); }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required." });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(404).json({ error: "No account found with this email." });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await prisma.user.update({ where: { id: user.id }, data: { otpCode: otp, otpExpiresAt } });

    try {
      await sendOtpEmail(user.email, otp, "password reset");
    } catch (emailErr) {
      console.error("Reset email failed:", emailErr.message);
      if (process.env.NODE_ENV !== "production") {
        console.log(`[dev] Password reset OTP for ${user.email}: ${otp}`);
      }
      return res.status(500).json({ error: "Could not send reset email. Check SMTP settings." });
    }

    res.json({ userId: user.id, message: "Reset code sent." });
  } catch (err) { next(err); }
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res, next) => {
  try {
    const { userId, code, newPassword } = req.body;
    if (!userId || !code || !newPassword)
      return res.status(400).json({ error: "userId, code, and newPassword are required." });
    if (newPassword.length < 8)
      return res.status(400).json({ error: "Password must be at least 8 characters." });

    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user) return res.status(404).json({ error: "User not found." });

    if (!user.otpCode || user.otpCode !== code)
      return res.status(400).json({ error: "Invalid reset code." });
    if (user.otpExpiresAt < new Date())
      return res.status(400).json({ error: "Reset code has expired. Please request a new one." });

    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data:  { password: hash, otpCode: null, otpExpiresAt: null },
    });

    res.json({ message: "Password reset successfully." });
  } catch (err) { next(err); }
});

// POST /api/auth/logout
router.post("/logout", requireAuth, async (req, res, next) => {
  try {
    const token = req.headers.authorization.slice(7);
    // Blacklist token until its natural expiry (~7d)
    await redis.set(`bl:${token}`, "1", "EX", 60 * 60 * 24 * 7).catch(() => {});
    res.json({ message: "Logged out." });
  } catch (err) { next(err); }
});

module.exports = router;
