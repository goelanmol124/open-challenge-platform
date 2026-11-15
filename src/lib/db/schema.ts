/**
 * Database schema (MySQL, Drizzle ORM).
 *
 * The schema is deliberately use-case agnostic: anything your config defines
 * (custom fields, stages, statuses, criteria) is stored as keys/JSON, so you
 * can change the config without writing migrations.
 */
import { randomUUID } from "crypto";
import { sql } from "drizzle-orm";
import {
  boolean,
  datetime,
  index,
  int,
  json,
  mysqlTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

const id = () => varchar("id", { length: 36 }).primaryKey().$defaultFn(() => randomUUID());
const createdAt = () => datetime("created_at").default(sql`CURRENT_TIMESTAMP`).notNull();

export type FieldValues = Record<string, unknown>;

export type CriterionScore = { score: number; rationale: string };

export const users = mysqlTable("users", {
  id: id(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }),
  /** "owner" | "solver" | "admin" — labels come from config.roles. */
  role: varchar("role", { length: 32 }).notNull().default("solver"),
  /** Owners may need admin approval before posting (config.permissions). */
  approved: boolean("approved").notNull().default(true),
  organization: varchar("organization", { length: 255 }),
  bio: text("bio"),
  /** Values for config.roles[role].profileFields. */
  profile: json("profile").$type<FieldValues>(),
  createdAt: createdAt(),
});

export const challenges = mysqlTable(
  "challenges",
  {
    id: id(),
    ownerId: varchar("owner_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    summary: text("summary").notNull(),
    /** Markdown. */
    description: text("description").notNull(),
    category: varchar("category", { length: 128 }),
    /** One of config.challenge.stages[].key */
    stage: varchar("stage", { length: 64 }).notNull(),
    deadline: datetime("deadline"),
    reward: varchar("reward", { length: 255 }),
    /** Values for config.challenge.fields. */
    fields: json("fields").$type<FieldValues>(),
    featured: boolean("featured").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull().$onUpdate(() => new Date()),
  },
  (t) => [index("challenges_stage_idx").on(t.stage), index("challenges_owner_idx").on(t.ownerId)],
);

export const submissions = mysqlTable(
  "submissions",
  {
    id: id(),
    challengeId: varchar("challenge_id", { length: 36 }).notNull().references(() => challenges.id, { onDelete: "cascade" }),
    authorId: varchar("author_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    summary: text("summary").notNull(),
    /** Values for config.submission.fields. */
    fields: json("fields").$type<FieldValues>(),
    /** One of config.submission.statuses[].key */
    status: varchar("status", { length: 64 }).notNull(),
    upvoteCount: int("upvote_count").notNull().default(0),
    endorsementCount: int("endorsement_count").notNull().default(0),

    // ── AI evaluation ──
    /** pending | running | done | failed | skipped */
    aiStatus: varchar("ai_status", { length: 16 }).notNull().default("pending"),
    /** Weighted overall score, 0-100. */
    aiOverall: int("ai_overall"),
    aiScores: json("ai_scores").$type<Record<string, CriterionScore>>(),
    aiGatePassed: boolean("ai_gate_passed"),
    aiGateReason: text("ai_gate_reason"),
    aiSummary: text("ai_summary"),
    aiFlags: json("ai_flags").$type<string[]>(),
    aiProvider: varchar("ai_provider", { length: 64 }),
    aiModel: varchar("ai_model", { length: 128 }),
    aiAttempts: int("ai_attempts").notNull().default(0),
    aiError: text("ai_error"),
    evaluatedAt: datetime("evaluated_at"),

    createdAt: createdAt(),
    updatedAt: datetime("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull().$onUpdate(() => new Date()),
  },
  (t) => [
    index("submissions_challenge_idx").on(t.challengeId),
    index("submissions_author_idx").on(t.authorId),
    index("submissions_ai_status_idx").on(t.aiStatus),
  ],
);

export const endorsements = mysqlTable(
  "endorsements",
  {
    id: id(),
    submissionId: varchar("submission_id", { length: 36 }).notNull().references(() => submissions.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    note: text("note"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("endorsements_unique").on(t.submissionId, t.userId)],
);

export const upvotes = mysqlTable(
  "upvotes",
  {
    id: id(),
    submissionId: varchar("submission_id", { length: 36 }).notNull().references(() => submissions.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("upvotes_unique").on(t.submissionId, t.userId)],
);

export const notifications = mysqlTable(
  "notifications",
  {
    id: id(),
    userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body"),
    link: varchar("link", { length: 512 }),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.isRead)],
);

export type User = typeof users.$inferSelect;
export type Challenge = typeof challenges.$inferSelect;
export type Submission = typeof submissions.$inferSelect;
