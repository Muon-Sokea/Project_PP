function errorHandler(err, req, res, _next) {
  console.error(err);
  const status = err.status || 500;

  // No route in this app sets `err.status` deliberately — every error that
  // reaches here is an unexpected one (Prisma/DB errors, etc.), whose
  // `.message` can include internal file paths, SQL, and stack details.
  // Only echo the raw message back to the client outside production, or
  // when a route explicitly marked the error as safe to show.
  const safeToExpose = err.status !== undefined || process.env.NODE_ENV !== "production";
  const message = safeToExpose ? (err.message || "Internal server error.") : "Internal server error.";

  res.status(status).json({ error: message });
}

module.exports = errorHandler;
