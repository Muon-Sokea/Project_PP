const express = require("express");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { requireAuth, requireRole } = require("../middleware/auth");
const { sendEventApprovalEmail } = require("../lib/mailer");
const { notifyUser, notifyRoles, broadcastAdminUpdate } = require("../lib/notify");

const router = express.Router();
const prisma = new PrismaClient();

// Sum of ticket.quantity (seats actually booked) per event — NOT a row count,
// since a single ticket row can represent a multi-seat group booking.
async function getAttendingMap(eventIds) {
  if (!eventIds.length) return {};
  const groups = await prisma.ticket.groupBy({
    by: ["eventId"],
    where: { eventId: { in: eventIds }, status: { not: "cancelled" } },
    _sum: { quantity: true },
  });
  return Object.fromEntries(groups.map(g => [g.eventId, g._sum.quantity || 0]));
}

// GET /api/events  (public — only approved + published events)
router.get("/", async (req, res, next) => {
  try {
    const raw = await prisma.event.findMany({
      where:   { published: true, approvalStatus: "APPROVED" },
      orderBy: { date: "asc" },
      include: {
        organizer: { select: { id: true, firstName: true, lastName: true } },
        ticketTypes: { orderBy: { price: "asc" } },
      },
    });
    const attendingMap = await getAttendingMap(raw.map(e => e.id));
    const events = raw.map(e => ({ ...e, attending: attendingMap[e.id] || 0 }));
    res.json(events);
  } catch (err) { next(err); }
});

// GET /api/events/all  (staff only — includes unpublished & pending)
router.get("/all", requireAuth, requireRole("Supervisor", "Admin", "Organizer"), async (req, res, next) => {
  try {
    const where = req.user.role === "Organizer" ? { organizerId: req.user.id } : {};
    const eventsRaw = await prisma.event.findMany({
      where,
      orderBy: { date: "asc" },
      include: {
        organizer: { select: { id: true, firstName: true, lastName: true } },
        ticketTypes: { orderBy: { price: "asc" } },
      },
    });
    const attendingMap = await getAttendingMap(eventsRaw.map(e => e.id));
    const events = eventsRaw.map(e => ({ ...e, attending: attendingMap[e.id] || 0, registered: attendingMap[e.id] || 0 }));
    res.json(events);
  } catch (err) { next(err); }
});

// GET /api/events/:id  (public — only approved+published, or if authorized)
router.get("/:id", async (req, res, next) => {
  try {
    const event = await prisma.event.findUnique({
      where:   { id: Number(req.params.id) },
      include: {
        organizer: { select: { id: true, firstName: true, lastName: true, role: true } },
        ticketTypes: { orderBy: { price: "asc" } },
      },
    });
    if (!event) return res.status(404).json({ error: "Event not found." });

    // Attach overall + per-ticket-type sold counts so the client can show
    // real remaining seats for each tier.
    async function withAttending(ev) {
      const attendingMap = await getAttendingMap([ev.id]);
      const soldByType = await prisma.ticket.groupBy({
        by: ["ticketTypeId"],
        where: { eventId: ev.id, status: { not: "cancelled" }, ticketTypeId: { not: null } },
        _sum: { quantity: true },
      });
      const soldMap = Object.fromEntries(soldByType.map(s => [s.ticketTypeId, s._sum.quantity || 0]));
      return {
        ...ev,
        attending: attendingMap[ev.id] || 0,
        ticketTypes: (ev.ticketTypes || []).map(tt => ({ ...tt, sold: soldMap[tt.id] || 0 })),
      };
    }

    // Non-approved events are only visible to the organizer and admins
    if (event.approvalStatus !== "APPROVED") {
      const token = req.headers.authorization?.slice(7);
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const isStaff = decoded.role === "Supervisor" || decoded.role === "Admin";
          const isOwner = decoded.id === event.organizerId;
          if (isStaff || isOwner) {
            return res.json(await withAttending(event));
          }
        } catch {}
      }
      return res.status(404).json({ error: "Event not found." });
    }

    res.json(await withAttending(event));
  } catch (err) { next(err); }
});

