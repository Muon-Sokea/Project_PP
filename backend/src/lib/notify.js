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

// Broadcasts an event-related change to ALL connected clients so the home
// page (EventsPage) can refresh the list in real-time without a manual reload.
async function broadcastEventUpdate(action, eventData) {
  try {
    getIO().emit("event-update", { action, event: eventData });
  } catch { /* socket.io not initialized (e.g. in tests) */ }
}

// Tells Admin/Supervisor dashboards which data just changed, so they can
// refetch instead of showing a stale snapshot until the page is reloaded.
// `resources` is a list of the dashboard's data slices affected by the write
// that just happened, e.g. ["tickets", "events"] after a registration —
// add new resource names here as more admin views need live updates.
function broadcastAdminUpdate(resources) {
  try {
    const io = getIO();
    const payload = { resources: Array.isArray(resources) ? resources : [resources], at: new Date().toISOString() };
    io.to("role:Supervisor").to("role:Admin").emit("admin:update", payload);
  } catch { /* socket.io not initialized (e.g. in tests) */ }
}

module.exports = { notifyUser, notifyRoles, broadcastCapacity, broadcastEventUpdate, broadcastAdminUpdate };
