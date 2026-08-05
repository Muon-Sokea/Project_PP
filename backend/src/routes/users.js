const express = require("express");
const bcrypt  = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { requireAuth, requireRole } = require("../middleware/auth");
const { getIO } = require("../lib/socket");
const { broadcastAdminUpdate } = require("../lib/notify");

const router = express.Router();
const prisma = new PrismaClient();

function safeUser(user) {
  const { password, otpCode, otpExpiresAt, ...rest } = user;
  return rest;
}

// GET /api/users  (Admin / Supervisor)
// Excludes soft-deleted users — they're hidden everywhere in the live app,
// but still fully intact in the database for report exports (see DELETE below).
router.get("/", requireAuth, requireRole("Supervisor", "Admin"), async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "asc" } });
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

// GET /api/users/me/login-history  (self) — powers the real Security Activity
// feed. Also used to build a deduplicated "Connected Devices" list on the
// frontend (read-only — no session revocation, see loginHistory.js).
router.get("/me/login-history", requireAuth, async (req, res, next) => {
  try {
    const events = await prisma.loginEvent.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    res.json(events);
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
    broadcastAdminUpdate(["users"]);
    res.status(201).json(safeUser(user));

    // Notify all admins that a user was created (for live dashboard updates)
    try { getIO().emit("user-update", { action: "created" }); } catch {}
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
    if (isStaff) broadcastAdminUpdate(["users"]);
    res.json(safeUser(user));

    // Notify all admins that a user was updated
    try { getIO().emit("user-update", { action: "updated", userId: targetId }); } catch {}
  } catch (err) { next(err); }
});

// DELETE /api/users/:id  (Supervisor only)
// Soft delete — Supervisor has full authority to remove a user from the live
// app immediately (login blocked, hidden from user lists) with no permission
// prompts or foreign-key errors in the way. Nothing is physically destroyed:
// their events, tickets, refunds, testimonials, and bookmarks stay exactly as
// they were, so report exports (PDF/CSV) still show the full history as
// evidence if a dispute ever comes up.
router.delete("/:id", requireAuth, requireRole("Supervisor"), async (req, res, next) => {
  try {
    const targetId = Number(req.params.id);
    if (req.user.id === targetId) return res.status(400).json({ error: "Cannot delete your own account." });

    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target || target.deletedAt) return res.status(404).json({ error: "User not found." });

    await prisma.user.update({
      where: { id: targetId },
      data: { deletedAt: new Date(), status: "suspended" },
    });
    broadcastAdminUpdate(["users"]);
    res.json({ message: "User deleted." });

    // Notify all admins that a user was deleted
    try { getIO().emit("user-update", { action: "deleted", userId: targetId }); } catch {}
  } catch (err) { next(err); }
});

module.exports = router;
