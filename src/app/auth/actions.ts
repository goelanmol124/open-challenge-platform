"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { FormState } from "@/components/form-bits";
import { config } from "@/config";
import { startSession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { checkRateLimit } from "@/lib/rate-limit";
import { safeNext } from "@/lib/utils";

async function clientKey(prefix: string) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  return `${prefix}:${ip}`;
}

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export async function login(_: FormState, form: FormData): Promise<FormState> {
  if (!checkRateLimit(await clientKey("login"), 10, 10 * 60_000)) {
    return { error: "Too many attempts. Try again in a few minutes." };
  }
  const parsed = LoginSchema.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Email or password is incorrect." };
  }
  await startSession(user);
  redirect(safeNext(form.get("next"), "/dashboard"));
}

const RegisterSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(255),
  email: z.string().trim().toLowerCase().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  role: z.enum(["owner", "solver"]),
  organization: z.string().trim().max(255).optional(),
});

export async function register(_: FormState, form: FormData): Promise<FormState> {
  if (!config.auth.allowSignup) return { error: "Sign-ups are closed." };
  if (!checkRateLimit(await clientKey("register"), 5, 60 * 60_000)) {
    return { error: "Too many sign-ups from this network. Try again later." };
  }
  const parsed = RegisterSchema.safeParse({
    name: form.get("name"),
    email: form.get("email"),
    password: form.get("password"),
    role: form.get("role") ?? config.auth.signupRoles[0],
    organization: form.get("organization") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { name, email, password, role, organization } = parsed.data;

  if (!config.auth.signupRoles.includes(role)) return { error: "That role is not available for sign-up." };

  const domains = config.auth.allowedEmailDomains.map((d) => d.toLowerCase());
  if (domains.length && !domains.includes(email.split("@")[1] ?? "")) {
    return { error: `Sign-up is limited to: ${domains.join(", ")}` };
  }

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) return { error: "An account with this email already exists." };

  const approved = !(role === "owner" && config.permissions.ownerApprovalRequired);
  const passwordHash = await hashPassword(password);
  const id = crypto.randomUUID();
  await db.insert(users).values({ id, name, email, passwordHash, role, approved, organization: organization ?? null });

  await startSession({ id, role });
  redirect("/dashboard");
}
