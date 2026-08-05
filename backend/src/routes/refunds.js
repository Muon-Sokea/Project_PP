const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { requireAuth, requireRole } = require("../middleware/auth");
const { notifyUser, notifyRoles, broadcastCapacity, broadcastEventUpdate, broadcastAdminUpdate } = require("../lib/notify");
const { sendRefundUpdateEmail } = require("../lib/mailer");

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/refunds  (attendee requests refund)
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { ticketCode, eventName, reason, details = "" } = req.body;
    if (!ticketCode || !eventName || !reason)
      return res.status(400).json({ error: "ticketCode, eventName and reason are required." });

    const ticket = await prisma.ticket.findUnique({ where: { ticketCode } });
    if (!ticket) return res.status(404).json({ error: "Ticket not found." });
    if (ticket.userId !== req.user.id) return res.status(403).json({ error: "Access denied." });

    const existing = await prisma.refund.findUnique({ where: { ticketCode } });
    if (existing) return res.status(409).json({ error: "Refund already requested for this ticket." });

    const refund = await prisma.refund.create({
      data: { ticketCode, eventName, reason, details, userId: req.user.id },
    });

    // Mark ticket as cancelled — this frees the seat immediately
    await prisma.ticket.update({ where: { ticketCode }, data: { status: "cancelled" } });
    broadcastCapacity(ticket.eventId);
    broadcastEventUpdate("capacity-changed", { id: ticket.eventId })
      .catch(err => console.warn("broadcastEventUpdate failed:", err.message));
    broadcastAdminUpdate(["tickets", "events", "refunds"]);

    notifyRoles(["Admin", "Supervisor"], {
      type: "refund_requested",
      title: "New refund request",
      message: `A refund was requested for "${eventName}".`,
      link: `/admin`,
    }).catch(err => console.warn("notifyRoles failed:", err.message));

    res.status(201).json(refund);
  } catch (err) { next(err); }
});

// GET /api/refunds  (staff sees all; attendee sees own)
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const isStaff = ["Supervisor", "Admin"].includes(req.user.role);
    const refunds = await prisma.refund.findMany({
      where:   isStaff ? {} : { userId: req.user.id },
      orderBy: { requestedAt: "desc" },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
    res.json(refunds);
  } catch (err) { next(err); }
});

// PATCH /api/refunds/:ticketCode  (Admin / Supervisor approve or reject)
router.patch("/:ticketCode", requireAuth, requireRole("Supervisor", "Admin"), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status))
      return res.status(400).json({ error: "status must be 'approved' or 'rejected'." });

    const refund = await prisma.refund.findUnique({
      where: { ticketCode: req.params.ticketCode },
      include: { user: { select: { email: true, notificationPrefs: true } } },
    });
    if (!refund) return res.status(404).json({ error: "Refund not found." });

    const updated = await prisma.refund.update({
      where: { ticketCode: req.params.ticketCode },
      data:  { status, resolvedAt: new Date() },
    });
    broadcastAdminUpdate(["refunds"]);

    notifyUser(refund.userId, {
      type: "refund_resolved",
      title: `Refund ${status}`,
      message: `Your refund for "${refund.eventName}" was ${status}.`,
      link: `/dashboard`,
    }).catch(err => console.warn("notifyUser failed:", err.message));

    const refundUpdatesOn = refund.user?.notificationPrefs?.refundUpdates !== false; // default on
    if (refundUpdatesOn && refund.user?.email) {
      sendRefundUpdateEmail(refund.user.email, {
        eventName: refund.eventName,
        ticketCode: refund.ticketCode,
        status,
        reason: refund.reason,
      }).catch(err => console.warn("sendRefundUpdateEmail failed:", err.message));
    }

    res.json(updated);
  } catch (err) { next(err); }
});

module.exports = router;
