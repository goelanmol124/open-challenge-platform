import type { Metadata } from "next";
import Link from "next/link";

import { ChallengeCard, SubmissionRow } from "@/components/cards";
import { ButtonLink, Card, EmptyState, PageHeader } from "@/components/ui";
import { config, roleLabel, t } from "@/config";
import { requireUser } from "@/lib/auth";
import { canCreateChallenge } from "@/lib/permissions";
import { listChallenges, listSubmissions } from "@/lib/queries";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const postsChallenges = user.role === "owner" || user.role === "admin";

  const [myChallenges, mySubmissions] = await Promise.all([
    postsChallenges ? listChallenges({ ownerId: user.id, includeNonPublic: true }) : Promise.resolve([]),
    listSubmissions({ authorId: user.id, sort: "new" }),
  ]);
  const incoming = myChallenges.length ? await listSubmissions({ challengeIds: myChallenges.map((c) => c.id), sort: "new", limit: 100 }) : [];
  const toReview = incoming.filter((s) => s.status === config.submission.defaultStatus).slice(0, 20);
  // eslint-disable-next-line react-hooks/purity -- server component, rendered per request
  const now = Date.now();

  return (
    <div className="space-y-10">
      <PageHeader
        title={`Hi, ${user.name.split(" ")[0]}`}
        subtitle={roleLabel(user.role)}
        actions={canCreateChallenge(user) && <ButtonLink href="/challenges/new">Post a {t.challenge.singular.toLowerCase()}</ButtonLink>}
      />

      {user.role === "owner" && !user.approved && (
        <Card className="text-sm">Your account is awaiting admin approval. You can browse in the meantime.</Card>
      )}

      {postsChallenges && (
        <>
          <section>
            <h2 className="mb-3 text-lg font-semibold">
              Awaiting your review <span className="text-muted-foreground">({toReview.length})</span>
            </h2>
            {toReview.length === 0 ? (
              <EmptyState>Nothing new to review.</EmptyState>
            ) : (
              <div className="space-y-2">
                {toReview.map((s) => (
                  <SubmissionRow key={s.id} s={s} showChallenge />
                ))}
              </div>
            )}
          </section>
          <section>
            <h2 className="mb-3 text-lg font-semibold">Your {t.challenge.plural.toLowerCase()}</h2>
            {myChallenges.length === 0 ? (
              <EmptyState>You haven&apos;t posted anything yet.</EmptyState>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {myChallenges.map((c) => (
                  <ChallengeCard key={c.id} c={c} now={now} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {(user.role !== "owner" || mySubmissions.length > 0) && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Your {t.submission.plural.toLowerCase()}</h2>
          {mySubmissions.length === 0 ? (
            <EmptyState>
              No {t.submission.plural.toLowerCase()} yet.{" "}
              <Link href="/challenges" className="text-brand underline">
                Find a {t.challenge.singular.toLowerCase()}
              </Link>
            </EmptyState>
          ) : (
            <div className="space-y-2">
              {mySubmissions.map((s) => (
                <SubmissionRow key={s.id} s={s} showChallenge />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
