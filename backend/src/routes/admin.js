const express = require("express");
const os = require("os");
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const redis = require("../lib/redis");
const { isEmailConfigured, verifyEmailService, sendMail } = require("../lib/mailer");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/admin/stats  (Supervisor / Admin only)
// Returns aggregated data for the admin dashboard overview
router.get("/stats", requireAuth, requireRole("Supervisor", "Admin"), async (req, res, next) => {
  try {
    // ── Totals ────────────────────────────────────────────────────────────
    const totalUsers    = await prisma.user.count();
    const totalEvents   = await prisma.event.count();

    // ── Tickets / Revenue ─────────────────────────────────────────────────
    const confirmedTickets = await prisma.ticket.findMany({
      where:  { status: "confirmed" },
      select: { price: true, quantity: true, registeredAt: true, status: true },
    });

    const totalRegistrations = confirmedTickets.reduce((sum, t) => sum + t.quantity, 0);
    const totalRevenue = confirmedTickets.reduce(
      (sum, t) => sum + Number(t.price) * t.quantity,
      0,
    );

    // ── Monthly Revenue (last 6 months) ───────────────────────────────────
    const now = new Date();
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString("en-US", { month: "short" });
      const monthTickets = confirmedTickets.filter((t) => {
        const td = new Date(t.registeredAt);
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
      });
      const revenue = monthTickets.reduce((s, t) => s + Number(t.price) * t.quantity, 0);
      monthlyRevenue.push({ month: label, revenue });
    }

    // ── Events by Category ────────────────────────────────────────────────
    const categoryGroups = await prisma.event.groupBy({
      by:        ["category"],
      _count:    { id: true },
      orderBy:   { _count: { id: "desc" } },
    });
    const eventsByCategory = categoryGroups.map((g) => ({
      category: g.category,
      count:    g._count.id,
    }));

    // ── Recent Registrations (last 10) ─────────────────────────────────────
    const recentTickets = await prisma.ticket.findMany({
      where:   { status: "confirmed" },
      orderBy: { registeredAt: "desc" },
      take:    10,
      include: {
        user:  { select: { firstName: true, lastName: true } },
        event: { select: { title: true } },
      },
    });

    const recentRegistrations = recentTickets.map((t) => ({
      name:   `${t.user.firstName} ${t.user.lastName}`,
      event:  t.event.title,
      date:   t.registeredAt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
      amount: Number(t.price) * t.quantity,
      status: t.status,
    }));

    res.json({
      totalUsers,
      totalEvents,
      totalRevenue,
      totalRegistrations,
      monthlyRevenue,
      eventsByCategory,
      recentRegistrations,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/audit-logs  (Supervisor / Admin only)
// Derives audit-like activity from existing database models
// ─────────────────────────────────────────────────────────────────────────────
router.get("/audit-logs", requireAuth, requireRole("Supervisor", "Admin"), async (req, res, next) => {
  try {
    const logs = [];

    // Recent user registrations
    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take:    20,
      select:  { id: true, firstName: true, lastName: true, role: true, createdAt: true },
    });
    recentUsers.forEach((u) => {
      logs.push({
        ts:    u.createdAt,
        user:  `${u.firstName} ${u.lastName}`,
        role:  u.role,
        action: "User registered",
        ip:    "—",
        ok:    true,
      });
    });

    // Recent events created
    const recentEvents = await prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      take:    20,
      include: { organizer: { select: { firstName: true, lastName: true, role: true } } },
    });
    recentEvents.forEach((e) => {
      logs.push({
        ts:    e.createdAt,
        user:  e.organizer ? `${e.organizer.firstName} ${e.organizer.lastName}` : "Unknown",
        role:  e.organizer?.role || "—",
        action: e.published ? "Published event" : "Created event (draft)",
        ip:    "—",
        ok:    true,
      });
    });

    // Recent tickets/registrations
    const recentTickets = await prisma.ticket.findMany({
      orderBy: { registeredAt: "desc" },
      take:    20,
      include: {
        user:  { select: { firstName: true, lastName: true, role: true } },
        event: { select: { title: true } },
      },
    });
    recentTickets.forEach((t) => {
      logs.push({
        ts:    t.registeredAt,
        user:  `${t.user.firstName} ${t.user.lastName}`,
        role:  t.user.role,
        action: t.status === "cancelled"
          ? `Cancelled registration for ${t.event.title}`
          : `Registered for ${t.event.title}`,
        ip:    "—",
        ok:    t.status !== "cancelled",
      });
    });

    // Recent refunds
    const recentRefunds = await prisma.refund.findMany({
      orderBy: { requestedAt: "desc" },
      take:    20,
      include: { user: { select: { firstName: true, lastName: true, role: true } } },
    });
    recentRefunds.forEach((r) => {
      logs.push({
        ts:    r.requestedAt,
        user:  `${r.user.firstName} ${r.user.lastName}`,
        role:  r.user.role,
        action: `Requested refund for ${r.eventName}`,
        ip:    "—",
        ok:    r.status === "approved",
      });
    });

    // Sort by timestamp descending, take latest 50
    logs.sort((a, b) => new Date(b.ts) - new Date(a.ts));
    const sliced = logs.slice(0, 50);

    // Format timestamps for display
    const formatted = sliced.map((l) => ({
      ...l,
      ts: new Date(l.ts).toISOString().replace("T", " ").slice(0, 19),
    }));

    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/system-health  (Supervisor / Admin only)
// Returns real system metrics from the server
// ─────────────────────────────────────────────────────────────────────────────
router.get("/system-health", requireAuth, requireRole("Supervisor", "Admin"), async (req, res, next) => {
  try {
    const cpus = os.cpus();
    const totalCpu = cpus.reduce((sum, cpu) => {
      const used = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      return sum + ((used - idle) / used) * 100;
    }, 0);
    const cpuPercent = Math.round((totalCpu / cpus.length) * 10) / 10;

    const totalMem = os.totalmem();
    const freeMem  = os.freemem();
    const memPercent = Math.round(((totalMem - freeMem) / totalMem) * 100);

    // Disk — use the project root directory via fs
    let diskPercent = 0;
    try {
      const stats = fs.statfsSync(process.cwd());
      const total = stats.blocks * stats.bsize;
      const free  = stats.bfree * stats.bsize;
      diskPercent = total > 0 ? Math.round(((total - free) / total) * 100) : 0;
    } catch {
      diskPercent = 0;
    }

    // Network / uptime
    const uptimeHours = Math.round(os.uptime() / 3600);
    const loadAvg = os.loadavg()[0];
    const loadPercent = Math.min(100, Math.round((loadAvg / cpus.length) * 100));

    // System info
    const hostname = os.hostname();
    const platform = `${os.type()} ${os.release()}`;

    const services = await Promise.all([
      checkWebServer(),
      checkDatabase(prisma),
      checkEmailService(),
      checkSmsService(redis),
      checkPaymentGateway(),
      checkCdnService(),
    ]);

    // Save to database for history
    try {
      await prisma.healthCheck.create({
        data: {
          cpuUsed:  cpuPercent,
          memUsed:  memPercent,
          diskUsed: diskPercent,
          loadAvg:  loadPercent,
          services: services,
        },
      });
    } catch (dbErr) {
      // Non-fatal — health check still works without persistence
      console.warn("Failed to persist health check:", dbErr.message);
    }

    res.json({
      cpu: {
        used: cpuPercent,
        cores: cpus.length,
        model: cpus[0]?.model || "Unknown",
      },
      memory: {
        used: memPercent,
        total: totalMem,
        free: freeMem,
      },
      disk: {
        used: diskPercent,
      },
      network: {
        load: loadPercent,
        uptimeHours,
      },
      system: {
        hostname,
        platform,
        nodeVersion: process.version,
      },
      services,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/system-health/history  (Supervisor / Admin only)
// Returns recent health check snapshots for trend charts
// ─────────────────────────────────────────────────────────────────────────────
router.get("/system-health/history", requireAuth, requireRole("Supervisor", "Admin"), async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const snapshots = await prisma.healthCheck.findMany({
      orderBy: { createdAt: "desc" },
      take:    limit,
    });

    // Return chronological order for charts (oldest first)
    const data = snapshots.reverse().map((h) => ({
      id:        h.id,
      ts:        h.createdAt.toISOString(),
      cpuUsed:   h.cpuUsed,
      memUsed:   h.memUsed,
      diskUsed:  h.diskUsed,
      loadAvg:   h.loadAvg,
      services:  h.services,
    }));

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ── Shared Report Data Helper ────────────────────────────────────────────────
// Parses date range and fetches all system data used by both
// GET /report-data and POST /email-report endpoints.
async function fetchReportData(startDate, endDate) {
  const start = startDate ? new Date(startDate) : null;
  const end   = endDate   ? new Date(endDate)   : null;
  if (end) end.setHours(23, 59, 59, 999);
  const hasFilter = start || end;

  const dateRange = {
    createdAt: hasFilter ? {
      ...(start ? { gte: start } : {}),
      ...(end   ? { lte: end }   : {}),
    } : {},
  };

  const usersWhere      = { createdAt: dateRange.createdAt };
  const eventsWhere     = { createdAt: dateRange.createdAt };
  const ticketsWhere    = hasFilter ? { registeredAt: {
    ...(start ? { gte: start } : {}),
    ...(end   ? { lte: end }   : {}),
  } } : {};
  const refundsWhere    = hasFilter ? { requestedAt: {
    ...(start ? { gte: start } : {}),
    ...(end   ? { lte: end }   : {}),
  } } : {};
  const testimonialsWhere = { createdAt: dateRange.createdAt };

  // ── Users ──────────────────────────────────────────────────────────────
  const users = await prisma.user.findMany({
    where: usersWhere,
    select: {
      id: true, firstName: true, lastName: true, email: true,
      role: true, status: true, phone: true, address: true,
      createdAt: true, updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // ── Events ──────────────────────────────────────────────────────────────
  const events = await prisma.event.findMany({
    where: eventsWhere,
    include: {
      organizer: { select: { firstName: true, lastName: true, email: true } },
      _count: { select: { tickets: true, testimonials: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const eventsData = events.map((e) => ({
    id: e.id, title: e.title, description: e.description,
    date: e.date, location: e.location, capacity: e.capacity,
    price: Number(e.price), category: e.category,
    published: e.published, createdAt: e.createdAt,
    organizer: e.organizer ? `${e.organizer.firstName} ${e.organizer.lastName}` : "—",
    organizerEmail: e.organizer?.email || "—",
    ticketsSold: e._count.tickets,
    testimonials: e._count.testimonials,
    revenue: e._count.tickets * Number(e.price),
  }));

  // ── Tickets ─────────────────────────────────────────────────────────────
  const tickets = await prisma.ticket.findMany({
    where: ticketsWhere,
    include: {
      user:  { select: { firstName: true, lastName: true, email: true, role: true } },
      event: { select: { title: true, category: true } },
    },
    orderBy: { registeredAt: "desc" },
  });
  const ticketsData = tickets.map((t) => ({
    id: t.id, ticketCode: t.ticketCode, ticketType: t.ticketType,
    quantity: t.quantity, price: Number(t.price), status: t.status,
    registeredAt: t.registeredAt,
    buyer: `${t.user.firstName} ${t.user.lastName}`,
    buyerEmail: t.user.email,
    buyerRole: t.user.role,
    eventTitle: t.event.title,
    eventCategory: t.event.category,
    totalAmount: Number(t.price) * t.quantity,
  }));

  // ── Refunds ─────────────────────────────────────────────────────────────
  const refunds = await prisma.refund.findMany({
    where: refundsWhere,
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: { requestedAt: "desc" },
  });
  const refundsData = refunds.map((r) => ({
    id: r.id, ticketCode: r.ticketCode, eventName: r.eventName,
    reason: r.reason, details: r.details, status: r.status,
    requestedAt: r.requestedAt, resolvedAt: r.resolvedAt,
    user: `${r.user.firstName} ${r.user.lastName}`,
    userEmail: r.user.email,
  }));

  // ── Testimonials ────────────────────────────────────────────────────────
  const testimonials = await prisma.testimonial.findMany({
    where: testimonialsWhere,
    include: {
      user:  { select: { firstName: true, lastName: true } },
      event: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const testimonialsData = testimonials.map((t) => ({
    id: t.id, content: t.content, rating: t.rating,
    createdAt: t.createdAt,
    user: `${t.user.firstName} ${t.user.lastName}`,
    eventTitle: t.event?.title || "—",
  }));

  // ── Aggregated Stats ────────────────────────────────────────────────────
  const confirmedTickets = ticketsData.filter((t) => t.status === "confirmed");
  const totalRevenue = confirmedTickets.reduce((s, t) => s + t.totalAmount, 0);
  const totalRefunds = refundsData.filter((r) => r.status === "approved");

  // Monthly revenue
  const now = new Date();
  let monthOffset = 11;
  if (start) {
    const monthsDiff = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    monthOffset = Math.max(monthsDiff, 0);
  }
  const monthlyRevenue = [];
  for (let i = monthOffset; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("en-US", { month: "short", year: "numeric" });
    const monthTickets = confirmedTickets.filter((t) => {
      const td = new Date(t.registeredAt);
      return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
    });
    const revenue = monthTickets.reduce((s, t) => s + t.totalAmount, 0);
    monthlyRevenue.push({ month: label, revenue, registrations: monthTickets.length });
  }

  // Events by category
  const categoryGroups = await prisma.event.groupBy({
    by: ["category"], _count: { id: true },
    where: eventsWhere,
    orderBy: { _count: { id: "desc" } },
  });
  const eventsByCategory = categoryGroups.map((g) => ({
    category: g.category, count: g._count.id,
  }));

  // Users by role
  const roleGroups = await prisma.user.groupBy({
    by: ["role"], _count: { id: true },
    where: usersWhere,
  });
  const usersByRole = roleGroups.map((g) => ({
    role: g.role, count: g._count.id,
  }));

  // Total counts (unfiltered)
  const [totalUsersAll, totalEventsAll, totalTicketsAll] = await Promise.all([
    prisma.user.count(),
    prisma.event.count(),
    prisma.ticket.count(),
  ]);

  return {
    start,
    end,
    hasFilter,
    summary: {
      totalUsers: users.length,
      totalEvents: events.length,
      totalTickets: tickets.length,
      confirmedTickets: confirmedTickets.length,
      totalRevenue,
      pendingRefunds: refundsData.filter((r) => r.status === "pending").length,
      approvedRefunds: totalRefunds.length,
      avgTicketPrice: confirmedTickets.length > 0 ? Math.round(totalRevenue / confirmedTickets.length) : 0,
      totalUsersAll,
      totalEventsAll,
      totalTicketsAll,
    },
    monthlyRevenue,
    eventsByCategory,
    usersByRole,
    users,
    events: eventsData,
    tickets: ticketsData,
    refunds: refundsData,
    testimonials: testimonialsData,
  };
}

// ── Individual service health checks ──────────────────────────────────────────

async function checkWebServer() {
  return { name: "Web Server", status: "operational" };
}

async function checkDatabase(prisma) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { name: "Database Server", status: "operational" };
  } catch (err) {
    return { name: "Database Server", status: "degraded", error: err.message };
  }
}

async function checkEmailService() {
  if (!isEmailConfigured()) {
    return { name: "Email Service", status: "not_configured", error: "SMTP/Brevo API credentials not set" };
  }
  try {
    await verifyEmailService();
    return { name: "Email Service", status: "operational" };
  } catch (err) {
    return { name: "Email Service", status: "degraded", error: err.message };
  }
}

async function checkSmsService(redis) {
  if (!redis.ping) {
    return { name: "SMS Service", status: "not_configured", error: "REDIS_URL not set (stub mode)" };
  }
  try {
    await redis.ping();
    return { name: "SMS Service", status: "operational" };
  } catch (err) {
    return { name: "SMS Service", status: "degraded", error: err.message };
  }
}

async function checkPaymentGateway() {
  // No real payment gateway integrated; check if any payment-related config exists
  const hasPaymentConfig = process.env.STRIPE_SECRET_KEY || process.env.PAYPAL_CLIENT_ID;
  if (!hasPaymentConfig) {
    return { name: "Payment Gateway", status: "not_configured", error: "No payment provider configured" };
  }
  return { name: "Payment Gateway", status: "operational" };
}

async function checkCdnService() {
  // CDN service check — look for CDN_URL or similar config, or try a simple fetch
  const cdnUrl = process.env.CDN_URL;
  if (!cdnUrl) {
    return { name: "CDN Service", status: "not_configured", error: "CDN_URL not set" };
  }
  try {
    const res = await fetch(cdnUrl, { method: "HEAD", signal: AbortSignal.timeout(5000) });
    return { name: "CDN Service", status: res.ok ? "operational" : "degraded", error: res.ok ? undefined : `HTTP ${res.status}` };
  } catch (err) {
    return { name: "CDN Service", status: "degraded", error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/report-data  (Supervisor / Admin only)
// Returns all system data needed for PDF & CSV report generation
// Query params: startDate, endDate (ISO date strings, optional)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/report-data", requireAuth, requireRole("Supervisor", "Admin"), async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const report = await fetchReportData(startDate, endDate);

    res.json({
      generatedAt: new Date().toISOString(),
      dateRange: {
        startDate: report.start ? report.start.toISOString() : null,
        endDate: report.end ? report.end.toISOString() : null,
        isFiltered: report.hasFilter,
      },
      summary: report.summary,
      monthlyRevenue: report.monthlyRevenue,
      eventsByCategory: report.eventsByCategory,
      usersByRole: report.usersByRole,
      users: report.users,
      events: report.events,
      tickets: report.tickets,
      refunds: report.refunds,
      testimonials: report.testimonials,
    });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/email-report  (Supervisor / Admin only)
// Sends a summary report email to the requesting admin's email address
// ─────────────────────────────────────────────────────────────────────────────
router.post("/email-report", requireAuth, requireRole("Supervisor", "Admin"), async (req, res, next) => {
  try {
    if (!isEmailConfigured()) {
      return res.status(503).json({ error: "Email service not configured. Set SMTP or Brevo API credentials in environment variables." });
    }

    const { startDate, endDate, recipientEmail } = req.body || {};
    const to = recipientEmail || req.user?.email;
    if (!to) {
      return res.status(400).json({ error: "No recipient email provided." });
    }

    // ── Fetch report data via shared helper ─────────────────────────────
    const report = await fetchReportData(startDate, endDate);
    const { summary, hasFilter, start, end } = report;

    const dateRangeLabel = hasFilter
      ? `${start ? start.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "Start"} — ${end ? end.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "Now"}`
      : "All Time";

    // ── Build HTML email ──────────────────────────────────────────────────
    const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;padding:0;">
      <div style="background:linear-gradient(135deg,#4A90D9,#357ABD);padding:32px;border-radius:12px 12px 0 0;">
        <h1 style="color:#fff;margin:0 0 4px;font-size:22px;">ERMS System Report</h1>
        <p style="color:rgba(255,255,255,0.8);margin:0;font-size:13px;">Event Registration & Management System</p>
      </div>
      <div style="background:#ffffff;padding:28px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
        <p style="color:#6b7280;font-size:13px;margin:0 0 20px;">
          <strong>Generated:</strong> ${new Date().toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}<br/>
          <strong>Date Range:</strong> ${dateRangeLabel}
        </p>

        <h2 style="font-size:16px;color:#1a1a2e;margin:0 0 12px;">Executive Summary</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr><td style="padding:10px 12px;background:#f8fafc;border-radius:6px 0 0 6px;font-size:13px;color:#6b7280;">Total Users</td><td style="padding:10px 12px;background:#f8fafc;border-radius:0 6px 6px 0;font-size:15px;font-weight:700;color:#1a1a2e;">${summary.totalUsers}</td></tr>
          <tr><td style="padding:10px 12px;font-size:13px;color:#6b7280;">Total Events</td><td style="padding:10px 12px;font-size:15px;font-weight:700;color:#1a1a2e;">${summary.totalEvents}</td></tr>
          <tr><td style="padding:10px 12px;background:#f8fafc;border-radius:6px 0 0 6px;font-size:13px;color:#6b7280;">Total Tickets Sold</td><td style="padding:10px 12px;background:#f8fafc;border-radius:0 6px 6px 0;font-size:15px;font-weight:700;color:#1a1a2e;">${summary.totalTickets}</td></tr>
          <tr><td style="padding:10px 12px;font-size:13px;color:#6b7280;">Confirmed Tickets</td><td style="padding:10px 12px;font-size:15px;font-weight:700;color:#1a1a2e;">${summary.confirmedTickets}</td></tr>
          <tr><td style="padding:10px 12px;background:#f8fafc;border-radius:6px 0 0 6px;font-size:13px;color:#6b7280;">Total Revenue</td><td style="padding:10px 12px;background:#f8fafc;border-radius:0 6px 6px 0;font-size:15px;font-weight:700;color:#059669;">$${summary.totalRevenue.toLocaleString()}</td></tr>
          <tr><td style="padding:10px 12px;font-size:13px;color:#6b7280;">Avg. Ticket Price</td><td style="padding:10px 12px;font-size:15px;font-weight:700;color:#1a1a2e;">$${summary.avgTicketPrice}</td></tr>
          <tr><td style="padding:10px 12px;background:#f8fafc;border-radius:6px 0 0 6px;font-size:13px;color:#6b7280;">Pending Refunds</td><td style="padding:10px 12px;background:#f8fafc;border-radius:0 6px 6px 0;font-size:15px;font-weight:700;color:#dc2626;">${summary.pendingRefunds}</td></tr>
          <tr><td style="padding:10px 12px;font-size:13px;color:#6b7280;">Approved Refunds</td><td style="padding:10px 12px;font-size:15px;font-weight:700;color:#1a1a2e;">${summary.approvedRefunds}</td></tr>
          <tr><td style="padding:10px 12px;background:#f8fafc;border-radius:6px 0 0 6px;font-size:13px;color:#6b7280;">Testimonials</td><td style="padding:10px 12px;background:#f8fafc;border-radius:0 6px 6px 0;font-size:15px;font-weight:700;color:#1a1a2e;">${report.testimonials.length}</td></tr>
        </table>

        <p style="font-size:12px;color:#9ca3af;margin:0;text-align:center;">
          This is an automated report from the ERMS Admin Dashboard. For detailed data, download the full PDF or CSV report from the dashboard.
        </p>
      </div>
    </div>`;

    await sendMail({
      from: process.env.SMTP_FROM || `"Planning Center" <${process.env.SMTP_USER}>`,
      to,
      subject: `ERMS System Report — ${dateRangeLabel}`,
      html,
    });

    res.json({ success: true, message: `Report sent to ${to}` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
