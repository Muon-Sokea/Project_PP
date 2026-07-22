const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const prisma = new PrismaClient();

// Random helper
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Cambodia addresses
const ADDRESSES = [
  "No. 123, Street 240, Phnom Penh",
  "No. 45, Street 63, Siem Reap",
  "No. 78, National Road 5, Battambang",
  "No. 12, Street 108, Phnom Penh",
  "No. 34, Street 178, Phnom Penh",
  "No. 56, Street 93, Phnom Penh",
  "No. 89, National Road 2, Takeo",
  "No. 23, Street 155, Phnom Penh",
  "No. 67, Street 450, Phnom Penh",
  "No. 11, Street 110, Phnom Penh",
  "No. 90, National Road 3, Kampong Speu",
  "No. 44, Street 214, Phnom Penh",
  "No. 77, Street 19, Sihanoukville",
  "No. 32, Street 310, Phnom Penh",
  "No. 55, National Road 6, Kampong Cham",
  "No. 18, Street 258, Phnom Penh",
  "No. 66, Street 115, Phnom Penh",
  "No. 22, Street 440, Phnom Penh",
  "No. 88, National Road 1, Kandal",
  "No. 41, Street 169, Phnom Penh",
  "No. 99, Street 306, Phnom Penh",
  "No. 15, Street 135, Phnom Penh",
  "No. 72, Street 51, Phnom Penh",
  "No. 37, Street 199, Phnom Penh",
  "No. 50, Street 609, Phnom Penh",
  "No. 81, Street 371, Phnom Penh",
  "No. 29, Street 289, Phnom Penh",
  "No. 63, Street 187, Phnom Penh",
  "No. 14, Street 118, Phnom Penh",
  "No. 85, Street 271, Phnom Penh",
  "No. 46, Street 351, Phnom Penh",
  "No. 73, Street 432, Phnom Penh",
  "No. 33, Street 130, Phnom Penh",
  "No. 58, Street 150, Phnom Penh",
  "No. 27, Street 200, Phnom Penh",
  "No. 92, Street 163, Phnom Penh",
  "No. 40, Street 265, Phnom Penh",
  "No. 69, Street 123, Phnom Penh",
  "No. 17, Street 380, Phnom Penh",
  "No. 54, Street 175, Phnom Penh",
  "No. 82, Street 315, Phnom Penh",
  "No. 36, Street 142, Phnom Penh",
  "No. 61, Street 294, Phnom Penh",
  "No. 20, Street 105, Phnom Penh",
  "No. 75, Street 360, Phnom Penh",
  "No. 48, Street 184, Phnom Penh",
  "No. 13, Street 222, Phnom Penh",
  "No. 87, Street 145, Phnom Penh",
  "No. 39, Street 330, Phnom Penh",
  "No. 64, Street 192, Phnom Penh",
];

