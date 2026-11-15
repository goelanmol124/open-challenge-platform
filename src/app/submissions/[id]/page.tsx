import { BadgeCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FieldDisplay } from "@/components/field-display";
import { SubmitButton } from "@/components/form-bits";
import { ScorePanel } from "@/components/score-panel";
import { StatusBadge } from "@/components/status-badges";
import { Avatar, ButtonLink, Card } from "@/components/ui";
import { UpvoteButton } from "@/components/upvote-button";
import { config, t } from "@/config";
import { getCurrentUser } from "@/lib/auth";
import { asValues } from "@/lib/fields";
import {
  canEditSubmission,
  canEndorse,
  canManageChallenge,
  canRunEvaluation,
  canSeeAiScores,
  canSetSubmissionStatus,
  canViewPrivateFields,
  canViewSubmission,
} from "@/lib/permissions";
import { getChallenge, getSubmission, upvotedBy } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

import { runEvaluation, setSubmissionStatus, toggleEndorsement } from "../actions";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const s = await getSubmission(id).catch(() => null);
  return s && config.submission.visibility === "public" ? { title: s.title } : { title: t.submission.singular };
}

export default async function SubmissionPage({ params }: Props) {
  const { id } = await params;
  const [user, s] = await Promise.all([getCurrentUser(), getSubmission(id)]);
  if (!s) notFound();
  const c = await getChallenge(s.challengeId);
  if (!c || !canViewSubmission(user, c, s)) notFound();

  const isManager = canManageChallenge(user, c);
  const showScores = canSeeAiScores(user, c, s);
  const myUpvotes = await upvotedBy(user?.id, [s.id]);
  const iEndorsed = !!user && s.endorsers.some((e) => e.userId === user.id);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-6">
        <div className="space-y-3">
          <Link href={`/challenges/${c.id}`} className="text-sm text-muted-foreground hover:text-foreground">
            ← {c.title}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={s.status} />
            {s.endorsers.length > 0 && config.features.endorsements && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand">
                <BadgeCheck className="h-4 w-4" /> {t.endorsement.past} by {s.endorsers.map((e) => e.name).join(", ")}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{s.title}</h1>
          <div className="flex items-center gap-2 text-sm">
            <Avatar name={s.authorName} size={6} />
            <span>
              {s.authorName}
              {s.authorOrg && <span className="text-muted-foreground"> · {s.authorOrg}</span>}
            </span>
            <span className="text-muted-foreground">· {formatDate(s.createdAt, config.branding.locale)}</span>
          </div>
        </div>

        <Card className="space-y-5">
          <section>
            <h2 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{config.submission.summaryLabel}</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{s.summary}</p>
          </section>
          <FieldDisplay fields={config.submission.fields} values={asValues(s.fields)} showPrivate={canViewPrivateFields(user, c, s)} />
        </Card>

        <div className="flex flex-wrap gap-2">
          {config.features.upvotes && (
            <UpvoteButton id={s.id} initialCount={s.upvoteCount} initialUpvoted={myUpvotes.has(s.id)} label={t.upvote.verb} />
          )}
          {canEditSubmission(user, c, s) && (
            <ButtonLink href={`/submissions/${s.id}/edit`} variant="outline" size="sm">
              Edit
            </ButtonLink>
          )}
        </div>

        {s.endorsers.some((e) => e.note) && (
          <section className="space-y-2">
            <h2 className="font-semibold">{t.endorsement.noun} notes</h2>
            {s.endorsers
              .filter((e) => e.note)
              .map((e) => (
                <Card key={e.userId} className="p-4 text-sm">
                  <p className="whitespace-pre-wrap">{e.note}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {e.name}
                    {e.organization && ` · ${e.organization}`}
                  </p>
                </Card>
              ))}
          </section>
        )}
      </div>

      <aside className="space-y-4">
        {showScores && config.evaluation.enabled && (
          <ScorePanel
            aiStatus={s.aiStatus}
            overall={s.aiOverall}
            scores={s.aiScores}
            gatePassed={s.aiGatePassed}
            gateReason={s.aiGateReason}
            summary={s.aiSummary}
            flags={s.aiFlags}
            model={s.aiModel}
            error={s.aiError}
            showError={isManager}
          />
        )}

        {canEndorse(user, c, s) && (
          <Card className="space-y-2 text-sm">
            <form action={toggleEndorsement.bind(null, s.id)} className="space-y-2">
              {!iEndorsed && (
                <textarea
                  name="note"
                  rows={3}
                  placeholder="Optional note to the author"
                  className="w-full rounded-md border border-border bg-background p-2 text-sm"
                  maxLength={1000}
                />
              )}
              <SubmitButton variant={iEndorsed ? "outline" : "primary"} size="sm">
                {iEndorsed ? `Withdraw ${t.endorsement.noun.toLowerCase()}` : t.endorsement.verb}
              </SubmitButton>
            </form>
          </Card>
        )}

        {canSetSubmissionStatus(user, c) && (
          <Card className="space-y-3 text-sm">
            <div className="font-semibold">Review</div>
            <form action={setSubmissionStatus.bind(null, s.id)} className="flex gap-2">
              <select name="status" defaultValue={s.status} aria-label="Status" className="h-9 flex-1 rounded-md border border-border bg-background px-2 text-sm">
                {config.submission.statuses.map((st) => (
                  <option key={st.key} value={st.key}>
                    {st.label}
                  </option>
                ))}
              </select>
              <SubmitButton variant="outline" size="sm">
                Set
              </SubmitButton>
            </form>
            {canRunEvaluation(user, c) && (
              <form action={runEvaluation.bind(null, s.id)}>
                <SubmitButton variant="ghost" size="sm" pendingText="Evaluating…">
                  {s.aiStatus === "done" ? "Re-run AI evaluation" : "Run AI evaluation now"}
                </SubmitButton>
              </form>
            )}
          </Card>
        )}
      </aside>
    </div>
  );
}
