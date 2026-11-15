/**
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  THIS IS THE FILE YOU EDIT.                                              │
 * │                                                                          │
 * │  It is used when NEXT_PUBLIC_PLATFORM_PRESET is "custom" (the default).  │
 * │  Every label, role, form field, stage, status, scoring criterion and     │
 * │  the AI prompt comes from here. Run `npm run config:check` after edits.  │
 * │  Full reference: docs/CONFIGURATION.md                                   │
 * │  More examples:  src/config/presets/{civic,corporate,research}           │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * This default is a general open-innovation / hackathon setup.
 */
import { defineConfig } from "./src/config/schema";

export default defineConfig({
  id: "custom",

  branding: {
    name: "Open Challenge Platform",
    tagline: "Post a problem. Get solutions. Let AI help you pick.",
    description:
      "An open innovation challenge platform: hosts post problems, solvers submit solutions, AI evaluates every submission against a transparent rubric, and hosts endorse the best.",
    logoText: "OC",
    primaryColor: "#2563eb",
    accentColor: "#0d9488",
    hero: {
      title: "Great solutions come from everywhere.",
      subtitle:
        "Hosts post real problems. Anyone can submit a solution. Every submission gets an instant AI evaluation against the host's criteria, and hosts endorse the ones they want to take forward.",
      primaryCta: "Browse challenges",
      secondaryCta: "Host a challenge",
    },
    footer: {
      text: "Built with the open-challenge-platform template.",
      links: [{ label: "How it works", href: "/about" }],
    },
    keywords: ["innovation challenge", "hackathon", "open innovation"],
  },

  terminology: {
    challenge: { singular: "Challenge", plural: "Challenges" },
    submission: { singular: "Solution", plural: "Solutions" },
    category: { singular: "Track", plural: "Tracks" },
    endorsement: { verb: "Endorse", past: "Endorsed", noun: "Endorsement" },
    upvote: { verb: "Upvote", noun: "Upvotes" },
    reward: "Prize",
    deadline: "Deadline",
  },

  roles: {
    owner: { label: "Host", plural: "Hosts", description: "Organisations or people who post challenges." },
    solver: {
      label: "Solver",
      plural: "Solvers",
      description: "Anyone who submits a solution.",
      profileFields: [{ key: "skills", label: "Skills", type: "tags", placeholder: "Comma separated" }],
    },
  },

  permissions: {
    createChallenge: ["owner", "admin"],
    submit: ["solver"],
    endorse: "challenge-owner",
    ownerApprovalRequired: false,
  },

  auth: {
    allowSignup: true,
    signupRoles: ["solver", "owner"],
    allowedEmailDomains: [],
    showDemoAccounts: true,
  },

  categories: ["Climate", "Health", "Education", "Fintech", "Open source", "Other"],

  challenge: {
    stages: [
      { key: "draft", label: "Draft", public: false },
      { key: "open", label: "Open", acceptsSubmissions: true, tone: "success" },
      { key: "judging", label: "Judging", tone: "warning" },
      { key: "closed", label: "Closed", tone: "neutral" },
    ],
    defaultStage: "open",
    fields: [
      { key: "team_size", label: "Max team size", type: "number", min: 1, max: 10, showOnCard: true },
      { key: "eligibility", label: "Who can take part", type: "text" },
    ],
  },

  submission: {
    summaryLabel: "Summary",
    summaryHelp: "What problem do you solve, how, and how far along are you?",
    summaryMinLength: 50,
    fields: [
      { key: "stage", label: "Stage", type: "select", required: true, options: ["Idea", "Prototype", "Working product"], showOnCard: true },
      { key: "details", label: "How it works", type: "markdown" },
      { key: "tech", label: "Tech stack", type: "tags" },
      { key: "repo_url", label: "Repository", type: "url" },
      { key: "demo_url", label: "Demo / video", type: "url" },
      { key: "team", label: "Team members", type: "tags" },
    ],
    statuses: [
      { key: "submitted", label: "Submitted", notifyAuthor: false },
      { key: "shortlisted", label: "Shortlisted", tone: "info" },
      { key: "winner", label: "Winner", tone: "success" },
      { key: "not_selected", label: "Not selected", tone: "neutral" },
    ],
    defaultStatus: "submitted",
    visibility: "public",
    maxPerSolverPerChallenge: 3,
    allowEditAfterSubmit: true,
  },

  features: { upvotes: true, endorsements: true, leaderboard: true },

  evaluation: {
    enabled: true,
    trigger: "on-submit",
    visibility: "public",
    persona:
      "You are an experienced, fair judge for an open innovation challenge. You score submissions honestly against the host's criteria so the strongest work rises to the top.",
    gate: {
      label: "Relevance check",
      question: "Is this a genuine attempt to solve the posted challenge (not spam, not off-topic)?",
    },
    criteria: [
      { key: "relevance", label: "Relevance", description: "How directly it addresses the posted challenge.", weight: 3 },
      { key: "impact", label: "Impact", description: "Size of the benefit if it works.", weight: 3 },
      { key: "feasibility", label: "Feasibility", description: "Can it realistically be built and deployed?", weight: 2 },
      { key: "originality", label: "Originality", description: "Is it a fresh approach rather than an obvious or existing one?", weight: 1 },
    ],
    instructions: ["Judge only what is written; do not assume features that are not described."],
    flags: ["incomplete", "duplicate"],
    summary: {
      label: "AI summary",
      guidance: "Neutral and specific. What it is, who it helps, main strength, main gap. No first person.",
      maxLength: 300,
    },
  },
});
