"use server";

import { and, count, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";

import type { FormState } from "@/components/form-bits";
import { config, getStatus, t } from "@/config";
import { evaluateSubmission } from "@/lib/ai/evaluate";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { challenges, endorsements, submissions, upvotes } from "@/lib/db/schema";
import { readFieldsFromForm, validateFields } from "@/lib/fields";
import { notify } from "@/lib/notifications";
import { canEditSubmission, canEndorse, canRunEvaluation, canSetSubmissionStatus, canSubmit, canViewSubmission } from "@/lib/permissions";
import { checkRateLimit } from "@/lib/rate-limit";

const BaseSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(255),
  summary: z
    .string()
    .trim()
    .min(config.submission.summaryMinLength, `${config.submission.summaryLabel} must be at least ${config.submission.summaryMinLength} characters`)
    .max(5000),
});

function collect(form: FormData) {
  const base = BaseSchema.safeParse({ title: form.get("title"), summary: form.get("summary") });
  const custom = validateFields(config.submission.fields, readFieldsFromForm(config.submission.fields, form));
  const errors: Record<string, string> = {};
  if (!base.success) for (const i of base.error.issues) errors[String(i.path[0])] ??= i.message;
  if (!custom.ok) Object.assign(errors, custom.errors);
  if (!base.success || !custom.ok) return { ok: false as const, errors };
  return { ok: true as const, base: base.data, fields: custom.values };
}

function scheduleEvaluation(id: string) {
  if (!config.evaluation.enabled || config.evaluation.trigger !== "on-submit") return;
  // Runs after the response is sent. If the process dies, the cron endpoint retries.
  after(async () => {
    await evaluateSubmission(id);
  });
}

async function loadPair(submissionId: string) {
  const [row] = await db
    .select({ s: submissions, c: challenges })
    .from(submissions)
    .innerJoin(challenges, eq(challenges.id, submissions.challengeId))
    .where(eq(submissions.id, submissionId))
    .limit(1);
  return row ?? null;
}

export async function createSubmission(challengeId: string, _: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  const [c] = await db.select().from(challenges).where(eq(challenges.id, challengeId)).limit(1);
  if (!c) return { error: `${t.challenge.singular} not found.` };
  if (!canSubmit(user, c)) return { error: `You can't submit to this ${t.challenge.singular.toLowerCase()} right now.` };
  if (!checkRateLimit(`submit:${user!.id}`, 20, 60 * 60_000)) return { error: "Too many submissions. Try again later." };

  const [{ n }] = await db
    .select({ n: count() })
    .from(submissions)
    .where(and(eq(submissions.challengeId, challengeId), eq(submissions.authorId, user!.id)));
  if (Number(n) >= config.submission.maxPerSolverPerChallenge) {
    return { error: `You can submit at most ${config.submission.maxPerSolverPerChallenge} ${t.submission.plural.toLowerCase()} here.` };
  }

  const data = collect(form);
  if (!data.ok) return { error: "Please fix the highlighted fields.", errors: data.errors };

  const id = crypto.randomUUID();
  await db.insert(submissions).values({
    id,
    challengeId,
    authorId: user!.id,
    ...data.base,
    fields: data.fields,
    status: config.submission.defaultStatus,
    aiStatus: config.evaluation.enabled ? "pending" : "skipped",
  });

  await notify({
    userId: c.ownerId,
    title: `New ${t.submission.singular.toLowerCase()} on "${c.title}": ${data.base.title}`,
    link: `/submissions/${id}`,
  });
  scheduleEvaluation(id);
  revalidatePath(`/challenges/${challengeId}`);
  redirect(`/submissions/${id}`);
}

export async function updateSubmission(id: string, _: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  const pair = await loadPair(id);
  if (!pair || !canEditSubmission(user, pair.c, pair.s)) return { error: "Not allowed." };

  const data = collect(form);
  if (!data.ok) return { error: "Please fix the highlighted fields.", errors: data.errors };

  // Content changed: re-evaluate from scratch.
  await db
    .update(submissions)
    .set({ ...data.base, fields: data.fields, aiStatus: config.evaluation.enabled ? "pending" : "skipped", aiAttempts: 0 })
    .where(eq(submissions.id, id));
  scheduleEvaluation(id);
  revalidatePath(`/submissions/${id}`);
  redirect(`/submissions/${id}`);
}

