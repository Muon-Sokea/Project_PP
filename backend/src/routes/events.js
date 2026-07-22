const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/events  (public)
router.get("/", async (req, res, next) => {
  try {
    const raw = await prisma.event.findMany({
      where:   { published: true },
      orderBy: { date: "asc" },
      include: {
        organizer: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { tickets: { where: { status: { not: "cancelled" } } } } },
      },
    });
    const events = raw.map(e => {
      const { _count, ...rest } = e;
      return { ...rest, attending: _count.tickets };
    });
    res.json(events);
  } catch (err) { next(err); }
});

// GET /api/events/all  (staff only — includes unpublished)
router.get("/all", requireAuth, requireRole("Supervisor", "Admin", "Organizer"), async (req, res, next) => {
  try {
    const where = req.user.role === "Organizer" ? { organizerId: req.user.id } : {};
    const eventsRaw = await prisma.event.findMany({
      where,
      orderBy: { date: "asc" },
      include: {
        organizer: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { tickets: { where: { status: { not: "cancelled" } } } } },
      },
    });
    const events = eventsRaw.map(e => {
      const { _count, ...rest } = e;
      return { ...rest, attending: _count.tickets, registered: _count.tickets };
    });
    res.json(events);
  } catch (err) { next(err); }
});

// GET /api/events/:id  (public)
router.get("/:id", async (req, res, next) => {
  try {
    const event = await prisma.event.findUnique({
      where:   { id: Number(req.params.id) },
      include: { organizer: { select: { id: true, firstName: true, lastName: true } } },
    });
    if (!event) return res.status(404).json({ error: "Event not found." });
    res.json(event);
  } catch (err) { next(err); }
});

// POST /api/events  (Organizer / Admin / Supervisor)
router.post("/", requireAuth, requireRole("Supervisor", "Admin", "Organizer"), async (req, res, next) => {
  try {
    const { title, description = "", date, time = "", location, capacity = 100, price = 0, category = "General", image = "" } = req.body;
    if (!title || !date || !location) return res.status(400).json({ error: "title, date and location are required." });

    const event = await prisma.event.create({
      data: { title, description, date: new Date(date), time, location, capacity, price, category, image, organizerId: req.user.id },
    });
    res.status(201).json(event);
  } catch (err) { next(err); }
});

// PUT /api/events/:id
router.put("/:id", requireAuth, requireRole("Supervisor", "Admin", "Organizer"), async (req, res, next) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: Number(req.params.id) } });
    if (!event) return res.status(404).json({ error: "Event not found." });
    if (req.user.role === "Organizer" && event.organizerId !== req.user.id)
      return res.status(403).json({ error: "You can only edit your own events." });

    const { title, description, date, time, location, capacity, price, category, image } = req.body;
    const updated = await prisma.event.update({
      where: { id: Number(req.params.id) },
      data:  { title, description, ...(date && { date: new Date(date) }), ...(time !== undefined && { time }), location, capacity, price, category, image },
    });
    res.json(updated);
  } catch (err) { next(err); }
});

// DELETE /api/events/:id
router.delete("/:id", requireAuth, requireRole("Supervisor", "Admin", "Organizer"), async (req, res, next) => {
  try {
    const eventId = Number(req.params.id);
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: "Event not found." });
    if (req.user.role === "Organizer" && event.organizerId !== req.user.id)
      return res.status(403).json({ error: "You can only delete your own events." });

    // Cascade delete: remove related records first to avoid foreign key constraints
    await prisma.$transaction(async (tx) => {
      // Delete refunds linked to this event's tickets
      await tx.$executeRaw`DELETE FROM "Refund" WHERE "ticketCode" IN (SELECT "ticketCode" FROM "Ticket" WHERE "eventId" = ${eventId})`;
      // Delete all tickets for this event
      await tx.ticket.deleteMany({ where: { eventId } });
      // Delete testimonials for this event
      await tx.testimonial.deleteMany({ where: { eventId } });
      // Finally delete the event itself
      await tx.event.delete({ where: { id: eventId } });
    });

    res.json({ message: "Event deleted." });
  } catch (err) { next(err); }
});

// GET /api/events/:id/tickets — All tickets/registrations for a specific event (staff only)
router.get("/:id/tickets", requireAuth, requireRole("Supervisor", "Admin", "Organizer"), async (req, res, next) => {
  try {
    const eventId = Number(req.params.id);
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: "Event not found." });
    const tickets = await prisma.ticket.findMany({
      where: { eventId, status: { not: "cancelled" } },
      orderBy: { registeredAt: "desc" },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    });

    const attendees = tickets.map(t => ({
      id: t.id,
      name: `${t.user.firstName} ${t.user.lastName}`,
      email: t.user.email,
      ticket: t.ticketType,
      ticketCode: t.ticketCode,
      quantity: t.quantity,
      price: Number(t.price),
      date: t.registeredAt.toISOString(),
      status: t.status,
    }));

    res.json({
      eventId,
      eventTitle: event.title,
      total: attendees.length,
      attendees,
    });
  } catch (err) { next(err); }
});

// PATCH /api/events/:id/publish
router.patch("/:id/publish", requireAuth, requireRole("Supervisor", "Admin", "Organizer"), async (req, res, next) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: Number(req.params.id) } });
    if (!event) return res.status(404).json({ error: "Event not found." });

    const updated = await prisma.event.update({
      where: { id: Number(req.params.id) },
      data:  { published: !event.published },
    });
    res.json(updated);
  } catch (err) { next(err); }
});

module.exports = router;
