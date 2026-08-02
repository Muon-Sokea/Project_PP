/**
 * Bulk-generates realistic data for the erms database (large volume).
 * Additive: does not delete existing rows. Run with `node scripts/generate-data.js`.
 */
const { PrismaClient } = require("@prisma/client");
const { faker } = require("@faker-js/faker");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const USER_COUNT = 200;
const EVENT_COUNT = 50;
const TICKET_COUNT = 800;

const CATEGORIES = ["Music", "Tech", "Business", "Sports", "Arts", "Food", "Education", "Health", "General"];
const TICKET_TYPE_NAMES = ["General Admission", "VIP", "Early Bird", "Student", "Group"];
const NOTIFICATION_TYPES = ["ticket", "event", "refund", "system"];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("Hashing shared placeholder password...");
  const passwordHash = await bcrypt.hash("Password123!", 10);

  console.log(`Creating ${USER_COUNT} users...`);
  const users = [];
  for (let i = 0; i < USER_COUNT; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const role = i < 5 ? "Organizer" : faker.helpers.weightedArrayElement([
      { value: "Attendee", weight: 8 },
      { value: "Organizer", weight: 1.5 },
      { value: "Admin", weight: 0.4 },
      { value: "Supervisor", weight: 0.1 },
    ]);
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: faker.internet.email({ firstName, lastName: `${lastName}${faker.string.alphanumeric(4)}`, provider: "example.com" }).toLowerCase(),
        password: passwordHash,
        avatar: faker.image.avatarGitHub(),
        phone: faker.phone.number(),
        address: faker.location.streetAddress({ useFullAddress: true }),
        role,
        status: faker.helpers.weightedArrayElement([{ value: "active", weight: 9 }, { value: "suspended", weight: 1 }]),
        notificationPrefs: { email: true, push: faker.datatype.boolean() },
      },
    });
    users.push(user);
  }

  const organizers = users.filter((u) => u.role === "Organizer");

  console.log(`Creating ${EVENT_COUNT} events (with ticket types)...`);
  const events = [];
  for (let i = 0; i < EVENT_COUNT; i++) {
    const category = pick(CATEGORIES);
    const event = await prisma.event.create({
      data: {
        title: `${faker.company.buzzAdjective()} ${category} ${faker.company.buzzNoun()}`.replace(/^\w/, (c) => c.toUpperCase()),
        description: faker.lorem.paragraphs(2),
        date: faker.date.between({ from: "2026-01-01", to: "2027-06-01" }),
        time: `${faker.number.int({ min: 8, max: 20 })}:00`,
        location: `${faker.location.city()}, ${faker.location.country()}`,
        capacity: faker.number.int({ min: 50, max: 2000 }),
        price: faker.number.float({ min: 0, max: 200, fractionDigits: 2 }),
        category,
        image: faker.image.urlPicsumPhotos(),
        agenda: [
          { time: "09:00", item: "Registration & Welcome" },
          { time: "10:00", item: "Keynote" },
          { time: "13:00", item: "Lunch" },
          { time: "15:00", item: "Closing" },
        ],
        published: faker.datatype.boolean({ probability: 0.85 }),
        approvalStatus: faker.helpers.weightedArrayElement([
          { value: "APPROVED", weight: 8 },
          { value: "PENDING", weight: 1.5 },
          { value: "REJECTED", weight: 0.5 },
        ]),
        organizerId: pick(organizers).id,
      },
    });

    const ticketTypeCount = faker.number.int({ min: 1, max: 3 });
    const ticketTypes = [];
    for (const name of faker.helpers.arrayElements(TICKET_TYPE_NAMES, ticketTypeCount)) {
      const tt = await prisma.ticketType.create({
        data: {
          eventId: event.id,
          name,
          price: faker.number.float({ min: 0, max: 250, fractionDigits: 2 }),
          quantity: faker.number.int({ min: 20, max: 500 }),
          description: faker.lorem.sentence(),
        },
      });
      ticketTypes.push(tt);
    }
    events.push({ ...event, ticketTypes });
  }

  console.log(`Creating ${TICKET_COUNT} tickets...`);
  const tickets = [];
  for (let i = 0; i < TICKET_COUNT; i++) {
    const event = pick(events);
    const ticketType = event.ticketTypes.length ? pick(event.ticketTypes) : null;
    const status = faker.helpers.weightedArrayElement([
      { value: "confirmed", weight: 8 },
      { value: "pending", weight: 1 },
      { value: "cancelled", weight: 1 },
    ]);
    const ticket = await prisma.ticket.create({
      data: {
        ticketType: ticketType?.name ?? "standard",
        quantity: faker.number.int({ min: 1, max: 4 }),
        price: ticketType?.price ?? event.price,
        status,
        userId: pick(users).id,
        eventId: event.id,
        ticketTypeId: ticketType?.id ?? null,
        registeredAt: faker.date.recent({ days: 180 }),
      },
    });
    tickets.push(ticket);
  }

  console.log("Creating bookmarks...");
  const bookmarkPairs = new Set();
  let bookmarkCount = 0;
  for (let i = 0; i < 300; i++) {
    const user = pick(users);
    const event = pick(events);
    const key = `${user.id}-${event.id}`;
    if (bookmarkPairs.has(key)) continue;
    bookmarkPairs.add(key);
    await prisma.bookmark.create({ data: { userId: user.id, eventId: event.id } });
    bookmarkCount++;
  }

  console.log("Creating refunds for cancelled tickets...");
  const cancelledTickets = tickets.filter((t) => t.status === "cancelled");
  for (const ticket of cancelledTickets) {
    const event = events.find((e) => e.id === ticket.eventId);
    await prisma.refund.create({
      data: {
        ticketCode: ticket.ticketCode,
        eventName: event?.title ?? "Unknown Event",
        reason: pick(["Schedule conflict", "Found a better option", "No longer available", "Wrong event booked", "Financial reasons"]),
        details: faker.lorem.sentence(),
        status: faker.helpers.weightedArrayElement([
          { value: "pending", weight: 5 },
          { value: "approved", weight: 3 },
          { value: "rejected", weight: 2 },
        ]),
        userId: ticket.userId,
      },
    });
  }

  console.log("Creating testimonials...");
  let testimonialCount = 0;
  for (let i = 0; i < 250; i++) {
    const ticket = pick(tickets);
    if (ticket.status !== "confirmed") continue;
    await prisma.testimonial.create({
      data: {
        content: faker.lorem.paragraph(),
        rating: faker.number.int({ min: 1, max: 5 }),
        userId: ticket.userId,
        eventId: ticket.eventId,
      },
    });
    testimonialCount++;
  }

  console.log("Creating notifications...");
  let notificationCount = 0;
  for (let i = 0; i < 400; i++) {
    const user = pick(users);
    const type = pick(NOTIFICATION_TYPES);
    await prisma.notification.create({
      data: {
        type,
        title: faker.lorem.sentence(4),
        message: faker.lorem.sentence(),
        link: "",
        read: faker.datatype.boolean({ probability: 0.4 }),
        userId: user.id,
      },
    });
    notificationCount++;
  }

  console.log("\nDone. Created:");
  console.log({
    users: users.length,
    events: events.length,
    ticketTypes: events.reduce((sum, e) => sum + e.ticketTypes.length, 0),
    tickets: tickets.length,
    bookmarks: bookmarkCount,
    refunds: cancelledTickets.length,
    testimonials: testimonialCount,
    notifications: notificationCount,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
