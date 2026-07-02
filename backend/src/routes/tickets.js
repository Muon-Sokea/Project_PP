const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/tickets/:ticketCode
router.get("/:ticketCode", requireAuth, async (req, res, next) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where:   { ticketCode: req.params.ticketCode },
      include: { event: true, user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
    if (!ticket) return res.status(404).json({ error: "Ticket not found." });

    // Only owner or staff can view
    if (ticket.userId !== req.user.id && !["Supervisor", "Admin", "Organizer"].includes(req.user.role))
      return res.status(403).json({ error: "Access denied." });

    res.json(ticket);
  } catch (err) { next(err); }
});

module.exports = router;
