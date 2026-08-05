const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Small dependency-free User-Agent parser — good enough for a "Chrome on
// Windows" style label. Not meant to be exhaustive (no bot detection, no
// version numbers) — just enough to make the Security Activity feed
// meaningful without pulling in a full UA-parsing library.
function parseDevice(userAgent) {
  if (!userAgent) return "Unknown device";

  let browser = "Unknown browser";
  if (/edg\//i.test(userAgent))          browser = "Edge";
  else if (/opr\/|opera/i.test(userAgent)) browser = "Opera";
  else if (/chrome\//i.test(userAgent))   browser = "Chrome";
  else if (/firefox\//i.test(userAgent))  browser = "Firefox";
  else if (/safari\//i.test(userAgent))   browser = "Safari";

  let os = "Unknown OS";
  if (/windows/i.test(userAgent))              os = "Windows";
  else if (/android/i.test(userAgent))         os = "Android";
  else if (/iphone|ipad|ipod/i.test(userAgent)) os = "iOS";
  else if (/mac os x/i.test(userAgent))        os = "macOS";
  else if (/linux/i.test(userAgent))           os = "Linux";

  return `${browser} on ${os}`;
}

// req.ip already respects `app.set('trust proxy', 1)` in index.js, so this
// is the real client IP (from X-Forwarded-For) even behind the Cloudflare
// tunnel / a reverse proxy in production — not the proxy's own IP.
function getClientIp(req) {
  return req.ip || req.socket?.remoteAddress || "";
}

// Fire-and-forget — a logging failure must never block a login.
function recordLogin(req, userId, method) {
  prisma.loginEvent.create({
    data: {
      userId,
      ip: getClientIp(req),
      device: parseDevice(req.headers["user-agent"]),
      method,
    },
  }).catch(err => console.warn("recordLogin failed:", err.message));
}

module.exports = { recordLogin, parseDevice, getClientIp };
