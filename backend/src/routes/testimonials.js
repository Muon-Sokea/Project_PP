const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/testimonials  (public)
router.get("/", async (req, res, next) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
    res.json(testimonials);
  } catch (err) { next(err); }
});

// POST /api/testimonials  (authenticated)
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { content, rating, eventId = null } = req.body;
    if (!content || rating === undefined)
      return res.status(400).json({ error: "content and rating are required." });
    if (rating < 1 || rating > 5)
      return res.status(400).json({ error: "rating must be between 1 and 5." });

    const testimonial = await prisma.testimonial.create({
      data: { content, rating, userId: req.user.id, ...(eventId && { eventId: Number(eventId) }) },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
    res.status(201).json(testimonial);
  } catch (err) { next(err); }
});

module.exports = router;
