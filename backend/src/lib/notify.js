const { PrismaClient } = require("@prisma/client");
const { getIO } = require("./socket");

const prisma = new PrismaClient();

async function notifyUser(userId, { type, title, message = "", link = "" }) {
  const notification = await prisma.notification.create({
    data: { userId, type, title, message, link },
  });
  try {
    getIO().to(`user:${userId}`).emit("notification", notification);
  } catch { /* socket.io not initialized (e.g. in tests) */ }
  return notification;
}

async function notifyRoles(roles, { type, title, message = "", link = "" }) {
  const users = await prisma.user.findMany({
    where: { role: { in: roles } },
    select: { id: true },
  });
  const notifications = await Promise.all(
    users.map(u => prisma.notification.create({
      data: { userId: u.id, type, title, message, link },
    }))
  );
  try {
    const io = getIO();
    notifications.forEach(n => io.to(`user:${n.userId}`).emit("notification", n));
  } catch { /* socket.io not initialized (e.g. in tests) */ }
  return notifications;
}

// Pushes the current seat count to anyone with this event's page open, so
// availability updates live without a manual refresh.
async function broadcastCapacity(eventId) {
  try {
    const agg = await prisma.ticket.aggregate({
      where: { eventId, status: { not: "cancelled" } },
      _sum: { quantity: true },
    });
    const attending = agg._sum.quantity || 0;
    getIO().to(`event:${eventId}`).emit("capacity-update", { eventId, attending });
  } catch { /* socket.io not initialized (e.g. in tests) */ }
}

module.exports = { notifyUser, notifyRoles, broadcastCapacity };
