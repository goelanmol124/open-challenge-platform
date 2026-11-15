import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";

export type NewNotification = { userId: string; title: string; body?: string | null; link?: string | null };

/** Best-effort: never throws, a failed notification must not fail the action. */
export async function notify(items: NewNotification | NewNotification[]): Promise<void> {
  const list = Array.isArray(items) ? items : [items];
  if (list.length === 0) return;
  try {
    await db.insert(notifications).values(
      list.map((n) => ({ userId: n.userId, title: n.title.slice(0, 255), body: n.body ?? null, link: n.link ?? null })),
    );
  } catch (err) {
    console.error("[notify] failed", err);
  }
}