// POST /api/events  (Organizer / Admin / Supervisor — created as PENDING, not published)
router.post("/", requireAuth, requireRole("Supervisor", "Admin", "Organizer"), async (req, res, next) => {
  try {
    const { title, description = "", date, time = "", location, capacity = 100, price = 0, category = "General", image = "", agenda = [], ticketTypes = [] } = req.body;
    if (!title || !date || !location) return res.status(400).json({ error: "title, date and location are required." });

    // Organizers create events as pending approval; Admin/Supervisor can set to approved directly
    const approvalStatus = (req.user.role === "Supervisor" || req.user.role === "Admin") ? "APPROVED" : "PENDING";

    const cleanTypes = Array.isArray(ticketTypes)
      ? ticketTypes
          .filter(t => t && t.name && String(t.name).trim())
          .map(t => ({
            name: String(t.name).trim(),
            price: Number(t.price) || 0,
            quantity: Number(t.quantity) || 0,
            description: String(t.description || "").trim(),
          }))
      : [];

    // The single Event.price/capacity fields stay as simple display/summary
    // values — the real per-tier prices live in TicketType. When real tiers
    // are provided, derive them instead of trusting separately-sent totals.
    const derivedPrice    = cleanTypes.length ? Math.min(...cleanTypes.map(t => t.price)) : Number(price);
    const derivedCapacity = cleanTypes.length ? cleanTypes.reduce((s, t) => s + t.quantity, 0) : Number(capacity);

    const event = await prisma.event.create({
      data: {
        title, description, date: new Date(date), time, location,
        capacity: derivedCapacity, price: derivedPrice, category, image,
        agenda: Array.isArray(agenda) ? agenda : [],
        organizerId: req.user.id,
        approvalStatus,
        // Auto-publish if approved
        published: approvalStatus === "APPROVED",
        ...(cleanTypes.length && { ticketTypes: { create: cleanTypes } }),
      },
      include: { ticketTypes: true },
    });

    if (approvalStatus === "PENDING") {
      notifyRoles(["Admin", "Supervisor"], {
        type: "event_pending",
        title: "New event awaiting approval",
        message: `"${event.title}" was submitted by ${req.user.email} and needs review.`,
        link: `/admin`,
      }).catch(err => console.warn("notifyRoles failed:", err.message));
    }
    broadcastAdminUpdate(["events"]);

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

    const { title, description, date, time, location, capacity, price, category, image, agenda, ticketTypes } = req.body;

    let derivedPrice, derivedCapacity;
    if (Array.isArray(ticketTypes)) {
      const cleanTypes = ticketTypes
        .filter(t => t && t.name && String(t.name).trim())
        .map(t => ({
          name: String(t.name).trim(),
          price: Number(t.price) || 0,
          quantity: Number(t.quantity) || 0,
          description: String(t.description || "").trim(),
        }));
      // Replace the tier set atomically: existing purchased tickets keep their
      // historical ticketTypeId reference (SetNull on delete), so past orders
      // aren't affected — only the event's currently-offered tiers change.
      await prisma.ticketType.deleteMany({ where: { eventId: event.id } });
      if (cleanTypes.length) {
        await prisma.ticketType.createMany({ data: cleanTypes.map(t => ({ ...t, eventId: event.id })) });
        derivedPrice    = Math.min(...cleanTypes.map(t => t.price));
        derivedCapacity = cleanTypes.reduce((s, t) => s + t.quantity, 0);
      }
    }

    // An Organizer editing an already-approved (or rejected) event sends it
    // back to PENDING — admin approved/reviewed the *previous* content, not
    // whatever the organizer just changed it to. Admin/Supervisor edits don't
    // need this, since they can self-approve.
    const needsReapproval = req.user.role === "Organizer" && event.approvalStatus !== "PENDING";

    const updated = await prisma.event.update({
      where: { id: Number(req.params.id) },
      data:  {
        title, description, ...(date && { date: new Date(date) }), ...(time !== undefined && { time }),
        location,
        capacity: derivedCapacity ?? capacity,
        price: derivedPrice ?? price,
        category, image,
        ...(Array.isArray(agenda) && { agenda }),
        ...(needsReapproval && { approvalStatus: "PENDING", published: false }),
      },
      include: { ticketTypes: true },
    });

    if (needsReapproval) {
      notifyRoles(["Admin", "Supervisor"], {
        type: "event_pending",
        title: "Edited event awaiting re-approval",
        message: `"${updated.title}" was edited by ${req.user.email} and needs review before going public again.`,
        link: `/admin`,
      }).catch(err => console.warn("notifyRoles failed:", err.message));
    }
    broadcastAdminUpdate(["events"]);

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
    broadcastAdminUpdate(["events", "tickets"]);

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

// PATCH /api/events/:id/approve  (Admin / Supervisor only — approves a pending event)
router.patch("/:id/approve", requireAuth, requireRole("Supervisor", "Admin"), async (req, res, next) => {
  try {
    const eventId = Number(req.params.id);
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { organizer: { select: { email: true, firstName: true, lastName: true } } },
    });
    if (!event) return res.status(404).json({ error: "Event not found." });

    const updated = await prisma.event.update({
      where: { id: eventId },
      data:  { approvalStatus: "APPROVED", published: true },
    });

    // Notify organizer
    try {
      await sendEventApprovalEmail(event.organizer.email, {
        eventTitle: event.title,
        status: "approved",
      });
    } catch (emailErr) {
      console.warn("Approval notification email failed:", emailErr.message);
    }

    notifyUser(event.organizerId, {
      type: "event_approved",
      title: "Event approved",
      message: `Your event "${event.title}" has been approved and published.`,
      link: `/events/${eventId}`,
    }).catch(err => console.warn("notifyUser failed:", err.message));
    broadcastAdminUpdate(["events"]);

    res.json(updated);
  } catch (err) { next(err); }
});

// PATCH /api/events/:id/reject  (Admin / Supervisor only — rejects a pending event)
router.patch("/:id/reject", requireAuth, requireRole("Supervisor", "Admin"), async (req, res, next) => {
  try {
    const eventId = Number(req.params.id);
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { organizer: { select: { email: true, firstName: true, lastName: true } } },
    });
    if (!event) return res.status(404).json({ error: "Event not found." });

    const updated = await prisma.event.update({
      where: { id: eventId },
      data:  { approvalStatus: "REJECTED", published: false },
    });

    // Notify organizer
    try {
      await sendEventApprovalEmail(event.organizer.email, {
        eventTitle: event.title,
        status: "rejected",
      });
    } catch (emailErr) {
      console.warn("Rejection notification email failed:", emailErr.message);
    }

    notifyUser(event.organizerId, {
      type: "event_rejected",
      title: "Event rejected",
      message: `Your event "${event.title}" was rejected by an admin.`,
      link: `/organizer`,
    }).catch(err => console.warn("notifyUser failed:", err.message));
    broadcastAdminUpdate(["events"]);

    res.json(updated);
  } catch (err) { next(err); }
});

// PATCH /api/events/:id/publish
router.patch("/:id/publish", requireAuth, requireRole("Supervisor", "Admin", "Organizer"), async (req, res, next) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: Number(req.params.id) } });
    if (!event) return res.status(404).json({ error: "Event not found." });

    // Only allow toggling publish if the event is already approved
    if (event.approvalStatus !== "APPROVED") {
      return res.status(400).json({ error: "Cannot publish an event that hasn't been approved." });
    }

    const updated = await prisma.event.update({
      where: { id: Number(req.params.id) },
      data:  { published: !event.published },
    });
    broadcastAdminUpdate(["events"]);
    res.json(updated);
  } catch (err) { next(err); }
});

module.exports = router;
