import { and, count, eq } from "drizzle-orm";
import { Bell } from "lucide-react";
import Link from "next/link";

import { config } from "@/config";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { canCreateChallenge } from "@/lib/permissions";
import { initials } from "@/lib/utils";

import { ButtonLink } from "./ui";

async function unreadCount(userId: string): Promise<number> {
  try {
    const [row] = await db
      .select({ n: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return Number(row?.n ?? 0);
  } catch {
    return 0;
  }
}

export async function SiteHeader() {
  const user = await getCurrentUser();
  const unread = user ? await unreadCount(user.id) : 0;
  const { branding, terminology: t } = config;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          {branding.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-provided logo path
            <img src={branding.logoUrl} alt="" className="h-7 w-7 rounded" />
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-[11px] font-bold text-brand-foreground">
              {branding.logoText ?? initials(branding.name)}
            </span>
          )}
          <span className="hidden sm:inline">{branding.name}</span>
        </Link>

        <nav className="flex flex-1 items-center gap-1 text-sm">
          <Link href="/challenges" className="rounded-md px-3 py-1.5 hover:bg-muted">
            {t.challenge.plural}
          </Link>
          {config.features.leaderboard && config.submission.visibility === "public" && (
            <Link href="/leaderboard" className="hidden rounded-md px-3 py-1.5 hover:bg-muted sm:inline">
              Top {t.submission.plural.toLowerCase()}
            </Link>
          )}
          <Link href="/about" className="hidden rounded-md px-3 py-1.5 hover:bg-muted md:inline">
            How it works
          </Link>
          {user && (
            <Link href="/dashboard" className="rounded-md px-3 py-1.5 hover:bg-muted">
              Dashboard
            </Link>
          )}
          {user?.role === "admin" && (
            <Link href="/admin" className="rounded-md px-3 py-1.5 hover:bg-muted">
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {canCreateChallenge(user) && (
                <ButtonLink href="/challenges/new" size="sm" className="hidden sm:inline-flex">
                  New {t.challenge.singular.toLowerCase()}
                </ButtonLink>
              )}
              <Link href="/notifications" className="relative rounded-md p-2 hover:bg-muted" aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}>
                <Bell className="h-4 w-4" />
                {unread > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-brand" />}
              </Link>
              <Link href="/profile" className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline">
                {user.name}
              </Link>
              <form action="/auth/logout" method="post">
                <button className="rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted">Sign out</button>
              </form>
            </>
          ) : (
            <>
              <ButtonLink href="/auth/login" variant="ghost" size="sm">
                Sign in
              </ButtonLink>
              {config.auth.allowSignup && (
                <ButtonLink href="/auth/register" size="sm">
                  Sign up
                </ButtonLink>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
