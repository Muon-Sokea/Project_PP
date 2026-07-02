// mockData.js — Consolidated fake data for React migration
// Sources: 3_auth.js, 2_events.js, 6_testimonials.js

export const mockUsers = [
  { id: 1, firstName: "Muon",    lastName: "Sokea",      email: "muonsokea@gmail.com",     password: "sokea123",      role: "Supervisor" },
  { id: 2, firstName: "San",     lastName: "Sotheayuth", email: "sansotheayuth@gmail.com", password: "sotheayuth123", role: "Admin" },
  { id: 3, firstName: "Proeung", lastName: "Sivly",      email: "proeungsivly@gmail.com",  password: "sivly123",      role: "Organizer" },
];

export const mockTestimonials = [
  { id: 1, name: "Sokchea Lim",  username: "@sokchea_events", role: "Event Organizer",    body: "I ran a 2,000-seat tech summit through Planning Center. Real-time seat tracking meant we never oversold a single ticket." },
  { id: 2, name: "Dara Phon",    username: "@daraphon",       role: "Attendee",            body: "Booked my workshop spot in under a minute and the QR ticket landed in my dashboard instantly. No printing, no queues." },
  { id: 3, name: "Mealea Sok",   username: "@mealea.k",       role: "Marketing Lead",      body: "The category filters and search made it effortless to find every networking event in Phnom Penh this quarter." },
  { id: 4, name: "Rithy Chan",   username: "@rithy_runs",     role: "Sports Coordinator",  body: "Managing 6,000 runners used to be chaos. Now check-in is just scanning codes at the start line — done in seconds." },
  { id: 5, name: "Bopha Nuon",   username: "@bopha.designs",  role: "UX Designer",         body: "Honestly the cleanest event dashboard I've used. Dark mode at 11pm while finalizing my schedule? Chef's kiss." },
  { id: 6, name: "Visal Kong",   username: "@visalk",         role: "Conference Speaker",  body: "Got my confirmation, ticket, and reminder without a single email thread. The whole flow just quietly works." },
  { id: 7, name: "Channary Ros", username: "@channary",       role: "First-time Attendee", body: "As a first-timer I never felt lost — the prompts told me exactly what to do at each step of registration." },
  { id: 8, name: "Pisey Hang",   username: "@pisey_h",        role: "Volunteer Lead",      body: "Refund requests that used to take days are now handled right in the dashboard in a couple of clicks." },
];

