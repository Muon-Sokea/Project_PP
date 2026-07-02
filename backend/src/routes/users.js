const express = require("express");
const bcrypt  = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

function safeUser(user) {
  const { password, otpCode, otpExpiresAt, ...rest } = user;
  return rest;
}

// GET /api/users  (Admin / Supervisor)
router.get("/", requireAuth, requireRole("Supervisor", "Admin"), async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
    res.json(users.map(safeUser));
  } catch (err) { next(err); }
});

// GET /api/users/me  (self)
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json(safeUser(user));
  } catch (err) { next(err); }
});

// POST /api/users  (Admin / Supervisor create staff)
router.post("/", requireAuth, requireRole("Supervisor", "Admin"), async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role = "Attendee" } = req.body;
    if (!firstName || !lastName || !email || !password)
      return res.status(400).json({ error: "All fields are required." });

    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) return res.status(409).json({ error: "Email already in use." });

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { firstName, lastName, email: email.toLowerCase(), password: hash, role },
    });
    res.status(201).json(safeUser(user));
  } catch (err) { next(err); }
});

// PUT /api/users/:id  (self or Admin/Supervisor)
router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const targetId = Number(req.params.id);
    const isStaff  = ["Supervisor", "Admin"].includes(req.user.role);
    if (req.user.id !== targetId && !isStaff)
      return res.status(403).json({ error: "Access denied." });

    const { firstName, lastName, phone, address, role, status } = req.body;
    const data = { firstName, lastName, phone, address };

    // Only Admin/Supervisor can change role or status
    if (isStaff) {
      if (role)   data.role   = role;
      if (status) data.status = status;
    }

    const user = await prisma.user.update({ where: { id: targetId }, data });
    res.json(safeUser(user));
  } catch (err) { next(err); }
});

// DELETE /api/users/:id  (Supervisor only)
router.delete("/:id", requireAuth, requireRole("Supervisor"), async (req, res, next) => {
  try {
    const targetId = Number(req.params.id);
    if (req.user.id === targetId) return res.status(400).json({ error: "Cannot delete your own account." });

    await prisma.user.delete({ where: { id: targetId } });
    res.json({ message: "User deleted." });
  } catch (err) { next(err); }
});

module.exports = router;
