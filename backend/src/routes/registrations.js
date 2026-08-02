const crypto = require("crypto");
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { requireAuth } = require("../middleware/auth");
const { notifyUser, broadcastCapacity, broadcastAdminUpdate } = require("../lib/notify");

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
      eventId:      t.eventId,
      event_title:  t.event.title,
      event_date:   t.event.date,
      event_time:   t.event.time,
      event_location: t.event.location,
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
    const { eventId, ticketTypeId, quantity = 1 } = req.body;
    if (!eventId) return res.status(400).json({ error: "eventId is required." });
    const qty = Number(quantity) || 1;

    const event = await prisma.event.findUnique({
      where: { id: Number(eventId) },
      include: { ticketTypes: true },
    });
    if (!event) return res.status(404).json({ error: "Event not found." });
    if (!event.published) return res.status(400).json({ error: "Event is not published." });

    // Price and ticket-type label are always derived server-side from the
    // event's real configured tier — never trusted from the client.
    let ticketType = "General Admission";
    let unitPrice = event.price;
    let resolvedTicketTypeId = null;

    if (event.ticketTypes.length > 0) {
      if (!ticketTypeId) return res.status(400).json({ error: "ticketTypeId is required for this event." });
      const tier = event.ticketTypes.find(t => t.id === Number(ticketTypeId));
      if (!tier) return res.status(400).json({ error: "Invalid ticket type for this event." });

      // Per-tier capacity check
      const tierAgg = await prisma.ticket.aggregate({
        where: { ticketTypeId: tier.id, status: { not: "cancelled" } },
        _sum: { quantity: true },
      });
      const tierTaken = tierAgg._sum.quantity || 0;
      if (tierTaken + qty > tier.quantity)
        return res.status(400).json({ error: `Not enough "${tier.name}" seats available.` });

      ticketType = tier.name;
      unitPrice = tier.price;
      resolvedTicketTypeId = tier.id;
    }

    // Overall event capacity check — sum seats actually booked, not row count
    const takenAgg = await prisma.ticket.aggregate({
      where: { eventId: event.id, status: { not: "cancelled" } },
      _sum: { quantity: true },
    });
    const taken = takenAgg._sum.quantity || 0;
    if (taken + qty > event.capacity)
      return res.status(400).json({ error: "Not enough seats available." });

    // Prevent duplicate registration
    const dupe = await prisma.ticket.findFirst({
      where: { userId: req.user.id, eventId: event.id, status: { not: "cancelled" } },
    });
    if (dupe) return res.status(409).json({ error: "Already registered for this event." });

    const ticket = await prisma.ticket.create({
      data: {
        ticketCode: crypto.randomUUID(),
        ticketType,
        quantity: qty,
        price: unitPrice,
        userId:  req.user.id,
        eventId: event.id,
        ticketTypeId: resolvedTicketTypeId,
      },
    });

    if (event.organizerId !== req.user.id) {
      notifyUser(event.organizerId, {
        type: "new_registration",
        title: "New registration",
        message: `${req.user.email} registered for "${event.title}".`,
        link: `/organizer`,
      }).catch(err => console.warn("notifyUser failed:", err.message));
    }
    broadcastCapacity(event.id);
    broadcastAdminUpdate(["tickets", "events"]);

    res.status(201).json({
      id:          ticket.id,
      ticket_code: ticket.ticketCode,
      event_title: event.title,
      event_date:  event.date,
      ticket_type: ticket.ticketType,
      quantity:    ticket.quantity,
      unit_price:  Number(unitPrice),
      total_price: Number(unitPrice) * qty,
      status:      ticket.status,
      registered_at: ticket.registeredAt,
    });
  } catch (err) { next(err); }
});

module.exports = router;
