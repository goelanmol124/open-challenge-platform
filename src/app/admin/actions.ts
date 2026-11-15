"use server";

import { count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { roleKeys } from "@/config/schema";
import { evaluatePending } from "@/lib/ai/evaluate";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { challenges, users } from "@/lib/db/schema";
import { notify } from "@/lib/notifications";

async function requireAdmin() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") throw new Error("Admins only");
  return user;
}

export async function setUserRole(userId: string, form: FormData): Promise<void> {
  const admin = await requireAdmin();
  const role = String(form.get("role"));
  if (!(roleKeys as readonly string[]).includes(role)) return;
  if (userId === admin.id && role !== "admin") {
    const [{ n }] = await db.select({ n: count() }).from(users).where(eq(users.role, "admin"));
    if (Number(n) <= 1) return; // never remove the last admin
  }
  await db.update(users).set({ role }).where(eq(users.id, userId));
  revalidatePath("/admin");
}

export async function setUserApproved(userId: string, approved: boolean): Promise<void> {
  await requireAdmin();
  await db.update(users).set({ approved }).where(eq(users.id, userId));
  if (approved) await notify({ userId, title: "Your account has been approved", link: "/dashboard" });
  revalidatePath("/admin");
}

export async function toggleFeatured(challengeId: string): Promise<void> {
  await requireAdmin();
  const [c] = await db.select({ featured: challenges.featured }).from(challenges).where(eq(challenges.id, challengeId)).limit(1);
  if (!c) return;
  await db.update(challenges).set({ featured: !c.featured }).where(eq(challenges.id, challengeId));
  revalidatePath("/admin");
  revalidatePath("/challenges");
}

export async function runPendingEvaluations(): Promise<void> {
  await requireAdmin();
  await evaluatePending(20);
  revalidatePath("/admin");
}
