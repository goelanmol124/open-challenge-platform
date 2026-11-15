import type { Metadata } from "next";
import Link from "next/link";

import { ChallengeCard } from "@/components/cards";
import { ButtonLink, EmptyState, Input, PageHeader, Select } from "@/components/ui";
import { config, t } from "@/config";
import { getCurrentUser } from "@/lib/auth";
import { canCreateChallenge } from "@/lib/permissions";
import { listChallenges } from "@/lib/queries";

export const metadata: Metadata = { title: t.challenge.plural };

type Search = { stage?: string; category?: string; q?: string };

export default async function ChallengesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const stage = config.challenge.stages.find((s) => s.key === sp.stage && s.public)?.key;
  const category = config.categories.includes(sp.category ?? "") ? sp.category : undefined;
  const q = sp.q?.trim().slice(0, 100) || undefined;

  const [user, items] = await Promise.all([getCurrentUser(), listChallenges({ stage, category, q })]);
  // eslint-disable-next-line react-hooks/purity -- server component, rendered per request
  const now = Date.now();

  return (
    <div>
      <PageHeader
        title={t.challenge.plural}
        subtitle={`${items.length} ${items.length === 1 ? t.challenge.singular.toLowerCase() : t.challenge.plural.toLowerCase()}`}
        actions={canCreateChallenge(user) && <ButtonLink href="/challenges/new">Post a {t.challenge.singular.toLowerCase()}</ButtonLink>}
      />

      <form className="mb-6 grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]" role="search">
        <Input name="q" defaultValue={q} placeholder={`Search ${t.challenge.plural.toLowerCase()}…`} aria-label="Search" />
        <Select name="category" defaultValue={category ?? ""} aria-label={t.category.singular}>
          <option value="">All {t.category.plural.toLowerCase()}</option>
          {config.categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
        <Select name="stage" defaultValue={stage ?? ""} aria-label="Stage">
          <option value="">All stages</option>
          {config.challenge.stages
            .filter((s) => s.public)
            .map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
        </Select>
        <button className="h-10 rounded-md border border-border px-4 text-sm hover:bg-muted">Filter</button>
      </form>

      {items.length === 0 ? (
        <EmptyState>
          Nothing here yet.{" "}
          {(q || category || stage) && (
            <Link href="/challenges" className="text-brand underline">
              Clear filters
            </Link>
          )}
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <ChallengeCard key={c.id} c={c} now={now} />
          ))}
        </div>
      )}
    </div>
  );
}
