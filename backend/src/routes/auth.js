const express  = require("express");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const { PrismaClient } = require("@prisma/client");
const redis    = require("../lib/redis");
const { sendOtpEmail } = require("../lib/mailer");
const { requireAuth } = require("../middleware/auth");
const { verifyTelegramAuth } = require("../lib/telegramAuth");
const { getIO } = require("../lib/socket");
const { recordLogin } = require("../lib/loginHistory");
const { loginLimiter, authActionLimiter } = require("../middleware/rateLimit");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required." });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(401).json({ error: "Invalid email or password." });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid email or password." });

    if (user.status === "suspended") return res.status(403).json({ error: "Account suspended." });

    const token = signToken(user);
    recordLogin(req, user.id, "password");
    res.json({ token, user: safeUser(user) });
  } catch (err) { next(err); }
});

// POST /api/auth/register
router.post("/register", authActionLimiter, async (req, res, next) => {
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

    // Notify dashboard that a new user registered
    try { getIO().emit("user-update", { action: "registered", userId: user.id }); } catch {}
  } catch (err) { next(err); }
});

// POST /api/auth/verify-email
router.post("/verify-email", authActionLimiter, async (req, res, next) => {
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
    recordLogin(req, user.id, "password");
    res.json({ token, user: safeUser(user) });
  } catch (err) { next(err); }
});

// POST /api/auth/resend-otp
router.post("/resend-otp", authActionLimiter, async (req, res, next) => {
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
router.post("/forgot-password", authActionLimiter, async (req, res, next) => {
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
router.post("/reset-password", authActionLimiter, async (req, res, next) => {
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

// POST /api/auth/google — Sign in / register with Google OAuth
router.post("/google", async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: "idToken is required." });

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) return res.status(400).json({ error: "Google account has no email." });

    // Check if user exists by googleId or email
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email: email.toLowerCase() }] },
    });
    const wasExisting = !!user;

    if (user) {
      // Existing user — link googleId if not already linked
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, avatar: picture || user.avatar },
        });
      } else if (picture) {
        // Update avatar picture on each login
        user = await prisma.user.update({
          where: { id: user.id },
          data: { avatar: picture },
        });
      }
    } else {
      // New user — create with Attendee role
      const nameParts = (name || email.split("@")[0]).split(" ");
      user = await prisma.user.create({
        data: {
          googleId,
          email: email.toLowerCase(),
          firstName: nameParts[0] || "User",
          lastName: nameParts.slice(1).join(" ") || "",
          avatar: picture || "",
          password: "",  // No password for OAuth users
          role: "Attendee",
        },
      });
    }

    if (user.status === "suspended") return res.status(403).json({ error: "Account suspended." });

    const token = signToken(user);
    recordLogin(req, user.id, "google");
    res.json({ token, user: safeUser(user) });

    // Notify dashboard of new user registration (only for newly created users)
    if (!wasExisting) {
      try { getIO().emit("user-update", { action: "registered", userId: user.id }); } catch {}
    }
  } catch (err) {
    console.error("Google auth error:", err.message);
    res.status(401).json({ error: "Invalid Google token." });
  }
});

// POST /api/auth/telegram — Sign in / register with the Telegram Login Widget
router.post("/telegram", async (req, res, next) => {
  try {
    const data = req.body;
    if (!data || !data.id || !data.hash) return res.status(400).json({ error: "Invalid Telegram payload." });
    if (!process.env.TELEGRAM_BOT_TOKEN) return res.status(500).json({ error: "Telegram login is not configured." });

    const valid = verifyTelegramAuth(data, process.env.TELEGRAM_BOT_TOKEN);
    if (!valid) return res.status(401).json({ error: "Invalid or expired Telegram authentication." });

    const telegramId = String(data.id);
    let user = await prisma.user.findUnique({ where: { telegramId } });
    let isExistingUser = !!user;

    if (user) {
      if (data.photo_url && data.photo_url !== user.avatar) {
        user = await prisma.user.update({ where: { id: user.id }, data: { avatar: data.photo_url } });
      }
    } else {
      user = await prisma.user.create({
        data: {
          telegramId,
          email: `tg_${telegramId}@telegram.local`,
          firstName: data.first_name || "Telegram",
          lastName: data.last_name || "User",
          avatar: data.photo_url || "",
          password: "",  // No password for OAuth users
          role: "Attendee",
        },
      });
    }

    if (user.status === "suspended") return res.status(403).json({ error: "Account suspended." });

    const token = signToken(user);
    recordLogin(req, user.id, "telegram");
    res.json({ token, user: safeUser(user) });

    // Notify dashboard of new user registration
    if (!isExistingUser) {
      try { getIO().emit("user-update", { action: "registered", userId: user.id }); } catch {}
    }
  } catch (err) {
    console.error("Telegram auth error:", err.message);
    res.status(401).json({ error: "Invalid Telegram authentication." });
  }
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
