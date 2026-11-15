import { and, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";

import { Card, EmptyState, PageHeader } from "@/components/ui";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications" };

async function markAllRead() {
  "use server";
  const user = await getCurrentUser();
  if (!user) return;
  await db.update(notifications).set({ isRead: true }).where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));
  revalidatePath("/", "layout");
}

export default async function NotificationsPage() {
  const user = await requireUser("/notifications");
  const rows = await db.select().from(notifications).where(eq(notifications.userId, user.id)).orderBy(desc(notifications.createdAt)).limit(100);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Notifications"
        actions={
          rows.some((r) => !r.isRead) && (
            <form action={markAllRead}>
              <button className="h-8 rounded-md border border-border px-3 text-xs hover:bg-muted">Mark all read</button>
            </form>
          )
        }
      />
      {rows.length === 0 ? (
        <EmptyState>You&apos;re all caught up.</EmptyState>
      ) : (
        <ul className="space-y-2">
          {rows.map((n) => {
            const body = (
              <Card className={`p-4 ${n.isRead ? "" : "border-brand/40"}`}>
                <div className="flex justify-between gap-4">
                  <p className={`text-sm ${n.isRead ? "" : "font-semibold"}`}>{n.title}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDate(n.createdAt)}</span>
                </div>
                {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
              </Card>
            );
            return <li key={n.id}>{n.link?.startsWith("/") ? <Link href={n.link}>{body}</Link> : body}</li>;
          })}
        </ul>
      )}
    </div>
  );
}
