import { defineSeed } from "../../seed-types";

// Entirely fictional company, people and ideas.
export default defineSeed({
  users: [
    { key: "o1", name: "Dana Whitlock", email: "dana.whitlock@example.com", role: "owner", organization: "Larkspur Logistics - Operations" },
    { key: "o2", name: "Ravi Castellan", email: "ravi.castellan@example.com", role: "owner", organization: "Larkspur Logistics - Sustainability" },
    { key: "s1", name: "June Ferreira", email: "june.ferreira@example.com", role: "solver", organization: "Warehouse North", bio: "Shift lead, forklift whisperer." },
    { key: "s2", name: "Oskar Lindqvist", email: "oskar.lindqvist@example.com", role: "solver", organization: "Data team" },
    { key: "s3", name: "Amara Nwosu", email: "amara.nwosu@example.com", role: "solver", organization: "Customer care" },
  ],
  challenges: [
    {
      key: "c1",
      ownerKey: "o1",
      title: "Cut dock-to-stock time in our warehouses",
      summary: "Inbound pallets wait an average of 6 hours between unloading and put-away.",
      description: "We want ideas that shrink the gap between a truck arriving and stock being available to pick. Process, layout, tooling and software ideas all welcome.",
      category: "Operations",
      stage: "open",
      deadlineInDays: 21,
      reward: "Up to 40k for a 3-month pilot",
      featured: true,
      fields: { success_metric: "Median dock-to-stock under 2 hours", budget_band: "10k-50k" },
    },
    {
      key: "c2",
      ownerKey: "o2",
      title: "Halve single-use packaging on returns",
      summary: "Returns generate a surprising amount of wrap, tape and void fill.",
      description: "Ideas for reusable or reduced packaging in the returns flow, without increasing damage rates.",
      category: "Sustainability",
      stage: "open",
      deadlineInDays: 45,
      reward: "Up to 25k",
      fields: { success_metric: "50% less single-use material per returned parcel", budget_band: "10k-50k" },
    },
  ],
  submissions: [
    {
      challengeKey: "c1",
      authorKey: "s1",
      title: "Put-away by zone wave instead of by truck",
      summary: "Sort pallets on the dock by destination zone and release a put-away wave every 30 minutes, so forklifts stop crossing the whole building for each pallet.",
      fields: { problem: "Forklifts travel the full aisle length for every pallet because we put away in truck order.", expected_value: "~35% fewer forklift kilometres; dock-to-stock under 3h", effort: "Weeks", team: ["June Ferreira", "Night shift crew"], needs_it: false },
      status: "shortlisted",
      endorsedBy: ["o1"],
      upvotedBy: ["s2", "s3"],
    },
    {
      challengeKey: "c1",
      authorKey: "s2",
      title: "Predict arrival content from advance shipping notices",
      summary: "Use supplier shipping notices to pre-assign put-away locations before the truck arrives.",
      fields: { problem: "Locations are chosen only after the pallet is scanned.", expected_value: "Removes ~1h of decision time per truck", effort: "Months", needs_it: true },
      upvotedBy: ["s1"],
    },
    {
      challengeKey: "c2",
      authorKey: "s3",
      title: "Reusable returns satchel with a tamper seal",
      summary: "Ship outbound orders in a satchel that customers can reseal and reuse for the return.",
      fields: { problem: "Customers repack returns in whatever they have, often with lots of tape and fill.", expected_value: "Fewer damaged returns and less waste", effort: "Weeks" },
    },
  ],
});
