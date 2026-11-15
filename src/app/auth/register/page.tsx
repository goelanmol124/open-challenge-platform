import type { Metadata } from "next";
import Link from "next/link";

import { Card } from "@/components/ui";
import { config } from "@/config";

import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  if (!config.auth.allowSignup) {
    return <p className="text-muted-foreground">Sign-ups are currently closed.</p>;
  }
  const roles = config.auth.signupRoles.map((r) => ({
    value: r,
    label: config.roles[r].label,
    description:
      config.roles[r].description +
      (r === "owner" && config.permissions.ownerApprovalRequired ? " (An admin approves new accounts before you can post.)" : ""),
  }));

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <h1 className="text-2xl font-bold">Join {config.branding.name}</h1>
      <Card>
        <RegisterForm roles={roles} orgLabel="Organisation" />
      </Card>
      {config.auth.allowedEmailDomains.length > 0 && (
        <p className="text-xs text-muted-foreground">Sign-up is limited to {config.auth.allowedEmailDomains.join(", ")} addresses.</p>
      )}
      <p className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-brand underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
