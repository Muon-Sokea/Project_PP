const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

// Formats a raw Cambodian local number (as stored on the user, e.g.
// "089285611") into a display-ready international number: strips the local
// trunk "0" (or an already-present "855"), prepends the +855 country code,
// then groups the remaining digits 2-3-3 (e.g. "89285611" -> "89 285 611").
// The country code intentionally only ever appears in this backend-computed
// string — nothing in the frontend hardcodes it.
function formatKhmerPhone(raw) {
  if (!raw) return "";
  let digits = String(raw).replace(/\D/g, "");
  if (digits.startsWith("855")) digits = digits.slice(3);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  if (!digits) return "";

  let grouped;
  if (digits.length === 8) {
    grouped = `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  } else if (digits.length === 9) {
    grouped = `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  } else {
    grouped = digits.replace(/(\d{3})(?=\d)/g, "$1 ").trim();
  }
  return `+855 ${grouped}`;
}

// GET /api/settings/contact  (public — no auth)
// Powers the public-facing contact phone number (footer, legal pages) so it
// always reflects the current Super Admin's phone rather than a hardcoded
// number that goes stale.
router.get("/contact", async (_req, res, next) => {
  try {
    const supervisor = await prisma.user.findFirst({
      where: { role: "Supervisor" },
      orderBy: { createdAt: "asc" },
      select: { phone: true },
    });
    res.json({ phone: formatKhmerPhone(supervisor?.phone) });
  } catch (err) { next(err); }
});

module.exports = router;
