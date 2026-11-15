import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SubmissionRow } from "@/components/cards";
import { FieldDisplay } from "@/components/field-display";
import { Markdown } from "@/components/markdown";
import { StageBadge } from "@/components/status-badges";
import { Avatar, Badge, ButtonLink, Card, EmptyState } from "@/components/ui";
import { config, t } from "@/config";
import { getCurrentUser } from "@/lib/auth";
import { asValues } from "@/lib/fields";
import { canManageChallenge, canSeeAiScores, canSubmit, canViewChallenge, challengeAcceptsSubmissions } from "@/lib/permissions";
import { getChallenge, listSubmissions } from "@/lib/queries";
import { formatDate, relativeDays } from "@/lib/utils";

import { setChallengeStage } from "../actions";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ sort?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const c = await getChallenge(id).catch(() => null);
  return c ? { title: c.title, description: c.summary } : {};
}

export default async function ChallengePage({ params, searchParams }: Props) {
  const [{ id }, { sort: sortParam }] = await Promise.all([params, searchParams]);
  const [user, c] = await Promise.all([getCurrentUser(), getChallenge(id)]);
  if (!c || !canViewChallenge(user, c)) notFound();

  const isManager = canManageChallenge(user, c);
  const sort = sortParam === "votes" || sortParam === "new" ? sortParam : "score";
  const all = await listSubmissions({ challengeId: id, sort });
  const visible = config.submission.visibility === "public" || isManager ? all : all.filter((s) => s.authorId === user?.id);
  const mine = user ? all.filter((s) => s.authorId === user.id).length : 0;
  const canPost = canSubmit(user, c) && mine < config.submission.maxPerSolverPerChallenge;
  const open = challengeAcceptsSubmissions(c);
  // eslint-disable-next-line react-hooks/purity -- server component, rendered per request
  const now = Date.now();

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <StageBadge stage={c.stage} />
            {c.category && <Badge>{c.category}</Badge>}
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{c.title}</h1>
          <p className="text-muted-foreground">{c.summary}</p>
          <div className="flex items-center gap-2 text-sm">
            <Avatar name={c.ownerName} size={6} />
            <span>
              {c.ownerName}
              {c.ownerOrg && <span className="text-muted-foreground"> · {c.ownerOrg}</span>}
            </span>
          </div>
        </div>

        <Card>
          <Markdown content={c.description} />
        </Card>

        {config.challenge.fields.length > 0 && (
          <Card>
            <FieldDisplay fields={config.challenge.fields} values={asValues(c.fields)} showPrivate={isManager} />
          </Card>
        )}

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">
              {t.submission.plural} <span className="text-muted-foreground">({visible.length})</span>
            </h2>
            {visible.length > 1 && (
              <nav className="flex gap-1 text-xs">
                {(
                  [
                    ["score", "Best"],
                    ...(config.features.upvotes ? [["votes", `Most ${t.upvote.noun.toLowerCase()}`]] : []),
                    ["new", "Newest"],
                  ] as [string, string][]
                ).map(([k, label]) => (
                  <Link key={k} href={`?sort=${k}`} className={`rounded-md px-2 py-1 ${sort === k ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted"}`}>
                    {label}
                  </Link>
                ))}
              </nav>
            )}
          </div>
          {config.submission.visibility === "restricted" && !isManager && (
            <p className="text-xs text-muted-foreground">
              {t.submission.plural} are private: only you and the {config.roles.owner.label.toLowerCase()} can see yours.
            </p>
          )}
          {visible.length === 0 ? (
            <EmptyState>No {t.submission.plural.toLowerCase()} yet.</EmptyState>
          ) : (
            <div className="space-y-2">
              {visible.map((s) => (
                <SubmissionRow key={s.id} s={s} showScore={canSeeAiScores(user, c, s)} />
              ))}
            </div>
          )}
        </section>
      </div>

      <aside className="space-y-4">
        <Card className="space-y-3 text-sm">
          {config.challenge.showReward && c.reward && (
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.reward}</div>
              <div className="font-semibold">{c.reward}</div>
            </div>
          )}
          {config.challenge.showDeadline && c.deadline && (
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{t.deadline}</div>
              <div suppressHydrationWarning>
                {formatDate(c.deadline, config.branding.locale)} ({relativeDays(c.deadline, now, config.branding.locale)})
              </div>
            </div>
          )}
          {canPost ? (
            <ButtonLink href={`/challenges/${c.id}/submit`} className="w-full">
              Submit a {t.submission.singular.toLowerCase()}
            </ButtonLink>
          ) : !user && open ? (
            <ButtonLink href={`/auth/login?next=/challenges/${c.id}/submit`} className="w-full">
              Sign in to submit
            </ButtonLink>
          ) : (
            <p className="text-xs text-muted-foreground">
              {!open
                ? `Not accepting ${t.submission.plural.toLowerCase()} right now.`
                : user && mine >= config.submission.maxPerSolverPerChallenge
                  ? `You've reached the limit of ${config.submission.maxPerSolverPerChallenge} ${t.submission.plural.toLowerCase()}.`
                  : user && user.id !== c.ownerId
                    ? `Only ${config.permissions.submit.map((r) => config.roles[r].plural.toLowerCase()).join(" and ")} can submit.`
                    : null}
            </p>
          )}
        </Card>

        {isManager && (
          <Card className="space-y-3 text-sm">
            <div className="font-semibold">Manage</div>
            <form action={setChallengeStage.bind(null, c.id)} className="flex gap-2">
              <select name="stage" defaultValue={c.stage} className="h-9 flex-1 rounded-md border border-border bg-background px-2 text-sm" aria-label="Stage">
                {config.challenge.stages.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
              <button className="h-9 rounded-md border border-border px-3 hover:bg-muted">Set</button>
            </form>
            <ButtonLink href={`/challenges/${c.id}/edit`} variant="outline" size="sm" className="w-full">
              Edit {t.challenge.singular.toLowerCase()}
            </ButtonLink>
          </Card>
        )}
      </aside>
    </div>
  );
}
