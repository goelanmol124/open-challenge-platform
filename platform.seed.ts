/**
 * Demo data for platform.config.ts (loaded by `npm run db:seed` when the
 * preset is "custom"). Replace or delete freely. All content is fictional.
 */
import { defineSeed } from "./src/config/seed-types";

export default defineSeed({
  users: [
    { key: "o1", name: "Greenfield Foundation", email: "host@greenfield.example", role: "owner", organization: "Greenfield Foundation" },
    { key: "s1", name: "Alex Rivera", email: "alex.rivera@example.com", role: "solver", bio: "Full-stack developer.", profile: { skills: ["TypeScript", "Postgres"] } },
    { key: "s2", name: "Sam Okoye", email: "sam.okoye@example.com", role: "solver", bio: "Data scientist.", profile: { skills: ["Python", "ML"] } },
  ],
  challenges: [
    {
      key: "c1",
      ownerKey: "o1",
      title: "Help small farms predict frost the night before",
      summary: "Small growers lose crops to unexpected frost. Build a low-cost early warning.",
      description:
        "Growers in our fictional valley rely on regional forecasts that miss local cold pockets.\n\n**Looking for:** something a farm can set up in an afternoon for under 200.",
      category: "Climate",
      stage: "open",
      deadlineInDays: 28,
      reward: "5,000 + mentoring",
      featured: true,
      fields: { team_size: 4, eligibility: "Anyone, anywhere" },
    },
    {
      key: "c2",
      ownerKey: "o1",
      title: "Make clinic wait times visible to patients",
      summary: "Patients at walk-in clinics have no idea how long they'll wait.",
      description: "Design a way for community clinics to publish live wait estimates without new hardware.",
      category: "Health",
      stage: "open",
      deadlineInDays: 14,
      reward: "3,000",
      fields: { team_size: 3 },
    },
  ],
  submissions: [
    {
      challengeKey: "c1",
      authorKey: "s1",
      title: "Frostline: 3 sensors + a text message",
      summary:
        "Three cheap temperature/humidity sensors placed in the lowest points of a field, a dew-point model, and an SMS alert when frost risk crosses a threshold overnight.",
      fields: { stage: "Prototype", details: "ESP32 sensors -> LoRa gateway -> tiny server -> SMS.", tech: ["ESP32", "LoRa", "TypeScript"], repo_url: "https://example.com/code/frostline" },
      status: "shortlisted",
      endorsedBy: ["o1"],
      upvotedBy: ["s2"],
    },
    {
      challengeKey: "c1",
      authorKey: "s2",
      title: "Hyper-local frost model from public weather data",
      summary: "A model that corrects the regional forecast with terrain features so each farm gets its own frost probability, no hardware required.",
      fields: { stage: "Idea", tech: ["Python", "ML"] },
      upvotedBy: ["s1"],
    },
    {
      challengeKey: "c2",
      authorKey: "s1",
      title: "Queue number SMS with live estimate",
      summary: "Front desk enters a patient in a tablet queue; patient gets an SMS link that shows their position and an estimate based on recent consult times.",
      fields: { stage: "Working product", tech: ["Next.js"] },
    },
  ],
});
