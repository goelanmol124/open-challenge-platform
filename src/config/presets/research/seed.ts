import { defineSeed } from "../../seed-types";

// Entirely fictional sponsors, researchers and problems.
export default defineSeed({
  users: [
    { key: "o1", name: "Halcyon Materials Lab", email: "bounties@halcyon.example", role: "owner", organization: "Halcyon Materials Lab" },
    { key: "o2", name: "Dr. Selma Varga", email: "selma.varga@example.org", role: "owner", organization: "Eastbrook Climate Institute" },
    { key: "s1", name: "Kenji Arrowood", email: "kenji.arrowood@example.com", role: "solver", profile: { affiliation: "Independent" } },
    { key: "s2", name: "Noor Haddad", email: "noor.haddad@example.com", role: "solver", profile: { affiliation: "Fictional State University" } },
  ],
  challenges: [
    {
      key: "c1",
      ownerKey: "o1",
      title: "Predict bandgap of doped perovskites within 0.1 eV",
      summary: "Beat our baseline model's mean absolute error on a held-out set of 400 doped perovskite compositions.",
      description: "We provide 4,000 DFT-computed compositions. The current baseline (gradient-boosted descriptors) reaches 0.19 eV MAE on the hidden test set.",
      category: "Materials",
      stage: "open",
      deadlineInDays: 60,
      reward: "10,000",
      featured: true,
      fields: { acceptance_criteria: "- MAE <= 0.10 eV on the hidden test set\n- Inference under 1 s per composition on a CPU\n- Training code released", dataset_url: "https://example.com/datasets/perovskite-bandgap", ip_terms: "Open licence required" },
    },
    {
      key: "c2",
      ownerKey: "o2",
      title: "Downscale daily rainfall to 1 km for a coastal basin",
      summary: "Produce a statistically sound 1 km daily rainfall product from 25 km reanalysis for a fictional coastal basin.",
      description: "Validation is against 38 rain gauges withheld from training.",
      category: "Climate",
      stage: "open",
      deadlineInDays: 90,
      reward: "6,000",
      fields: { acceptance_criteria: "- Beats bilinear interpolation on CRPS at 30+ of 38 gauges\n- Preserves wet-day frequency within 5%", ip_terms: "Solver keeps IP, sponsor gets licence" },
    },
  ],
  submissions: [
    {
      challengeKey: "c1",
      authorKey: "s1",
      title: "Graph network over composition with dopant-site attention",
      summary: "A message-passing network over the composition graph with attention on dopant sites reaches 0.094 eV MAE on our 5-fold CV of the public set; inference is 40 ms on a laptop CPU. Code and trained weights are released.",
      fields: { method: "Composition graph, 4 message-passing layers, dopant-site attention head, ensemble of 5 seeds.", results: "5-fold CV MAE 0.094 +/- 0.006 eV. Hidden test set not available to us.", code_url: "https://example.com/code/perovskite-gnn", compute_used: "1 consumer GPU, 5 hours" },
      status: "verifying",
    },
    {
      challengeKey: "c1",
      authorKey: "s2",
      title: "Physics-informed descriptors + kernel ridge",
      summary: "Tolerance-factor-based descriptors with kernel ridge regression; simple, fast and interpretable, 0.13 eV MAE.",
      fields: { method: "Hand-built descriptors from ionic radii and electronegativity; KRR with RBF kernel.", results: "0.13 eV MAE on a random 10% split. Does not meet the 0.10 target.", code_url: "https://example.com/code/krr-descriptors" },
    },
  ],
});
