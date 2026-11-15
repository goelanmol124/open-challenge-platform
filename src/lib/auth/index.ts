import "server-only";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { db } from "@/lib/db";
import { users, type User } from "@/lib/db/schema";

import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession } from "./session";

export type CurrentUser = Pick<User, "id" | "email" | "name" | "role" | "approved" | "organization">;

/** The signed-in user (fresh from the DB, so role changes apply immediately). */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  try {
    const [row] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        approved: users.approved,
        organization: users.organization,
      })
      .from(users)
      .where(eq(users.id, session.sub))
      .limit(1);
    return row ?? null;
  } catch (err) {
    console.error("[auth] could not load current user", err);
    return null;
  }
});

export async function requireUser(redirectTo = "/"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(redirectTo)}`);
  return user;
}

export async function startSession(user: { id: string; role: string }) {
  const token = await signSession({ sub: user.id, role: user.role });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
