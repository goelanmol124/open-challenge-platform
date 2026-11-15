import { ArrowRight } from "lucide-react";

import { ChallengeCard } from "@/components/cards";
import { ButtonLink, EmptyState } from "@/components/ui";
import { config, t } from "@/config";
import { getCurrentUser } from "@/lib/auth";
import { canCreateChallenge } from "@/lib/permissions";
import { listChallenges } from "@/lib/queries";

export default async function HomePage() {
  const { branding } = config;
  const [user, items] = await Promise.all([
    getCurrentUser(),
    listChallenges({ limit: 6 }).catch((err) => {
      console.error("[home] could not load challenges — is the database running?", err);
      return [];
    }),
  ]);
  // eslint-disable-next-line react-hooks/purity -- server component, rendered per request
  const now = Date.now();

  const steps = [
    { n: 1, title: `${config.roles.owner.plural} post ${t.challenge.plural.toLowerCase()}`, body: config.roles.owner.description },
    { n: 2, title: `${config.roles.solver.plural} submit ${t.submission.plural.toLowerCase()}`, body: config.roles.solver.description },
    ...(config.evaluation.enabled
      ? [{ n: 3, title: "AI evaluates every one", body: `Scored on ${config.evaluation.criteria.map((c) => c.label.toLowerCase()).join(", ")}.` }]
      : []),
    ...(config.features.endorsements
      ? [{ n: config.evaluation.enabled ? 4 : 3, title: `${config.roles.owner.plural} ${t.endorsement.verb.toLowerCase()} the best`, body: `${t.endorsement.past} ${t.submission.plural.toLowerCase()} move forward.` }]
      : []),
  ];

  return (
    <div className="space-y-14">
      <section className="rounded-2xl border border-border bg-gradient-to-br from-brand/10 via-background to-accent/10 px-6 py-14 sm:px-12">
        <p className="mb-3 text-sm font-semibold text-brand">{branding.tagline}</p>
        <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">{branding.hero.title}</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground sm:text-lg">{branding.hero.subtitle}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/challenges" size="lg">
            {branding.hero.primaryCta} <ArrowRight />
          </ButtonLink>
          <ButtonLink href={canCreateChallenge(user) ? "/challenges/new" : user ? "/about" : "/auth/register"} size="lg" variant="outline">
            {branding.hero.secondaryCta}
          </ButtonLink>
        </div>
      </section>

      <section>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <li key={s.n} className="rounded-xl border border-border p-5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-brand-foreground">{s.n}</span>
              <h3 className="mt-3 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-xl font-semibold">Latest {t.challenge.plural.toLowerCase()}</h2>
          <ButtonLink href="/challenges" variant="ghost" size="sm">
            See all <ArrowRight />
          </ButtonLink>
        </div>
        {items.length === 0 ? (
          <EmptyState>
            No {t.challenge.plural.toLowerCase()} yet. Run <code>npm run db:seed</code> to load demo data.
          </EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((c) => (
              <ChallengeCard key={c.id} c={c} now={now} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
