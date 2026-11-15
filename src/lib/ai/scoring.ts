/**
 * Parses and validates model output against the configured rubric and
 * computes the weighted overall score (0-100). Pure; no I/O.
 */
import type { EvaluationConfig } from "@/config/schema";

export type ParsedEvaluation = {
  gatePassed: boolean | null;
  gateReason: string | null;
  scores: Record<string, { score: number; rationale: string }>;
  summary: string;
  flags: string[];
  overall: number;
};

function extractJson(text: string): unknown {
  let s = text.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) s = fence[1].trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("No JSON object found in model output");
  return JSON.parse(s.slice(start, end + 1));
}

/** Weighted mean of normalised criterion scores, as 0-100. */
export function computeOverall(
  ev: Pick<EvaluationConfig, "criteria">,
  scores: Record<string, { score: number }>,
  gatePassed: boolean | null = null,
): number {
  if (gatePassed === false) return 0;
  let total = 0;
  let weights = 0;
  for (const c of ev.criteria) {
    const s = scores[c.key];
    if (!s) continue;
    total += c.weight * ((s.score - c.min) / (c.max - c.min));
    weights += c.weight;
  }
  return weights === 0 ? 0 : Math.round((total / weights) * 100);
}

export function parseEvaluation(ev: EvaluationConfig, rawText: string): ParsedEvaluation {
  const data = extractJson(rawText) as Record<string, unknown>;
  if (!data || typeof data !== "object") throw new Error("Model output is not an object");

  const rawScores = (data.scores ?? {}) as Record<string, unknown>;
  const scores: ParsedEvaluation["scores"] = {};
  for (const c of ev.criteria) {
    const entry = rawScores[c.key];
    const value = typeof entry === "object" && entry !== null ? (entry as { score?: unknown }).score : entry;
    const n = typeof value === "string" ? Number(value) : value;
    if (typeof n !== "number" || !Number.isFinite(n)) {
      throw new Error(`Model output is missing a numeric score for "${c.key}"`);
    }
    const rationale =
      typeof entry === "object" && entry !== null && typeof (entry as { rationale?: unknown }).rationale === "string"
        ? ((entry as { rationale: string }).rationale).slice(0, 500)
        : "";
    scores[c.key] = { score: Math.min(c.max, Math.max(c.min, Math.round(n))), rationale };
  }

  const gatePassed = ev.gate ? data.gate_passed !== false : null;
  const gateReason = ev.gate && typeof data.gate_reason === "string" ? data.gate_reason.slice(0, 500) : null;

  let summary = typeof data.summary === "string" ? data.summary.trim() : "";
  if (summary.length > ev.summary.maxLength) summary = summary.slice(0, ev.summary.maxLength - 1).trimEnd() + "…";

  const flags = Array.isArray(data.flags)
    ? [...new Set(data.flags.filter((f): f is string => typeof f === "string" && ev.flags.includes(f)))]
    : [];

  return { gatePassed, gateReason, scores, summary, flags, overall: computeOverall(ev, scores, gatePassed) };
}
