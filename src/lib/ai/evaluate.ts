/**
 * Evaluation orchestration: load a submission + its challenge, ask the
 * provider, validate, score, store. Used by the submit action (background),
 * the "Run evaluation" button, the cron endpoint and the CLI scripts.
 */
import { and, eq, lt, or } from "drizzle-orm";

import { config } from "@/config";
import { db } from "@/lib/db";
import { challenges, submissions } from "@/lib/db/schema";
import { asValues } from "@/lib/fields";
import { notify } from "@/lib/notifications";

import { getProvider, type AIProvider } from "./index";
import { buildEvaluationRequest } from "./prompt";
import { parseEvaluation } from "./scoring";

export const MAX_EVAL_ATTEMPTS = 3;

export type EvaluateResult = { ok: true; overall: number } | { ok: false; error: string };

export async function evaluateSubmission(
  submissionId: string,
  opts: { provider?: AIProvider; notifyAuthor?: boolean } = {},
): Promise<EvaluateResult> {
  if (!config.evaluation.enabled) return { ok: false, error: "Evaluation is disabled in the config" };

  const [row] = await db
    .select({ s: submissions, c: challenges })
    .from(submissions)
    .innerJoin(challenges, eq(submissions.challengeId, challenges.id))
    .where(eq(submissions.id, submissionId))
    .limit(1);
  if (!row) return { ok: false, error: "Submission not found" };

  let provider: AIProvider;
  try {
    provider = opts.provider ?? getProvider();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }

  await db
    .update(submissions)
    .set({ aiStatus: "running", aiAttempts: row.s.aiAttempts + 1 })
    .where(eq(submissions.id, submissionId));

  try {
    const request = buildEvaluationRequest(
      config,
      {
        title: row.c.title,
        summary: row.c.summary,
        description: row.c.description,
        category: row.c.category,
        reward: row.c.reward,
        fields: asValues(row.c.fields),
      },
      { title: row.s.title, summary: row.s.summary, fields: asValues(row.s.fields) },
    );
    const raw = await provider.generateJson(request);
    const parsed = parseEvaluation(config.evaluation, raw);

    await db
      .update(submissions)
      .set({
        aiStatus: "done",
        aiOverall: parsed.overall,
        aiScores: parsed.scores,
        aiGatePassed: parsed.gatePassed,
        aiGateReason: parsed.gateReason,
        aiSummary: parsed.summary,
        aiFlags: parsed.flags,
        aiProvider: provider.id,
        aiModel: provider.model,
        aiError: null,
        evaluatedAt: new Date(),
      })
      .where(eq(submissions.id, submissionId));

    if (opts.notifyAuthor !== false) {
      await notify({
        userId: row.s.authorId,
        title: `Your ${config.terminology.submission.singular.toLowerCase()} "${row.s.title}" has been evaluated`,
        link: `/submissions/${submissionId}`,
      });
    }
    return { ok: true, overall: parsed.overall };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[evaluate] ${submissionId} failed:`, message);
    await db
      .update(submissions)
      .set({ aiStatus: "failed", aiError: message.slice(0, 2000) })
      .where(eq(submissions.id, submissionId));
    return { ok: false, error: message };
  }
}

/** Evaluate pending/failed submissions (bounded). Used by cron + CLI. */
export async function evaluatePending(limit = 20, concurrency = 4) {
  const rows = await db
    .select({ id: submissions.id })
    .from(submissions)
    .where(
      and(
        or(
          eq(submissions.aiStatus, "pending"),
          eq(submissions.aiStatus, "failed"),
          // "running" for >10 min means a crashed/timed-out run: retry it.
          and(eq(submissions.aiStatus, "running"), lt(submissions.updatedAt, new Date(Date.now() - 10 * 60_000))),
        ),
        lt(submissions.aiAttempts, MAX_EVAL_ATTEMPTS),
      ),
    )
    .limit(limit);

  let ok = 0;
  let failed = 0;
  for (let i = 0; i < rows.length; i += concurrency) {
    const batch = rows.slice(i, i + concurrency);
    const results = await Promise.all(batch.map((r) => evaluateSubmission(r.id)));
    ok += results.filter((r) => r.ok).length;
    failed += results.filter((r) => !r.ok).length;
  }
  return { considered: rows.length, ok, failed };
}
