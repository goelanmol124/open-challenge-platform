import type { Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components/ui";
import { activePresetId, config, roleLabel } from "@/config";
import { DEMO_PASSWORD, seeds } from "@/config/seeds";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  // Demo accounts are only listed outside production, for one-click testing.
  const demos = process.env.NODE_ENV !== "production" && config.auth.showDemoAccounts ? (seeds[activePresetId]?.users ?? []) : [];

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">Sign in to {config.branding.name}</h1>
      <Card>
        <LoginForm next={next} />
      </Card>
      {config.auth.allowSignup && (
        <p className="text-sm text-muted-foreground">
          New here?{" "}
          <Link href="/auth/register" className="text-brand underline">
            Create an account
          </Link>
        </p>
      )}
      {demos.length > 0 && (
        <Card className="text-xs">
          <p className="mb-2 font-semibold">Demo accounts (development only, after `npm run db:seed`)</p>
          <p className="mb-2 text-muted-foreground">
            Password for all: <code>{DEMO_PASSWORD}</code>. Admin: the SEED_ADMIN_* values from your env.
          </p>
          <ul className="space-y-1">
            {demos.map((u) => (
              <li key={u.email}>
                <code>{u.email}</code> <span className="text-muted-foreground">· {roleLabel(u.role)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
