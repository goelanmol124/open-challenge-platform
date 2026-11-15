/**
 * Platform configuration schema.
 *
 * Everything that makes one deployment an "innovation challenge platform",
 * another a "research bounty board" and a third a "civic problem hub" lives
 * in a single object validated by this schema. See docs/CONFIGURATION.md.
 *
 * The config must stay plain JSON-serialisable data (no functions) because it
 * is imported by both server and client components.
 */
import { z } from "zod";

const key = z
  .string()
  .regex(/^[a-z][a-z0-9_]*$/, "keys must be lower_snake_case and start with a letter");

const noun = z.object({
  singular: z.string().min(1),
  plural: z.string().min(1),
});

// ─── Dynamic form fields ──────────────────────────────────────────────────────

export const fieldTypes = [
  "text",
  "textarea",
  "markdown",
  "url",
  "email",
  "number",
  "date",
  "select",
  "multiselect",
  "tags",
  "boolean",
] as const;

export const fieldSchema = z
  .object({
    key,
    label: z.string().min(1),
    type: z.enum(fieldTypes),
    required: z.boolean().default(false),
    help: z.string().optional(),
    placeholder: z.string().optional(),
    /** For select / multiselect. */
    options: z.array(z.string().min(1)).optional(),
    /** Min/max length for text types, min/max value for number. */
    min: z.number().optional(),
    max: z.number().optional(),
    /** Send this field to the AI evaluator (default true). */
    includeInEvaluation: z.boolean().default(true),
    /** Show this field on cards in list views (default false). */
    showOnCard: z.boolean().default(false),
    /** Only visible to the owner of the challenge and the author (default false). */
    private: z.boolean().default(false),
  })
  .superRefine((f, ctx) => {
    if ((f.type === "select" || f.type === "multiselect") && !f.options?.length) {
      ctx.addIssue({ code: "custom", message: `field "${f.key}" of type ${f.type} needs options` });
    }
  });

export type FieldDef = z.infer<typeof fieldSchema>;
export type FieldDefInput = z.input<typeof fieldSchema>;

// ─── Stages & statuses ────────────────────────────────────────────────────────

const tone = z.enum(["neutral", "info", "success", "warning", "danger", "brand"]).default("neutral");

export const stageSchema = z.object({
  key,
  label: z.string(),
  description: z.string().optional(),
  /** Can solvers submit while the challenge is in this stage? */
  acceptsSubmissions: z.boolean().default(false),
  /** Is the challenge listed publicly in this stage? (drafts usually aren't) */
  public: z.boolean().default(true),
  tone,
});

export const statusSchema = z.object({
  key,
  label: z.string(),
  description: z.string().optional(),
  tone,
  /** Notify the author when the owner moves a submission to this status. */
  notifyAuthor: z.boolean().default(true),
});

// ─── AI evaluation ────────────────────────────────────────────────────────────

export const criterionSchema = z
  .object({
    key,
    label: z.string(),
    description: z.string(),
    /** Relative weight in the overall score. Weights are normalised. */
    weight: z.number().positive(),
    min: z.number().int().default(1),
    max: z.number().int().default(5),
    /** Optional anchor descriptions for specific score values, e.g. {1: "...", 5: "..."}. */
    anchors: z.record(z.string(), z.string()).optional(),
  })
  .refine((c) => c.max > c.min, { message: "criterion max must be greater than min" });

export type Criterion = z.infer<typeof criterionSchema>;

export const evaluationSchema = z.object({
  enabled: z.boolean().default(true),
  /**
   * on-submit: evaluate in the background right after a submission is created
   * (and retried by the cron endpoint). manual: only when an owner/admin
   * clicks "Run evaluation" or the cron/CLI runs.
   */
  trigger: z.enum(["on-submit", "manual"]).default("on-submit"),
  /** Who can see AI scores. */
  visibility: z.enum(["public", "owner-and-author", "owner-only"]).default("public"),
  /** First line of the prompt: who the evaluator is. */
  persona: z.string(),
  /** Extra rules appended to the prompt, one bullet each. */
  instructions: z.array(z.string()).default([]),
  /**
   * Optional pass/fail gate checked before scoring (e.g. "is this on-topic
   * and not spam?"). A failed gate forces the overall score to 0.
   */
  gate: z.object({ label: z.string(), question: z.string() }).optional(),
  criteria: z.array(criterionSchema).min(1),
  summary: z
    .object({
      label: z.string().default("AI summary"),
      guidance: z.string().default("A neutral, specific summary of what the submission proposes and its main strengths and gaps."),
      maxLength: z.number().int().min(50).max(2000).default(300),
    })
    .default({}),
  /** Short machine-readable flags the model may attach, e.g. "duplicate". */
  flags: z.array(key).default([]),
  /** Disclaimer shown under the AI panel. */
  disclaimer: z.string().default("AI-generated assessment. Treat it as a first-pass signal, not a verdict."),
});

export type EvaluationConfig = z.infer<typeof evaluationSchema>;

// ─── Root ─────────────────────────────────────────────────────────────────────

export const roleKeys = ["owner", "solver", "admin"] as const;
export type RoleKey = (typeof roleKeys)[number];

const roleSchema = z.object({
  label: z.string(),
  plural: z.string(),
  description: z.string().default(""),
  /** Extra profile fields for users with this role (shown on profile page). */
  profileFields: z.array(fieldSchema).default([]),
});

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "use a 6-digit hex colour like #2563eb");

