/**
 * Loads fictional demo data for the active preset.
 *
 *   npm run db:seed              # seed an empty database
 *   npm run db:seed -- --reset   # wipe ALL app tables first (destructive!)
 *   npm run db:seed -- --ai      # evaluate with the configured AI_PROVIDER instead of the mock
 */
import "./load-env";

import { eq, inArray } from "drizzle-orm";

import { activePresetId, config } from "@/config";
import { DEMO_PASSWORD, seeds } from "@/config/seeds";
import { evaluateSubmission } from "@/lib/ai/evaluate";
import { MockProvider } from "@/lib/ai/providers/mock";
import { hashPassword } from "@/lib/auth/password";
import { db, pool } from "@/lib/db";
import { challenges, endorsements, notifications, submissions, upvotes, users } from "@/lib/db/schema";
import { placeholderValue, validateFields, type FieldValues } from "@/lib/fields";
import type { FieldDef } from "@/config/schema";

const args = new Set(process.argv.slice(2));

function fill(defs: FieldDef[], given: FieldValues | undefined, where: string): FieldValues {
  const values: FieldValues = { ...(given ?? {}) };
  for (const f of defs) if (values[f.key] === undefined) values[f.key] = f.required ? placeholderValue(f) : null;
  const res = validateFields(defs, values);
  if (!res.ok) console.warn(`  ! seed values for ${where} don't match the config:`, res.errors);
  return res.ok ? res.values : values;
}

async function main() {
  const seed = seeds[activePresetId];
  if (!seed) throw new Error(`No seed data for preset "${activePresetId}"`);
  console.log(`Seeding preset "${activePresetId}" (${config.branding.name})`);

  if (args.has("--reset")) {
    console.log("  --reset: deleting all rows");
    for (const table of [notifications, upvotes, endorsements, submissions, challenges, users]) await db.delete(table);
  }

  const existing = await db.select({ id: users.id }).from(users).where(inArray(users.email, seed.users.map((u) => u.email)));
  if (existing.length) {
    console.log("  Demo users already exist. Use `npm run db:seed -- --reset` to start over.");
    return;
  }

  // Admin from env (optional)
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const [a] = await db.select({ id: users.id }).from(users).where(eq(users.email, adminEmail)).limit(1);
    if (!a) {
      await db.insert(users).values({ email: adminEmail, name: "Admin", role: "admin", passwordHash: await hashPassword(adminPassword) });
      console.log(`  admin: ${adminEmail}`);
    }
  }

  const demoHash = await hashPassword(DEMO_PASSWORD);
  const userIds = new Map<string, string>();
  for (const u of seed.users) {
    const id = crypto.randomUUID();
    userIds.set(u.key, id);
    const profileDefs = config.roles[u.role]?.profileFields ?? [];
    await db.insert(users).values({
      id,
      email: u.email.toLowerCase(),
      name: u.name,
      role: u.role,
      approved: true,
      organization: u.organization ?? null,
      bio: u.bio ?? null,
      profile: fill(profileDefs, u.profile, `user ${u.key}`),
      passwordHash: demoHash,
    });
  }
  console.log(`  ${seed.users.length} users (password: ${DEMO_PASSWORD})`);

  const challengeIds = new Map<string, string>();
  for (const c of seed.challenges) {
    const id = crypto.randomUUID();
    challengeIds.set(c.key, id);
    await db.insert(challenges).values({
      id,
      ownerId: userIds.get(c.ownerKey)!,
      title: c.title,
      summary: c.summary,
      description: c.description,
      category: c.category,
      stage: c.stage,
      reward: c.reward ?? null,
      deadline: c.deadlineInDays !== undefined ? new Date(Date.now() + c.deadlineInDays * 86_400_000) : null,
      featured: c.featured ?? false,
      fields: fill(config.challenge.fields, c.fields, `challenge ${c.key}`),
    });
  }
  console.log(`  ${seed.challenges.length} ${config.terminology.challenge.plural.toLowerCase()}`);

  const provider = args.has("--ai") ? undefined : new MockProvider();
  let n = 0;
  for (const s of seed.submissions) {
    const id = crypto.randomUUID();
    const endorsedBy = s.endorsedBy ?? [];
    const upvotedBy = s.upvotedBy ?? [];
    await db.insert(submissions).values({
      id,
      challengeId: challengeIds.get(s.challengeKey)!,
      authorId: userIds.get(s.authorKey)!,
      title: s.title,
      summary: s.summary,
      fields: fill(config.submission.fields, s.fields, `submission "${s.title}"`),
      status: s.status ?? config.submission.defaultStatus,
      upvoteCount: upvotedBy.length,
      endorsementCount: endorsedBy.length,
      aiStatus: config.evaluation.enabled ? "pending" : "skipped",
    });
    for (const k of endorsedBy) await db.insert(endorsements).values({ submissionId: id, userId: userIds.get(k)! });
    for (const k of upvotedBy) await db.insert(upvotes).values({ submissionId: id, userId: userIds.get(k)! });
    if (config.evaluation.enabled) {
      const r = await evaluateSubmission(id, { provider, notifyAuthor: false });
      if (!r.ok) console.warn(`  ! evaluation failed for "${s.title}": ${r.error}`);
    }
    n++;
  }
  console.log(`  ${n} ${config.terminology.submission.plural.toLowerCase()} (evaluated with ${provider ? "mock" : process.env.AI_PROVIDER || "gemini"} provider)`);
}

main()
  .then(() => console.log("Done."))
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
