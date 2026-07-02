const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { PrismaClient } = require("@prisma/client");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/registrations/mine
router.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const tickets = await prisma.ticket.findMany({
      where:   { userId: req.user.id },
      include: { event: true },
      orderBy: { registeredAt: "desc" },
    });

    const result = tickets.map(t => ({
      id:           t.id,
      userId:       t.userId,
      event_title:  t.event.title,
      event_date:   t.event.date,
      ticket_code:  t.ticketCode,
      ticket_type:  t.ticketType,
      quantity:     t.quantity,
      price:        t.price,
      status:       t.status,
      registered_at: t.registeredAt,
    }));

    res.json(result);
  } catch (err) { next(err); }
});

// POST /api/registrations
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { eventId, ticketType = "standard", quantity = 1, price = "0.00" } = req.body;
    if (!eventId) return res.status(400).json({ error: "eventId is required." });

    const event = await prisma.event.findUnique({ where: { id: Number(eventId) } });
    if (!event) return res.status(404).json({ error: "Event not found." });
    if (!event.published) return res.status(400).json({ error: "Event is not published." });

    // Capacity check
    const taken = await prisma.ticket.count({
      where: { eventId: event.id, status: { not: "cancelled" } },
    });
    if (taken + quantity > event.capacity)
      return res.status(400).json({ error: "Not enough seats available." });

    // Prevent duplicate registration
    const dupe = await prisma.ticket.findFirst({
      where: { userId: req.user.id, eventId: event.id, status: { not: "cancelled" } },
    });
    if (dupe) return res.status(409).json({ error: "Already registered for this event." });

    const ticket = await prisma.ticket.create({
      data: {
        ticketCode: uuidv4(),
        ticketType,
        quantity,
        price,
        userId:  req.user.id,
        eventId: event.id,
      },
    });

    res.status(201).json({
      id:          ticket.id,
      ticket_code: ticket.ticketCode,
      event_title: event.title,
      event_date:  event.date,
      status:      ticket.status,
      registered_at: ticket.registeredAt,
    });
  } catch (err) { next(err); }
});

module.exports = router;
