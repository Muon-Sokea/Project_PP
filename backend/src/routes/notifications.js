const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { requireAuth } = require("../middleware/auth");
const { sendEventReminderEmail, sendRefundUpdateEmail, sendPromotionalEmail, sendTestEmail } = require("../lib/mailer");

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/notifications — List the logged-in user's in-app notifications
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 30));
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({ where: { userId: req.user.id, read: false } }),
    ]);
    res.json({ notifications, unreadCount });
  } catch (err) { next(err); }
});

// PATCH /api/notifications/:id/read — Mark a single notification as read
router.patch("/:id/read", requireAuth, async (req, res, next) => {
  try {
    const notification = await prisma.notification.findUnique({ where: { id: Number(req.params.id) } });
    if (!notification || notification.userId !== req.user.id)
      return res.status(404).json({ error: "Notification not found." });

    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data:  { read: true },
    });
    res.json(updated);
  } catch (err) { next(err); }
});

// PATCH /api/notifications/read-all — Mark all of the logged-in user's notifications as read
router.patch("/read-all", requireAuth, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data:  { read: true },
    });
    res.json({ message: "All notifications marked as read." });
  } catch (err) { next(err); }
});

// GET /api/notifications/preferences — Get the logged-in user's notification prefs
router.get("/preferences", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { notificationPrefs: true },
    });
    // Default preferences if none saved
    const defaults = { email: true, reminders: true, promotional: false, refundUpdates: true };
    let prefs = defaults;
    if (user?.notificationPrefs && typeof user.notificationPrefs === "object") {
      prefs = { ...defaults, ...user.notificationPrefs };
    }
    res.json(prefs);
  } catch (err) { next(err); }
});

// PUT /api/notifications/preferences — Save notification prefs
router.put("/preferences", requireAuth, async (req, res, next) => {
  try {
    const prefs = req.body;
    // Validate shape
    const allowed = ["email", "reminders", "promotional", "refundUpdates"];
    const clean = {};
    for (const key of allowed) {
      if (typeof prefs[key] === "boolean") clean[key] = prefs[key];
    }
    await prisma.user.update({
      where: { id: req.user.id },
      data: { notificationPrefs: clean },
    });
    res.json({ message: "Preferences saved.", prefs: clean });
  } catch (err) { next(err); }
});

// POST /api/notifications/send — Send a notification email
// Body: { type: "reminder"|"refund"|"promotional"|"test", data: {...} }
router.post("/send", requireAuth, async (req, res, next) => {
  try {
    const { type, data } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: "User not found." });

    const to = user.email;

    switch (type) {
      case "reminder":
        await sendEventReminderEmail(to, {
          eventTitle: data.eventTitle,
          eventDate: data.eventDate,
          eventTime: data.eventTime,
          eventLocation: data.eventLocation,
          ticketCode: data.ticketCode,
        });
        break;
      case "refund":
        await sendRefundUpdateEmail(to, {
          eventName: data.eventName,
          ticketCode: data.ticketCode,
          status: data.status,
          reason: data.reason,
        });
        break;
      case "promotional":
        await sendPromotionalEmail(to, {
          title: data.title || "Special offer from Planning Center",
          message: data.message,
          ctaText: data.ctaText,
          ctaLink: data.ctaLink,
        });
        break;
      case "test":
        await sendTestEmail(to);
        break;
      default:
        return res.status(400).json({ error: `Unknown notification type: ${type}` });
    }

    res.json({ message: "Notification sent.", type, to });
  } catch (err) {
    console.error("Notification send failed:", err.message);
    // Don't expose SMTP internals
    res.status(500).json({ error: "Failed to send notification. Check SMTP settings." });
  }
});

// POST /api/notifications/send-test — Quick test email to verify SMTP
router.post("/send-test", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: "User not found." });
    await sendTestEmail(user.email);
    res.json({ message: "Test email sent." });
  } catch (err) {
    console.error("Test email failed:", err.message);
    res.status(500).json({ error: "Failed to send test email. Check SMTP settings." });
  }
});

module.exports = router;
