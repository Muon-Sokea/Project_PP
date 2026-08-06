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

// Permanently deletes a user and every record tied to them (tickets, refunds,
// testimonials, bookmarks, login history, notifications). Refuses to touch a
// user who still organizes events — Event.organizerId is required, so deleting
// them would either fail outright or cascade into OTHER users' tickets and
// testimonials for those events, which is data loss far outside "this user's
// own information". Caller must reassign or delete those events first.
async function hardDeleteUser(userId) {
  const organizedCount = await prisma.event.count({ where: { organizerId: userId } });
  if (organizedCount > 0) {
    const err = new Error(
      `This user still organizes ${organizedCount} event(s). Reassign or delete those events before deleting the account.`
    );
    err.code = "HAS_EVENTS";
    throw err;
  }

  await prisma.$transaction(async (tx) => {
    await tx.refund.deleteMany({ where: { userId } });
    await tx.ticket.deleteMany({ where: { userId } });
    await tx.testimonial.deleteMany({ where: { userId } });
    await tx.bookmark.deleteMany({ where: { userId } });
    await tx.loginEvent.deleteMany({ where: { userId } });
    await tx.notification.deleteMany({ where: { userId } });
    await tx.user.delete({ where: { id: userId } });
  });
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
// Permanent delete — removes the user and every record tied to them (tickets,
// refunds, testimonials, bookmarks, login history, notifications). Cannot be
// undone. See hardDeleteUser() above for the one guard: a user who still
// organizes events must have those reassigned/deleted first.
router.delete("/:id", requireAuth, requireRole("Supervisor"), async (req, res, next) => {
  try {
    const targetId = Number(req.params.id);
    if (req.user.id === targetId) return res.status(400).json({ error: "Cannot delete your own account." });

    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) return res.status(404).json({ error: "User not found." });
    if (target.role === "Supervisor") return res.status(403).json({ error: "Cannot delete a Supervisor account." });

    try {
      await hardDeleteUser(targetId);
    } catch (err) {
      if (err.code === "HAS_EVENTS") return res.status(409).json({ error: err.message });
      throw err;
    }

    broadcastAdminUpdate(["users"]);
    res.json({ message: "User deleted." });

    // Notify all admins that a user was deleted
    try { getIO().emit("user-update", { action: "deleted", userId: targetId }); } catch {}
  } catch (err) { next(err); }
});

// POST /api/users/bulk-delete  (Supervisor only) — up to 10 at a time
// Same permanent-delete semantics as the single DELETE above, just batched.
// A user blocked by owned events doesn't abort the whole batch — they're
// reported back as "blocked" alongside the counts that did succeed.
router.post("/bulk-delete", requireAuth, requireRole("Supervisor"), async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ error: "ids must be a non-empty array." });
    if (ids.length > 10)
      return res.status(400).json({ error: "You can delete at most 10 users at a time." });

    const targetIds = [...new Set(ids.map(Number))].filter(id => id !== req.user.id);
    const targets = await prisma.user.findMany({ where: { id: { in: targetIds } } });
    const deletable = targets.filter(u => u.role !== "Supervisor");

    let deleted = 0;
    let blocked = 0;
    const deletedIds = [];
    for (const u of deletable) {
      try {
        await hardDeleteUser(u.id);
        deleted++;
        deletedIds.push(u.id);
      } catch (err) {
        if (err.code === "HAS_EVENTS") { blocked++; continue; }
        throw err;
      }
    }

    if (deleted > 0) {
      broadcastAdminUpdate(["users"]);
      try { getIO().emit("user-update", { action: "deleted", userIds: deletedIds }); } catch {}
    }

    res.json({
      deleted,
      blocked,
      skipped: ids.length - deletable.length,
    });
  } catch (err) { next(err); }
});

module.exports = router;
