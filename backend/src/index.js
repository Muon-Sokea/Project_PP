const path   = require("path");
const fs     = require("fs");
const os     = require("os");
require("dotenv").config();
const http    = require("http");
const express = require("express");
const cors    = require("cors");
const { initSocket } = require("./lib/socket");

const authRoutes          = require("./routes/auth");
const eventRoutes         = require("./routes/events");
const registrationRoutes  = require("./routes/registrations");
const ticketRoutes        = require("./routes/tickets");
const refundRoutes        = require("./routes/refunds");
const testimonialRoutes   = require("./routes/testimonials");
const uploadRoutes        = require("./routes/upload");
const organizerRoutes     = require("./routes/organizer");
const userRoutes          = require("./routes/users");
const adminRoutes         = require("./routes/admin");
const notificationRoutes  = require("./routes/notifications");
const bookmarkRoutes      = require("./routes/bookmarks");
const errorHandler        = require("./middleware/errorHandler");

const app  = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 4000;

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  "http://127.0.0.1:5173", "http://localhost:5173",
  "http://10.4.30.219:5173",
  "http://127.0.0.1:5500", "http://localhost:5500",
  "http://127.0.0.1:5501", "http://localhost:5501",
  "http://127.0.0.1:3000", "http://localhost:3000",
  "https://graceful-strength-production-1c0e.up.railway.app",
  // Temporary Cloudflare tunnel — used to test Google/Telegram login, which
  // both require a public HTTPS domain. Ephemeral: replace/remove once a
  // real production domain is registered with Google Console and BotFather.
  "https://occupations-requires-expand-genetic.trycloudflare.com",
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
app.use("/api/admin",         adminRoutes);
app.use("/api/upload",        uploadRoutes);
app.use("/api/organizer",     organizerRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/bookmarks",      bookmarkRoutes);

// Serve uploaded images statically
app.use("/uploads", express.static("uploads"));

// Serve built frontend SPA (dist folder) — no Vite WebSocket needed
const frontendDist = path.join(__dirname, "..", "..", "frontend", "dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // SPA fallback: serve index.html for all non-API routes
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api")) return res.status(404).json({ error: "Not found" });
    res.sendFile(path.join(frontendDist, "index.html"));
  });
  console.log(`Frontend SPA served from ${frontendDist}`);
}

app.use(errorHandler);

const server = http.createServer(app);
initSocket(server, ALLOWED_ORIGINS);

// start
server.listen(PORT, "0.0.0.0", () => {
  if (process.env.NODE_ENV !== "production") {
    console.log(`ERMS API running on http://localhost:${PORT}`);
  }
  const ifaces = os.networkInterfaces();
  if (ifaces) {
    const addresses = Object.values(ifaces).flat().filter(i => i && i.family === "IPv4" && !i.internal);
    if (addresses.length > 0) {
      console.log(`🌐 Network access: http://${addresses[0].address}:${PORT}`);
    }
  }
});