export async function setSubmissionStatus(id: string, form: FormData): Promise<void> {
  const user = await getCurrentUser();
  const status = String(form.get("status") ?? "");
  const pair = await loadPair(id);
  const def = getStatus(status);
  if (!pair || !def || !canSetSubmissionStatus(user, pair.c) || pair.s.status === status) return;

  await db.update(submissions).set({ status }).where(eq(submissions.id, id));
  if (def.notifyAuthor) {
    await notify({ userId: pair.s.authorId, title: `"${pair.s.title}" is now: ${def.label}`, link: `/submissions/${id}` });
  }
  revalidatePath(`/submissions/${id}`);
  revalidatePath(`/challenges/${pair.c.id}`);
}

export async function toggleEndorsement(id: string, form: FormData): Promise<void> {
  const user = await getCurrentUser();
  const pair = await loadPair(id);
  if (!user || !pair || !canEndorse(user, pair.c, pair.s)) return;

  const note = String(form.get("note") ?? "").trim().slice(0, 1000) || null;
  const [existing] = await db
    .select({ id: endorsements.id })
    .from(endorsements)
    .where(and(eq(endorsements.submissionId, id), eq(endorsements.userId, user.id)))
    .limit(1);

  if (existing) {
    await db.delete(endorsements).where(eq(endorsements.id, existing.id));
  } else {
    await db.insert(endorsements).values({ submissionId: id, userId: user.id, note });
    await notify({
      userId: pair.s.authorId,
      title: `${user.name} ${t.endorsement.past.toLowerCase()} "${pair.s.title}"`,
      body: note,
      link: `/submissions/${id}`,
    });
  }
  const [{ n }] = await db.select({ n: count() }).from(endorsements).where(eq(endorsements.submissionId, id));
  await db.update(submissions).set({ endorsementCount: Number(n) }).where(eq(submissions.id, id));
  revalidatePath(`/submissions/${id}`);
  revalidatePath(`/challenges/${pair.c.id}`);
}

export type UpvoteResult = { error: string } | { upvoted: boolean; count: number };

export async function toggleUpvote(id: string): Promise<UpvoteResult> {
  if (!config.features.upvotes) return { error: "Disabled" };
  const user = await getCurrentUser();
  if (!user) return { error: `Sign in to ${t.upvote.verb.toLowerCase()}` };
  const pair = await loadPair(id);
  if (!pair || !canViewSubmission(user, pair.c, pair.s)) return { error: "Not found" };
  if (!checkRateLimit(`upvote:${user.id}`, 120, 60_000)) return { error: "Slow down a little." };

  const [existing] = await db
    .select({ id: upvotes.id })
    .from(upvotes)
    .where(and(eq(upvotes.submissionId, id), eq(upvotes.userId, user.id)))
    .limit(1);
  if (existing) {
    await db.delete(upvotes).where(eq(upvotes.id, existing.id));
    await db.update(submissions).set({ upvoteCount: sql`GREATEST(0, ${submissions.upvoteCount} - 1)` }).where(eq(submissions.id, id));
  } else {
    await db.insert(upvotes).values({ submissionId: id, userId: user.id });
    await db.update(submissions).set({ upvoteCount: sql`${submissions.upvoteCount} + 1` }).where(eq(submissions.id, id));
  }
  const [row] = await db.select({ n: submissions.upvoteCount }).from(submissions).where(eq(submissions.id, id)).limit(1);
  revalidatePath(`/challenges/${pair.c.id}`);
  return { upvoted: !existing, count: row?.n ?? 0 };
}

export async function runEvaluation(id: string): Promise<void> {
  const user = await getCurrentUser();
  const pair = await loadPair(id);
  if (!pair || !canRunEvaluation(user, pair.c)) return;
  if (!checkRateLimit(`eval:${user!.id}`, 30, 60 * 60_000)) return;
  await db.update(submissions).set({ aiAttempts: 0 }).where(eq(submissions.id, id));
  await evaluateSubmission(id);
  revalidatePath(`/submissions/${id}`);
}
