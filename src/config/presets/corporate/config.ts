import { defineConfig } from "../../schema";

/**
 * Example: an internal corporate innovation challenge. Business sponsors post
 * challenges, employees submit ideas (optionally as teams), AI scores them
 * for strategic fit / value / feasibility / novelty, and sponsors "back" the
 * ideas they will fund. Company and content are fictional.
 */
export default defineConfig({
  id: "corporate",
  branding: {
    name: "Larkspur Idea Exchange",
    tagline: "Every team has the next big idea. Let's find it.",
    description: "An internal innovation challenge platform: sponsors post business challenges, employees pitch ideas, AI triages, sponsors back the best.",
    logoText: "LX",
    primaryColor: "#7c3aed",
    accentColor: "#db2777",
    hero: {
      title: "Got an idea that could change how we work?",
      subtitle: "Business sponsors post the challenges they would fund. Pitch an idea in ten minutes, get an instant AI review, and get backed.",
      primaryCta: "See open challenges",
      secondaryCta: "Sponsor a challenge",
    },
    footer: { text: "Larkspur Logistics is a fictional company used for this demo." },
    keywords: ["intrapreneurship", "corporate innovation", "idea management"],
  },
  terminology: {
    challenge: { singular: "Challenge", plural: "Challenges" },
    submission: { singular: "Idea", plural: "Ideas" },
    category: { singular: "Business unit", plural: "Business units" },
    endorsement: { verb: "Back", past: "Backed", noun: "Backing" },
    upvote: { verb: "Like", noun: "Likes" },
    reward: "Funding available",
    deadline: "Closes",
  },
  roles: {
    owner: { label: "Sponsor", plural: "Sponsors", description: "Leaders with budget who post challenges." },
    solver: { label: "Contributor", plural: "Contributors", description: "Any employee." },
  },
  permissions: { submit: ["solver", "owner"], endorse: "challenge-owner" },
  auth: {
    signupRoles: ["solver"],
    // Lock sign-ups to company addresses in a real deployment:
    allowedEmailDomains: [],
  },
  categories: ["Operations", "Customer experience", "Sustainability", "People & culture", "Finance", "Technology"],
  challenge: {
    stages: [
      { key: "draft", label: "Draft", public: false },
      { key: "open", label: "Accepting ideas", acceptsSubmissions: true, tone: "success" },
      { key: "evaluation", label: "Evaluation", tone: "warning" },
      { key: "decided", label: "Decided", tone: "info" },
    ],
    defaultStage: "draft",
    fields: [
      { key: "success_metric", label: "How we will measure success", type: "text", required: true, showOnCard: true },
      { key: "budget_band", label: "Budget band", type: "select", options: ["< 10k", "10k-50k", "50k-250k", "> 250k"] },
    ],
  },
  submission: {
    summaryLabel: "The idea in a paragraph",
    summaryMinLength: 60,
    fields: [
      { key: "problem", label: "Problem it solves", type: "textarea", required: true, min: 30 },
      { key: "expected_value", label: "Expected value", type: "text", help: "Savings, revenue, NPS, hours saved...", showOnCard: true },
      { key: "effort", label: "Effort to pilot", type: "select", required: true, options: ["Days", "Weeks", "Months", "Quarters"] },
      { key: "team", label: "Team members", type: "tags", placeholder: "Comma-separated names" },
      { key: "needs_it", label: "Needs IT support", type: "boolean" },
    ],
    statuses: [
      { key: "new", label: "New", notifyAuthor: false },
      { key: "shortlisted", label: "Shortlisted", tone: "info" },
      { key: "pilot", label: "Pilot approved", tone: "success" },
      { key: "parked", label: "Parked", tone: "warning" },
      { key: "declined", label: "Declined", tone: "danger" },
    ],
    defaultStatus: "new",
    visibility: "public",
    maxPerSolverPerChallenge: 5,
  },
  evaluation: {
    trigger: "on-submit",
    visibility: "owner-and-author",
    persona: "You are a pragmatic innovation-portfolio analyst at a mid-sized logistics company. You triage employee ideas so sponsors can spend their limited time on the most promising ones.",
    criteria: [
      { key: "strategic_fit", label: "Strategic fit", description: "How well the idea addresses the stated challenge and success metric.", weight: 3 },
      { key: "value", label: "Value", description: "Size and credibility of the expected benefit.", weight: 3 },
      { key: "feasibility", label: "Feasibility", description: "Can a small team pilot it with the stated effort?", weight: 2 },
      { key: "novelty", label: "Novelty", description: "Is it meaningfully different from the obvious or existing approach?", weight: 1 },
    ],
    instructions: ["Penalise ideas whose expected value is asserted without any reasoning.", "Be encouraging in tone: these are colleagues, not vendors."],
    flags: ["needs_detail", "duplicate"],
    summary: { label: "Analyst note", maxLength: 250 },
  },
});