export const mockEvents = [
  {
    id: 1,
    title: "Tech Innovation Summit 2026",
    category: "Technology",
    date: "October 30, 2026",
    time: "9:00 AM - 5:00 PM",
    location: "Prey Veng Province",
    price: 250,
    rating: 4.0,
    attending: 1000,
    capacity: 2300,
    image: "/assets/images/Tech1.jpg",
    description: "Join us for the premier technology conference of 2026. Connect with industry leaders, discover cutting-edge innovations, and network with fellow tech enthusiasts. This year features our biggest lineup yet, focusing on AI, Web3, and sustainable tech.",
    highlights: [
      { icon: "ri-mic-line",   title: "20+ Keynote Speakers", desc: "From top global tech companies." },
      { icon: "ri-tools-line", title: "Hands-on Workshops",   desc: "Interactive sessions for all skill levels." },
      { icon: "ri-group-line", title: "Massive Networking",   desc: "Connect with 2,000+ professionals." },
      { icon: "ri-rocket-line",title: "Exclusive Launches",   desc: "Be first to see new products." }
    ],
    agenda: {
      "Day 1": [
        { time: "09:00 AM - 10:00 AM", title: "Registration & Welcome Coffee", sub: "Main Lobby" },
        { time: "10:00 AM - 11:30 AM", title: "Opening Keynote: The Future of AI", sub: "Sarah Jenkins, CEO of TechCorp", tag: "Keynote" },
        { time: "11:45 AM - 01:00 PM", title: "Workshop: Building Scalable Apps", sub: "David Chen, Lead Dev at CloudSys", tag: "Workshop" },
        { time: "02:00 PM - 03:30 PM", title: "Panel: Web3 & the Open Internet", sub: "Industry leaders roundtable", tag: "Panel" }
      ],
      "Day 2": [
        { time: "09:30 AM - 10:30 AM", title: "Keynote: Sustainable Tech", sub: "Elena Rodriguez, VP Product at InnovateLab", tag: "Keynote" },
        { time: "10:45 AM - 12:00 PM", title: "Workshop: Shipping with AI", sub: "Hands-on lab", tag: "Workshop" },
        { time: "01:00 PM - 02:00 PM", title: "Closing & Awards", sub: "Main Hall" }
      ]
    },
    speakers: [
      { name: "Sarah Jenkins",   title: "CEO",            company: "TechCorp" },
      { name: "David Chen",      title: "Lead Developer", company: "CloudSys" },
      { name: "Elena Rodriguez", title: "VP of Product",  company: "InnovateLab" }
    ],
    venue: {
      name: "Sokha Hotel Convention Center",
      address: "123 Tech Avenue, Prey Veng Province, Cambodia",
      parking: true, accessibility: true
    },
  },
  {
    id: 2,
    title: "Pre-Event Planning Workshop",
    category: "Workshop",
    date: "September 20, 2026",
    time: "8:00 AM - 12:00 PM",
    location: "Phnom Penh, RUPP",
    price: 300,
    rating: 4.0,
    attending: 2000,
    capacity: 2000,
    image: "/assets/images/workshop-1.jpg",
    description: "A practical half-day workshop for event planners covering logistics, vendor management, and last-minute preparations. Walk away with ready-to-use templates, checklists, and a network of fellow planners.",
    highlights: [
      { icon: "ri-file-list-3-line", title: "Planning Frameworks",   desc: "Proven templates for any event size." },
      { icon: "ri-store-2-line",     title: "Vendor Coordination",   desc: "How to brief and manage suppliers." },
      { icon: "ri-timer-line",       title: "Timeline Management",   desc: "Build bulletproof run-of-show docs." },
      { icon: "ri-shield-check-line",title: "Risk Mitigation",       desc: "Spot and handle surprises early." }
    ],
    agenda: {
      "Morning": [
        { time: "08:00 AM - 08:30 AM", title: "Registration & Coffee", sub: "Welcome Lobby" },
        { time: "08:30 AM - 09:30 AM", title: "Keynote: Planning from Zero", sub: "Mey Sophea, Senior Event Director", tag: "Keynote" },
        { time: "09:45 AM - 11:00 AM", title: "Workshop: Build Your Run-of-Show", sub: "Hands-on group session", tag: "Workshop" },
        { time: "11:00 AM - 12:00 PM", title: "Vendor Panel & Open Q&A", sub: "Live supplier roundtable", tag: "Panel" }
      ]
    },
    speakers: [
      { name: "Mey Sophea",   title: "Senior Event Director", company: "KhmerEvents Co." },
      { name: "Chea Daro",    title: "Logistics Manager",     company: "ProPlan Cambodia" }
    ],
    venue: {
      name: "RUPP Convention Hall",
      address: "Russian Federation Blvd, Phnom Penh, Cambodia",
      parking: true, accessibility: true
    },
  },
  {
    id: 3,
    title: "Business Leadership Conference",
    category: "Business",
    date: "September 20, 2026",
    time: "9:00 AM - 6:00 PM",
    location: "Preah Sihanouk Province",
    price: 450,
    rating: 4.0,
    attending: 2500,
    capacity: 3000,
    image: "/assets/images/business-1.jpg",
    description: "Cambodia's premier business leadership gathering, bringing together executives, entrepreneurs, and thought leaders for a full day of strategic insights, deal-making, and inspired conversation.",
    highlights: [
      { icon: "ri-briefcase-4-line",  title: "Executive Panels",        desc: "CEOs and founders share hard-won lessons." },
      { icon: "ri-handshake-line",    title: "Deal-Making Sessions",    desc: "Structured 1-on-1 investor meetings." },
      { icon: "ri-presentation-line", title: "Leadership Masterclass",  desc: "Develop the skills that drive growth." },
      { icon: "ri-restaurant-2-line", title: "Networking Dinner",       desc: "Gala dinner with 300+ business leaders." }
    ],
    agenda: {
      "Day 1": [
        { time: "09:00 AM - 09:30 AM", title: "Opening Ceremony", sub: "Welcome Hall" },
        { time: "09:30 AM - 11:00 AM", title: "Keynote: Leading Through Uncertainty", sub: "Chan Vibol, Group CEO of ImpactCorp", tag: "Keynote" },
        { time: "11:15 AM - 12:30 PM", title: "Masterclass: Building High-Performance Teams", sub: "Srey Nita, HR Director at VisionGroup", tag: "Workshop" },
        { time: "02:00 PM - 03:30 PM", title: "Panel: The Future of Business in SEA", sub: "Regional executives roundtable", tag: "Panel" },
        { time: "04:00 PM - 06:00 PM", title: "Networking & Gala Dinner", sub: "Ballroom A" }
      ]
    },
    speakers: [
      { name: "Chan Vibol",  title: "Group CEO",      company: "ImpactCorp" },
      { name: "Srey Nita",   title: "HR Director",    company: "VisionGroup" },
      { name: "Ly Piseth",   title: "Founder & MD",   company: "SEA Ventures" }
    ],
    venue: {
      name: "Sokha Beach Hotel",
      address: "Ochheuteal Beach Rd, Sihanoukville, Cambodia",
      parking: true, accessibility: true
    },
  },
  {
    id: 4,
    title: "Workshop on Event Management",
    category: "Entertainment",
    date: "September 20, 2026",
    time: "6:00 PM - 11:00 PM",
    location: "Phnom Penh, Koh Pech",
    price: 100,
    rating: 4.0,
    attending: 6000,
    capacity: 6000,
    image: "/assets/images/entertainment-1.jpg",
    description: "An evening immersive workshop covering the full lifecycle of event production â€” from concept to curtain call. Perfect for aspiring event managers and entertainment professionals.",
    highlights: [
      { icon: "ri-settings-4-line",   title: "Production Workflows",  desc: "How the pros structure event day." },
      { icon: "ri-vidicon-line",      title: "AV & Stage Basics",     desc: "Lighting, sound, and live production." },
      { icon: "ri-team-line",         title: "Crew Management",       desc: "Lead volunteers and staff effectively." },
      { icon: "ri-bar-chart-box-line",title: "Post-Event Analytics",  desc: "Measure ROI and attendee satisfaction." }
    ],
    agenda: {
      "Evening": [
        { time: "06:00 PM - 06:30 PM", title: "Check-in & Mixer", sub: "Island Terrace" },
        { time: "06:30 PM - 07:30 PM", title: "Session: Production Fundamentals", sub: "Dara Kim, Lead Producer", tag: "Talk" },
        { time: "07:45 PM - 09:15 PM", title: "Hands-on: Plan a Mock Event", sub: "Team breakout activity", tag: "Workshop" },
        { time: "09:30 PM - 11:00 PM", title: "Showcase & Feedback Night", sub: "Teams present to a live panel", tag: "Showcase" }
      ]
    },
    speakers: [
      { name: "Dara Kim",    title: "Lead Producer",     company: "EventPro KH" },
      { name: "Sina Pich",   title: "AV Technician",     company: "SoundScape Asia" }
    ],
    venue: {
      name: "Koh Pech Event Space",
      address: "Diamond Island, Phnom Penh, Cambodia",
      parking: true, accessibility: false
    },
  },
  {
    id: 5,
    title: "Digital Marketing Workshop",
    category: "Education",
    date: "September 20, 2026",
    time: "9:00 AM - 4:00 PM",
    location: "Phnom Penh, RUPP",
    price: 100,
    rating: 4.0,
    attending: 1500,
    capacity: 2000,
    image: "/assets/images/education-1.jpg",
    description: "A full-day hands-on workshop for marketers and entrepreneurs looking to supercharge their digital presence. Learn from practitioners who run real campaigns every day.",
    highlights: [
      { icon: "ri-search-eye-line",   title: "SEO & Content",         desc: "Rank higher, drive organic traffic." },
      { icon: "ri-advertisement-line",title: "Paid Advertising",      desc: "Google Ads & Meta campaigns that convert." },
      { icon: "ri-instagram-line",    title: "Social Media Growth",   desc: "Build an audience that buys." },
      { icon: "ri-line-chart-line",   title: "Analytics & ROI",       desc: "Measure what matters, cut what doesn't." }
    ],
    agenda: {
      "Day 1": [
        { time: "09:00 AM - 09:30 AM", title: "Welcome & Overview", sub: "RUPP IT Center, Room 201" },
        { time: "09:30 AM - 11:00 AM", title: "SEO Fundamentals & Content Strategy", sub: "Morn Kalyan, Digital Strategist", tag: "Workshop" },
        { time: "11:15 AM - 12:30 PM", title: "Running Paid Ads: Live Campaign Build", sub: "Hands-on Meta & Google session", tag: "Hands-on" },
        { time: "01:30 PM - 03:00 PM", title: "Social Media Growth Playbook", sub: "Pov Sreynich, Growth Lead", tag: "Workshop" },
        { time: "03:15 PM - 04:00 PM", title: "Analytics Deep Dive & Q&A", sub: "Open floor discussion" }
      ]
    },
    speakers: [
      { name: "Morn Kalyan",    title: "Digital Strategist",  company: "GrowthLab KH" },
      { name: "Pov Sreynich",   title: "Growth Lead",         company: "BrandBoost" }
    ],
    venue: {
      name: "RUPP IT Center",
      address: "Russian Federation Blvd, Phnom Penh, Cambodia",
      parking: true, accessibility: true
    },
  },
  {
    id: 6,
    title: "Networking & Innovation Forum",
    category: "Networking",
    date: "September 20, 2026",
    time: "10:00 AM - 5:00 PM",
    location: "Phnom Penh, RUPP",
    price: 50,
    rating: 4.0,
    attending: 2000,
    capacity: 2000,
    image: "/assets/images/networking-1.jpg",
    description: "A dedicated space for Cambodia's brightest minds to connect, collaborate, and spark the next big idea. Open to students, startups, and seasoned professionals alike.",
    highlights: [
      { icon: "ri-contacts-line",       title: "Open Networking",       desc: "Structured sessions with curated matches." },
      { icon: "ri-lightbulb-flash-line",title: "Innovation Showcase",   desc: "See the startups changing Cambodia." },
      { icon: "ri-mic-2-line",          title: "Speed Pitching",        desc: "60-second pitches to live investors." },
      { icon: "ri-user-received-line",  title: "Mentorship Tables",     desc: "Get advice from industry veterans." }
    ],
    agenda: {
      "Day 1": [
        { time: "10:00 AM - 10:30 AM", title: "Registration & Welcome Drinks", sub: "Innovation Hub Atrium" },
        { time: "10:30 AM - 12:00 PM", title: "Startup Showcase & Demos", sub: "Open floor exhibition", tag: "Showcase" },
        { time: "01:00 PM - 02:30 PM", title: "Speed Pitching Competition", sub: "6 startups, live investor panel", tag: "Pitch" },
        { time: "02:45 PM - 04:00 PM", title: "Mentorship Roundtables", sub: "Rotating 15-min mentor sessions", tag: "Networking" },
        { time: "04:15 PM - 05:00 PM", title: "Closing & Community Mixer", sub: "Main Hall" }
      ]
    },
    speakers: [
      { name: "Heng Ratana",   title: "Startup Mentor",   company: "Mekong Capital" },
      { name: "Lim Sokvanna",  title: "Innovation Lead",  company: "CamboTech Hub" }
    ],
    venue: {
      name: "RUPP Innovation Hub",
      address: "Russian Federation Blvd, Phnom Penh, Cambodia",
      parking: true, accessibility: true
    },
  },
  {
    id: 7,
    title: "Annual Healthcare Conference",
    category: "Healthcare",
    date: "September 20, 2026",
    time: "8:00 AM - 5:00 PM",
    location: "Phnom Penh, RUPP",
    price: 300,
    rating: 4.0,
    attending: 1250,
    capacity: 2000,
    image: "/assets/images/healthcare-1.jpg",
    description: "Bringing together healthcare professionals, researchers, and policymakers to advance health outcomes across Cambodia and the region. CME credits available for attending physicians.",
    highlights: [
      { icon: "ri-heart-pulse-line",   title: "Clinical Research",     desc: "Latest findings from regional hospitals." },
      { icon: "ri-government-line",    title: "Policy Forum",          desc: "Shaping national health strategy." },
      { icon: "ri-robot-line",         title: "MedTech Demos",         desc: "AI diagnostics and digital health tools." },
      { icon: "ri-award-line",         title: "CME Accreditation",     desc: "Earn continuing education credits." }
    ],
    agenda: {
      "Day 1": [
        { time: "08:00 AM - 08:30 AM", title: "Registration & Welcome", sub: "Conference Lobby" },
        { time: "08:30 AM - 10:00 AM", title: "Keynote: Digital Health in SEA", sub: "Dr. Keo Virak, Ministry of Health", tag: "Keynote" },
        { time: "10:15 AM - 12:00 PM", title: "Clinical Research Presentations", sub: "3 peer-reviewed studies presented", tag: "Research" },
        { time: "01:30 PM - 03:00 PM", title: "MedTech Exhibition & Demos", sub: "Open floor with 10 exhibitors", tag: "Exhibition" },
        { time: "03:15 PM - 05:00 PM", title: "Policy Roundtable: Universal Coverage", sub: "Ministry & NGO representatives", tag: "Panel" }
      ]
    },
    speakers: [
      { name: "Dr. Keo Virak",    title: "Deputy Director",      company: "Ministry of Health" },
      { name: "Dr. Noun Panha",   title: "Chief of Medicine",    company: "Calmette Hospital" },
      { name: "Rath Sreyleak",    title: "Digital Health Lead",  company: "HealthTech KH" }
    ],
    venue: {
      name: "Calmette Hospital Conference Center",
      address: "Monivong Blvd, Phnom Penh, Cambodia",
      parking: true, accessibility: true
    },
  },
  {
    id: 8,
    title: "Sport Event 2026",
    category: "Sports",
    date: "September 20, 2026",
    time: "7:00 AM - 12:00 PM",
    location: "Phnom Penh, RUPP",
    price: 300,
    rating: 4.0,
    attending: 1250,
    capacity: 2000,
    image: "/assets/images/Sport1.4.webp",
    description: "A high-energy day of community sport. Whether you're competing or cheering from the stands, expect great matches, food stalls, and a festival atmosphere for all ages.",
    highlights: [
      { icon: "ri-trophy-line",     title: "Open Tournament", desc: "Compete across multiple divisions." },
      { icon: "ri-run-line",        title: "5K Fun Run",      desc: "Open to all fitness levels." },
      { icon: "ri-restaurant-line", title: "Food & Festival", desc: "Local food stalls and live music." },
      { icon: "ri-team-line",       title: "Family Friendly", desc: "Activities and zones for kids." }
    ],
    agenda: {
      "Day 1": [
        { time: "07:00 AM - 08:00 AM", title: "Check-in & Warm-up", sub: "Main Field" },
        { time: "08:00 AM - 09:00 AM", title: "5K Fun Run", sub: "Start line at Gate A", tag: "Race" },
        { time: "09:30 AM - 11:30 AM", title: "Tournament Group Stage", sub: "Courts 1-4", tag: "Match" },
        { time: "12:00 PM - 01:00 PM", title: "Finals & Medal Ceremony", sub: "Center Court", tag: "Final" }
      ]
    },
    speakers: [
      { name: "Coach Sophea", title: "Head Coach",         company: "National Team" },
      { name: "Rith Many",    title: "Marathon Champion",  company: "RunKH" }
    ],
    venue: {
      name: "Phnom Penh Sports Complex",
      address: "Olympic Stadium Road, Phnom Penh, Cambodia",
      parking: true, accessibility: true
    },
  },
  {
    id: 9,
    title: "Entertainment Gala 2027",
    category: "Entertainment",
    date: "September 20, 2026",
    time: "7:00 PM - 11:00 PM",
    location: "Phnom Penh, Diamond Island",
    price: 150,
    rating: 4.0,
    attending: 1900,
    capacity: 2000,
    image: "/assets/images/entertainment-5.jpg",
    description: "A spectacular evening celebration featuring live performances, celebrity appearances, and an awards ceremony honoring Cambodia's finest in entertainment and the arts.",
    highlights: [
      { icon: "ri-music-line",          title: "Live Performances",     desc: "Top artists perform back-to-back sets." },
      { icon: "ri-trophy-line",         title: "Awards Ceremony",       desc: "Honoring the best in Cambodian entertainment." },
      { icon: "ri-vip-crown-line",      title: "Celebrity Appearances", desc: "Meet and greet with special guests." },
      { icon: "ri-restaurant-line",     title: "Gourmet Dining",        desc: "5-course dinner by award-winning chefs." }
    ],
    agenda: {
      "Evening": [
        { time: "07:00 PM - 07:30 PM", title: "Red Carpet Arrival", sub: "Grand Entrance, Diamond Island" },
        { time: "07:30 PM - 08:30 PM", title: "Welcome Dinner & Cocktails", sub: "Ballroom A" },
        { time: "08:30 PM - 09:30 PM", title: "Live Performances â€” Act I & II", sub: "Main Stage", tag: "Performance" },
        { time: "09:30 PM - 10:15 PM", title: "Annual Entertainment Awards", sub: "Hosted by MC Virak Dara", tag: "Awards" },
        { time: "10:15 PM - 11:00 PM", title: "Closing Act & After-Party", sub: "Rooftop Garden" }
      ]
    },
    speakers: [
      { name: "MC Virak Dara",   title: "Celebrity Host",     company: "CamboStar Media" },
      { name: "Nita Sophea",     title: "Award Director",     company: "Arts Council KH" }
    ],
    venue: {
      name: "Diamond Island Convention Center",
      address: "Koh Pich, Phnom Penh, Cambodia",
      parking: true, accessibility: true
    },
  },
  {
    id: 10,
    title: "International Technology Expo",
    category: "Technology",
    date: "September 20, 2026",
    time: "9:00 AM - 5:00 PM",
    location: "Phnom Penh, RUPP",
    price: 200,
    rating: 4.0,
    attending: 1500,
    capacity: 1500,
    image: "/assets/images/Tech1.3.jpg",
    description: "Southeast Asia's largest technology exposition showcasing innovations from global tech giants and local startups. Explore hundreds of exhibits, live product demos, and the region's hottest startup pitches.",
    highlights: [
      { icon: "ri-computer-line",        title: "200+ Exhibitors",      desc: "Global and regional tech companies." },
      { icon: "ri-flashlight-line",      title: "Live Product Demos",   desc: "See tomorrow's tech today." },
      { icon: "ri-seedling-line",        title: "Startup Pitch Battle", desc: "$10,000 prize for the top startup." },
      { icon: "ri-wifi-line",            title: "Networking Lounges",   desc: "Dedicated spaces for every interest." }
    ],
    agenda: {
      "Day 1": [
        { time: "09:00 AM - 09:30 AM", title: "Opening Ceremony", sub: "RUPP Expo Hall Main Stage" },
        { time: "09:30 AM - 12:00 PM", title: "Exhibition Hall Open", sub: "All exhibitor booths live", tag: "Exhibition" },
        { time: "01:00 PM - 02:30 PM", title: "Startup Pitch Battle â€” Semi-Finals", sub: "10 startups, 5 minutes each", tag: "Pitch" },
        { time: "02:45 PM - 04:00 PM", title: "Keynote: The Next Decade of Tech", sub: "Sok Reaksmey, CTO of TechAsia", tag: "Keynote" },
        { time: "04:15 PM - 05:00 PM", title: "Startup Pitch Finals & Prize Ceremony", sub: "Top 3 finalists compete", tag: "Final" }
      ]
    },
    speakers: [
      { name: "Sok Reaksmey",   title: "CTO",              company: "TechAsia" },
      { name: "Pich Sokunthea", title: "AI Research Lead", company: "DataLab SEA" },
      { name: "Yim Bunna",      title: "Startup Founder",  company: "CodeKH" }
    ],
    venue: {
      name: "RUPP Expo Hall",
      address: "Russian Federation Blvd, Phnom Penh, Cambodia",
      parking: true, accessibility: true
    },
  },
  {
    id: 11,
    title: "World Business Summit",
    category: "Business",
    date: "September 20, 2026",
    time: "8:00 AM - 5:00 PM",
    location: "Phnom Penh, RUPP",
    price: 300,
    rating: 4.0,
    attending: 1250,
    capacity: 2000,
    image: "/assets/images/business-3.jpg",
    description: "A high-stakes summit connecting business leaders from across the globe to shape the future of commerce in Southeast Asia. Investment forums, trade delegations, and bilateral deal-making await.",
    highlights: [
      { icon: "ri-global-line",        title: "Global Delegations",   desc: "30+ countries represented." },
      { icon: "ri-funds-line",         title: "Investment Forum",     desc: "Connect with VCs and family offices." },
      { icon: "ri-exchange-line",      title: "Trade Expo",           desc: "B2B matchmaking with verified buyers." },
      { icon: "ri-award-line",         title: "Business Awards",      desc: "Recognizing SEA's top enterprises." }
    ],
    agenda: {
      "Day 1": [
        { time: "08:00 AM - 08:30 AM", title: "VIP Registration & Welcome Coffee", sub: "Grand Foyer" },
        { time: "08:30 AM - 10:00 AM", title: "Opening Keynote: SEA's Economic Outlook", sub: "Phal Chanvuth, Regional Economist", tag: "Keynote" },
        { time: "10:15 AM - 12:00 PM", title: "Investment Forum: Deal-Flow Sessions", sub: "Private meeting rooms", tag: "Forum" },
        { time: "01:30 PM - 03:00 PM", title: "Trade Expo & B2B Matchmaking", sub: "Exhibition Hall", tag: "Expo" },
        { time: "03:30 PM - 05:00 PM", title: "Business Awards & Closing Gala", sub: "Grand Ballroom" }
      ]
    },
    speakers: [
      { name: "Phal Chanvuth",   title: "Regional Economist",  company: "ADB Cambodia" },
      { name: "Sam Piseth",      title: "Managing Director",   company: "Phnom Penh SEZ" },
      { name: "Ros Dararith",    title: "VP Investments",      company: "Mekong Capital" }
    ],
    venue: {
      name: "Intercontinental Phnom Penh",
      address: "296 Mao Tse Tung Blvd, Phnom Penh, Cambodia",
      parking: true, accessibility: true
    },
  },
  {
    id: 12,
    title: "Workshop on Digital Marketing",
    category: "Education",
    date: "September 20, 2026",
    time: "8:00 AM - 5:00 PM",
    location: "Phnom Penh, RUPP",
    price: 300,
    rating: 4.0,
    attending: 1250,
    capacity: 2000,
    image: "/assets/images/education-3.jpg",
    description: "An advanced full-day workshop for marketing professionals ready to master the complete digital marketing stack â€” from technical SEO to influencer strategy and conversion optimization.",
    highlights: [
      { icon: "ri-pencil-ruler-line",   title: "Content Masterclass",     desc: "Write copy that converts." },
      { icon: "ri-mail-send-line",      title: "Email Marketing",         desc: "Sequences, automation, and deliverability." },
      { icon: "ri-user-star-line",      title: "Influencer Strategy",     desc: "Find, brief, and track the right creators." },
      { icon: "ri-funds-box-line",      title: "Conversion Optimization", desc: "Turn traffic into paying customers." }
    ],
    agenda: {
      "Day 1": [
        { time: "08:00 AM - 08:30 AM", title: "Welcome & Icebreaker", sub: "RUPP Business School, Hall B" },
        { time: "08:30 AM - 10:00 AM", title: "Advanced SEO & Content Creation", sub: "Thy Borey, SEO Specialist", tag: "Workshop" },
        { time: "10:15 AM - 12:00 PM", title: "Email Marketing Automation Lab", sub: "Live tool walkthrough", tag: "Hands-on" },
        { time: "01:30 PM - 03:00 PM", title: "Influencer Marketing Strategy", sub: "Sreyleak Pov, Influencer Manager", tag: "Workshop" },
        { time: "03:15 PM - 05:00 PM", title: "CRO: Landing Pages & A/B Testing", sub: "Group critique session", tag: "Workshop" }
      ]
    },
    speakers: [
      { name: "Thy Borey",       title: "SEO Specialist",       company: "RankKH" },
      { name: "Sreyleak Pov",    title: "Influencer Manager",   company: "Social Boost KH" }
    ],
    venue: {
      name: "RUPP Business School",
      address: "Russian Federation Blvd, Phnom Penh, Cambodia",
      parking: true, accessibility: true
    },
  },

  // â”€â”€ Technology (IDs 13-18) â”€â”€
  {
    id: 13, title: "AI & Machine Learning Bootcamp", category: "Technology",
    date: "August 5, 2026", location: "Institute of Technology, Phnom Penh",
    price: 65, capacity: 200, attending: 154, rating: 4.7,
    image: "/assets/images/Tect1.1.jpg",
    description: "Intensive 2-day bootcamp covering the fundamentals of AI and machine learning. Build real models from scratch using Python and popular ML libraries.",
    highlights: ["Hands-on Python ML sessions","Neural network design workshops","Kaggle competition practice","Certificate of completion"],
    agenda: { day1: [
      { time: "08:30 AM - 10:00 AM", title: "Python for ML Foundations", sub: "Numpy, Pandas, Matplotlib", tag: "Lecture" },
      { time: "10:15 AM - 12:00 PM", title: "Supervised Learning Deep Dive", sub: "Regression, classification models", tag: "Workshop" },
      { time: "01:30 PM - 03:30 PM", title: "Neural Networks & Backprop", sub: "From scratch with PyTorch", tag: "Hands-on" },
      { time: "03:45 PM - 05:00 PM", title: "Kaggle Competition Kickoff", sub: "Team formation & baseline", tag: "Project" }
    ]},
    speakers: [
      { name: "Veasna Keo", title: "ML Engineer", company: "DataKH" },
      { name: "Pisey Chan", title: "AI Researcher", company: "KIRIROM Institute" }
    ],
    venue: { name: "Institute of Technology Auditorium", address: "Phnom Penh, Cambodia", parking: true, accessibility: true }
  },
  {
    id: 14, title: "Cybersecurity Essentials Summit", category: "Technology",
    date: "August 18, 2026", location: "PaÃ±Ã±ÄsÄstra University, Phnom Penh",
    price: 45, capacity: 180, attending: 120, rating: 4.6,
    image: "/assets/images/Tect1.2.jpg",
    description: "Learn the critical cybersecurity skills needed to protect modern digital infrastructure. From ethical hacking basics to enterprise security policies.",
    highlights: ["Ethical hacking lab","Capture The Flag challenges","Security audit methodology","Industry certifications roadmap"],
    agenda: { day1: [
      { time: "09:00 AM - 10:30 AM", title: "Threat Landscape 2026", sub: "Latest attack vectors & trends", tag: "Keynote" },
      { time: "10:45 AM - 12:00 PM", title: "Penetration Testing 101", sub: "Kali Linux live demo", tag: "Workshop" },
      { time: "01:30 PM - 03:00 PM", title: "CTF Challenge", sub: "Team-based security puzzles", tag: "Competition" },
      { time: "03:15 PM - 05:00 PM", title: "Security Policy & Compliance", sub: "ISO 27001 overview", tag: "Lecture" }
    ]},
    speakers: [
      { name: "Ratanak Heng", title: "Cybersecurity Consultant", company: "SecureNet KH" },
      { name: "Sreymom Ly", title: "SOC Analyst", company: "TechGuard Asia" }
    ],
    venue: { name: "PaÃ±Ã±ÄsÄstra Tech Hall", address: "Phnom Penh, Cambodia", parking: true, accessibility: false }
  },
  {
    id: 15, title: "Cloud Computing & DevOps Conference", category: "Technology",
    date: "September 3, 2026", location: "Sofitel Phnom Penh Phokeethra",
    price: 80, capacity: 250, attending: 198, rating: 4.8,
    image: "/assets/images/Tech1.4.webp",
    description: "Explore the future of cloud infrastructure with hands-on sessions on AWS, GCP, Docker, Kubernetes, and CI/CD pipelines.",
    highlights: ["AWS & GCP live labs","Kubernetes orchestration demo","CI/CD pipeline setup","Cloud cost optimization tips"],
    agenda: { day1: [
      { time: "09:00 AM - 10:00 AM", title: "State of Cloud 2026", sub: "Keynote address", tag: "Keynote" },
      { time: "10:15 AM - 12:00 PM", title: "Docker & Kubernetes Workshop", sub: "Container orchestration live", tag: "Hands-on" },
      { time: "01:30 PM - 03:00 PM", title: "CI/CD with GitHub Actions", sub: "End-to-end pipeline demo", tag: "Workshop" },
      { time: "03:15 PM - 05:00 PM", title: "Cloud Cost Optimization", sub: "FinOps strategies", tag: "Panel" }
    ]},
    speakers: [
      { name: "Dara Nhem", title: "Cloud Architect", company: "AWS ASEAN" },
      { name: "Kimly Prak", title: "DevOps Lead", company: "CAMTECH Solutions" }
    ],
    venue: { name: "Sofitel Ballroom", address: "Phnom Penh, Cambodia", parking: true, accessibility: true }
  },
  {
    id: 16, title: "Mobile App Development Hackathon", category: "Technology",
    date: "September 20, 2026", location: "SmartPhone Center, Phnom Penh",
    price: 20, capacity: 120, attending: 98, rating: 4.5,
    image: "/assets/images/Tech1.8.webp",
    description: "48-hour hackathon focused on building innovative mobile applications. React Native and Flutter teams compete for prizes and mentorship opportunities.",
    highlights: ["48-hour build challenge","Expert mentors on-site","$3,000 prize pool","Startup incubator pitches"],
    agenda: { day1: [
      { time: "09:00 AM - 10:00 AM", title: "Opening & Team Formation", sub: "Problem statement reveal", tag: "Opening" },
      { time: "10:00 AM - 06:00 PM", title: "Build Sprint Day 1", sub: "Mentors available all day", tag: "Hackathon" },
      { time: "06:30 PM - 08:00 PM", title: "Checkpoint & Feedback", sub: "Mid-hack review with judges", tag: "Review" }
    ]},
    speakers: [
      { name: "Chantha Sok", title: "Flutter Developer", company: "AppKH" },
      { name: "Bora Meas", title: "React Native Lead", company: "MobileFirst KH" }
    ],
    venue: { name: "SmartPhone Center Innovation Hub", address: "Phnom Penh, Cambodia", parking: false, accessibility: true }
  },
  {
    id: 17, title: "Data Science & Analytics Forum", category: "Technology",
    date: "October 8, 2026", location: "National University of Management, Phnom Penh",
    price: 35, capacity: 160, attending: 112, rating: 4.6,
    image: "/assets/images/Tech1.9.png",
    description: "Deep dive into data analytics, visualization, and business intelligence. Learn to extract actionable insights from complex datasets.",
    highlights: ["Power BI & Tableau workshops","Real dataset case studies","SQL optimization techniques","Data storytelling masterclass"],
    agenda: { day1: [
      { time: "08:30 AM - 10:00 AM", title: "Data Strategy for Organizations", sub: "Keynote by industry leaders", tag: "Keynote" },
      { time: "10:15 AM - 12:00 PM", title: "Advanced SQL & Query Optimization", sub: "Live coding session", tag: "Workshop" },
      { time: "01:30 PM - 03:00 PM", title: "Tableau Dashboard Masterclass", sub: "Build a live dashboard", tag: "Hands-on" },
      { time: "03:15 PM - 05:00 PM", title: "Data Storytelling", sub: "Communicating insights to executives", tag: "Workshop" }
    ]},
    speakers: [
      { name: "Leakhena Noun", title: "Data Analyst", company: "ABA Bank" },
      { name: "Sopheak Ung", title: "BI Consultant", company: "KPMG Cambodia" }
    ],
    venue: { name: "NUM Conference Hall", address: "Phnom Penh, Cambodia", parking: true, accessibility: true }
  },
  {
    id: 18, title: "Web3 & Blockchain Developer Day", category: "Technology",
    date: "October 25, 2026", location: "TechHub Phnom Penh",
    price: 55, capacity: 100, attending: 76, rating: 4.4,
    image: "/assets/images/Tech1.6.jpg",
    description: "Explore decentralized application development, smart contracts, and the emerging Web3 ecosystem in Southeast Asia.",
    highlights: ["Solidity smart contract coding","DeFi protocol analysis","NFT marketplace demo","Web3 career pathways"],
    agenda: { day1: [
      { time: "09:00 AM - 10:30 AM", title: "Web3 Ecosystem Overview", sub: "Blockchain fundamentals & trends", tag: "Lecture" },
      { time: "10:45 AM - 12:00 PM", title: "Solidity Smart Contract Lab", sub: "Deploy your first contract", tag: "Hands-on" },
      { time: "01:30 PM - 03:00 PM", title: "Building a DApp", sub: "React + Ethers.js integration", tag: "Workshop" },
      { time: "03:15 PM - 04:30 PM", title: "Web3 Careers Panel", sub: "How to break into the industry", tag: "Panel" }
    ]},
    speakers: [
      { name: "Visal Chhun", title: "Blockchain Developer", company: "CryptoKH" },
      { name: "Maly Keo", title: "DeFi Analyst", company: "Chain Research Asia" }
    ],
    venue: { name: "TechHub Coworking Space", address: "Phnom Penh, Cambodia", parking: false, accessibility: true }
  },

  // â”€â”€ Workshop (IDs 19-25) â”€â”€
  {
    id: 19, title: "Watercolor Painting for Beginners", category: "Workshop",
    date: "August 2, 2026", location: "Bophana Audiovisual Resource Center, Phnom Penh",
    price: 25, capacity: 30, attending: 28, rating: 4.8,
    image: "/assets/images/workshop-2.jpg",
    description: "A relaxing weekend watercolor workshop for absolute beginners. Learn color mixing, brush techniques, and create your own landscape painting to take home.",
    highlights: ["All materials provided","Small class (max 30)","Take home your artwork","Professional artist instruction"],
    agenda: { day1: [
      { time: "09:00 AM - 10:00 AM", title: "Color Theory Basics", sub: "Primary, secondary & mixing", tag: "Lecture" },
      { time: "10:15 AM - 12:00 PM", title: "Brush Techniques Practice", sub: "Wet-on-wet & dry brush", tag: "Hands-on" },
      { time: "01:00 PM - 03:00 PM", title: "Landscape Painting", sub: "Guided full painting session", tag: "Project" },
      { time: "03:15 PM - 04:00 PM", title: "Gallery Showcase & Critique", sub: "Share and celebrate your work", tag: "Showcase" }
    ]},
    speakers: [
      { name: "Bopha Sou", title: "Watercolor Artist", company: "Bophana Arts Studio" }
    ],
    venue: { name: "Bophana Art Hall", address: "Phnom Penh, Cambodia", parking: false, accessibility: true }
  },
  {
    id: 20, title: "Pottery & Ceramics Weekend", category: "Workshop",
    date: "August 16, 2026", location: "Khmer Ceramics Center, Siem Reap",
    price: 40, capacity: 20, attending: 18, rating: 4.9,
    image: "/assets/images/workshop-3.jpg",
    description: "Experience the ancient art of Khmer ceramics. Learn wheel-throwing and hand-building techniques guided by master potters.",
    highlights: ["Wheel-throwing & hand-building","Traditional Khmer glazing","Kiln firing included","Piece ready for pickup in 2 weeks"],
    agenda: { day1: [
      { time: "09:00 AM - 10:30 AM", title: "History of Khmer Ceramics", sub: "Cultural context & heritage", tag: "Introduction" },
      { time: "10:45 AM - 12:00 PM", title: "Hand-Building Techniques", sub: "Pinch, coil & slab methods", tag: "Hands-on" },
      { time: "01:00 PM - 03:00 PM", title: "Wheel-Throwing Session", sub: "Guided by master potter", tag: "Hands-on" },
      { time: "03:15 PM - 04:30 PM", title: "Glazing & Decoration", sub: "Traditional patterns application", tag: "Finishing" }
    ]},
    speakers: [
      { name: "Sophoan Him", title: "Master Potter", company: "Khmer Ceramics Revival" }
    ],
    venue: { name: "Khmer Ceramics Center", address: "Siem Reap, Cambodia", parking: true, accessibility: false }
  },
  {
    id: 21, title: "Calligraphy & Lettering Masterclass", category: "Workshop",
    date: "September 6, 2026", location: "Meta House, Phnom Penh",
    price: 30, capacity: 25, attending: 22, rating: 4.7,
    image: "/assets/images/workshop-4.jpg",
    description: "Master the art of modern calligraphy and brush lettering. From basic strokes to creating personalized pieces for cards, invitations, and home decor.",
    highlights: ["Starter kit included","Modern & traditional styles","Digital lettering intro","Portfolio piece creation"],
    agenda: { day1: [
      { time: "09:00 AM - 10:00 AM", title: "Tools & Materials Overview", sub: "Choosing nibs, inks & paper", tag: "Introduction" },
      { time: "10:15 AM - 12:00 PM", title: "Basic Strokes & Letterforms", sub: "Foundational practice drills", tag: "Hands-on" },
      { time: "01:00 PM - 02:30 PM", title: "Composition & Layout", sub: "Designing full pieces", tag: "Workshop" },
      { time: "02:45 PM - 04:00 PM", title: "Final Project Showcase", sub: "Share & photograph your work", tag: "Showcase" }
    ]},
    speakers: [
      { name: "Sreyleak Mao", title: "Lettering Artist", company: "Ink & Script Studio" }
    ],
    venue: { name: "Meta House Gallery", address: "Phnom Penh, Cambodia", parking: false, accessibility: true }
  },
  {
    id: 22, title: "Sustainable Fashion Design Workshop", category: "Workshop",
    date: "September 21, 2026", location: "Kandal Market Creative Space, Phnom Penh",
    price: 35, capacity: 30, attending: 24, rating: 4.6,
    image: "/assets/images/workshop-5.jpg",
    description: "Learn to upcycle and repurpose fabrics into fashionable garments. Explore zero-waste pattern cutting and natural dyeing techniques.",
    highlights: ["Upcycled fabric provided","Natural dyeing with plants","Sewing basics included","Take home a finished piece"],
    agenda: { day1: [
      { time: "09:00 AM - 10:00 AM", title: "Sustainable Fashion Intro", sub: "Impact of fast fashion & alternatives", tag: "Lecture" },
      { time: "10:15 AM - 12:00 PM", title: "Natural Dyeing Workshop", sub: "Turmeric, indigo & hibiscus dyes", tag: "Hands-on" },
      { time: "01:00 PM - 03:00 PM", title: "Zero-Waste Pattern Cutting", sub: "Design your garment", tag: "Workshop" },
      { time: "03:15 PM - 05:00 PM", title: "Sewing & Finishing", sub: "Assemble your final piece", tag: "Hands-on" }
    ]},
    speakers: [
      { name: "Narin Hak", title: "Sustainable Designer", company: "EcoThread Cambodia" }
    ],
    venue: { name: "Kandal Creative Space", address: "Phnom Penh, Cambodia", parking: false, accessibility: true }
  },
  {
    id: 23, title: "Cooking Masterclass: Khmer Cuisine", category: "Workshop",
    date: "October 4, 2026", location: "Cuisine Wat Damnak, Siem Reap",
    price: 50, capacity: 16, attending: 16, rating: 5.0,
    image: "/assets/images/workshop-6.jpg",
    description: "An intimate cooking class led by award-winning chefs teaching authentic Khmer recipes using local ingredients and traditional techniques.",
    highlights: ["Market ingredient tour","6-dish cooking session","Recipes & technique guide","3-course meal to enjoy"],
    agenda: { day1: [
      { time: "08:00 AM - 09:00 AM", title: "Morning Market Tour", sub: "Psar Leu â€” sourcing fresh ingredients", tag: "Tour" },
      { time: "09:30 AM - 11:30 AM", title: "Amok & Soups Cooking", sub: "Classic Khmer dishes session 1", tag: "Hands-on" },
      { time: "12:00 PM - 01:00 PM", title: "Lunch Break", sub: "Enjoy the food you cooked", tag: "Break" },
      { time: "01:15 PM - 03:00 PM", title: "Desserts & Beverages", sub: "Nom Cha & Tuk Ampil", tag: "Hands-on" }
    ]},
    speakers: [
      { name: "Joannes RiviÃ¨re", title: "Executive Chef", company: "Cuisine Wat Damnak" }
    ],
    venue: { name: "Cuisine Wat Damnak Kitchen", address: "Siem Reap, Cambodia", parking: true, accessibility: false }
  },
  {
    id: 24, title: "Film Photography & Darkroom Workshop", category: "Workshop",
    date: "October 18, 2026", location: "Factory Phnom Penh",
    price: 45, capacity: 15, attending: 13, rating: 4.8,
    image: "/assets/images/workshop-7.jpg",
    description: "Rediscover the magic of analog photography. Load and shoot 35mm film, then develop your own prints in a traditional darkroom.",
    highlights: ["35mm camera provided","Film & chemicals included","Darkroom development","Take home your prints"],
    agenda: { day1: [
      { time: "09:00 AM - 10:00 AM", title: "Analog Photography History", sub: "From Kodak to the digital age", tag: "Introduction" },
      { time: "10:15 AM - 12:00 PM", title: "Shooting Session", sub: "Street photography with film cameras", tag: "Field" },
      { time: "01:00 PM - 03:00 PM", title: "Film Development", sub: "Develop your negatives in darkroom", tag: "Hands-on" },
      { time: "03:15 PM - 04:30 PM", title: "Print & Enlarge", sub: "Make photographic prints", tag: "Hands-on" }
    ]},
    speakers: [
      { name: "Chann Pheara", title: "Film Photographer", company: "Analog Collective KH" }
    ],
    venue: { name: "Factory Creative Hub", address: "Phnom Penh, Cambodia", parking: true, accessibility: true }
  },
  {
    id: 25, title: "Urban Gardening & Composting Workshop", category: "Workshop",
    date: "November 1, 2026", location: "Phnom Penh Community Garden, Toul Tom Poung",
    price: 15, capacity: 40, attending: 31, rating: 4.5,
    image: "/assets/images/workshop%20group.webp",
    description: "Learn to grow food in small urban spaces. Covers container gardening, composting, vertical garden setups, and organic pest control.",
    highlights: ["Seed starter kits provided","Composting bin assembly","Vertical planter building","Organic growing guide"],
    agenda: { day1: [
      { time: "08:30 AM - 09:30 AM", title: "Urban Agriculture Overview", sub: "Why grow your own food in the city", tag: "Lecture" },
      { time: "09:45 AM - 11:30 AM", title: "Container Gardening Setup", sub: "Hands-on planting session", tag: "Hands-on" },
      { time: "12:00 PM - 01:00 PM", title: "Composting Workshop", sub: "Build a worm compost bin", tag: "Hands-on" },
      { time: "01:15 PM - 02:30 PM", title: "Vertical Garden Build", sub: "Pallet garden construction", tag: "Project" }
    ]},
    speakers: [
      { name: "Thida Ros", title: "Urban Farmer", company: "GreenCity KH" }
    ],
    venue: { name: "Toul Tom Poung Community Garden", address: "Phnom Penh, Cambodia", parking: false, accessibility: true }
  },

  // â”€â”€ Business (IDs 26-31) â”€â”€
  {
    id: 26, title: "Startup Funding & Investment Summit", category: "Business",
    date: "August 7, 2026", location: "Hyatt Regency, Phnom Penh",
    price: 90, capacity: 200, attending: 165, rating: 4.7,
    image: "/assets/images/business-2.jpg",
    description: "Connect with regional investors and learn how to pitch, structure deals, and navigate the Southeast Asian startup funding landscape.",
    highlights: ["VC & angel investor panels","Live pitch competition","Term sheet negotiation workshop","1-on-1 investor meetings"],
    agenda: { day1: [
      { time: "09:00 AM - 10:00 AM", title: "SEA Startup Funding Landscape", sub: "State of venture capital 2026", tag: "Keynote" },
      { time: "10:15 AM - 12:00 PM", title: "The Perfect Pitch", sub: "Structure, story & delivery", tag: "Workshop" },
      { time: "01:30 PM - 03:30 PM", title: "Live Pitch Competition", sub: "10 startups, 5 judges", tag: "Competition" },
      { time: "03:45 PM - 05:00 PM", title: "1-on-1 Investor Meetings", sub: "Speed networking with VCs", tag: "Networking" }
    ]},
    speakers: [
      { name: "Virak Chheng", title: "Partner", company: "Mekong Capital" },
      { name: "Sophie Tran", title: "Venture Analyst", company: "500 Global" }
    ],
    venue: { name: "Hyatt Regency Grand Ballroom", address: "Phnom Penh, Cambodia", parking: true, accessibility: true }
  },
  {
    id: 27, title: "Leadership & Management Excellence Forum", category: "Business",
    date: "August 22, 2026", location: "Phnom Penh Hotel, Cambodia",
    price: 70, capacity: 150, attending: 118, rating: 4.6,
    image: "/assets/images/business-4.jpg",
    description: "Develop the leadership skills needed to inspire teams, drive performance, and navigate organizational change in dynamic business environments.",
    highlights: ["Executive coaching sessions","360-degree leadership assessment","Change management frameworks","Action learning projects"],
    agenda: { day1: [
      { time: "09:00 AM - 10:30 AM", title: "Modern Leadership Models", sub: "Servant, adaptive & transformational", tag: "Lecture" },
      { time: "10:45 AM - 12:00 PM", title: "Emotional Intelligence Workshop", sub: "EQ assessment & development", tag: "Workshop" },
      { time: "01:30 PM - 03:00 PM", title: "High-Performance Teams", sub: "Building & sustaining team culture", tag: "Workshop" },
      { time: "03:15 PM - 05:00 PM", title: "Executive Coaching Circle", sub: "Small group coaching sessions", tag: "Coaching" }
    ]},
    speakers: [
      { name: "Vannak Lim", title: "Executive Coach", company: "Growth Leaders Asia" },
      { name: "Sokha Nhem", title: "HR Director", company: "Acleda Bank" }
    ],
    venue: { name: "Phnom Penh Hotel Conference Hall", address: "Phnom Penh, Cambodia", parking: true, accessibility: true }
  },
  {
    id: 28, title: "E-Commerce & Digital Trade Conference", category: "Business",
    date: "September 9, 2026", location: "NagaWorld Convention Center, Phnom Penh",
    price: 60, capacity: 300, attending: 245, rating: 4.8,
    image: "/assets/images/business-5.jpg",
    description: "Explore the booming e-commerce landscape in Southeast Asia. Learn from top platforms, logistics partners, and digital payment providers.",
    highlights: ["Platform strategy sessions","Cross-border trade insights","Logistics & fulfilment panel","Live seller success stories"],
    agenda: { day1: [
      { time: "09:00 AM - 10:00 AM", title: "E-Commerce SEA 2026 Overview", sub: "Market size, trends & opportunities", tag: "Keynote" },
      { time: "10:15 AM - 12:00 PM", title: "Multi-Channel Selling Strategy", sub: "Shopee, Lazada, TikTok Shop", tag: "Workshop" },
      { time: "01:30 PM - 03:00 PM", title: "Logistics & Last-Mile Delivery", sub: "Fulfillment optimization panel", tag: "Panel" },
      { time: "03:15 PM - 05:00 PM", title: "Payment Solutions & Trust", sub: "Digital wallets & fraud prevention", tag: "Panel" }
    ]},
    speakers: [
      { name: "Dara Keo", title: "Head of Sellers", company: "Shopee Cambodia" },
      { name: "Mala Chan", title: "Logistics Director", company: "Kerry Express KH" }
    ],
    venue: { name: "NagaWorld Convention Center", address: "Phnom Penh, Cambodia", parking: true, accessibility: true }
  },
  {
    id: 29, title: "Personal Finance & Wealth Building Seminar", category: "Business",
    date: "September 27, 2026", location: "Canadia Tower, Phnom Penh",
    price: 30, capacity: 120, attending: 95, rating: 4.5,
    image: "/assets/images/business-6.jpg",
    description: "Take control of your financial future. Learn budgeting, investing basics, real estate fundamentals, and retirement planning in the Cambodian context.",
    highlights: ["Budget planning toolkit","Stock & crypto investment intro","Real estate ROI analysis","Insurance & risk management"],
    agenda: { day1: [
      { time: "09:00 AM - 10:00 AM", title: "Financial Freedom Mindset", sub: "Why most people stay broke", tag: "Keynote" },
      { time: "10:15 AM - 12:00 PM", title: "Budgeting & Saving Systems", sub: "50/30/20 rule in practice", tag: "Workshop" },
      { time: "01:30 PM - 03:00 PM", title: "Investment Vehicles in Cambodia", sub: "Stocks, REITs, crypto & more", tag: "Lecture" },
      { time: "03:15 PM - 05:00 PM", title: "Real Estate Investing", sub: "ROI analysis & case studies", tag: "Workshop" }
    ]},
    speakers: [
      { name: "Bunna Hor", title: "Financial Planner", company: "Prudential Cambodia" },
      { name: "Tara Sok", title: "Investment Advisor", company: "Canadia Bank" }
    ],
    venue: { name: "Canadia Tower Seminar Room", address: "Phnom Penh, Cambodia", parking: true, accessibility: true }
  },
  {
    id: 30, title: "SME Growth & Scaling Masterclass", category: "Business",
    date: "October 12, 2026", location: "Koh Pich Convention Center, Phnom Penh",
    price: 55, capacity: 180, attending: 132, rating: 4.7,
    image: "/assets/images/business-7.jpg",
    description: "Strategies and tools for small and medium businesses ready to scale. From operations optimization to market expansion and franchise models.",
    highlights: ["Scaling framework workshop","Operations efficiency audit","Franchise model overview","Export readiness checklist"],
    agenda: { day1: [
      { time: "09:00 AM - 10:00 AM", title: "Scaling vs. Growing", sub: "Understanding the difference", tag: "Keynote" },
      { time: "10:15 AM - 12:00 PM", title: "Operations & Systems", sub: "Building scalable processes", tag: "Workshop" },
      { time: "01:30 PM - 03:00 PM", title: "Market Expansion Strategies", sub: "New geographies & channels", tag: "Workshop" },
      { time: "03:15 PM - 05:00 PM", title: "Franchise & Licensing Models", sub: "Case studies from Cambodia", tag: "Panel" }
    ]},
    speakers: [
      { name: "Sovannak Pov", title: "SME Advisor", company: "USAID Cambodia" },
      { name: "Chanthy Kith", title: "Operations Consultant", company: "McKinsey Phnom Penh" }
    ],
    venue: { name: "Koh Pich Convention Center", address: "Phnom Penh, Cambodia", parking: true, accessibility: true }
  },
  {
    id: 31, title: "Women in Business Leadership Summit", category: "Business",
    date: "October 29, 2026", location: "InterContinental Phnom Penh",
    price: 50, capacity: 200, attending: 178, rating: 4.9,
    image: "/assets/images/Business.webp",
    description: "Celebrating and empowering women entrepreneurs and corporate leaders in Cambodia and the wider ASEAN region.",
    highlights: ["Inspiring keynote speakers","Mentorship matching program","Funding opportunities panel","Networking & peer circles"],
    agenda: { day1: [
      { time: "09:00 AM - 10:00 AM", title: "Breaking the Glass Ceiling in SEA", sub: "Keynote by leading women CEOs", tag: "Keynote" },
      { time: "10:15 AM - 12:00 PM", title: "Negotiation & Salary Advocacy", sub: "Know your worth & ask for it", tag: "Workshop" },
      { time: "01:30 PM - 03:00 PM", title: "Women-Led Startup Pitches", sub: "Showcase & feedback panel", tag: "Pitches" },
      { time: "03:15 PM - 05:00 PM", title: "Mentorship Circle", sub: "Paired sessions with senior leaders", tag: "Mentorship" }
    ]},
    speakers: [
      { name: "Kagna Chy", title: "CEO", company: "Zando Cambodia" },
      { name: "Mengly Prum", title: "Founder & Director", company: "Womenpreneur KH" }
    ],
    venue: { name: "InterContinental Grand Ballroom", address: "Phnom Penh, Cambodia", parking: true, accessibility: true }
  },

  // â”€â”€ Entertainment (IDs 32-37) â”€â”€
  {
    id: 32, title: "Phnom Penh Jazz Festival", category: "Entertainment",
    date: "August 9, 2026", location: "Riverside Park, Phnom Penh",
    price: 18, capacity: 1500, attending: 1280, rating: 4.8,
    image: "/assets/images/entertainment-2.jpg",
    description: "Two nights of world-class jazz performances featuring local talent and international acts along the scenic Tonle Sap river.",
    highlights: ["10+ live jazz bands","Open-air riverside stage","Food & craft market","Late-night jam sessions"],
    agenda: { day1: [
      { time: "05:00 PM - 06:00 PM", title: "Opening Act: Young Jazz Talent", sub: "Emerging Cambodian musicians", tag: "Performance" },
      { time: "06:30 PM - 08:00 PM", title: "Headliner: Jazz Fusion Set", sub: "International jazz quartet", tag: "Main Stage" },
      { time: "08:30 PM - 10:00 PM", title: "Late Night Jam Session", sub: "Open stage â€” all musicians welcome", tag: "Jam" }
    ]},
    speakers: [
      { name: "Marcus Wells", title: "Jazz Saxophonist", company: "Global Jazz Tour" },
      { name: "Rathana Penh", title: "Pianist", company: "Phnom Penh Jazz Collective" }
    ],
    venue: { name: "Riverside Park Amphitheater", address: "Phnom Penh, Cambodia", parking: false, accessibility: true }
  },
  {
    id: 33, title: "International Film Festival Phnom Penh", category: "Entertainment",
    date: "August 24, 2026", location: "Major Cineplex, Phnom Penh",
    price: 12, capacity: 500, attending: 420, rating: 4.7,
    image: "/assets/images/entertainment-3.jpg",
    description: "A 5-day celebration of independent cinema from across Asia and the world. Includes filmmaker Q&As, workshops, and industry panels.",
    highlights: ["50+ film screenings","Director Q&A sessions","Short film competition","Industry networking nights"],
    agenda: { day1: [
      { time: "10:00 AM - 12:00 PM", title: "Opening Ceremony & Gala Screening", sub: "Red carpet & premiere", tag: "Gala" },
      { time: "02:00 PM - 04:00 PM", title: "Documentary Block", sub: "3 short documentaries + Q&A", tag: "Screening" },
      { time: "05:00 PM - 07:00 PM", title: "Filmmaker Panel", sub: "The independent film economy", tag: "Panel" },
      { time: "08:00 PM - 10:30 PM", title: "Feature Film: Evening Showing", sub: "Competition entry", tag: "Screening" }
    ]},
    speakers: [
      { name: "Davy Chou", title: "Film Director", company: "Anti-Archive" },
      { name: "Sotho Kulikar", title: "Director & Actress", company: "Hanuman Films" }
    ],
    venue: { name: "Major Cineplex Diamond Island", address: "Phnom Penh, Cambodia", parking: true, accessibility: true }
  },
  {
    id: 34, title: "Comedy Night: Stand-Up Spectacular", category: "Entertainment",
    date: "September 12, 2026", location: "The Factory Phnom Penh",
    price: 15, capacity: 200, attending: 185, rating: 4.9,
    image: "/assets/images/entertainment-4.jpg",
    description: "A raucous night of stand-up comedy featuring Cambodia's top comedians alongside international touring acts. 18+ event.",
    highlights: ["7 comedians performing","Bilingual sets (Khmer & English)","Drinks & bar available","VIP front-row packages"],
    agenda: { day1: [
      { time: "07:30 PM - 08:00 PM", title: "Doors Open & Bar Service", sub: "Arrive early for best seats", tag: "Pre-Show" },
      { time: "08:00 PM - 09:00 PM", title: "Opening Acts (3 comedians)", sub: "Rising stars of Cambodian comedy", tag: "Performance" },
      { time: "09:15 PM - 10:30 PM", title: "Headline Sets", sub: "International touring comedians", tag: "Headliner" }
    ]},
    speakers: [
      { name: "Kevin Meas", title: "Stand-Up Comedian", company: "Laugh Factory KH" },
      { name: "Tom Chana", title: "Comedian & Writer", company: "Comedy Central SEA" }
    ],
    venue: { name: "Factory Live Venue", address: "Phnom Penh, Cambodia", parking: true, accessibility: true }
  },
  {
    id: 35, title: "Traditional Khmer Arts Gala", category: "Entertainment",
    date: "September 28, 2026", location: "National Museum of Cambodia, Phnom Penh",
    price: 25, capacity: 300, attending: 240, rating: 4.8,
    image: "/assets/images/entertainment-6.jpg",
    description: "An evening celebrating the rich traditions of Khmer performing arts â€” classical dance, shadow puppetry, and traditional music.",
    highlights: ["Royal Ballet performance","Sbek Thom shadow puppetry","Traditional music ensemble","Guided museum tour"],
    agenda: { day1: [
      { time: "06:00 PM - 06:30 PM", title: "Welcome Reception & Museum Tour", sub: "Guided evening tour of galleries", tag: "Reception" },
      { time: "07:00 PM - 08:00 PM", title: "Sbek Thom Shadow Puppetry", sub: "UNESCO heritage performance", tag: "Performance" },
      { time: "08:15 PM - 09:30 PM", title: "Classical Khmer Ballet", sub: "Royal University of Fine Arts ensemble", tag: "Performance" }
    ]},
    speakers: [
      { name: "Charya Burt", title: "Apsara Dance Director", company: "Royal University of Fine Arts" }
    ],
    venue: { name: "National Museum of Cambodia", address: "Phnom Penh, Cambodia", parking: false, accessibility: true }
  },
  {
    id: 36, title: "Electronic Music & Light Festival", category: "Entertainment",
    date: "October 17, 2026", location: "Koh Pich Island, Phnom Penh",
    price: 22, capacity: 2000, attending: 1756, rating: 4.6,
    image: "/assets/images/entertainment-7.jpg",
    description: "Phnom Penh's biggest outdoor electronic music festival. Three stages, international DJs, mesmerizing light installations, and food village.",
    highlights: ["3 stages & 15 DJs","Laser & drone light show","Art installations","Street food village"],
    agenda: { day1: [
      { time: "04:00 PM - 06:00 PM", title: "Sunset Chill Stage", sub: "Ambient & deep house sets", tag: "Stage 1" },
      { time: "06:00 PM - 08:00 PM", title: "Main Stage Opens", sub: "Progressive house headliners", tag: "Main Stage" },
      { time: "08:00 PM - 10:00 PM", title: "Headline DJ Set", sub: "International electronic artist", tag: "Headliner" },
      { time: "10:00 PM - 12:00 AM", title: "After Dark: Techno Stage", sub: "Berlin-style techno closing set", tag: "Stage 3" }
    ]},
    speakers: [
      { name: "DJ Kura", title: "Electronic Artist", company: "Ministry of Sound SEA" },
      { name: "Mony Khmer", title: "Local DJ", company: "Phnom Penh Beats" }
    ],
    venue: { name: "Koh Pich Outdoor Arena", address: "Phnom Penh, Cambodia", parking: true, accessibility: true }
  },
  {
    id: 37, title: "Street Art & Mural Festival", category: "Entertainment",
    date: "November 8, 2026", location: "Street 240 Arts District, Phnom Penh",
    price: 0, capacity: 5000, attending: 3200, rating: 4.7,
    image: "/assets/images/event%20entertainment.png",
    description: "A free 3-day outdoor festival bringing together 30 local and international street artists to transform the walls of Phnom Penh's arts district.",
    highlights: ["30 artists live painting","Interactive mural workshops","Food & craft stalls","Evening projections"],
    agenda: { day1: [
      { time: "09:00 AM - 12:00 PM", title: "Artists Begin Live Painting", sub: "Watch murals come to life", tag: "Live Art" },
      { time: "12:00 PM - 02:00 PM", title: "Community Mural Workshop", sub: "Paint a section of the community wall", tag: "Participation" },
      { time: "04:00 PM - 06:00 PM", title: "Artist Meet & Greet", sub: "Talk to the creators", tag: "Networking" },
      { time: "07:00 PM - 09:00 PM", title: "Building Projection Show", sub: "Digital art mapped onto buildings", tag: "Show" }
    ]},
    speakers: [
      { name: "Reth Meas", title: "Muralist", company: "Phnom Penh Street Art Collective" },
      { name: "Sara Khoury", title: "International Artist", company: "Global Walls Project" }
    ],
    venue: { name: "Street 240 Arts District", address: "Phnom Penh, Cambodia", parking: false, accessibility: true }
  },

  // â”€â”€ Education (IDs 38-43) â”€â”€
  {
    id: 38, title: "Higher Education Fair Cambodia 2026", category: "Education",
    date: "August 10, 2026", location: "Phnom Penh Exhibition Center",
    price: 0, capacity: 3000, attending: 2650, rating: 4.6,
    image: "/assets/images/education-2.jpg",
    description: "Connect with 80+ universities from 20 countries. Explore scholarship opportunities, degree programs, and study abroad pathways.",
    highlights: ["80+ university booths","Scholarship application workshops","Study abroad visa guidance","Alumni panel discussions"],
    agenda: { day1: [
      { time: "09:00 AM - 10:00 AM", title: "Opening Ceremony", sub: "Welcome from Ministry of Education", tag: "Ceremony" },
      { time: "10:00 AM - 04:00 PM", title: "University Exhibition", sub: "Visit booths & collect materials", tag: "Exhibition" },
      { time: "11:00 AM - 12:00 PM", title: "Scholarship Workshop", sub: "How to find & apply for funding", tag: "Workshop" },
      { time: "02:00 PM - 03:00 PM", title: "Alumni Success Panel", sub: "Stories from Cambodian students abroad", tag: "Panel" }
    ]},
    speakers: [
      { name: "H.E. Hang Chuon Naron", title: "Minister of Education", company: "Ministry of Education Cambodia" }
    ],
    venue: { name: "Phnom Penh Exhibition & Convention Center", address: "Phnom Penh, Cambodia", parking: true, accessibility: true }
  },
  {
    id: 39, title: "STEM Education Innovation Summit", category: "Education",
    date: "August 28, 2026", location: "Royal University of Phnom Penh",
    price: 20, capacity: 250, attending: 198, rating: 4.7,
    image: "/assets/images/education-4.jpg",
    description: "Bringing together educators, students, and industry to reimagine STEM education in Cambodia. Robotics demos, maker challenges, and curriculum innovation.",
    highlights: ["Robotics & coding showcases","Curriculum design workshop","Teacher training sessions","Student innovation competition"],
    agenda: { day1: [
      { time: "09:00 AM - 10:00 AM", title: "The Future of STEM in SEA", sub: "Keynote address", tag: "Keynote" },
      { time: "10:15 AM - 12:00 PM", title: "Robotics & Coding Demo", sub: "Student teams showcase projects", tag: "Demo" },
      { time: "01:30 PM - 03:00 PM", title: "STEM Curriculum Innovation", sub: "Teacher workshop sessions", tag: "Workshop" },
      { time: "03:15 PM - 05:00 PM", title: "Student Innovation Pitches", sub: "Top 5 student projects", tag: "Competition" }
    ]},
    speakers: [
      { name: "Dr. Makara Sok", title: "Dean of Engineering", company: "RUPP" },
      { name: "Lina Chim", title: "STEM Education Director", company: "STEM Education KH" }
    ],
    venue: { name: "RUPP Science Complex", address: "Phnom Penh, Cambodia", parking: true, accessibility: true }
  },
  {
    id: 40, title: "Language Learning & Linguistics Conference", category: "Education",
    date: "September 14, 2026", location: "Institute of Foreign Languages, Phnom Penh",
    price: 25, capacity: 180, attending: 145, rating: 4.5,
    image: "/assets/images/education-5.jpg",
    description: "Exploring modern approaches to language learning â€” from AI-assisted tools to immersive methodologies. Focus on Khmer, English, and Mandarin.",
    highlights: ["Multilingual learning strategies","AI language tools demo","Immersive methods workshop","Translation career pathways"],
    agenda: { day1: [
      { time: "09:00 AM - 10:00 AM", title: "Khmer Language Preservation", sub: "Digital tools for heritage languages", tag: "Keynote" },
      { time: "10:15 AM - 12:00 PM", title: "AI Language Tools Workshop", sub: "ChatGPT, Duolingo & beyond", tag: "Workshop" },
      { time: "01:30 PM - 03:00 PM", title: "Immersive Language Learning", sub: "TPRS & task-based approaches", tag: "Workshop" },
      { time: "03:15 PM - 04:30 PM", title: "Translation & Interpretation Careers", sub: "Pathways in a multilingual world", tag: "Panel" }
    ]},
    speakers: [
      { name: "Dr. Heng Sreang", title: "Applied Linguist", company: "IFL Cambodia" },
      { name: "Amy Chhouk", title: "Language Tech Specialist", company: "Google Translate Asia" }
    ],
    venue: { name: "IFL Conference Hall", address: "Phnom Penh, Cambodia", parking: false, accessibility: true }
  },
  {
    id: 41, title: "Early Childhood Education Forum", category: "Education",
    date: "October 3, 2026", location: "Lux Hotel, Phnom Penh",
    price: 30, capacity: 200, attending: 155, rating: 4.6,
    image: "/assets/images/education-6.jpg",
    description: "A forum for early childhood educators, parents, and policymakers to discuss best practices in foundational learning for children aged 0-8.",
    highlights: ["Play-based learning research","Nutrition & learning connection","Parent engagement strategies","Policy advocacy workshop"],
    agenda: { day1: [
      { time: "09:00 AM - 10:00 AM", title: "Brain Development in Early Years", sub: "Neuroscience & learning windows", tag: "Keynote" },
      { time: "10:15 AM - 12:00 PM", title: "Play-Based Learning in Practice", sub: "Classroom activity demonstrations", tag: "Workshop" },
      { time: "01:30 PM - 03:00 PM", title: "Parent Engagement Programs", sub: "Home learning environment design", tag: "Workshop" },
      { time: "03:15 PM - 04:30 PM", title: "Policy Roundtable", sub: "Funding & access for ECE", tag: "Panel" }
    ]},
    speakers: [
      { name: "Dr. Srey Neang", title: "Child Development Expert", company: "UNICEF Cambodia" },
      { name: "Chamnab Mok", title: "ECE Curriculum Designer", company: "Save the Children" }
    ],
    venue: { name: "Lux Hotel Ballroom", address: "Phnom Penh, Cambodia", parking: true, accessibility: true }
  },
  {
    id: 42, title: "Vocational Training & Skills Expo", category: "Education",
    date: "October 22, 2026", location: "National Technical Training Institute, Phnom Penh",
    price: 0, capacity: 1000, attending: 780, rating: 4.5,
    image: "/assets/images/education-7.jpg",
    description: "Showcasing vocational training pathways in construction, hospitality, auto mechanics, beauty, and IT. Connect with employers offering direct hiring.",
    highlights: ["Live skills demonstrations","Employer job fair","Free enrollment consultations","Scholarship sign-ups"],
    agenda: { day1: [
      { time: "09:00 AM - 10:00 AM", title: "Opening: Skills for the Future Economy", sub: "Keynote by Minister of Labor", tag: "Keynote" },
      { time: "10:00 AM - 04:00 PM", title: "Skills Demonstrations & Booths", sub: "Live demos from 20+ trades", tag: "Expo" },
      { time: "11:00 AM - 12:00 PM", title: "Employer Job Fair", sub: "Meet hiring managers directly", tag: "Job Fair" },
      { time: "01:30 PM - 03:00 PM", title: "Scholarship & Funding Workshop", sub: "How to access vocational grants", tag: "Workshop" }
    ]},
    speakers: [
      { name: "Sothy Khim", title: "TVET Director", company: "National Technical Training Institute" }
    ],
    venue: { name: "NTTI Main Campus", address: "Phnom Penh, Cambodia", parking: true, accessibility: true }
  },
  {
    id: 43, title: "Academic Research Methods Conference", category: "Education",
    date: "November 5, 2026", location: "University of Cambodia, Phnom Penh",
    price: 35, capacity: 150, attending: 112, rating: 4.7,
    image: "/assets/images/Conference%20Workshop.png",
    description: "A conference for graduate students and researchers on best practices in qualitative, quantitative, and mixed-methods research design.",
    highlights: ["Research design workshops","Statistical analysis sessions","Publishing & peer review guide","Thesis writing masterclass"],
    agenda: { day1: [
      { time: "09:00 AM - 10:00 AM", title: "Research Ethics & Integrity", sub: "Avoiding plagiarism & bias", tag: "Lecture" },
      { time: "10:15 AM - 12:00 PM", title: "Quantitative Methods Workshop", sub: "SPSS & R for survey analysis", tag: "Workshop" },
      { time: "01:30 PM - 03:00 PM", title: "Qualitative Research Techniques", sub: "Interviews, observation & coding", tag: "Workshop" },
      { time: "03:15 PM - 04:30 PM", title: "Publishing Your Research", sub: "Journals, conferences & impact", tag: "Panel" }
    ]},
    speakers: [
      { name: "Dr. Chanrith Ngin", title: "Research Professor", company: "University of Cambodia" },
      { name: "Kheang Un", title: "Political Scientist", company: "Northern Illinois University" }
    ],
    venue: { name: "University of Cambodia Auditorium", address: "Phnom Penh, Cambodia", parking: true, accessibility: true }
  },

  // â”€â”€ Networking (IDs 44-50) â”€â”€
  {
    id: 44, title: "Young Professionals Mixer Phnom Penh", category: "Networking",
    date: "August 12, 2026", location: "Eclipse Sky Bar, Phnom Penh",
    price: 15, capacity: 120, attending: 98, rating: 4.6,
    image: "/assets/images/networking-2.jpg",
    description: "Monthly mixer for ambitious young professionals aged 22-35. Structured networking rounds, industry tables, and a relaxed atmosphere with drinks.",
    highlights: ["Structured networking rounds","Industry-specific tables","Business card exchange","Follow-up app for connections"],
    agenda: { day1: [
      { time: "06:30 PM - 07:00 PM", title: "Welcome Drinks & Registration", sub: "Name badges & group assignments", tag: "Arrival" },
      { time: "07:00 PM - 08:30 PM", title: "Speed Networking Rounds", sub: "5-minute 1-on-1 conversations", tag: "Networking" },
      { time: "08:30 PM - 09:30 PM", title: "Industry Table Discussions", sub: "Tech, Finance, Marketing groups", tag: "Discussion" },
      { time: "09:30 PM - 11:00 PM", title: "Free Networking & Bar", sub: "Relax and follow up on new contacts", tag: "Social" }
    ]},
    speakers: [
      { name: "Borey Prak", title: "Community Manager", company: "YP Phnom Penh" }
    ],
    venue: { name: "Eclipse Sky Bar", address: "Phnom Penh, Cambodia", parking: false, accessibility: false }
  },
  {
    id: 45, title: "Tech Founders Meetup", category: "Networking",
    date: "August 26, 2026", location: "Emerge Coworking, Phnom Penh",
    price: 10, capacity: 80, attending: 67, rating: 4.7,
    image: "/assets/images/networking-3.jpg",
    description: "Informal monthly gathering for tech startup founders to share challenges, wins, and connect with potential co-founders, advisors, and investors.",
    highlights: ["Demo table showcase","Co-founder matching","Advisor introductions","VC open office hours"],
    agenda: { day1: [
      { time: "06:00 PM - 06:30 PM", title: "Arrival & Demo Tables", sub: "Show off what you're building", tag: "Demo" },
      { time: "06:30 PM - 07:30 PM", title: "Lightning Pitches", sub: "2-minute pitches from 10 founders", tag: "Pitches" },
      { time: "07:30 PM - 08:30 PM", title: "Open Networking", sub: "Food & drinks provided", tag: "Networking" },
      { time: "08:30 PM - 09:30 PM", title: "VC Office Hours", sub: "1-on-1 meetings with investors", tag: "Investor" }
    ]},
    speakers: [
      { name: "Sopheak Mony", title: "Startup Ecosystem Lead", company: "Emerge Hub" }
    ],
    venue: { name: "Emerge Coworking Space", address: "Phnom Penh, Cambodia", parking: false, accessibility: true }
  },
  {
    id: 46, title: "Creative Industries Networking Evening", category: "Networking",
    date: "September 16, 2026", location: "Pontoon Club, Phnom Penh",
    price: 12, capacity: 100, attending: 85, rating: 4.5,
    image: "/assets/images/networking-4.jpg",
    description: "A networking night for designers, filmmakers, photographers, musicians, and other creatives to connect, collaborate, and find new project partners.",
    highlights: ["Portfolio showcase wall","Collaboration matchmaking","Freelancer resources guide","Live music & creative ambience"],
    agenda: { day1: [
      { time: "06:00 PM - 07:00 PM", title: "Portfolio Wall & Arrival Drinks", sub: "Hang your work â€” meet others", tag: "Arrival" },
      { time: "07:00 PM - 08:00 PM", title: "Collaboration Matchmaking", sub: "Facilitated partner-finding session", tag: "Workshop" },
      { time: "08:00 PM - 10:00 PM", title: "Open Networking with Live Music", sub: "Chill out & make connections", tag: "Social" }
    ]},
    speakers: [
      { name: "Lyda Mao", title: "Creative Director", company: "Mao Creative Studio" }
    ],
    venue: { name: "Pontoon Club", address: "Phnom Penh, Cambodia", parking: false, accessibility: false }
  },
  {
    id: 47, title: "Alumni Network Grand Reunion", category: "Networking",
    date: "October 5, 2026", location: "Sofitel Phnom Penh Phokeethra",
    price: 25, capacity: 400, attending: 312, rating: 4.8,
    image: "/assets/images/networking-5.jpg",
    description: "Annual reunion for Cambodian alumni from top international universities. Reconnect, celebrate achievements, and build lasting professional connections.",
    highlights: ["Gala dinner & awards","Alumni achievement showcase","Mentorship programme launch","International alumni live-streamed"],
    agenda: { day1: [
      { time: "05:00 PM - 06:00 PM", title: "Welcome Reception", sub: "Cocktails & registration", tag: "Reception" },
      { time: "06:00 PM - 07:00 PM", title: "Alumni Achievement Awards", sub: "Celebrating class of 2016-2020", tag: "Awards" },
      { time: "07:00 PM - 09:00 PM", title: "Gala Dinner", sub: "Khmer & international cuisine", tag: "Dinner" },
      { time: "09:00 PM - 11:00 PM", title: "Networking & Dancing", sub: "Live band & open dance floor", tag: "Social" }
    ]},
    speakers: [
      { name: "Pheakdey Heng", title: "Alumni Association President", company: "Cambodia Alumni Network" }
    ],
    venue: { name: "Sofitel Grand Ballroom", address: "Phnom Penh, Cambodia", parking: true, accessibility: true }
  },
  {
    id: 48, title: "NGO & Social Enterprise Forum", category: "Networking",
    date: "October 20, 2026", location: "Daughters of Cambodia, Phnom Penh",
    price: 0, capacity: 150, attending: 120, rating: 4.6,
    image: "/assets/images/networking-6.jpg",
    description: "Connecting NGO professionals, social entrepreneurs, and impact investors to share resources, challenges, and collaboration opportunities.",
    highlights: ["Impact story showcases","Grant writing workshop","Partnership matchmaking","Volunteer recruitment fair"],
    agenda: { day1: [
      { time: "09:00 AM - 10:00 AM", title: "State of Civil Society in Cambodia", sub: "2026 sector overview", tag: "Keynote" },
      { time: "10:15 AM - 12:00 PM", title: "Grant Writing Workshop", sub: "Write winning proposals", tag: "Workshop" },
      { time: "01:30 PM - 03:00 PM", title: "Impact Story Pitches", sub: "7 organizations share their work", tag: "Pitches" },
      { time: "03:15 PM - 05:00 PM", title: "Partnership Matchmaking", sub: "Find collaborators & funders", tag: "Networking" }
    ]},
    speakers: [
      { name: "Chanbopha Nhim", title: "Executive Director", company: "Cambodian Women's Crisis Center" }
    ],
    venue: { name: "Daughters of Cambodia Training Center", address: "Phnom Penh, Cambodia", parking: false, accessibility: true }
  },
  {
    id: 49, title: "Real Estate & Property Networking Night", category: "Networking",
    date: "November 4, 2026", location: "Rosewood Phnom Penh",
    price: 20, capacity: 200, attending: 156, rating: 4.5,
    image: "/assets/images/networking-7.jpg",
    description: "The premier monthly networking event for real estate developers, agents, investors, and property professionals in Phnom Penh.",
    highlights: ["Market update presentation","Developer project showcases","Buyer-agent matchmaking","Legal & financing panel"],
    agenda: { day1: [
      { time: "06:00 PM - 06:30 PM", title: "Property Market Update", sub: "Q4 2026 data & trends", tag: "Briefing" },
      { time: "06:30 PM - 07:30 PM", title: "Developer Project Showcases", sub: "5 new projects presented", tag: "Showcase" },
      { time: "07:30 PM - 09:30 PM", title: "Open Networking & Canapes", sub: "Connect with buyers, sellers & agents", tag: "Networking" }
    ]},
    speakers: [
      { name: "Rith Phea", title: "Market Research Director", company: "CBRE Cambodia" }
    ],
    venue: { name: "Rosewood Sky Lounge", address: "Phnom Penh, Cambodia", parking: true, accessibility: true }
  },
  {
    id: 50, title: "International Business Community Sundowner", category: "Networking",
    date: "November 19, 2026", location: "Plantation Urban Resort, Phnom Penh",
    price: 18, capacity: 250, attending: 188, rating: 4.7,
    image: "/assets/images/Networking.jpg",
    description: "Monthly sundowner for the international business community in Phnom Penh. Expats, diplomats, and local professionals come together in a relaxed garden setting.",
    highlights: ["Pool garden setting","90+ nationalities attending","Chamber of Commerce updates","Business card tombola prizes"],
    agenda: { day1: [
      { time: "05:30 PM - 06:00 PM", title: "Welcome & Registration", sub: "Collect your badge & first drink", tag: "Arrival" },
      { time: "06:00 PM - 07:00 PM", title: "Chamber of Commerce Briefing", sub: "Business news & updates", tag: "Briefing" },
      { time: "07:00 PM - 09:00 PM", title: "Open Networking", sub: "Sundowner drinks in the garden", tag: "Networking" }
    ]},
    speakers: [
      { name: "Pierre Collin", title: "President", company: "EuroCham Cambodia" }
    ],
    venue: { name: "Plantation Urban Resort Garden", address: "Phnom Penh, Cambodia", parking: true, accessibility: true }
  },

  // â”€â”€ Healthcare (IDs 51-57) â”€â”€
  {
    id: 51, title: "Mental Health Awareness Conference", category: "Healthcare",
    date: "August 14, 2026", location: "Kirirom Institute, Phnom Penh",
    price: 15, capacity: 200, attending: 168, rating: 4.8,
    image: "/assets/images/healthcare-2.jpg",
    description: "Breaking the stigma around mental health in Cambodia. Expert talks, peer support workshops, and resources for students, professionals, and families.",
    highlights: ["Stigma-reduction workshops","Mindfulness & stress sessions","Peer support training","Crisis helpline resources"],
    agenda: { day1: [
      { time: "09:00 AM - 10:00 AM", title: "Mental Health in Cambodia Today", sub: "Statistics, stigma & progress", tag: "Keynote" },
      { time: "10:15 AM - 12:00 PM", title: "Mindfulness & Stress Reduction", sub: "Evidence-based techniques", tag: "Workshop" },
      { time: "01:30 PM - 03:00 PM", title: "Peer Support Training", sub: "How to help friends in crisis", tag: "Training" },
      { time: "03:15 PM - 04:30 PM", title: "Mental Health Policy in SEA", sub: "Progress & advocacy", tag: "Panel" }
    ]},
    speakers: [
      { name: "Dr. Chhim Sotheara", title: "Psychiatrist", company: "TPO Cambodia" },
      { name: "Mina Phal", title: "Psychologist", company: "Mental Health Cambodia" }
    ],
    venue: { name: "Kirirom Conference Center", address: "Phnom Penh, Cambodia", parking: true, accessibility: true }
  },
  {
    id: 52, title: "Nutrition & Healthy Living Expo", category: "Healthcare",
    date: "August 29, 2026", location: "Aeon Mall 2, Phnom Penh",
    price: 0, capacity: 500, attending: 423, rating: 4.5,
    image: "/assets/images/healthcare-3.jpg",
    description: "A free public health expo with free screenings, cooking demos, nutrition consultations, and talks from registered dietitians and doctors.",
    highlights: ["Free health screenings","Healthy cooking demonstrations","Dietitian consultations","Child nutrition zone"],
    agenda: { day1: [
      { time: "10:00 AM - 11:00 AM", title: "Opening: Nutrition for Cambodia", sub: "Healthy food systems overview", tag: "Keynote" },
      { time: "11:00 AM - 04:00 PM", title: "Expo Booths & Screenings", sub: "BMI, blood pressure, sugar checks", tag: "Expo" },
      { time: "12:00 PM - 01:00 PM", title: "Healthy Khmer Cooking Demo", sub: "Nutritious traditional recipes", tag: "Demo" },
      { time: "02:00 PM - 03:00 PM", title: "Child Nutrition Workshop", sub: "Feeding children 0-5 years", tag: "Workshop" }
    ]},
    speakers: [
      { name: "Dr. Phalla Meas", title: "Nutritionist", company: "National Institute of Public Health" }
    ],
    venue: { name: "Aeon Mall 2 Event Hall", address: "Phnom Penh, Cambodia", parking: true, accessibility: true }
  },
  {
    id: 53, title: "Yoga & Wellness Retreat Weekend", category: "Healthcare",
    date: "September 19, 2026", location: "Phnom Bakheng, Siem Reap",
    price: 85, capacity: 40, attending: 36, rating: 4.9,
    image: "/assets/images/healthcare-4.jpg",
    description: "A restorative 2-day wellness retreat combining yoga, meditation, sound healing, and Ayurvedic nutrition in the serene setting near Angkor Wat.",
    highlights: ["Morning yoga at sunrise","Sound bath meditation","Ayurvedic meal plan","Temple sunrise tour"],
    agenda: { day1: [
      { time: "06:00 AM - 07:30 AM", title: "Sunrise Yoga Session", sub: "Facing Angkor Wat at dawn", tag: "Yoga" },
      { time: "08:00 AM - 09:00 AM", title: "Ayurvedic Breakfast", sub: "Mindful eating workshop", tag: "Nutrition" },
      { time: "10:00 AM - 12:00 PM", title: "Deep Stretching & Pranayama", sub: "Breathwork & flexibility", tag: "Yoga" },
      { time: "03:00 PM - 04:30 PM", title: "Sound Bath Meditation", sub: "Tibetan singing bowls session", tag: "Meditation" }
    ]},
    speakers: [
      { name: "Maya Devi", title: "Yoga Teacher (RYT 500)", company: "Lotus Yoga Siem Reap" }
    ],
    venue: { name: "Phnom Bakheng Retreat Center", address: "Siem Reap, Cambodia", parking: true, accessibility: false }
  },
  {
    id: 54, title: "Women's Health Symposium", category: "Healthcare",
    date: "October 7, 2026", location: "Calmette Hospital, Phnom Penh",
    price: 10, capacity: 300, attending: 245, rating: 4.7,
    image: "/assets/images/healthcare-5.jpg",
    description: "A dedicated health symposium addressing reproductive health, maternal care, breast cancer awareness, and women's wellbeing in Cambodia.",
    highlights: ["Free breast cancer screening","Maternal health workshop","Reproductive health Q&A","Cervical cancer vaccination info"],
    agenda: { day1: [
      { time: "09:00 AM - 10:00 AM", title: "Women's Health in Cambodia 2026", sub: "Key indicators & challenges", tag: "Keynote" },
      { time: "10:15 AM - 12:00 PM", title: "Maternal & Newborn Health", sub: "Antenatal care best practices", tag: "Workshop" },
      { time: "01:30 PM - 03:00 PM", title: "Cancer Screening & Prevention", sub: "Breast & cervical cancer focus", tag: "Lecture" },
      { time: "03:00 PM - 05:00 PM", title: "Free Health Screenings", sub: "Blood pressure, BMI & more", tag: "Screening" }
    ]},
    speakers: [
      { name: "Dr. Sophanny Sok", title: "OB/GYN Specialist", company: "Calmette Hospital" },
      { name: "Channary Heng", title: "Public Health Officer", company: "WHO Cambodia" }
    ],
    venue: { name: "Calmette Hospital Conference Center", address: "Phnom Penh, Cambodia", parking: true, accessibility: true }
  },
  {
    id: 55, title: "Traditional & Modern Medicine Forum", category: "Healthcare",
    date: "October 24, 2026", location: "National Center for Traditional Medicine, Phnom Penh",
    price: 20, capacity: 150, attending: 112, rating: 4.6,
    image: "/assets/images/healthcare-6.jpg",
    description: "Bridging traditional Khmer healing practices with modern medical science. Includes herbal medicine research, acupuncture demos, and integrative health approaches.",
    highlights: ["Herbal medicine research updates","Acupuncture live demonstration","Integrative health case studies","Traditional remedy safety guide"],
    agenda: { day1: [
      { time: "09:00 AM - 10:00 AM", title: "Traditional Medicine Heritage", sub: "Khmer healing through the ages", tag: "Keynote" },
      { time: "10:15 AM - 12:00 PM", title: "Herbal Medicine Research", sub: "Evidence-based traditional remedies", tag: "Lecture" },
      { time: "01:30 PM - 03:00 PM", title: "Acupuncture & Massage Demo", sub: "Live treatment demonstrations", tag: "Demo" },
      { time: "03:15 PM - 04:30 PM", title: "Integrative Medicine Panel", sub: "Combining East & West", tag: "Panel" }
    ]},
    speakers: [
      { name: "Dr. Vann Molyvann", title: "Traditional Medicine Director", company: "NCTM Cambodia" }
    ],
    venue: { name: "National Center for Traditional Medicine", address: "Phnom Penh, Cambodia", parking: true, accessibility: true }
  },
  {
    id: 56, title: "Occupational Health & Workplace Safety Summit", category: "Healthcare",
    date: "November 10, 2026", location: "Parkway Square, Phnom Penh",
    price: 40, capacity: 200, attending: 148, rating: 4.5,
    image: "/assets/images/healthcare-7.jpg",
    description: "Equipping HR professionals, managers, and safety officers with best practices in occupational health, ergonomics, and mental wellness at work.",
    highlights: ["Ergonomics assessment workshop","Mental wellness at work program","First aid & emergency training","Legal compliance update"],
    agenda: { day1: [
      { time: "09:00 AM - 10:00 AM", title: "Workplace Health in Cambodia", sub: "Legal framework & compliance", tag: "Keynote" },
      { time: "10:15 AM - 12:00 PM", title: "Ergonomics Workshop", sub: "Assess & fix workplace posture issues", tag: "Workshop" },
      { time: "01:30 PM - 03:00 PM", title: "Mental Wellness at Work", sub: "Building psychologically safe teams", tag: "Workshop" },
      { time: "03:15 PM - 04:30 PM", title: "First Aid Certification Session", sub: "Basic life support training", tag: "Training" }
    ]},
    speakers: [
      { name: "Samnang Phy", title: "OHS Consultant", company: "ILO Cambodia" },
      { name: "Tararith Kang", title: "EAP Specialist", company: "WorkWell Asia" }
    ],
    venue: { name: "Parkway Square Conference Room", address: "Phnom Penh, Cambodia", parking: true, accessibility: true }
  },
  {
    id: 57, title: "Healthcare Technology Innovation Day", category: "Healthcare",
    date: "November 26, 2026", location: "Calmette Innovation Center, Phnom Penh",
    price: 45, capacity: 180, attending: 132, rating: 4.7,
    image: "/assets/images/Healthcare-Events.webp",
    description: "Exploring how AI diagnostics, telemedicine, wearable health tech, and digital health records are transforming healthcare delivery in Cambodia.",
    highlights: ["AI diagnostics live demos","Telemedicine platform showcase","Health wearables exhibition","Digital health policy panel"],
    agenda: { day1: [
      { time: "09:00 AM - 10:00 AM", title: "Digital Health in SEA 2026", sub: "Trends, adoption & barriers", tag: "Keynote" },
      { time: "10:15 AM - 12:00 PM", title: "AI Diagnostics Showcase", sub: "X-ray, ECG & skin AI tools", tag: "Demo" },
      { time: "01:30 PM - 03:00 PM", title: "Telemedicine Best Practices", sub: "Building trust in virtual care", tag: "Workshop" },
      { time: "03:15 PM - 04:30 PM", title: "Digital Health Policy Roundtable", sub: "Regulation, data & equity", tag: "Panel" }
    ]},
    speakers: [
      { name: "Dr. Lida Prum", title: "Health Technology Advisor", company: "WHO Digital Health" },
      { name: "Sopheap Tan", title: "Telemedicine CEO", company: "ClinicKH" }
    ],
    venue: { name: "Calmette Innovation Center", address: "Phnom Penh, Cambodia", parking: true, accessibility: true }
  },

  // â”€â”€ Sports (IDs 58-64) â”€â”€
  {
    id: 58, title: "Phnom Penh Half Marathon", category: "Sports",
    date: "August 16, 2026", location: "Olympic Stadium, Phnom Penh",
    price: 20, capacity: 3000, attending: 2756, rating: 4.8,
    image: "/assets/images/Sport1.2.jpg",
    description: "Run through the heart of Phnom Penh in this scenic 21km city half marathon. Flat course through historic landmarks, suitable for all ability levels.",
    highlights: ["21km scenic city route","Timing chip & finisher medal","Aid stations every 3km","Post-race recovery zone"],
    agenda: { day1: [
      { time: "05:00 AM - 05:45 AM", title: "Registration & Bib Collection", sub: "Olympic Stadium gates open", tag: "Preparation" },
      { time: "06:00 AM - 06:15 AM", title: "Opening Ceremony & Warm-up", sub: "Official race briefing", tag: "Ceremony" },
      { time: "06:15 AM - 09:30 AM", title: "Race: Half Marathon 21km", sub: "Start gun at 06:15 AM", tag: "Race" },
      { time: "09:30 AM - 11:00 AM", title: "Finisher Zone & Awards", sub: "Medals, photos & recovery", tag: "Awards" }
    ]},
    speakers: [
      { name: "Hem Bunting", title: "National Marathon Champion", company: "Cambodia Athletics Federation" }
    ],
    venue: { name: "Olympic Stadium Start Line", address: "Phnom Penh, Cambodia", parking: true, accessibility: true }
  },
  {
    id: 59, title: "Basketball 3x3 Street Tournament", category: "Sports",
    date: "September 5, 2026", location: "Wat Phnom Sports Court, Phnom Penh",
    price: 8, capacity: 500, attending: 380, rating: 4.6,
    image: "/assets/images/Sport1.5.webp",
    description: "Weekend 3-on-3 basketball tournament in the open air near Wat Phnom. Teams of all skill levels welcome. Cash prizes for top finishers.",
    highlights: ["Open-air tournament","All skill levels welcome","$1,500 prize pool","Live DJ & food trucks"],
    agenda: { day1: [
      { time: "08:00 AM - 09:00 AM", title: "Team Check-in & Draw", sub: "Draw ceremony & warm-ups", tag: "Setup" },
      { time: "09:00 AM - 12:00 PM", title: "Group Stage Games", sub: "Round robin â€” all teams play", tag: "Competition" },
      { time: "01:00 PM - 03:00 PM", title: "Quarter & Semi Finals", sub: "Top 8 teams advance", tag: "Competition" },
      { time: "03:30 PM - 05:00 PM", title: "Final & Awards Ceremony", sub: "Champion crowned & prizes awarded", tag: "Final" }
    ]},
    speakers: [
      { name: "Chanda Mao", title: "Basketball Coach", company: "Cambodia Basketball Association" }
    ],
    venue: { name: "Wat Phnom Street Courts", address: "Phnom Penh, Cambodia", parking: false, accessibility: true }
  },
  {
    id: 60, title: "Muay Thai & Khmer Boxing Championship", category: "Sports",
    date: "September 26, 2026", location: "Phnom Penh Sports Complex",
    price: 12, capacity: 1500, attending: 1320, rating: 4.9,
    image: "/assets/images/Sport1.7.jpg",
    description: "Premier combat sports evening featuring Pradal Serey (Khmer boxing) and Muay Thai bouts. International fighters and rising Cambodian champions compete.",
    highlights: ["12 championship bouts","Khmer & Muay Thai combined card","International fighters","VIP ringside packages"],
    agenda: { day1: [
      { time: "05:00 PM - 06:00 PM", title: "Doors Open & Undercard Bouts", sub: "6 preliminary fights", tag: "Undercard" },
      { time: "06:30 PM - 08:30 PM", title: "Main Card Fights", sub: "4 championship bouts", tag: "Main Event" },
      { time: "09:00 PM - 10:00 PM", title: "Main Event & Championship", sub: "Title fight â€” Pradal Serey", tag: "Championship" }
    ]},
    speakers: [
      { name: "Kun Khmer Federation", title: "Sports Body", company: "Cambodia Pradal Serey Federation" }
    ],
    venue: { name: "Phnom Penh Sports Complex Arena", address: "Phnom Penh, Cambodia", parking: true, accessibility: true }
  },
  {
    id: 61, title: "Youth Football Skills Camp", category: "Sports",
    date: "October 10, 2026", location: "Olympic Stadium Training Ground, Phnom Penh",
    price: 15, capacity: 100, attending: 88, rating: 4.7,
    image: "/assets/images/Sport1.8.webp",
    description: "A 3-day football skills camp for youth aged 10-18. Coached by professional players and certified UEFA coaches. All skill levels welcome.",
    highlights: ["UEFA certified coaches","Technical skills drills","Tactical game sessions","Talent identification program"],
    agenda: { day1: [
      { time: "07:00 AM - 07:30 AM", title: "Registration & Warm-up", sub: "Dynamic stretching & team intro", tag: "Warm-up" },
      { time: "07:30 AM - 10:00 AM", title: "Technical Skills: Passing & Control", sub: "Ball mastery drills", tag: "Training" },
      { time: "10:30 AM - 12:00 PM", title: "Small-Sided Games", sub: "4v4 & 7v7 competitive play", tag: "Games" },
      { time: "03:00 PM - 04:30 PM", title: "Tactical Workshop", sub: "Formations & set pieces", tag: "Tactics" }
    ]},
    speakers: [
      { name: "Samnang Mith", title: "Head Coach", company: "Cambodia National Youth Football" }
    ],
    venue: { name: "Olympic Stadium Training Ground", address: "Phnom Penh, Cambodia", parking: true, accessibility: true }
  },
  {
    id: 62, title: "Open Water Swimming Challenge", category: "Sports",
    date: "October 25, 2026", location: "Tonle Sap Lake, Kampong Chhnang",
    price: 18, capacity: 200, attending: 154, rating: 4.6,
    image: "/assets/images/Sport%20event.jpg",
    description: "A scenic open water swimming race across a 2km and 5km course in the calm waters of Tonle Sap Lake. Kayak safety escorts provided.",
    highlights: ["2km & 5km race distances","Safety kayak escorts","Finisher medal & t-shirt","Post-race riverbank party"],
    agenda: { day1: [
      { time: "06:00 AM - 06:45 AM", title: "Registration & Safety Briefing", sub: "Mandatory safety instructions", tag: "Briefing" },
      { time: "07:00 AM - 08:00 AM", title: "2km Race", sub: "All categories compete", tag: "Race" },
      { time: "08:30 AM - 10:30 AM", title: "5km Race", sub: "Advanced swimmers", tag: "Race" },
      { time: "11:00 AM - 01:00 PM", title: "Awards & Riverbank Party", sub: "Medals, food & music", tag: "Awards" }
    ]},
    speakers: [
      { name: "Channath Ouk", title: "Swimming Coach", company: "Cambodia Aquatics Federation" }
    ],
    venue: { name: "Tonle Sap Lakeshore, Kampong Chhnang", address: "Kampong Chhnang, Cambodia", parking: true, accessibility: false }
  },
  {
    id: 63, title: "Cycling Gran Fondo: Angkor Route", category: "Sports",
    date: "November 15, 2026", location: "Angkor Wat, Siem Reap",
    price: 35, capacity: 400, attending: 312, rating: 4.8,
    image: "/assets/images/Sport%20run.webp",
    description: "A spectacular 80km or 40km cycling route around the temples of Angkor. Suitable for road and gravel bikes. Medical support and aid stations included.",
    highlights: ["80km & 40km route options","Ride past 12 temple sites","Timing chip & finisher jersey","Professional photography on route"],
    agenda: { day1: [
      { time: "05:30 AM - 06:00 AM", title: "Bike Check & Registration", sub: "Ensure bike safety before start", tag: "Setup" },
      { time: "06:00 AM - 06:15 AM", title: "Race Start Ceremony", sub: "Flag off at Angkor Wat gates", tag: "Start" },
      { time: "06:15 AM - 11:00 AM", title: "Gran Fondo Race", sub: "80km route â€” aim to finish by 11 AM", tag: "Race" },
      { time: "11:00 AM - 01:00 PM", title: "Finish Line Celebration", sub: "Medals, photos & recovery meal", tag: "Finish" }
    ]},
    speakers: [
      { name: "Pierre Blanc", title: "Event Director", company: "Gran Fondo SEA" }
    ],
    venue: { name: "Angkor Wat Causeway Start", address: "Siem Reap, Cambodia", parking: true, accessibility: false }
  },
  {
    id: 64, title: "Community Sports Day Festival", category: "Sports",
    date: "December 6, 2026", location: "Chroy Changvar Park, Phnom Penh",
    price: 5, capacity: 800, attending: 620, rating: 4.7,
    image: "/assets/images/Sport1.1.jpg",
    description: "A fun-filled community sports festival for all ages. Activities include fun runs, tug-of-war, volleyball, badminton, and children's athletic races.",
    highlights: ["10+ sports activities","Children's fun run","Family team competitions","Food & games village"],
    agenda: { day1: [
      { time: "07:00 AM - 08:00 AM", title: "Registration & Warm-Up", sub: "All participants & family teams", tag: "Setup" },
      { time: "08:00 AM - 10:00 AM", title: "Morning Sports Rounds", sub: "Volleyball, badminton & fun run", tag: "Sports" },
      { time: "10:30 AM - 12:00 PM", title: "Children's Athletic Events", sub: "Races for ages 5-14", tag: "Kids" },
      { time: "01:00 PM - 03:00 PM", title: "Team Finals & Tug-of-War", sub: "Championship rounds", tag: "Finals" },
      { time: "03:30 PM - 04:30 PM", title: "Awards & Closing Ceremony", sub: "Trophies & community celebration", tag: "Ceremony" }
    ]},
    speakers: [
      { name: "Sophea Kang", title: "Community Sports Coordinator", company: "Phnom Penh Municipality" }
    ],
    venue: { name: "Chroy Changvar Riverside Park", address: "Phnom Penh, Cambodia", parking: true, accessibility: true }
  },
];