export const platformConfigSchema = z
  .object({
    /** Stable id, used by NEXT_PUBLIC_PLATFORM_PRESET. */
    id: key,
    branding: z.object({
      name: z.string(),
      tagline: z.string(),
      description: z.string(),
      /** Short text mark shown in the header (defaults to initials of name). */
      logoText: z.string().max(4).optional(),
      /** Optional path to a logo in /public, e.g. "/logo.svg". */
      logoUrl: z.string().optional(),
      primaryColor: hex.default("#2563eb"),
      accentColor: hex.default("#0d9488"),
      hero: z.object({
        title: z.string(),
        subtitle: z.string(),
        primaryCta: z.string().default("Browse"),
        secondaryCta: z.string().default("Post one"),
      }),
      footer: z
        .object({
          text: z.string().default(""),
          links: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
        })
        .default({}),
      locale: z.string().default("en"),
      keywords: z.array(z.string()).default([]),
    }),

    terminology: z.object({
      challenge: noun,
      submission: noun,
      category: noun,
      endorsement: z.object({
        verb: z.string(), // "Endorse"
        past: z.string(), // "Endorsed"
        noun: z.string(), // "Endorsement"
      }),
      upvote: z.object({ verb: z.string(), noun: z.string() }).default({ verb: "Upvote", noun: "Upvotes" }),
      reward: z.string().default("Reward"),
      deadline: z.string().default("Deadline"),
    }),

    roles: z.object({
      owner: roleSchema,
      solver: roleSchema,
      admin: roleSchema.default({ label: "Admin", plural: "Admins" }),
    }),

    permissions: z
      .object({
        /** Roles allowed to post challenges. */
        createChallenge: z.array(z.enum(roleKeys)).default(["owner", "admin"]),
        /** Roles allowed to submit solutions. */
        submit: z.array(z.enum(roleKeys)).default(["solver"]),
        /**
         * Who may endorse a submission: the owner of that challenge only, or
         * any user with the owner role.
         */
        endorse: z.enum(["challenge-owner", "any-owner"]).default("challenge-owner"),
        /** Owners must be approved by an admin before they can post. */
        ownerApprovalRequired: z.boolean().default(false),
      })
      .default({}),

    auth: z
      .object({
        allowSignup: z.boolean().default(true),
        /** Roles a visitor can pick on the sign-up form. */
        signupRoles: z.array(z.enum(["owner", "solver"])).min(1).default(["solver", "owner"]),
        /** Restrict sign-ups to these email domains (empty = anyone). */
        allowedEmailDomains: z.array(z.string()).default([]),
        /** Show seeded demo accounts on the login page (never in production). */
        showDemoAccounts: z.boolean().default(true),
      })
      .default({}),

    categories: z.array(z.string().min(1)).min(1),

    challenge: z.object({
      stages: z.array(stageSchema).min(1),
      defaultStage: key,
      showReward: z.boolean().default(true),
      showDeadline: z.boolean().default(true),
      /** Extra fields owners fill in when posting a challenge. */
      fields: z.array(fieldSchema).default([]),
    }),

    submission: z.object({
      /** Extra fields solvers fill in (title + summary are built in). */
      fields: z.array(fieldSchema).default([]),
      summaryLabel: z.string().default("Summary"),
      summaryHelp: z.string().optional(),
      summaryMinLength: z.number().int().min(0).default(50),
      statuses: z.array(statusSchema).min(1),
      defaultStatus: key,
      /** public = anyone can browse submissions; restricted = only the author and the challenge owner. */
      visibility: z.enum(["public", "restricted"]).default("public"),
      maxPerSolverPerChallenge: z.number().int().min(1).default(3),
      allowEditAfterSubmit: z.boolean().default(true),
    }),

    features: z
      .object({
        upvotes: z.boolean().default(true),
        endorsements: z.boolean().default(true),
        leaderboard: z.boolean().default(true),
      })
      .default({}),

    evaluation: evaluationSchema,
  })
  .superRefine((c, ctx) => {
    const dupes = (arr: { key: string }[]) => arr.map((x) => x.key).filter((k, i, a) => a.indexOf(k) !== i);
    const check = (arr: { key: string }[], where: string) => {
      for (const d of new Set(dupes(arr))) ctx.addIssue({ code: "custom", message: `duplicate key "${d}" in ${where}` });
    };
    check(c.challenge.stages, "challenge.stages");
    check(c.challenge.fields, "challenge.fields");
    check(c.submission.fields, "submission.fields");
    check(c.submission.statuses, "submission.statuses");
    check(c.evaluation.criteria, "evaluation.criteria");

    if (!c.challenge.stages.some((s) => s.key === c.challenge.defaultStage)) {
      ctx.addIssue({ code: "custom", message: `challenge.defaultStage "${c.challenge.defaultStage}" is not a defined stage` });
    }
    if (!c.submission.statuses.some((s) => s.key === c.submission.defaultStatus)) {
      ctx.addIssue({ code: "custom", message: `submission.defaultStatus "${c.submission.defaultStatus}" is not a defined status` });
    }
    const reserved = ["title", "summary"];
    for (const f of c.submission.fields) {
      if (reserved.includes(f.key)) ctx.addIssue({ code: "custom", message: `submission field key "${f.key}" is reserved` });
    }
    for (const f of c.challenge.fields) {
      if ([...reserved, "description", "category", "deadline", "reward", "stage"].includes(f.key)) {
        ctx.addIssue({ code: "custom", message: `challenge field key "${f.key}" is reserved` });
      }
    }
  });

export type PlatformConfig = z.infer<typeof platformConfigSchema>;
/** What you write in a config file (defaults may be omitted). */
export type PlatformConfigInput = z.input<typeof platformConfigSchema>;

/** Identity helper that gives you autocomplete when writing a config. */
export function defineConfig(config: PlatformConfigInput): PlatformConfigInput {
  return config;
}
