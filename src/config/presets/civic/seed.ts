import { defineSeed } from "../../seed-types";

// Entirely fictional people, places and problems.
export default defineSeed({
  users: [
    { key: "o1", name: "Councillor Mara Quill", email: "mara.quill@example.org", role: "owner", organization: "Riverton City Council", profile: { designation: "Ward Councillor", jurisdiction: "Ward 7" } },
    { key: "o2", name: "Deputy Director Ines Halloway", email: "ines.halloway@example.org", role: "owner", organization: "Riverton Water Board", profile: { designation: "Deputy Director", jurisdiction: "City-wide" } },
    { key: "s1", name: "Theo Brandt", email: "theo.brandt@example.com", role: "solver", bio: "Embedded-systems engineer who likes sensors more than people.", profile: { background: "Professional", skills: ["IoT", "LoRaWAN", "Python"] } },
    { key: "s2", name: "Priya Okafor", email: "priya.okafor@example.com", role: "solver", bio: "Urban-planning student.", profile: { background: "Student", skills: ["GIS", "Surveys"] } },
    { key: "s3", name: "Lumen Works Co-op", email: "hello@lumenworks.example", role: "solver", bio: "A small civic-tech cooperative.", profile: { background: "Startup", skills: ["Next.js", "Mobile", "Open data"] } },
  ],
  challenges: [
    {
      key: "c1",
      ownerKey: "o2",
      title: "Detect water-main leaks before the street floods",
      summary: "We lose an estimated fifth of treated water to leaks we only find when they surface.",
      description:
        "## Context\nRiverton's distribution network is 60+ years old in places. Leaks are found when residents report puddles, often weeks after they start.\n\n## What we want\n- Earlier detection (days, not weeks)\n- Something our two-person maintenance team can actually operate\n- Data we can feed into our existing asset register (CSV is fine)",
      category: "Water",
      stage: "open",
      deadlineInDays: 30,
      reward: "Paid pilot in one district + engineering support",
      featured: true,
      fields: { location: "Old Market district", people_affected: 42000, constraints: "- Pilot budget is small\n- No digging permits for sensor installs this year" },
    },
    {
      key: "c2",
      ownerKey: "o1",
      title: "Make the night bus feel safe to wait for",
      summary: "Ridership after 10pm has dropped and surveys say waiting at stops feels unsafe.",
      description:
        "Ward 7 has 14 night-bus stops. We want ideas that make waiting feel safer without turning stops into surveillance zones.\n\nLighting, information, community approaches and design changes are all welcome.",
      category: "Transport",
      stage: "open",
      deadlineInDays: 12,
      reward: "Council-funded trial at 3 stops",
      fields: { location: "Ward 7", people_affected: 9000 },
    },
    {
      key: "c3",
      ownerKey: "o1",
      title: "Reduce missed bulky-waste pickups",
      summary: "One in four bulky-waste bookings ends in a missed or wasted trip.",
      description: "Residents book a slot, then the item isn't out, or the truck can't access the street. We'd like fewer wasted trips.",
      category: "Waste",
      stage: "review",
      deadlineInDays: -5,
      fields: { location: "City-wide" },
    },
  ],
  submissions: [
    {
      challengeKey: "c1",
      authorKey: "s1",
      title: "Acoustic leak loggers on hydrant caps",
      summary:
        "Clip-on acoustic loggers mounted on existing hydrants listen for the hiss of pressurised leaks overnight and upload a nightly noise profile over LoRaWAN. No digging needed; a dashboard ranks street segments by leak likelihood.",
      fields: {
        maturity: "Prototype",
        approach: "1. Mount loggers on 40 hydrants in the district.\n2. Record 2am-4am when demand is lowest.\n3. Correlate noise between neighbouring loggers to localise leaks to ~50 m.\n4. Export weekly CSV for the asset register.",
        cost_estimate: "About 9,000 for 40 loggers plus a gateway",
        technologies: ["LoRaWAN", "Python", "Signal processing"],
        demo_url: "https://example.com/demo/hydrant-loggers",
        contact_phone: "555-0101",
      },
      status: "shortlisted",
      endorsedBy: ["o2"],
      upvotedBy: ["s2", "s3"],
    },
    {
      challengeKey: "c1",
      authorKey: "s3",
      title: "Night-flow analysis from existing district meters",
      summary:
        "Use the district metering data the Water Board already collects to compute minimum night flow per zone and flag zones where it creeps up. Software only; starts from data you already have.",
      fields: { maturity: "Deployed elsewhere", approach: "Ingest meter exports, compute rolling minimum night flow, alert when a zone exceeds its baseline by a configurable margin.", technologies: ["Next.js", "PostgreSQL"] },
      upvotedBy: ["s1"],
    },
    {
      challengeKey: "c2",
      authorKey: "s2",
      title: "Live arrival screens plus 'request-a-stop' for late buses",
      summary:
        "Add real-time arrival displays to the 5 least-busy stops and let late-night riders request drop-off between stops, so less time is spent waiting alone.",
      fields: { maturity: "Idea", approach: "Pilot screens at 5 stops; add a between-stops drop-off policy after 10pm, publicised on the screens.", cost_estimate: "Screens ~2,500 each" },
      upvotedBy: ["s1", "s3"],
    },
    {
      challengeKey: "c3",
      authorKey: "s3",
      title: "Photo check-in the evening before pickup",
      summary: "An SMS link asks residents to snap a photo of the item at the kerb the evening before. No photo by 8am means the slot is released.",
      fields: { maturity: "Prototype", approach: "SMS reminder with upload link; route optimiser skips unconfirmed slots.", technologies: ["SMS", "Route optimisation"] },
      status: "invited",
      endorsedBy: ["o1"],
    },
  ],
});
