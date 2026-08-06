const express = require("express");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { requireAuth, requireRole } = require("../middleware/auth");
const { sendEventApprovalEmail, sendNewEventEmail, sendPromotionalEmail } = require("../lib/mailer");
const { notifyUser, notifyRoles, broadcastEventUpdate, broadcastAdminUpdate } = require("../lib/notify");

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

// A promo needs both a non-empty code AND a discount in (0, 100] to be
// "active" — a code with no discount (or vice versa) is treated as no promo.
function normalizePromo(promoCode, promoDiscountPercent) {
  const code = String(promoCode || "").trim().toUpperCase();
  const pct = Math.round(Number(promoDiscountPercent)) || 0;
  if (!code || pct <= 0 || pct > 100) return { promoCode: null, promoDiscountPercent: null };
  return { promoCode: code, promoDiscountPercent: pct };
}

// GET /api/events  (public — only approved + published, non-past events)
router.get("/", async (req, res, next) => {
  try {
    // `date` is stored at UTC midnight of the event's calendar day (see
    // POST handler below), so compare against UTC midnight of "today" —
    // this keeps an event visible for its whole actual day rather than
    // hiding it the moment the server clock ticks past midnight in some
    // other timezone.
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const raw = await prisma.event.findMany({
      where:   { published: true, approvalStatus: "APPROVED", date: { gte: todayStart } },
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
// Admin/Supervisor never see other organizers' drafts here — a draft is only
// ever visible on its own organizer's dashboard until they submit it.
router.get("/all", requireAuth, requireRole("Supervisor", "Admin", "Organizer"), async (req, res, next) => {
  try {
    const where = req.user.role === "Organizer" ? { organizerId: req.user.id } : { isDraft: false };
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

    // A draft is fully private to its organizer — not even staff can see it,
    // by design (this is the whole point of "draft" vs "pending approval").
    if (event.isDraft) {
      const token = req.headers.authorization?.slice(7);
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          if (decoded.id === event.organizerId) return res.json(await withAttending(event));
        } catch {}
      }
      return res.status(404).json({ error: "Event not found." });
    }

    // Non-approved (but submitted) events are visible to the organizer and admins
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
    const { title, description = "", date, time = "", location, capacity = 100, price = 0, category = "General", image = "", agenda = [], ticketTypes = [], promoCode, promoDiscountPercent, isDraft: rawIsDraft } = req.body;
    if (!title || !date || !location) return res.status(400).json({ error: "title, date and location are required." });

    const cleanPromo = normalizePromo(promoCode, promoDiscountPercent);
    // A draft never enters the approval workflow — approvalStatus stays PENDING
    // as an inert default (unused until the organizer submits it), and admins
    // are never notified.
    const isDraft = Boolean(rawIsDraft);

    // Organizers create events as pending approval; Admin/Supervisor can set to approved directly
    const approvalStatus = isDraft
      ? "PENDING"
      : (req.user.role === "Supervisor" || req.user.role === "Admin") ? "APPROVED" : "PENDING";

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
        isDraft,
        promoCode: cleanPromo.promoCode,
        promoDiscountPercent: cleanPromo.promoDiscountPercent,
        // Auto-publish if approved
        published: approvalStatus === "APPROVED",
        ...(cleanTypes.length && { ticketTypes: { create: cleanTypes } }),
      },
      include: { ticketTypes: true },
    });

    if (!isDraft && approvalStatus === "PENDING") {
      notifyRoles(["Admin", "Supervisor"], {
        type: "event_pending",
        title: "New event awaiting approval",
        message: `"${event.title}" was submitted by ${req.user.email} and needs review.`,
        link: `/admin`,
      }).catch(err => console.warn("notifyRoles failed:", err.message));
    }
    broadcastAdminUpdate(["events"]);

    broadcastEventUpdate("created", { id: event.id, title: event.title })
      .catch(err => console.warn("broadcastEventUpdate failed:", err.message));

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

    const { title, description, date, time, location, capacity, price, category, image, agenda, ticketTypes, promoCode, promoDiscountPercent } = req.body;
    const cleanPromo = normalizePromo(promoCode, promoDiscountPercent);

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
    // need this, since they can self-approve. A draft is never part of the
    // approval workflow, so editing one never triggers re-approval either —
    // isDraft itself is only ever changed by POST /:id/submit below.
    const needsReapproval = req.user.role === "Organizer" && !event.isDraft && event.approvalStatus !== "PENDING";

    const updated = await prisma.event.update({
      where: { id: Number(req.params.id) },
      data:  {
        title, description, ...(date && { date: new Date(date) }), ...(time !== undefined && { time }),
        location,
        capacity: derivedCapacity ?? capacity,
        price: derivedPrice ?? price,
        category, image,
        promoCode: cleanPromo.promoCode,
        promoDiscountPercent: cleanPromo.promoDiscountPercent,
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

    broadcastEventUpdate("updated", { id: updated.id, title: updated.title })
      .catch(err => console.warn("broadcastEventUpdate failed:", err.message));

    res.json(updated);
  } catch (err) { next(err); }
});

// PATCH /api/events/:id/submit  (Organizer only) — the one moment a draft
// actually enters the approval workflow: flips isDraft off, sets PENDING,
// and notifies admins for the first time.
router.patch("/:id/submit", requireAuth, requireRole("Organizer"), async (req, res, next) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: Number(req.params.id) } });
    if (!event) return res.status(404).json({ error: "Event not found." });
    if (event.organizerId !== req.user.id) return res.status(403).json({ error: "You can only submit your own events." });
    if (!event.isDraft) return res.status(400).json({ error: "This event is not a draft." });

    const updated = await prisma.event.update({
      where: { id: event.id },
      data:  { isDraft: false, approvalStatus: "PENDING", published: false },
      include: { ticketTypes: true },
    });

    notifyRoles(["Admin", "Supervisor"], {
      type: "event_pending",
      title: "New event awaiting approval",
      message: `"${updated.title}" was submitted by ${req.user.email} and needs review.`,
      link: `/admin`,
    }).catch(err => console.warn("notifyRoles failed:", err.message));

    broadcastAdminUpdate(["events"]);
    broadcastEventUpdate("updated", { id: updated.id, title: updated.title })
      .catch(err => console.warn("broadcastEventUpdate failed:", err.message));

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

    broadcastEventUpdate("deleted", { id: eventId })
      .catch(err => console.warn("broadcastEventUpdate failed:", err.message));

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

// POST /api/events/:id/promote  (Organizer who owns the event, or Admin/Supervisor)
// Sends a promotional email to that event's ticket holders (not cancelled),
// respecting each recipient's `promotional` notification preference.
router.post("/:id/promote", requireAuth, requireRole("Supervisor", "Admin", "Organizer"), async (req, res, next) => {
  try {
    const eventId = Number(req.params.id);
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: "Event not found." });
    if (req.user.role === "Organizer" && event.organizerId !== req.user.id)
      return res.status(403).json({ error: "You can only promote your own events." });

    const { subject, message } = req.body;
    if (!subject?.trim() || !message?.trim())
      return res.status(400).json({ error: "subject and message are required." });

    const tickets = await prisma.ticket.findMany({
      where: { eventId, status: { not: "cancelled" } },
      include: { user: { select: { email: true, notificationPrefs: true } } },
    });
    // De-dupe — a user can hold multiple tickets to the same event.
    const recipients = new Map();
    for (const t of tickets) {
      if (t.user?.email && !recipients.has(t.user.email)) recipients.set(t.user.email, t.user);
    }

    let sent = 0;
    for (const user of recipients.values()) {
      const promoOn = user.notificationPrefs?.promotional === true; // default OFF — opt-in only
      if (!promoOn) continue;
      try {
        await sendPromotionalEmail(user.email, {
          title: subject.trim(),
          message: message.trim(),
          ctaText: "View event",
          ctaLink: `${process.env.FRONTEND_URL || "http://localhost:5173"}/events/${eventId}`,
        });
        sent++;
      } catch (err) {
        console.warn(`Promo email failed for ${user.email}:`, err.message);
      }
    }

    res.json({ message: `Promotional email sent to ${sent} of ${recipients.size} eligible ticket holder(s).`, sent, eligible: recipients.size });
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

    broadcastEventUpdate("approved", { id: updated.id, title: updated.title })
      .catch(err => console.warn("broadcastEventUpdate failed:", err.message));

    // Email every user with Email Notifications on — fire-and-forget so the
    // admin's approve action doesn't wait on a full email blast. Sent
    // sequentially (not all at once) to stay gentle on the SMTP connection.
    notifyAllUsersOfNewEvent(updated).catch(err => console.warn("New-event email blast failed:", err.message));

    res.json(updated);
  } catch (err) { next(err); }
});

async function notifyAllUsersOfNewEvent(event) {
  const users = await prisma.user.findMany({
    where: { status: "active" },
    select: { email: true, notificationPrefs: true },
  });
  const eventDate = event.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  let sent = 0;
  for (const u of users) {
    const emailOn = u.notificationPrefs?.email !== false; // default on
    if (!emailOn) continue;
    try {
      await sendNewEventEmail(u.email, {
        eventTitle: event.title,
        eventDate,
        eventLocation: event.location,
        eventId: event.id,
      });
      sent++;
    } catch (err) {
      console.warn(`New-event email failed for ${u.email}:`, err.message);
    }
  }
  console.log(`New event "${event.title}": ${sent}/${users.length} emails sent.`);
}

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

    broadcastEventUpdate("rejected", { id: updated.id, title: updated.title })
      .catch(err => console.warn("broadcastEventUpdate failed:", err.message));

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
    broadcastEventUpdate("published", { id: updated.id, title: updated.title, published: updated.published })
      .catch(err => console.warn("broadcastEventUpdate failed:", err.message));
    broadcastAdminUpdate(["events"]);
    res.json(updated);
  } catch (err) { next(err); }
});

module.exports = router;
