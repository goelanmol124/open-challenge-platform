"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { FormState } from "@/components/form-bits";
import { config, getStage } from "@/config";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { challenges, submissions } from "@/lib/db/schema";
import { readFieldsFromForm, validateFields } from "@/lib/fields";
import { notify } from "@/lib/notifications";
import { canCreateChallenge, canManageChallenge } from "@/lib/permissions";
import { checkRateLimit } from "@/lib/rate-limit";
import { parseDateInput } from "@/lib/utils";

const stageKeys = config.challenge.stages.map((s) => s.key) as [string, ...string[]];

const BaseSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(255),
  summary: z.string().trim().min(10, "Summary must be at least 10 characters").max(500),
  description: z.string().trim().min(20, "Description must be at least 20 characters").max(20_000),
  category: z.enum(config.categories as [string, ...string[]], { errorMap: () => ({ message: `Choose a ${config.terminology.category.singular.toLowerCase()}` }) }),
  stage: z.enum(stageKeys),
  reward: z.string().trim().max(255).optional(),
});

function readBase(form: FormData) {
  return BaseSchema.safeParse({
    title: form.get("title"),
    summary: form.get("summary"),
    description: form.get("description"),
    category: form.get("category"),
    stage: form.get("stage") || config.challenge.defaultStage,
    reward: form.get("reward") || undefined,
  });
}

function collect(form: FormData) {
  const base = readBase(form);
  const custom = validateFields(config.challenge.fields, readFieldsFromForm(config.challenge.fields, form));
  const errors: Record<string, string> = {};
  if (!base.success) for (const i of base.error.issues) errors[String(i.path[0])] ??= i.message;
  if (!custom.ok) Object.assign(errors, custom.errors);
  if (!base.success || !custom.ok) return { ok: false as const, errors };
  return { ok: true as const, base: base.data, fields: custom.values, deadline: parseDateInput(form.get("deadline")) };
}

export async function createChallenge(_: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!canCreateChallenge(user)) return { error: "You are not allowed to post here (yet)." };
  if (!checkRateLimit(`challenge:${user!.id}`, 20, 60 * 60_000)) return { error: "Too many posts. Try again later." };

  const data = collect(form);
  if (!data.ok) return { error: "Please fix the highlighted fields.", errors: data.errors };

  const id = crypto.randomUUID();
  await db.insert(challenges).values({
    id,
    ownerId: user!.id,
    ...data.base,
    reward: data.base.reward ?? null,
    deadline: data.deadline,
    fields: data.fields,
  });
  revalidatePath("/challenges");
  redirect(`/challenges/${id}`);
}

export async function updateChallenge(id: string, _: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  const [existing] = await db.select().from(challenges).where(eq(challenges.id, id)).limit(1);
  if (!existing || !canManageChallenge(user, existing)) return { error: "Not allowed." };

  const data = collect(form);
  if (!data.ok) return { error: "Please fix the highlighted fields.", errors: data.errors };

  await db
    .update(challenges)
    .set({ ...data.base, reward: data.base.reward ?? null, deadline: data.deadline, fields: data.fields })
    .where(eq(challenges.id, id));
  revalidatePath(`/challenges/${id}`);
  redirect(`/challenges/${id}`);
}

export async function setChallengeStage(id: string, form: FormData): Promise<void> {
  const user = await getCurrentUser();
  const stage = String(form.get("stage") ?? "");
  const [existing] = await db.select().from(challenges).where(eq(challenges.id, id)).limit(1);
  if (!existing || !canManageChallenge(user, existing) || !getStage(stage) || existing.stage === stage) return;

  await db.update(challenges).set({ stage }).where(eq(challenges.id, id));

  // Let everyone who submitted know the stage changed.
  const authors = await db.selectDistinct({ id: submissions.authorId }).from(submissions).where(eq(submissions.challengeId, id));
  await notify(
    authors.map((a) => ({
      userId: a.id,
      title: `"${existing.title}" is now: ${getStage(stage)!.label}`,
      link: `/challenges/${id}`,
    })),
  );
  revalidatePath(`/challenges/${id}`);
}
