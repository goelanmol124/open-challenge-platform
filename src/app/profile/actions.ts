"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { FormState } from "@/components/form-bits";
import { config, type RoleKey } from "@/config";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { readFieldsFromForm, validateFields } from "@/lib/fields";

const Base = z.object({
  name: z.string().trim().min(2, "Enter your name").max(255),
  organization: z.string().trim().max(255).nullable(),
  bio: z.string().trim().max(2000).nullable(),
});

export async function updateProfile(_: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not signed in." };
  const fields = config.roles[user.role as RoleKey]?.profileFields ?? [];

  const base = Base.safeParse({ name: form.get("name"), organization: form.get("organization") || null, bio: form.get("bio") || null });
  const custom = validateFields(fields, readFieldsFromForm(fields, form));
  if (!base.success) return { error: base.error.issues[0]?.message };
  if (!custom.ok) return { error: "Please fix the highlighted fields.", errors: custom.errors };

  await db.update(users).set({ ...base.data, profile: custom.values }).where(eq(users.id, user.id));
  revalidatePath("/", "layout");
  return { ok: "Saved." };
}
