const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io = null;

function initSocket(httpServer, allowedOrigins = []) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === "development") {
          return cb(null, true);
        }
        cb(new Error(`Socket.IO CORS: ${origin} not allowed`));
      },
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token provided."));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error("Invalid or expired token."));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.user.id}`);
    socket.join(`role:${socket.user.role}`);

    // Live seat-availability updates for whichever event page a client has open.
    socket.on("join-event", (eventId) => {
      const id = Number(eventId);
      if (Number.isInteger(id)) socket.join(`event:${id}`);
    });
    socket.on("leave-event", (eventId) => {
      const id = Number(eventId);
      if (Number.isInteger(id)) socket.leave(`event:${id}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error("Socket.IO not initialized yet.");
  return io;
}

module.exports = { initSocket, getIO };
