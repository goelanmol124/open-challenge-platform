import { count, desc } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SubmitButton } from "@/components/form-bits";
import { StageBadge } from "@/components/status-badges";
import { Badge, Card, PageHeader } from "@/components/ui";
import { activePresetId, config, roleLabel, t } from "@/config";
import { roleKeys } from "@/config/schema";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { submissions, users } from "@/lib/db/schema";
import { listChallenges } from "@/lib/queries";

import { runPendingEvaluations, setUserApproved, setUserRole, toggleFeatured } from "./actions";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  const me = await requireUser("/admin");
  if (me.role !== "admin") notFound();

  const [allUsers, allChallenges, aiCounts] = await Promise.all([
    db.select().from(users).orderBy(desc(users.createdAt)).limit(200),
    listChallenges({ includeNonPublic: true, limit: 200 }),
    db.select({ status: submissions.aiStatus, n: count() }).from(submissions).groupBy(submissions.aiStatus),
  ]);
  const pendingApproval = allUsers.filter((u) => !u.approved);

  return (
    <div className="space-y-10">
      <PageHeader title="Admin" subtitle={`Preset: ${activePresetId} · AI provider: ${process.env.AI_PROVIDER || "gemini"}`} />

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="text-xs uppercase text-muted-foreground">Users</div>
          <div className="text-2xl font-bold">{allUsers.length}</div>
        </Card>
        <Card>
          <div className="text-xs uppercase text-muted-foreground">{t.challenge.plural}</div>
          <div className="text-2xl font-bold">{allChallenges.length}</div>
        </Card>
        <Card className="space-y-2">
          <div className="text-xs uppercase text-muted-foreground">AI evaluations</div>
          <div className="flex flex-wrap gap-1">
            {aiCounts.map((r) => (
              <Badge key={r.status} tone={r.status === "failed" ? "danger" : r.status === "done" ? "success" : "neutral"}>
                {r.status}: {Number(r.n)}
              </Badge>
            ))}
          </div>
          {config.evaluation.enabled && (
            <form action={runPendingEvaluations}>
              <SubmitButton size="sm" variant="outline" pendingText="Running…">
                Run pending now
              </SubmitButton>
            </form>
          )}
        </Card>
      </section>

      {pendingApproval.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Awaiting approval</h2>
          <div className="space-y-2">
            {pendingApproval.map((u) => (
              <Card key={u.id} className="flex items-center justify-between p-4 text-sm">
                <span>
                  {u.name} · {u.email} · {roleLabel(u.role)} {u.organization && `· ${u.organization}`}
                </span>
                <form action={setUserApproved.bind(null, u.id, true)}>
                  <SubmitButton size="sm">Approve</SubmitButton>
                </form>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Users</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Approved</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-3 py-2">{u.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{u.email}</td>
                  <td className="px-3 py-2">
                    <form action={setUserRole.bind(null, u.id)} className="flex gap-1">
                      <select name="role" defaultValue={u.role} aria-label="Role" className="h-8 rounded-md border border-border bg-background px-2 text-xs">
                        {roleKeys.map((r) => (
                          <option key={r} value={r}>
                            {roleLabel(r)}
                          </option>
                        ))}
                      </select>
                      <button className="h-8 rounded-md border border-border px-2 text-xs hover:bg-muted">Set</button>
                    </form>
                  </td>
                  <td className="px-3 py-2">
                    <form action={setUserApproved.bind(null, u.id, !u.approved)}>
                      <button className="text-xs underline">{u.approved ? "Yes (revoke)" : "No (approve)"}</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t.challenge.plural}</h2>
        <div className="space-y-2">
          {allChallenges.map((c) => (
            <Card key={c.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <StageBadge stage={c.stage} />
                <Link href={`/challenges/${c.id}`} className="truncate hover:underline">
                  {c.title}
                </Link>
                <span className="text-muted-foreground">· {c.submissionCount}</span>
              </span>
              <form action={toggleFeatured.bind(null, c.id)}>
                <button className="text-xs underline">{c.featured ? "Unfeature" : "Feature"}</button>
              </form>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
