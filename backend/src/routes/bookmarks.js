const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/bookmarks — Get current user's bookmarked events
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        event: {
          include: {
            organizer: { select: { id: true, firstName: true, lastName: true } },
            _count: { select: { tickets: { where: { status: { not: "cancelled" } } } } },
          },
        },
      },
    });

    const events = bookmarks.map(b => {
      const { _count, ...event } = b.event;
      return {
        bookmarkId: b.id,
        bookmarkedAt: b.createdAt,
        ...event,
        attending: _count.tickets,
      };
    });

    res.json(events);
  } catch (err) { next(err); }
});

// POST /api/bookmarks/:eventId — Bookmark an event
router.post("/:eventId", requireAuth, async (req, res, next) => {
  try {
    const eventId = Number(req.params.eventId);
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: "Event not found." });

    // Check if already bookmarked
    const existing = await prisma.bookmark.findUnique({
      where: { userId_eventId: { userId: req.user.id, eventId } },
    });
    if (existing) return res.json({ message: "Already bookmarked." });

    const bookmark = await prisma.bookmark.create({
      data: { userId: req.user.id, eventId },
    });

    res.status(201).json(bookmark);
  } catch (err) { next(err); }
});

// DELETE /api/bookmarks/:eventId — Remove a bookmark
router.delete("/:eventId", requireAuth, async (req, res, next) => {
  try {
    const eventId = Number(req.params.eventId);
    const existing = await prisma.bookmark.findUnique({
      where: { userId_eventId: { userId: req.user.id, eventId } },
    });
    if (!existing) return res.status(404).json({ error: "Bookmark not found." });

    await prisma.bookmark.delete({
      where: { id: existing.id },
    });

    res.json({ message: "Bookmark removed." });
  } catch (err) { next(err); }
});

// GET /api/bookmarks/check/:eventId — Check if an event is bookmarked
router.get("/check/:eventId", requireAuth, async (req, res, next) => {
  try {
    const eventId = Number(req.params.eventId);
    const existing = await prisma.bookmark.findUnique({
      where: { userId_eventId: { userId: req.user.id, eventId } },
    });
    res.json({ bookmarked: !!existing });
  } catch (err) { next(err); }
});

module.exports = router;
