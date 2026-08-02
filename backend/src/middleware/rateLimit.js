const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");

// Brute-force protection on login — keyed per IP+email so one attacker
// can't lock out other users sharing the same IP (NAT, office network).
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${(req.body?.email || "").toLowerCase()}`,
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
});

// Looser limit for account-creation / OTP / password-reset endpoints —
// still per IP, guards against automated signup spam and OTP flooding.
const authActionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

module.exports = { loginLimiter, authActionLimiter };
