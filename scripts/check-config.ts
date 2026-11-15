/**
 * Validates every preset (or just the active one) and prints a summary.
 *
 *   npm run config:check                 # validate all presets
 *   npm run config:check -- --prompt     # also print the AI prompt for the active preset's first seed submission
 *   npm run config:check -- --score      # run the mock provider end-to-end (prompt -> JSON -> score), no DB
 */
import "./load-env";

import { buildEvaluationRequest } from "@/lib/ai/prompt";
import { MockProvider } from "@/lib/ai/providers/mock";
import { parseEvaluation } from "@/lib/ai/scoring";
import { activePresetId, loadConfig, presets } from "@/config";
import { seeds } from "@/config/seeds";

const args = new Set(process.argv.slice(2));
let failed = false;

for (const id of Object.keys(presets)) {
  try {
    const c = loadConfig(id);
    const w = c.evaluation.criteria.reduce((a, x) => a + x.weight, 0);
    console.log(
      `✓ ${id.padEnd(10)} ${c.branding.name} — ${c.terminology.challenge.plural}/${c.terminology.submission.plural}, ` +
        `${c.challenge.stages.length} stages, ${c.submission.statuses.length} statuses, ` +
        `${c.submission.fields.length} submission fields, ${c.evaluation.criteria.length} criteria (${c.evaluation.criteria
          .map((x) => `${x.key} ${Math.round((x.weight / w) * 100)}%`)
          .join(", ")})${id === activePresetId ? "  <- active" : ""}`,
    );
  } catch (err) {
    failed = true;
    console.error(`✗ ${id}\n${err instanceof Error ? err.message : err}`);
  }
}

async function demo() {
  const cfg = loadConfig(activePresetId);
  const seed = seeds[activePresetId];
  const sub = seed?.submissions[0];
  const ch = seed?.challenges.find((c) => c.key === sub?.challengeKey);
  if (!sub || !ch) return console.log("(no seed submission to demo)");
  const req = buildEvaluationRequest(
    cfg,
    { title: ch.title, summary: ch.summary, description: ch.description, category: ch.category, reward: ch.reward ?? null, fields: ch.fields ?? {} },
    { title: sub.title, summary: sub.summary, fields: sub.fields ?? {} },
  );
  if (args.has("--prompt")) {
    console.log("\n──── SYSTEM ────\n" + req.system + "\n\n──── PROMPT ────\n" + req.prompt);
  }
  if (args.has("--score")) {
    const raw = await new MockProvider().generateJson(req);
    const parsed = parseEvaluation(cfg.evaluation, raw);
    console.log("\n──── MOCK EVALUATION ────\n" + JSON.stringify(parsed, null, 2));
  }
}

if (!failed && (args.has("--prompt") || args.has("--score"))) {
  demo().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
}
if (failed) process.exitCode = 1;
