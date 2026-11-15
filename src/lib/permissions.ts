/**
 * All "who may do what" rules in one place, driven by config.permissions,
 * config.challenge.stages and config.evaluation/submission visibility.
 */
import { config, getStage, type RoleKey } from "@/config";

type Actor = { id: string; role: string; approved: boolean } | null | undefined;
type ChallengeLike = { ownerId: string; stage: string; deadline?: Date | null };
type SubmissionLike = { authorId: string };

const isAdmin = (u: Actor) => u?.role === "admin";

export function canCreateChallenge(u: Actor): boolean {
  if (!u) return false;
  if (isAdmin(u)) return true;
  if (!config.permissions.createChallenge.includes(u.role as RoleKey)) return false;
  if (u.role === "owner" && config.permissions.ownerApprovalRequired && !u.approved) return false;
  return true;
}

export function canManageChallenge(u: Actor, c: ChallengeLike): boolean {
  return !!u && (isAdmin(u) || u.id === c.ownerId);
}

export function canViewChallenge(u: Actor, c: ChallengeLike): boolean {
  const stage = getStage(c.stage);
  return (stage?.public ?? false) || canManageChallenge(u, c);
}

export function challengeAcceptsSubmissions(c: ChallengeLike): boolean {
  const stage = getStage(c.stage);
  if (!stage?.acceptsSubmissions) return false;
  return !(c.deadline && c.deadline.getTime() < Date.now());
}

export function canSubmit(u: Actor, c: ChallengeLike): boolean {
  if (!u) return false;
  if (u.id === c.ownerId) return false;
  if (!isAdmin(u) && !config.permissions.submit.includes(u.role as RoleKey)) return false;
  return challengeAcceptsSubmissions(c);
}

export function canViewSubmission(u: Actor, c: ChallengeLike, s: SubmissionLike): boolean {
  if (config.submission.visibility === "public") return canViewChallenge(u, c);
  return !!u && (u.id === s.authorId || canManageChallenge(u, c));
}

/** Private fields and contact details. */
export function canViewPrivateFields(u: Actor, c: ChallengeLike, s: SubmissionLike): boolean {
  return !!u && (u.id === s.authorId || canManageChallenge(u, c));
}

export function canEditSubmission(u: Actor, c: ChallengeLike, s: SubmissionLike): boolean {
  if (!u) return false;
  if (isAdmin(u)) return true;
  return u.id === s.authorId && config.submission.allowEditAfterSubmit && challengeAcceptsSubmissions(c);
}

export function canSetSubmissionStatus(u: Actor, c: ChallengeLike): boolean {
  return canManageChallenge(u, c);
}

export function canEndorse(u: Actor, c: ChallengeLike, s: SubmissionLike): boolean {
  if (!config.features.endorsements || !u || u.id === s.authorId) return false;
  if (isAdmin(u)) return true;
  if (config.permissions.endorse === "challenge-owner") return u.id === c.ownerId;
  return u.role === "owner" && (u.approved || !config.permissions.ownerApprovalRequired);
}

export function canSeeAiScores(u: Actor, c: ChallengeLike, s: SubmissionLike): boolean {
  switch (config.evaluation.visibility) {
    case "public":
      return true;
    case "owner-and-author":
      return !!u && (u.id === s.authorId || canManageChallenge(u, c));
    case "owner-only":
      return canManageChallenge(u, c);
  }
}

export function canRunEvaluation(u: Actor, c: ChallengeLike): boolean {
  return config.evaluation.enabled && canManageChallenge(u, c);
}
