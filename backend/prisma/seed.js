const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Seed staff users (mirrors mockUsers in mockData.js)
  const staff = [
    { firstName: "Muon",    lastName: "Sokea",      email: "muonsokea@gmail.com",     password: "sokea123",      role: "Supervisor" },
    { firstName: "San",     lastName: "Sotheayuth", email: "sansotheayuth@gmail.com", password: "sotheayuth123", role: "Admin" },
    { firstName: "Proeung", lastName: "Sivly",      email: "proeungsivly@gmail.com",  password: "sivly123",      role: "Organizer" },
  ];

  let organizer;
  for (const u of staff) {
    const hash = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password: hash },
    });
    if (u.role === "Organizer") organizer = user;
    console.log(`  ✓ ${u.role}: ${u.email}`);
  }

  // Seed a handful of sample events
  const sampleEvents = [
    {
      title: "Tech Innovation Summit 2026", category: "Technology",
      date: new Date("2026-10-30"), location: "Phnom Penh Convention Centre",
      capacity: 500, price: 25,
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Startup Pitch Night", category: "Business",
      date: new Date("2026-09-20"), location: "Factory Phnom Penh",
      capacity: 200, price: 10,
      image: "https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Khmer Digital Arts Festival", category: "Entertainment",
      date: new Date("2026-11-05"), location: "National Museum, Phnom Penh",
      capacity: 800, price: 0,
      image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Leadership Workshop Series", category: "Workshop",
      date: new Date("2026-12-10"), location: "Rosewood Hotel, Phnom Penh",
      capacity: 50, price: 50,
      image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Networking & Innovation Forum", category: "Networking",
      date: new Date("2026-09-20"), location: "RUPP, Phnom Penh",
      capacity: 300, price: 15,
      image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
    },
  ];

  for (const e of sampleEvents) {
    const existing = await prisma.event.findFirst({ where: { title: e.title } });
    if (existing) {
      await prisma.event.update({ where: { id: existing.id }, data: { image: e.image } });
    } else {
      await prisma.event.create({ data: { ...e, organizerId: organizer.id, published: true } });
    }
    console.log(`  ✓ Event: ${e.title}`);
  }

  console.log("\nSeed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
