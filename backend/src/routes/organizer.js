const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/organizer/stats — Dashboard stats for the logged-in organizer
// Supports pagination via ?page=1&limit=20
router.get("/stats", requireAuth, requireRole("Supervisor", "Admin", "Organizer"), async (req, res, next) => {
  try {
    const page    = Math.max(1, parseInt(req.query.page) || 1);
    const limit   = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip    = (page - 1) * limit;

    // An Organizer only ever sees their own events here — including their own
    // drafts, which is the whole point of a draft. Admin/Supervisor use this
    // same dashboard shape but must never see any organizer's drafts.
    const whereClause = req.user.role === "Organizer"
      ? { organizerId: req.user.id }
      : { isDraft: false };

    // ── Block 1: Fetch paginated events + total count (parallel) ──
    const [events, totalEvents] = await Promise.all([
      prisma.event.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { ticketTypes: { orderBy: { price: "asc" } } },
      }),
      prisma.event.count({ where: whereClause }),
    ]);

    const eventIds = events.map(e => e.id);

    // ── Block 2: GROUP BY ticket counts + aggregate revenue + recent tickets (all parallel) ──
    // These only need eventIds (from Block 1), so they can run concurrently
    const [countsResult, aggResult, recentTicketsResult] = await Promise.all([
      // Single GROUP BY query (replaces N+1 _count subqueries!) — sums seats
      // booked (quantity) per event, not ticket row count.
      eventIds.length > 0
        ? prisma.ticket.groupBy({
            by: ["eventId"],
            where: {
              eventId: { in: eventIds },
              status:  { not: "cancelled" },
            },
            _sum: { quantity: true },
          })
        : Promise.resolve([]),

      // Aggregate revenue & total registrations (seats booked) across ALL events
      prisma.$queryRaw`
          SELECT
            COALESCE(SUM(t."quantity"), 0)::int  AS "count",
            COALESCE(SUM(t."price" * t."quantity"), 0)::float AS "revenue"
          FROM "Ticket" t
          WHERE t."status" != 'cancelled'
        `,

      // Recent 5 registrations
      eventIds.length > 0
        ? prisma.ticket.findMany({
            where: {
              eventId: { in: eventIds },
              status:  { not: "cancelled" },
            },
            orderBy: { registeredAt: "desc" },
            take: 5,
            include: {
              user:  { select: { firstName: true, lastName: true, email: true } },
              event: { select: { title: true } },
            },
          })
        : Promise.resolve([]),
    ]);

    // ── Parse results ──
    const ticketCountMap = Object.fromEntries(
      (countsResult || []).map(c => [c.eventId, c._sum.quantity || 0])
    );

    const aggRow = Array.isArray(aggResult) ? aggResult[0] : aggResult;
    const totalRegistrations = Number(aggRow?.count)   || 0;
    const totalRevenue       = Number(aggRow?.revenue) || 0;
    const averageAttendee    = totalEvents > 0 ? Math.round(totalRegistrations / totalEvents) : 0;

    const recentRegistrations = (recentTicketsResult || []).map(t => ({
      name:   `${t.user.firstName} ${t.user.lastName}`,
      email:  t.user.email,
      event:  t.event.title,
      date:   t.registeredAt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
      amount: Number(t.price) * t.quantity,
      status: t.status,
    }));

    // ── Map response ──
    res.json({
      totalEvents,
      totalRegistrations,
      totalRevenue,
      averageAttendee,
      page,
      limit,
      totalPages: Math.ceil(totalEvents / limit),
      recentRegistrations,
      events: events.map(e => ({
        id: e.id,
        title: e.title,
        date: e.date,
        time: e.time,
        location: e.location,
        image: e.image,
        price: Number(e.price),
        capacity: e.capacity,
        registered: ticketCountMap[e.id] || 0,
        status: e.published ? "published" : "unpublished",
        approvalStatus: e.approvalStatus,
        isDraft: e.isDraft,
        description: e.description,
        category: e.category,
        agenda: e.agenda,
        ticketTypes: e.ticketTypes,
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
