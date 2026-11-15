import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SubmissionRow } from "@/components/cards";
import { EmptyState, PageHeader } from "@/components/ui";
import { config, publicStageKeys, t } from "@/config";
import { listSubmissions } from "@/lib/queries";

export const metadata: Metadata = { title: `Top ${t.submission.plural.toLowerCase()}` };

export default async function LeaderboardPage() {
  // Only meaningful when submissions and scores are public.
  if (!config.features.leaderboard || config.submission.visibility !== "public") notFound();
  const showScores = config.evaluation.visibility === "public";

  const rows = (await listSubmissions({ sort: "score", limit: 100 })).filter((s) => publicStageKeys.includes(s.challengeStage)).slice(0, 30);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={`Top ${t.submission.plural.toLowerCase()}`}
        subtitle={`Ranked by ${config.features.endorsements ? `${t.endorsement.noun.toLowerCase()}s, then ` : ""}${showScores ? "AI score, then " : ""}${t.upvote.noun.toLowerCase()}.`}
      />
      {rows.length === 0 ? (
        <EmptyState>Nothing here yet.</EmptyState>
      ) : (
        <ol className="space-y-2">
          {rows.map((s, i) => (
            <li key={s.id} className="flex items-start gap-3">
              <span className="mt-4 w-6 shrink-0 text-right text-sm font-semibold tabular-nums text-muted-foreground">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <SubmissionRow s={s} showChallenge showScore={showScores} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
