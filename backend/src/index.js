require("dotenv").config();
const express = require("express");
const cors    = require("cors");

const authRoutes          = require("./routes/auth");
const eventRoutes         = require("./routes/events");
const registrationRoutes  = require("./routes/registrations");
const ticketRoutes        = require("./routes/tickets");
const refundRoutes        = require("./routes/refunds");
const testimonialRoutes   = require("./routes/testimonials");
const userRoutes          = require("./routes/users");
const errorHandler        = require("./middleware/errorHandler");

const app  = express();
const PORT = process.env.PORT || 4000;

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  "http://127.0.0.1:5173", "http://localhost:5173",
  "http://127.0.0.1:5500", "http://localhost:5500",
  "http://127.0.0.1:5501", "http://localhost:5501",
  "http://127.0.0.1:3000", "http://localhost:3000",
  "https://graceful-strength-production-1c0e.up.railway.app",
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman) or any allowed origin
    if (!origin || ALLOWED_ORIGINS.includes(origin) || process.env.NODE_ENV === "development") {
      return cb(null, true);
    }
    cb(new Error(`CORS: ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth",          authRoutes);
app.use("/api/events",        eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/tickets",       ticketRoutes);
app.use("/api/refunds",       refundRoutes);
app.use("/api/testimonials",  testimonialRoutes);
app.use("/api/users",         userRoutes);

app.use(errorHandler);

// start
app.listen(PORT, () => {
  if (process.env.NODE_ENV !== "production") {
    console.log(`ERMS API running on http://localhost:${PORT}`);
  }
});