const { PrismaClient } = require("@prisma/client");
const { sendEventReminderEmail } = require("./mailer");

const prisma = new PrismaClient();

// Finds confirmed tickets for events happening tomorrow, emails each
// attendee a reminder (respecting their `reminders` notification
// preference), and marks the ticket so it's never sent twice. Meant to be
// run once a day (see index.js for the cron schedule) — safe to call more
// than once, since `reminderSentAt` guards against duplicate sends.
async function runEventReminders() {
  const tomorrowStart = new Date();
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setHours(23, 59, 59, 999);

  const tickets = await prisma.ticket.findMany({
    where: {
      status: "confirmed",
      reminderSentAt: null,
      event: { date: { gte: tomorrowStart, lte: tomorrowEnd } },
    },
    include: {
      user:  { select: { id: true, email: true, notificationPrefs: true } },
      event: { select: { title: true, date: true, time: true, location: true } },
    },
  });

  let sent = 0;
  for (const ticket of tickets) {
    const remindersOn = ticket.user?.notificationPrefs?.reminders !== false; // default on
    if (remindersOn && ticket.user?.email) {
      try {
        await sendEventReminderEmail(ticket.user.email, {
          eventTitle: ticket.event.title,
          eventDate:  ticket.event.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          eventTime:  ticket.event.time,
          eventLocation: ticket.event.location,
          ticketCode: ticket.ticketCode,
        });
        sent++;
      } catch (err) {
        console.warn(`Reminder email failed for ticket ${ticket.ticketCode}:`, err.message);
        continue; // leave reminderSentAt unset so it retries tomorrow's run
      }
    }
    // Mark as handled even if the pref was off, so we don't re-check it daily.
    await prisma.ticket.update({ where: { id: ticket.id }, data: { reminderSentAt: new Date() } });
  }

  if (tickets.length > 0) console.log(`Event reminders: ${sent}/${tickets.length} emails sent for tomorrow's events.`);
  return { checked: tickets.length, sent };
}

module.exports = { runEventReminders };
