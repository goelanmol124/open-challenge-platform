import { Award, CalendarClock, MessageSquare } from "lucide-react";
import Link from "next/link";

import { config, t } from "@/config";
import { asValues, formatValue, isEmpty } from "@/lib/fields";
import type { ChallengeListItem, SubmissionListItem } from "@/lib/queries";
import { relativeDays } from "@/lib/utils";

import { ScoreBadge } from "./score-panel";
import { StageBadge, StatusBadge } from "./status-badges";
import { Badge, Card } from "./ui";

export function ChallengeCard({ c, now }: { c: ChallengeListItem; now: number }) {
  const values = asValues(c.fields);
  const cardFields = config.challenge.fields.filter((f) => f.showOnCard && !f.private && !isEmpty(values[f.key]));
  return (
    <Link href={`/challenges/${c.id}`} className="group block">
      <Card className="flex h-full flex-col gap-3 transition-colors group-hover:border-brand/50">
        <div className="flex flex-wrap items-center gap-2">
          <StageBadge stage={c.stage} />
          {c.category && <Badge>{c.category}</Badge>}
          {c.featured && <Badge tone="brand">Featured</Badge>}
        </div>
        <div>
          <h3 className="font-semibold leading-snug group-hover:text-brand">{c.title}</h3>
          <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{c.summary}</p>
        </div>
        {cardFields.length > 0 && (
          <dl className="space-y-0.5 text-xs">
            {cardFields.map((f) => (
              <div key={f.key} className="flex gap-1">
                <dt className="text-muted-foreground">{f.label}:</dt>
                <dd className="truncate">{formatValue(f, values[f.key])}</dd>
              </div>
            ))}
          </dl>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-xs text-muted-foreground">
          <span className="truncate">{c.ownerOrg || c.ownerName}</span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" /> {c.submissionCount} {c.submissionCount === 1 ? t.submission.singular.toLowerCase() : t.submission.plural.toLowerCase()}
          </span>
          {config.challenge.showDeadline && c.deadline && (
            <span className="flex items-center gap-1" suppressHydrationWarning>
              <CalendarClock className="h-3 w-3" /> {t.deadline} {relativeDays(c.deadline, now, config.branding.locale)}
            </span>
          )}
          {config.challenge.showReward && c.reward && (
            <span className="flex items-center gap-1">
              <Award className="h-3 w-3" /> {c.reward}
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}

export function SubmissionRow({ s, showChallenge = false, showScore = true }: { s: SubmissionListItem; showChallenge?: boolean; showScore?: boolean }) {
  const values = asValues(s.fields);
  const cardFields = config.submission.fields.filter((f) => f.showOnCard && !f.private && !isEmpty(values[f.key]));
  return (
    <Link href={`/submissions/${s.id}`} className="group block">
      <Card className="flex flex-col gap-2 p-4 transition-colors group-hover:border-brand/50 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {showChallenge && <p className="mb-0.5 truncate text-xs text-muted-foreground">{s.challengeTitle}</p>}
          <h3 className="font-medium group-hover:text-brand">{s.title}</h3>
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{s.summary}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            by {s.authorName}
            {cardFields.map((f) => ` · ${formatValue(f, values[f.key])}`)}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:flex-col sm:items-end">
          {showScore && config.evaluation.enabled && <ScoreBadge overall={s.aiStatus === "done" ? s.aiOverall : null} />}
          {s.status !== config.submission.defaultStatus && <StatusBadge status={s.status} />}
          {config.features.endorsements && s.endorsementCount > 0 && <Badge tone="brand">{t.endorsement.past}</Badge>}
          {config.features.upvotes && s.upvoteCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {s.upvoteCount} {t.upvote.noun.toLowerCase()}
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