async function main() {
  console.log("Seeding database...\n");

  // ── Staff users ──────────────────────────────────────────────────────────
  const staff = [
    { firstName: "Muon",    lastName: "Sokea",      email: "muonsokea@gmail.com",     password: "sokea123",      role: "Supervisor", address: ADDRESSES[0] },
    // Admins (existing + 2 new)
    { firstName: "San",     lastName: "Sotheayuth", email: "sansotheayuth@gmail.com", password: "sotheayuth123", role: "Admin", address: ADDRESSES[1] },
    { firstName: "Bopha",   lastName: "Chan",       email: "bopha.chan@gmail.com",    password: "bopha123",      role: "Admin", address: ADDRESSES[2] },
    { firstName: "Kosal",   lastName: "Phan",       email: "kosal.phan@gmail.com",    password: "kosal123",      role: "Admin", address: ADDRESSES[3] },
    // Organizers (existing + 6 new = 7 total)
    { firstName: "Proeung", lastName: "Sivly",      email: "proeungsivly@gmail.com",  password: "sivly123",      role: "Organizer", address: ADDRESSES[4] },
    { firstName: "Sokha",   lastName: "Dara",       email: "sokha.dara@gmail.com",    password: "sokha123",      role: "Organizer", address: ADDRESSES[5] },
    { firstName: "Davith",  lastName: "Oum",        email: "davith.oum@gmail.com",    password: "davith123",     role: "Organizer", address: ADDRESSES[6] },
    { firstName: "Chantou", lastName: "Nhem",       email: "chantou.nhem@gmail.com",  password: "chantou123",    role: "Organizer", address: ADDRESSES[7] },
    { firstName: "Sophea",  lastName: "Khem",       email: "sophea.khem@gmail.com",   password: "sophea123",     role: "Organizer", address: ADDRESSES[8] },
    { firstName: "Rotha",   lastName: "Yim",        email: "rotha.yim@gmail.com",     password: "rotha123",      role: "Organizer", address: ADDRESSES[9] },
    { firstName: "Chamroeun", lastName: "Kan",      email: "chamroeun.kan@gmail.com", password: "chamroeun123",  role: "Organizer", address: ADDRESSES[10] },
    // Original attendee
    { firstName: "Long",    lastName: "Tola",       email: "longtola@gmail.com",      password: "tola123",       role: "Attendee", address: ADDRESSES[11] },
    { firstName: "Lang",    lastName: "Socheat",    email: "langsocheat@gmail.com",   password: "socheat123",    role: "Attendee", address: ADDRESSES[12] },
  ];

  const organizers = [];
  for (const u of staff) {
    const hash = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { address: u.address },
      create: { ...u, password: hash },
    });
    if (u.role === "Organizer") organizers.push(user);
    console.log(`  ✓ ${u.role}: ${u.email}`);
  }

  // ── 90 Attendees with addresses ──────────────────────────────────────────
  const attendees = [
    { firstName: "Sokhem",    lastName: "Meas",       email: "sokhem.meas@gmail.com",    password: "attend001" },
    { firstName: "Dara",      lastName: "Sovann",     email: "dara.sovann@gmail.com",    password: "attend002" },
    { firstName: "Sothea",    lastName: "Khiev",      email: "sothea.khiev@gmail.com",   password: "attend003" },
    { firstName: "Vibol",     lastName: "Sam",        email: "vibol.sam@gmail.com",      password: "attend004" },
    { firstName: "Bun",       lastName: "Rin",        email: "bun.rin@gmail.com",        password: "attend005" },
    { firstName: "Samantha",  lastName: "Sen",        email: "samantha.sen@gmail.com",   password: "attend006" },
    { firstName: "Chea",      lastName: "Heng",       email: "chea.heng@gmail.com",      password: "attend007" },
    { firstName: "Mealea",    lastName: "Men",        email: "mealea.men@gmail.com",     password: "attend008" },
    { firstName: "Romy",      lastName: "Chap",       email: "romy.chap@gmail.com",      password: "attend009" },
    { firstName: "Sophea",    lastName: "Neath",      email: "sophea.neath@gmail.com",   password: "attend010" },
    { firstName: "Samrath",   lastName: "Thon",       email: "samrath.thon@gmail.com",   password: "attend011" },
    { firstName: "Chanthy",   lastName: "Vong",       email: "chanthy.vong@gmail.com",   password: "attend012" },
    { firstName: "Kimly",     lastName: "Sok",        email: "kimly.sok@gmail.com",      password: "attend013" },
    { firstName: "Savuth",    lastName: "Tey",        email: "savuth.tey@gmail.com",     password: "attend014" },
    { firstName: "Pheap",     lastName: "Long",       email: "pheap.long@gmail.com",     password: "attend015" },
    { firstName: "Sreypich",  lastName: "Oeun",       email: "sreypich.oeun@gmail.com",  password: "attend016" },
    { firstName: "Thavy",     lastName: "Ros",        email: "thavy.ros@gmail.com",      password: "attend017" },
    { firstName: "Piseth",    lastName: "Mom",        email: "piseth.mom@gmail.com",     password: "attend018" },
    { firstName: "Vicheka",   lastName: "Em",         email: "vicheka.em@gmail.com",     password: "attend019" },
    { firstName: "Rotha",     lastName: "Hang",       email: "rotha.hang@gmail.com",     password: "attend020" },
    { firstName: "Bunrith",   lastName: "Kong",       email: "bunrith.kong@gmail.com",   password: "attend021" },
    { firstName: "Vichy",     lastName: "Hul",        email: "vichy.hul@gmail.com",      password: "attend022" },
    { firstName: "Narith",    lastName: "Yet",        email: "narith.yet@gmail.com",     password: "attend023" },
    { firstName: "Sarin",     lastName: "Suy",        email: "sarin.suy@gmail.com",      password: "attend024" },
    { firstName: "Thorany",   lastName: "Duch",       email: "thorany.duch@gmail.com",   password: "attend025" },
    { firstName: "Soriya",    lastName: "Chhim",      email: "soriya.chhim@gmail.com",   password: "attend026" },
    { firstName: "Sopheap",   lastName: "Hing",       email: "sopheap.hing@gmail.com",   password: "attend027" },
    { firstName: "Channary",  lastName: "Meng",       email: "channary.meng@gmail.com",  password: "attend028" },
    { firstName: "Dina",      lastName: "Roeun",      email: "dina.roeun@gmail.com",     password: "attend029" },
    { firstName: "Kosal",     lastName: "Vy",         email: "kosal.vy@gmail.com",       password: "attend030" },
    { firstName: "Mony",      lastName: "Bopha",      email: "mony.bopha@gmail.com",     password: "attend031" },
    { firstName: "Nary",      lastName: "Thou",       email: "nary.thou@gmail.com",      password: "attend032" },
    { firstName: "Sokunthy",  lastName: "Leng",       email: "sokunthy.leng@gmail.com",  password: "attend033" },
    { firstName: "Tola",      lastName: "Chenda",     email: "tola.chenda@gmail.com",    password: "attend034" },
    { firstName: "Ratchanee", lastName: "Chem",       email: "ratchanee.chem@gmail.com", password: "attend035" },
    { firstName: "Rithy",     lastName: "Srun",       email: "rithy.srun@gmail.com",     password: "attend036" },
    { firstName: "Thy",       lastName: "Bunheng",    email: "thy.bunheng@gmail.com",    password: "attend037" },
    { firstName: "Vuthy",     lastName: "Tin",        email: "vuthy.tin@gmail.com",      password: "attend038" },
    { firstName: "Chamroen",  lastName: "Keo",        email: "chamroen.keo@gmail.com",   password: "attend039" },
    { firstName: "Vanna",     lastName: "Trin",       email: "vanna.trin@gmail.com",     password: "attend040" },
    { firstName: "Davuth",    lastName: "Tith",       email: "davuth.tith@gmail.com",    password: "attend041" },
    { firstName: "Sotheary",  lastName: "Soka",       email: "sotheary.soka@gmail.com",  password: "attend042" },
    { firstName: "Chhor",     lastName: "Mouny",      email: "chhor.mouny@gmail.com",    password: "attend043" },
    { firstName: "Ponleu",    lastName: "Chumm",      email: "ponleu.chumm@gmail.com",   password: "attend044" },
    { firstName: "Tith",      lastName: "Muy",        email: "tith.muy@gmail.com",       password: "attend045" },
    { firstName: "Sophana",   lastName: "Chhin",      email: "sophana.chhin@gmail.com",  password: "attend046" },
    { firstName: "Sivilay",   lastName: "So",         email: "sivilay.so@gmail.com",     password: "attend047" },
    { firstName: "Sophorn",   lastName: "Kith",       email: "sophorn.kith@gmail.com",   password: "attend048" },
    { firstName: "Sovanny",   lastName: "Bon",        email: "sovanny.bon@gmail.com",    password: "attend049" },
    { firstName: "Savorn",    lastName: "Thoeun",     email: "savorn.thoeun@gmail.com",  password: "attend050" },
    { firstName: "Ratana",    lastName: "Reth",       email: "ratana.reth@gmail.com",    password: "attend051" },
    { firstName: "Sophany",   lastName: "Voey",       email: "sophany.voey@gmail.com",   password: "attend052" },
    { firstName: "Daravit",   lastName: "Khen",       email: "daravit.khen@gmail.com",   password: "attend053" },
    { firstName: "Sunisa",    lastName: "Math",       email: "sunisa.math@gmail.com",    password: "attend054" },
    { firstName: "Chakra",    lastName: "Ong",        email: "chakra.ong@gmail.com",     password: "attend055" },
    { firstName: "Nimith",    lastName: "Sot",        email: "nimith.sot@gmail.com",     password: "attend056" },
    { firstName: "Kunthea",   lastName: "Soeun",      email: "kunthea.soeun@gmail.com",  password: "attend057" },
    { firstName: "Monirath",  lastName: "Virak",      email: "monirath.virak@gmail.com", password: "attend058" },
    { firstName: "Norodom",   lastName: "Chhay",      email: "norodom.chhay@gmail.com",  password: "attend059" },
    { firstName: "Chhunrith", lastName: "Khet",       email: "chhunrith.khet@gmail.com", password: "attend060" },
    { firstName: "Sovath",    lastName: "Leung",      email: "sovath.leung@gmail.com",   password: "attend061" },
    { firstName: "Sokhem",    lastName: "Thun",       email: "sokhem.thun@gmail.com",    password: "attend062" },
    { firstName: "Vannak",    lastName: "Kry",        email: "vannak.kry@gmail.com",     password: "attend063" },
    { firstName: "Visal",     lastName: "Sung",       email: "visal.sung@gmail.com",     password: "attend064" },
    { firstName: "Pheara",    lastName: "Srey",       email: "pheara.srey@gmail.com",    password: "attend065" },
    { firstName: "Somnang",   lastName: "Seng",       email: "somnang.seng@gmail.com",   password: "attend066" },
    { firstName: "Sethaporn", lastName: "Tum",        email: "sethaporn.tum@gmail.com",  password: "attend067" },
    { firstName: "Sovannarith", lastName: "Tim",      email: "sovannarith.tim@gmail.com",password: "attend068" },
    { firstName: "Tharith",   lastName: "Yos",        email: "tharith.yos@gmail.com",    password: "attend069" },
    { firstName: "Sophea",    lastName: "Ny",         email: "sophea.ny@gmail.com",      password: "attend070" },
    { firstName: "Khemaree",  lastName: "Pro",        email: "khemaree.pro@gmail.com",   password: "attend071" },
    { firstName: "Sophera",   lastName: "So",         email: "sophera.so@gmail.com",     password: "attend072" },
    { firstName: "Daruny",    lastName: "Kem",        email: "daruny.kem@gmail.com",     password: "attend073" },
    { firstName: "Sopheak",   lastName: "Dey",        email: "sopheak.dey@gmail.com",    password: "attend074" },
    { firstName: "Thoeun",    lastName: "Sak",        email: "thoeun.sak@gmail.com",     password: "attend075" },
    { firstName: "Rachna",    lastName: "Toch",       email: "rachna.toch@gmail.com",    password: "attend076" },
    { firstName: "Sovichea",  lastName: "Vuon",       email: "sovichea.vuon@gmail.com",  password: "attend077" },
    { firstName: "Theardy",   lastName: "Roch",       email: "theardy.roch@gmail.com",   password: "attend078" },
    { firstName: "Vothong",   lastName: "Keo",        email: "vothong.keo@gmail.com",    password: "attend079" },
    { firstName: "Roeun",     lastName: "Say",        email: "roeun.say@gmail.com",      password: "attend080" },
    { firstName: "Sothy",     lastName: "Ang",        email: "sothy.ang@gmail.com",      password: "attend081" },
    { firstName: "Sambath",   lastName: "Pech",       email: "sambath.pech@gmail.com",   password: "attend082" },
    { firstName: "Renny",     lastName: "Choun",      email: "renny.choun@gmail.com",    password: "attend083" },
    { firstName: "Korey",     lastName: "Houth",      email: "korey.houth@gmail.com",    password: "attend084" },
    { firstName: "Sokly",     lastName: "Tum",        email: "sokly.tum@gmail.com",      password: "attend085" },
    { firstName: "Prom",      lastName: "Reth",       email: "prom.reth@gmail.com",      password: "attend086" },
    { firstName: "Hor",       lastName: "Chhien",     email: "hor.chhien@gmail.com",     password: "attend087" },
    { firstName: "Seyha",     lastName: "Chun",       email: "seyha.chun@gmail.com",     password: "attend088" },
    { firstName: "Sophearith", lastName: "Pen",       email: "sophearith.pen@gmail.com", password: "attend089" },
    { firstName: "Virak",     lastName: "Dol",        email: "virak.dol@gmail.com",      password: "attend090" },
  ];

  let attendeeIndex = 0;
  for (const u of attendees) {
    const hash = await bcrypt.hash(u.password, 10);
    const address = ADDRESSES[attendeeIndex % ADDRESSES.length];
    await prisma.user.upsert({
      where: { email: u.email },
      update: { address },
      create: { ...u, password: hash, role: "Attendee", address },
    });
    attendeeIndex++;
  }
  console.log(`  ✓ ${attendees.length} attendees with addresses\n`);

  // ── Sample events (with time) ────────────────────────────────────────────
  const sampleEvents = [
    { title: "Tech Innovation Summit 2026", category: "Technology", date: new Date("2026-10-30"), time: "9:00 AM - 5:00 PM", location: "Phnom Penh Convention Centre", capacity: 500, price: 25 },
    { title: "Startup Pitch Night", category: "Business", date: new Date("2026-09-20"), time: "6:00 PM - 9:00 PM", location: "Factory Phnom Penh", capacity: 200, price: 10 },
    { title: "Khmer Digital Arts Festival", category: "Entertainment", date: new Date("2026-11-05"), time: "10:00 AM - 6:00 PM", location: "National Museum, Phnom Penh", capacity: 800, price: 0 },
    { title: "Leadership Workshop Series", category: "Workshop", date: new Date("2026-12-10"), time: "9:00 AM - 4:00 PM", location: "Rosewood Hotel, Phnom Penh", capacity: 50, price: 50 },
    { title: "Networking & Innovation Forum", category: "Networking", date: new Date("2026-09-20"), time: "10:00 AM - 5:00 PM", location: "RUPP, Phnom Penh", capacity: 300, price: 15 },
    { title: "Web Development Bootcamp", category: "Technology", date: new Date("2026-08-15"), time: "9:00 AM - 5:00 PM", location: "Siem Reap Convention Hall", capacity: 80, price: 35 },
    { title: "E-Commerce Summit", category: "Business", date: new Date("2026-09-25"), time: "9:00 AM - 4:00 PM", location: "Battambang Business Hub", capacity: 150, price: 20 },
    { title: "AI & Machine Learning Workshop", category: "Technology", date: new Date("2026-10-10"), time: "10:00 AM - 5:00 PM", location: "Kampong Cham Tech Center", capacity: 60, price: 40 },
    { title: "Digital Marketing Masterclass", category: "Business", date: new Date("2026-11-12"), time: "9:00 AM - 3:00 PM", location: "Preah Sihanouk Business Plaza", capacity: 100, price: 25 },
    { title: "Blockchain Conference", category: "Technology", date: new Date("2026-10-22"), time: "8:30 AM - 5:30 PM", location: "Kandal Innovation Center", capacity: 200, price: 30 },
    { title: "Cloud Computing Seminar", category: "Technology", date: new Date("2026-09-08"), time: "1:00 PM - 5:00 PM", location: "Phnom Penh Tech Park", capacity: 75, price: 22 },
    { title: "Career Fair 2026", category: "Networking", date: new Date("2026-11-15"), time: "9:00 AM - 4:00 PM", location: "Prey Veng Convention Center", capacity: 250, price: 0 },
    { title: "Cultural Heritage Exhibition", category: "Entertainment", date: new Date("2026-08-20"), time: "10:00 AM - 6:00 PM", location: "Takeo Provincial Museum", capacity: 500, price: 5 },
    { title: "Sport Festival & Competition", category: "Sports", date: new Date("2026-10-05"), time: "7:00 AM - 5:00 PM", location: "Svay Rieng Sports Complex", capacity: 600, price: 10 },
    { title: "Yoga & Wellness Retreat", category: "Health", date: new Date("2026-09-10"), time: "8:00 AM - 12:00 PM", location: "Koh Kong Beach Resort", capacity: 40, price: 45 },
    { title: "Photography Workshop & Exhibition", category: "Arts", date: new Date("2026-11-08"), time: "2:00 PM - 6:00 PM", location: "Rattanakiri Art Center", capacity: 50, price: 15 },
    { title: "Film Festival Southeast Asia", category: "Entertainment", date: new Date("2026-12-01"), time: "6:00 PM - 10:00 PM", location: "Mondolkiri Cinema Complex", capacity: 300, price: 8 },
    { title: "Music Showcase 2026", category: "Entertainment", date: new Date("2026-10-14"), time: "7:00 PM - 11:00 PM", location: "Pursat Concert Hall", capacity: 400, price: 12 },
    { title: "Dance Competition Khmer", category: "Entertainment", date: new Date("2026-11-20"), time: "9:00 AM - 5:00 PM", location: "Oddar Meanchey Performance Center", capacity: 350, price: 10 },
    { title: "Fashion Show & Design Expo", category: "Entertainment", date: new Date("2026-09-18"), time: "2:00 PM - 8:00 PM", location: "Stung Treng Fashion District", capacity: 200, price: 20 },
    { title: "Food Festival & Culinary Arts", category: "Commerce", date: new Date("2026-08-28"), time: "10:00 AM - 8:00 PM", location: "Kratie Market Square", capacity: 500, price: 15 },
    { title: "Travel Expo Southeast Asia", category: "Commerce", date: new Date("2026-10-16"), time: "10:00 AM - 5:00 PM", location: "Kampong Chhnang Tourism Hub", capacity: 180, price: 12 },
    { title: "Real Estate Summit Cambodia", category: "Business", date: new Date("2026-11-05"), time: "9:00 AM - 4:00 PM", location: "Kampong Thom Development Zone", capacity: 120, price: 28 },
    { title: "Agricultural Innovation Day", category: "Education", date: new Date("2026-09-22"), time: "8:00 AM - 3:00 PM", location: "Tboung Khmum Farming Community", capacity: 100, price: 5 },
    { title: "Women in Business Forum", category: "Business", date: new Date("2026-08-25"), time: "9:00 AM - 5:00 PM", location: "Preah Vihear Convention Hall", capacity: 150, price: 18 },
    { title: "Youth Entrepreneurship Summit", category: "Business", date: new Date("2026-10-02"), time: "10:00 AM - 4:00 PM", location: "Banteay Meanchey Youth Center", capacity: 200, price: 15 },
    { title: "Tourism Development Conference", category: "Business", date: new Date("2026-09-30"), time: "9:00 AM - 4:00 PM", location: "Kampot Tourism Board", capacity: 130, price: 22 },
    { title: "Environmental Sustainability Talk", category: "Education", date: new Date("2026-11-18"), time: "2:00 PM - 5:00 PM", location: "Koh Kong Conservation Area", capacity: 80, price: 10 },
    { title: "Creative Writing Workshop", category: "Arts", date: new Date("2026-12-03"), time: "10:00 AM - 2:00 PM", location: "Siem Reap Writers Guild", capacity: 45, price: 20 },
    { title: "Graphic Design Masterclass", category: "Arts", date: new Date("2026-10-11"), time: "1:00 PM - 5:00 PM", location: "Battambang Design Studio", capacity: 55, price: 35 },
    { title: "Video Production Bootcamp", category: "Technology", date: new Date("2026-11-22"), time: "9:00 AM - 6:00 PM", location: "Phnom Penh Media Center", capacity: 40, price: 50 },
    { title: "Social Media Strategy Session", category: "Business", date: new Date("2026-09-05"), time: "2:00 PM - 5:00 PM", location: "Kandal Digital Hub", capacity: 70, price: 18 },
    { title: "Product Launch Event 2026", category: "Business", date: new Date("2026-10-28"), time: "10:00 AM - 2:00 PM", location: "Prey Veng Innovation Center", capacity: 160, price: 0 },
    { title: "Innovation Hackathon", category: "Technology", date: new Date("2026-12-05"), time: "8:00 AM - 8:00 PM", location: "Takeo Tech Zone", capacity: 100, price: 25 },
    { title: "Team Building Retreat", category: "Networking", date: new Date("2026-08-30"), time: "9:00 AM - 5:00 PM", location: "Svay Rieng Resort & Spa", capacity: 60, price: 40 },
    { title: "Volunteer Appreciation Gala", category: "Networking", date: new Date("2026-11-10"), time: "6:00 PM - 10:00 PM", location: "Koh Kong Community Center", capacity: 120, price: 5 },
    { title: "Annual Charity Gala", category: "Entertainment", date: new Date("2026-12-15"), time: "6:00 PM - 11:00 PM", location: "Kratie Grand Ballroom", capacity: 250, price: 35 },
    { title: "Coffee Lovers Meetup", category: "Networking", date: new Date("2026-09-12"), time: "9:00 AM - 12:00 PM", location: "Mondolkiri Coffee Farm", capacity: 50, price: 8 },
    { title: "Tech Meetup Monthly", category: "Networking", date: new Date("2026-10-19"), time: "6:00 PM - 8:00 PM", location: "Rattanakiri Innovation Hub", capacity: 90, price: 5 },
    { title: "Investor Pitch Event", category: "Business", date: new Date("2026-11-25"), time: "2:00 PM - 6:00 PM", location: "Pursat Business Plaza", capacity: 80, price: 30 },
    { title: "Product Demo Day", category: "Technology", date: new Date("2026-09-27"), time: "10:00 AM - 4:00 PM", location: "Oddar Meanchey Tech Center", capacity: 110, price: 12 },
    { title: "Networking Breakfast Session", category: "Networking", date: new Date("2026-10-06"), time: "8:00 AM - 10:00 AM", location: "Stung Treng Hotel Convention", capacity: 70, price: 15 },
    { title: "Book Club Meeting & Discussion", category: "Entertainment", date: new Date("2026-08-18"), time: "3:00 PM - 5:00 PM", location: "Kampong Cham Library", capacity: 35, price: 0 },
    { title: "Academic Conference 2026", category: "Education", date: new Date("2026-12-08"), time: "8:30 AM - 5:00 PM", location: "Kampong Chhnang University", capacity: 300, price: 40 },
    { title: "Business Growth Accelerator", category: "Business", date: new Date("2026-10-09"), time: "9:00 AM - 4:00 PM", location: "Kampong Thom Business Hub", capacity: 95, price: 32 },
    { title: "Enterprise Software Training", category: "Technology", date: new Date("2026-11-14"), time: "9:00 AM - 5:00 PM", location: "Kandal Corporate Center", capacity: 65, price: 38 },
    { title: "Cybersecurity Workshop", category: "Technology", date: new Date("2026-09-16"), time: "9:00 AM - 5:00 PM", location: "Banteay Meanchey Security Lab", capacity: 50, price: 45 },
    { title: "Mobile App Development Summit", category: "Technology", date: new Date("2026-10-23"), time: "10:00 AM - 5:00 PM", location: "Kampot Tech Campus", capacity: 85, price: 35 },
    { title: "Data Science Masterclass", category: "Education", date: new Date("2026-11-29"), time: "9:00 AM - 5:00 PM", location: "Siem Reap Data Center", capacity: 60, price: 50 },
  ];

  let eventIdx = 0;
  for (const e of sampleEvents) {
    const existing = await prisma.event.findFirst({ where: { title: e.title } });
    if (existing) {
      await prisma.event.update({ where: { id: existing.id }, data: { time: e.time, image: `https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80` } });
    } else {
      // Round-robin: assign each event to the next organizer so every organizer gets events
      const orgIdx = eventIdx % organizers.length;
      await prisma.event.create({ data: { ...e, organizerId: organizers[orgIdx].id, published: true } });
    }
    eventIdx++;
  }
  console.log(`  ✓ ${sampleEvents.length} events with time values\n`);

  // ── Buy tickets for random attendees ─────────────────────────────────────
  const allEvents = await prisma.event.findMany({ where: { published: true } });
  const allAttendees = await prisma.user.findMany({ where: { role: "Attendee" } });

  console.log("  Buying tickets for attendees...");
  let ticketCount = 0;

  for (const attendee of allAttendees.slice(0, 30)) { // first 30 attendees
    const numTickets = randInt(1, 4);
    const shuffledEvents = [...allEvents].sort(() => Math.random() - 0.5);

    for (let i = 0; i < numTickets && i < shuffledEvents.length; i++) {
      const event = shuffledEvents[i];

      // Check capacity
      const taken = await prisma.ticket.count({
        where: { eventId: event.id, status: { not: "cancelled" } },
      });
      if (taken >= event.capacity) continue;

      // Check duplicate
      const dupe = await prisma.ticket.findFirst({
        where: { userId: attendee.id, eventId: event.id, status: { not: "cancelled" } },
      });
      if (dupe) continue;

      const isVip = Math.random() < 0.3; // 30% chance VIP
      const ticketType = isVip ? "VIP Pass" : "General Admission";
      const basePrice = Number(event.price);
      const unitPrice = isVip ? Math.round(basePrice * 1.8) : basePrice;
      const quantity = randInt(1, 3);
      const discount = Math.random() < 0.2 ? 0.1 : 0; // 20% chance of 10% discount
      const finalPrice = Math.round(unitPrice * quantity * (1 - discount) * 100) / 100;

      await prisma.ticket.create({
        data: {
          ticketCode: uuidv4(),
          ticketType,
          quantity,
          price: finalPrice,
          status: "confirmed",
          userId: attendee.id,
          eventId: event.id,
        },
      });
      ticketCount++;
    }
  }
  console.log(`  ✓ ${ticketCount} tickets purchased\n`);

  // ── Create some refund requests ───────────────────────────────────────────
  console.log("  Creating refund requests...");
  const allTickets = await prisma.ticket.findMany({
    where: { status: "confirmed" },
    include: { event: true, user: true },
  });

  const refundReasons = [
    "Schedule conflict - cannot attend",
    "Unexpected travel plans",
    "Personal emergency",
    "Event postponed to a date I cannot make",
    "Found a better alternative event",
    "Budget constraints changed",
  ];

  const refundDetails = [
    "I purchased this ticket last month but now have a work commitment that overlaps with the event date. I would appreciate a full refund.",
    "Due to unexpected family travel requirements, I will be out of the country during the event. Please process my refund.",
    "A personal matter came up that requires my attention during the event dates. I hope to attend next time.",
    "I have another event that was rescheduled to the same date. Would like to get a refund to attend that one instead.",
    "After reviewing the event details, I found another event that better suits my interests. Please refund my ticket.",
    "My financial situation has changed and I need to cancel this registration. Thank you for understanding.",
  ];

  let refundCount = 0;
  // Create refunds for ~20% of tickets
  const refundTickets = allTickets.sort(() => Math.random() - 0.5).slice(0, Math.floor(allTickets.length * 0.2));

  for (const ticket of refundTickets) {
    const existing = await prisma.refund.findUnique({ where: { ticketCode: ticket.ticketCode } });
    if (existing) continue;

    await prisma.refund.create({
      data: {
        ticketCode: ticket.ticketCode,
        eventName: ticket.event.title,
        reason: pick(refundReasons),
        details: pick(refundDetails),
        userId: ticket.userId,
        status: pick(["pending", "pending", "approved", "rejected"]), // weighted toward pending
      },
    });

    // Cancel the ticket
    await prisma.ticket.update({
      where: { ticketCode: ticket.ticketCode },
      data: { status: "cancelled" },
    });
    refundCount++;
  }
  console.log(`  ✓ ${refundCount} refund requests created\n`);

  // ── Testimonials ────────────────────────────────────────────────────────
  console.log("  Creating testimonials...");
  const ticketHolders = await prisma.ticket.findMany({
    where: { status: "confirmed" },
    include: { event: true, user: true },
    distinct: ["userId"],
  });

  const testimonialContents = [
    { text: "I ran a 2,000-seat tech summit through Planning Center. Real-time seat tracking meant we never oversold a single ticket.", role: "Event Organizer" },
    { text: "Booked my workshop spot in under a minute and the QR ticket landed in my dashboard instantly. No printing, no queues.", role: "Attendee" },
    { text: "The category filters and search made it effortless to find every networking event in Phnom Penh this quarter.", role: "Marketing Lead" },
    { text: "Managing 6,000 runners used to be chaos. Now check-in is just scanning codes at the start line \u2014 done in seconds.", role: "Sports Coordinator" },
    { text: "Honestly the cleanest event dashboard I've used. Dark mode at 11 pm while finalizing my schedule? Chef's kiss.", role: "UX Designer" },
    { text: "Got my confirmation, ticket, and reminder without a single email thread. The whole flow just quietly works.", role: "Conference Speaker" },
    { text: "As a first-timer I never felt lost \u2014 the prompts told me exactly what to do at each step of registration.", role: "First-time Attendee" },
    { text: "Refund requests that used to take days are now handled right in the dashboard in a couple of clicks.", role: "Volunteer Lead" },
    { text: "The real-time capacity updates are a game-changer. We can plan logistics on the fly without guessing attendance.", role: "Event Planner" },
    { text: "I love how easy it is to browse events by category. Found three tech meetups I didn't even know existed.", role: "Developer" },
    { text: "Our charity gala sold out in 48 hours thanks to the built-in promotion tools. Absolutely incredible reach.", role: "Non-Profit Director" },
    { text: "The digital ticket system eliminated paper waste entirely. Our sustainability event finally walks the talk.", role: "Environmental Advocate" },
    { text: "Registered my whole team in under 5 minutes. Group booking is smooth and the confirmation was instant.", role: "HR Manager" },
    { text: "Planning Center turned our small workshop into a professional event with proper registration and follow-up.", role: "Workshop Facilitator" },
    { text: "The analytics dashboard gives us insights we never had before. We can measure ROI for every single event.", role: "Data Analyst" },
    { text: "Best event platform I've used in Southeast Asia. The UX is polished and everything just works on mobile.", role: "Frequent Attendee" },
  ];

  let testimonialCount = 0;
  for (const holder of ticketHolders.slice(0, 16)) {
    const existing = await prisma.testimonial.findFirst({ where: { userId: holder.userId } });
    if (existing) continue;

    const template = testimonialContents[testimonialCount % testimonialContents.length];
    await prisma.testimonial.create({
      data: {
        content: template.text,
        rating: randInt(4, 5),
        userId: holder.userId,
        eventId: holder.eventId,
      },
    });
    testimonialCount++;
  }
  console.log(`  \u2713 ${testimonialCount} testimonials created\n`);

  console.log("Seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
