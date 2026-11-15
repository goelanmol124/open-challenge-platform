import { defineConfig } from "../../schema";

/**
 * Example: a research problem bounty board. Labs and funders post open
 * research problems with a bounty; researchers submit solutions with
 * reproducible artefacts; AI pre-screens for rigour and reproducibility;
 * the sponsor "accepts" a solution. Submissions are private to the author
 * and sponsor. All content is fictional.
 */
export default defineConfig({
  id: "research",
  branding: {
    name: "Open Problems Bounty Board",
    tagline: "Hard problems. Real bounties. Reproducible answers.",
    description: "A research bounty platform: sponsors post open problems with a bounty, researchers submit reproducible solutions, AI pre-screens, sponsors accept.",
    logoText: "OP",
    primaryColor: "#0f766e",
    accentColor: "#b45309",
    hero: {
      title: "Solve an open problem. Get paid for it.",
      subtitle: "Sponsors post well-specified research problems with a bounty. Submit a reproducible solution; every submission gets a rigour and reproducibility pre-screen before a human looks at it.",
      primaryCta: "Browse bounties",
      secondaryCta: "Post a bounty",
    },
    footer: { text: "Demo content. Sponsors and problems are fictional." },
    keywords: ["research bounty", "open problems", "reproducibility", "prize challenge"],
  },
  terminology: {
    challenge: { singular: "Bounty", plural: "Bounties" },
    submission: { singular: "Solution", plural: "Solutions" },
    category: { singular: "Field", plural: "Fields" },
    endorsement: { verb: "Accept", past: "Accepted", noun: "Acceptance" },
    upvote: { verb: "Star", noun: "Stars" },
    reward: "Bounty",
    deadline: "Submission deadline",
  },
  roles: {
    owner: { label: "Sponsor", plural: "Sponsors", description: "Labs, funders and companies posting problems." },
    solver: {
      label: "Researcher",
      plural: "Researchers",
      description: "Anyone who can produce a reproducible answer.",
      profileFields: [{ key: "affiliation", label: "Affiliation", type: "text" }, { key: "orcid_url", label: "ORCID or homepage", type: "url" }],
    },
  },
  permissions: { endorse: "challenge-owner" },
  categories: ["Machine learning", "Computational biology", "Materials", "Climate", "Mathematics", "Systems"],
  challenge: {
    stages: [
      { key: "draft", label: "Draft", public: false },
      { key: "open", label: "Open", acceptsSubmissions: true, tone: "success" },
      { key: "review", label: "In review", tone: "warning" },
      { key: "awarded", label: "Awarded", tone: "brand" },
      { key: "expired", label: "Expired", tone: "neutral" },
    ],
    defaultStage: "open",
    fields: [
      { key: "acceptance_criteria", label: "Acceptance criteria", type: "markdown", required: true, help: "Exactly what a winning solution must demonstrate." },
      { key: "dataset_url", label: "Dataset / baseline", type: "url" },
      { key: "ip_terms", label: "IP terms", type: "select", options: ["Solver keeps IP, sponsor gets licence", "Assigned to sponsor", "Open licence required"], showOnCard: true },
    ],
  },
  submission: {
    summaryLabel: "Abstract",
    summaryMinLength: 100,
    fields: [
      { key: "method", label: "Method", type: "markdown", required: true, min: 100 },
      { key: "results", label: "Results against the acceptance criteria", type: "markdown", required: true },
      { key: "code_url", label: "Code repository", type: "url", required: true },
      { key: "paper_url", label: "Write-up / preprint", type: "url" },
      { key: "compute_used", label: "Compute used", type: "text", placeholder: "e.g. 1 GPU, 6 hours" },
    ],
    statuses: [
      { key: "received", label: "Received", notifyAuthor: false },
      { key: "verifying", label: "Verifying results", tone: "warning" },
      { key: "awarded", label: "Bounty awarded", tone: "success" },
      { key: "rejected", label: "Does not meet criteria", tone: "danger" },
    ],
    defaultStatus: "received",
    visibility: "restricted",
    maxPerSolverPerChallenge: 3,
    allowEditAfterSubmit: false,
  },
  features: { upvotes: false, leaderboard: false },
  evaluation: {
    trigger: "on-submit",
    visibility: "owner-and-author",
    persona: "You are a careful scientific referee pre-screening bounty submissions. You check claims against the stated acceptance criteria and value reproducibility above impressive-sounding prose.",
    gate: { label: "Addresses the problem", question: "Does the submission attempt the posted problem and report results against its acceptance criteria?" },
    criteria: [
      { key: "rigor", label: "Rigour", description: "Soundness of method and whether the results support the claims.", weight: 4, min: 0, max: 10 },
      { key: "criteria_met", label: "Acceptance criteria met", description: "How fully the reported results satisfy the posted acceptance criteria.", weight: 4, min: 0, max: 10 },
      { key: "reproducibility", label: "Reproducibility", description: "Are code, data and steps sufficient for someone else to reproduce?", weight: 3, min: 0, max: 10 },
      { key: "clarity", label: "Clarity", description: "Is the write-up clear and complete?", weight: 1, min: 0, max: 10 },
    ],
    instructions: [
      "You cannot open links; judge reproducibility from what the text says is provided.",
      "Flag 'unverified_claim' when a headline number has no described evaluation protocol.",
    ],
    flags: ["unverified_claim", "incomplete", "off_topic"],
    summary: { label: "Referee pre-screen", maxLength: 400 },
    disclaimer: "Automated pre-screen only. The sponsor verifies results before any bounty is paid.",
  },
});
