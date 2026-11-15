import { eq } from "drizzle-orm";
import type { Metadata } from "next";

import { Card, PageHeader } from "@/components/ui";
import { config, roleLabel, type RoleKey } from "@/config";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { asValues } from "@/lib/fields";

import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const me = await requireUser("/profile");
  const [row] = await db.select().from(users).where(eq(users.id, me.id)).limit(1);
  const fields = config.roles[me.role as RoleKey]?.profileFields ?? [];

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Your profile" subtitle={`${roleLabel(me.role)} · ${me.email}`} />
      <Card>
        <ProfileForm fields={fields} initial={{ name: row.name, organization: row.organization, bio: row.bio, profile: asValues(row.profile) }} />
      </Card>
    </div>
  );
}
