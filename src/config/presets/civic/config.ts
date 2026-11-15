import { defineConfig } from "../../schema";

/**
 * Example: a civic problem hub. Public officials post local problems,
 * residents and civic technologists propose solutions, AI scores them for
 * public impact / feasibility / readiness, and officials "champion" the
 * proposals they want to pursue. The city and all content are fictional.
 */
export default defineConfig({
  id: "civic",
  branding: {
    name: "Riverton Civic Lab",
    tagline: "Local problems, solved together.",
    description:
      "A civic innovation platform where public officials share real problems and residents propose practical, evaluated solutions.",
    logoText: "RC",
    primaryColor: "#1d4ed8",
    accentColor: "#0f766e",
    hero: {
      title: "Your city has problems worth solving.",
      subtitle:
        "Officials post the issues they are responsible for. Anyone can propose a solution. Every proposal gets an independent AI review, and officials champion the ones they will take forward.",
      primaryCta: "Browse problems",
      secondaryCta: "Post a problem",
    },
    footer: { text: "Riverton is a fictional city used for this demo." },
    keywords: ["civic tech", "govtech", "open innovation", "participatory"],
  },
  terminology: {
    challenge: { singular: "Problem", plural: "Problems" },
    submission: { singular: "Proposal", plural: "Proposals" },
    category: { singular: "Department", plural: "Departments" },
    endorsement: { verb: "Champion", past: "Championed", noun: "Champion" },
    upvote: { verb: "Support", noun: "Supporters" },
    reward: "Support offered",
    deadline: "Proposals due",
  },
  roles: {
    owner: {
      label: "Official",
      plural: "Officials",
      description: "Elected representatives and public servants who own a problem.",
      profileFields: [
        { key: "designation", label: "Designation", type: "text", required: true, placeholder: "e.g. Ward Councillor" },
        { key: "jurisdiction", label: "Jurisdiction", type: "text", placeholder: "e.g. Ward 7, North Riverton" },
      ],
    },
    solver: {
      label: "Civic innovator",
      plural: "Civic innovators",
      description: "Residents, students, researchers and startups proposing solutions.",
      profileFields: [
        { key: "background", label: "Background", type: "select", options: ["Student", "Professional", "Startup", "Researcher", "Resident"] },
        { key: "skills", label: "Skills", type: "tags", placeholder: "Comma separated" },
      ],
    },
  },
  permissions: { endorse: "any-owner", ownerApprovalRequired: true },
  auth: { signupRoles: ["solver", "owner"] },
  categories: ["Water", "Transport", "Waste", "Health", "Education", "Public safety", "Environment", "Digital services"],
  challenge: {
    stages: [
      { key: "draft", label: "Draft", public: false, tone: "neutral" },
      { key: "open", label: "Open for proposals", acceptsSubmissions: true, tone: "success" },
      { key: "review", label: "Under review", tone: "warning" },
      { key: "implementing", label: "Being implemented", tone: "brand" },
      { key: "resolved", label: "Resolved", tone: "info" },
    ],
    defaultStage: "open",
    fields: [
      { key: "location", label: "Area affected", type: "text", placeholder: "e.g. Old Market district", showOnCard: true },
      { key: "people_affected", label: "Approx. people affected", type: "number", min: 0 },
      { key: "constraints", label: "Known constraints", type: "markdown", help: "Budget, regulations, existing contracts..." },
    ],
  },
  submission: {
    summaryLabel: "What do you propose?",
    summaryHelp: "Describe the problem as you understand it, your solution, and what exists today.",
    summaryMinLength: 80,
    fields: [
      {
        key: "maturity",
        label: "Maturity",
        type: "select",
        required: true,
        options: ["Idea", "Prototype", "Piloted", "Deployed elsewhere"],
        showOnCard: true,
      },
      { key: "approach", label: "How it works", type: "markdown", required: true, min: 50 },
      { key: "cost_estimate", label: "Rough cost estimate", type: "text", placeholder: "e.g. 15,000 per year" },
      { key: "technologies", label: "Technologies", type: "tags" },
      { key: "demo_url", label: "Demo or deck link", type: "url" },
      { key: "contact_phone", label: "Contact number (only shared with officials)", type: "text", private: true, includeInEvaluation: false },
    ],
    statuses: [
      { key: "submitted", label: "Submitted", tone: "neutral", notifyAuthor: false },
      { key: "shortlisted", label: "Shortlisted", tone: "info" },
      { key: "invited", label: "Invited to present", tone: "brand" },
      { key: "piloting", label: "Pilot approved", tone: "success" },
      { key: "not_pursued", label: "Not pursued", tone: "danger" },
    ],
    defaultStatus: "submitted",
    visibility: "public",
    maxPerSolverPerChallenge: 2,
  },
  evaluation: {
    trigger: "on-submit",
    visibility: "public",
    persona:
      "You are a rigorous, fair reviewer of civic-technology proposals submitted to local government. You score honestly so that genuinely useful public-interest work rises to the top.",
    gate: {
      label: "Public-interest check",
      question:
        "Does the proposal genuinely serve the public or a government function for this problem (not spam, not a disguised sales pitch for an unrelated product)?",
    },
    criteria: [
      {
        key: "impact",
        label: "Public impact",
        description: "How much real public benefit if it works: people reached, severity of the problem, measurability.",
        weight: 0.4,
      },
      {
        key: "feasibility",
        label: "Feasibility",
        description: "Realism of deployment for a mid-sized city: budget, infrastructure, regulation, operations.",
        weight: 0.35,
      },
      {
        key: "readiness",
        label: "Readiness",
        description: "Technology/solution readiness inferred from the description (not the self-declared maturity).",
        weight: 0.25,
        min: 1,
        max: 9,
        anchors: { "1": "Concept only", "3": "Proof of concept", "6": "Piloted with real users", "9": "Deployed at scale" },
      },
    ],
    instructions: [
      "Infer readiness from evidence in the text; do not trust the self-declared maturity.",
      "If the proposal duplicates a large, already-deployed public programme without adding anything, give low impact and feasibility and add the flag 'duplicate'.",
    ],
    flags: ["duplicate", "incomplete", "off_topic"],
    summary: {
      label: "Reviewer summary",
      guidance:
        "Diplomatic, specific, no first person. Say what the proposal does and for whom, so an official can tell at a glance if it fits.",
      maxLength: 280,
    },
  },
});
