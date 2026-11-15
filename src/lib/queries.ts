import "server-only";

import { and, count, desc, eq, inArray, like, or, type SQL } from "drizzle-orm";

import { publicStageKeys } from "@/config";
import { db } from "@/lib/db";
import { challenges, endorsements, submissions, upvotes, users, type CriterionScore } from "@/lib/db/schema";

export async function listChallenges(opts: { stage?: string; category?: string; q?: string; ownerId?: string; includeNonPublic?: boolean; limit?: number } = {}) {
  const conds: SQL[] = [];
  if (opts.stage) conds.push(eq(challenges.stage, opts.stage));
  else if (!opts.includeNonPublic && publicStageKeys.length) conds.push(inArray(challenges.stage, publicStageKeys));
  if (opts.category) conds.push(eq(challenges.category, opts.category));
  if (opts.ownerId) conds.push(eq(challenges.ownerId, opts.ownerId));
  if (opts.q) {
    const pattern = `%${opts.q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
    conds.push(or(like(challenges.title, pattern), like(challenges.summary, pattern))!);
  }

  const rows = await db
    .select({
      id: challenges.id,
      title: challenges.title,
      summary: challenges.summary,
      category: challenges.category,
      stage: challenges.stage,
      deadline: challenges.deadline,
      reward: challenges.reward,
      fields: challenges.fields,
      featured: challenges.featured,
      createdAt: challenges.createdAt,
      ownerId: challenges.ownerId,
      ownerName: users.name,
      ownerOrg: users.organization,
    })
    .from(challenges)
    .innerJoin(users, eq(users.id, challenges.ownerId))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(challenges.featured), desc(challenges.createdAt))
    .limit(opts.limit ?? 100);

  const ids = rows.map((r) => r.id);
  const counts = ids.length
    ? await db.select({ id: submissions.challengeId, n: count() }).from(submissions).where(inArray(submissions.challengeId, ids)).groupBy(submissions.challengeId)
    : [];
  const byId = new Map(counts.map((c) => [c.id, Number(c.n)]));
  return rows.map((r) => ({ ...r, submissionCount: byId.get(r.id) ?? 0 }));
}

export type ChallengeListItem = Awaited<ReturnType<typeof listChallenges>>[number];

export async function getChallenge(id: string) {
  const [row] = await db
    .select({ c: challenges, ownerName: users.name, ownerOrg: users.organization })
    .from(challenges)
    .innerJoin(users, eq(users.id, challenges.ownerId))
    .where(eq(challenges.id, id))
    .limit(1);
  return row ? { ...row.c, ownerName: row.ownerName, ownerOrg: row.ownerOrg } : null;
}

export async function listSubmissions(opts: { challengeId?: string; challengeIds?: string[]; authorId?: string; sort?: "score" | "votes" | "new"; limit?: number }) {
  const conds: SQL[] = [];
  if (opts.challengeId) conds.push(eq(submissions.challengeId, opts.challengeId));
  if (opts.challengeIds?.length) conds.push(inArray(submissions.challengeId, opts.challengeIds));
  if (opts.authorId) conds.push(eq(submissions.authorId, opts.authorId));
  const order =
    opts.sort === "votes"
      ? [desc(submissions.upvoteCount), desc(submissions.createdAt)]
      : opts.sort === "new"
        ? [desc(submissions.createdAt)]
        : [desc(submissions.endorsementCount), desc(submissions.aiOverall), desc(submissions.upvoteCount)];

  return db
    .select({
      id: submissions.id,
      challengeId: submissions.challengeId,
      challengeTitle: challenges.title,
      challengeOwnerId: challenges.ownerId,
      challengeStage: challenges.stage,
      authorId: submissions.authorId,
      authorName: users.name,
      title: submissions.title,
      summary: submissions.summary,
      fields: submissions.fields,
      status: submissions.status,
      upvoteCount: submissions.upvoteCount,
      endorsementCount: submissions.endorsementCount,
      aiStatus: submissions.aiStatus,
      aiOverall: submissions.aiOverall,
      createdAt: submissions.createdAt,
    })
    .from(submissions)
    .innerJoin(users, eq(users.id, submissions.authorId))
    .innerJoin(challenges, eq(challenges.id, submissions.challengeId))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(...order)
    .limit(opts.limit ?? 200);
}

export type SubmissionListItem = Awaited<ReturnType<typeof listSubmissions>>[number];

export async function getSubmission(id: string) {
  const [row] = await db
    .select({ s: submissions, authorName: users.name, authorOrg: users.organization, authorBio: users.bio })
    .from(submissions)
    .innerJoin(users, eq(users.id, submissions.authorId))
    .where(eq(submissions.id, id))
    .limit(1);
  if (!row) return null;
  const endorsers = await db
    .select({ userId: endorsements.userId, name: users.name, organization: users.organization, note: endorsements.note, createdAt: endorsements.createdAt })
    .from(endorsements)
    .innerJoin(users, eq(users.id, endorsements.userId))
    .where(eq(endorsements.submissionId, id));
  return {
    ...row.s,
    // Some MySQL-compatible servers (e.g. MariaDB) return JSON columns as strings.
    aiScores: parseJson<Record<string, CriterionScore>>(row.s.aiScores),
    aiFlags: parseJson<string[]>(row.s.aiFlags),
    authorName: row.authorName,
    authorOrg: row.authorOrg,
    authorBio: row.authorBio,
    endorsers,
  };
}

function parseJson<T>(v: unknown): T | null {
  if (v === null || v === undefined) return null;
  if (typeof v !== "string") return v as T;
  try {
    return JSON.parse(v) as T;
  } catch {
    return null;
  }
}

export async function upvotedBy(userId: string | undefined, submissionIds: string[]): Promise<Set<string>> {
  if (!userId || submissionIds.length === 0) return new Set();
  const rows = await db
    .select({ id: upvotes.submissionId })
    .from(upvotes)
    .where(and(eq(upvotes.userId, userId), inArray(upvotes.submissionId, submissionIds)));
  return new Set(rows.map((r) => r.id));
}
