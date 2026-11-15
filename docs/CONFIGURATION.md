# Configuration guide

One TypeScript object decides what your platform *is*. The same code runs an
innovation challenge, a civic problem hub, a research bounty board, a hackathon
or an internal idea programme. The only differences are in the config.

- **Where:** `platform.config.ts` at the repo root (the "custom" preset).
- **Bundled examples:** `src/config/presets/{civic,corporate,research}/config.ts`.
- **Which one runs:** `NEXT_PUBLIC_PLATFORM_PRESET=custom|civic|corporate|research`.
  It is read at **build time**, so rebuild (or restart `npm run dev`) after changing it.
- **Schema (source of truth):** `src/config/schema.ts`. Every option and default is defined there with zod.
- **Validate:** `npm run config:check` checks every preset. `-- --prompt` prints the exact AI prompt
  for the active preset, and `-- --score` runs it end-to-end through the mock provider.

The config has to stay plain data (no functions), because client components import it too.

## The model in one paragraph

An **owner** posts a **challenge**. A challenge moves through your **stages**
(e.g. draft, open, judging, closed). While a stage `acceptsSubmissions`,
**solvers** post **submissions**. Each submission is scored by the **AI
evaluator** against your **criteria** and gets a 0-100 overall score. The owner
moves submissions through your **statuses** (e.g. shortlisted, winner) and can
**endorse** the ones they want to take forward. Admins approve owners, change
roles and feature challenges.

Internally the three roles are always `owner`, `solver` and `admin`. What you
*call* them, and what they can do, is config.

## Sections

### `branding`

| key | what it does |
| --- | --- |
| `name`, `tagline`, `description` | Header, hero, `<title>`, meta description |
| `logoText` / `logoUrl` | Up to 4 letters in a coloured square, or a path to an image in `/public` |
| `primaryColor`, `accentColor` | Hex colours. Applied as CSS variables (`--brand`, `--accent`) |
| `hero.{title,subtitle,primaryCta,secondaryCta}` | Landing page copy |
| `footer.{text,links}` | Footer |
| `locale` | `<html lang>` and date formatting |
| `keywords` | `<meta name="keywords">` |

### `terminology`

Every user-facing noun. For example:

```ts
terminology: {
  challenge:  { singular: "Bounty",  plural: "Bounties" },
  submission: { singular: "Solution", plural: "Solutions" },
  category:   { singular: "Field",   plural: "Fields" },
  endorsement: { verb: "Accept", past: "Accepted", noun: "Acceptance" },
  upvote: { verb: "Star", noun: "Stars" },
  reward: "Bounty",
  deadline: "Submission deadline",
}
```

### `roles`

```ts
roles: {
  owner:  { label: "Official", plural: "Officials", description: "...", profileFields: [ /* fields */ ] },
  solver: { label: "Civic innovator", plural: "Civic innovators", description: "...", profileFields: [] },
  admin:  { label: "Admin", plural: "Admins" },   // optional
}
```

`profileFields` use the same [field definitions](#field-definitions) as forms
and show up on `/profile`.

### `permissions`

| key | default | meaning |
| --- | --- | --- |
| `createChallenge` | `["owner","admin"]` | Roles that can post challenges. Add `"solver"` for a fully open board. |
| `submit` | `["solver"]` | Roles that can submit. Add `"owner"` if sponsors may also pitch, as in an internal idea programme. |
| `endorse` | `"challenge-owner"` | `"challenge-owner"`: only whoever posted the challenge. `"any-owner"`: any owner can endorse any submission. |
| `ownerApprovalRequired` | `false` | New owner accounts must be approved in `/admin` before posting. |

Owners can never submit to their own challenge.

### `auth`

| key | default | meaning |
| --- | --- | --- |
| `allowSignup` | `true` | Turn off for invite-only (admins create or promote accounts) |
| `signupRoles` | `["solver","owner"]` | Roles offered on the sign-up form |
| `allowedEmailDomains` | `[]` | e.g. `["yourcompany.com"]` for an internal programme |
| `showDemoAccounts` | `true` | Lists seeded demo logins on `/auth/login`. Only outside production. |

The built-in auth is email + password (scrypt hashes, signed JWT cookie). To
add SSO/OAuth, replace `src/lib/auth/*`. Everything else only calls
`getCurrentUser()`.

### `categories`

A flat list (`["Water", "Transport", ...]`). It is labelled with `terminology.category`.

### `challenge`

```ts
challenge: {
  stages: [
    { key: "draft",   label: "Draft", public: false },
    { key: "open",    label: "Open", acceptsSubmissions: true, tone: "success" },
    { key: "judging", label: "Judging", tone: "warning" },
    { key: "closed",  label: "Closed" },
  ],
  defaultStage: "open",
  showReward: true,
  showDeadline: true,
  fields: [ /* extra fields owners fill in */ ],
}
```

- `public: false` hides a stage from listings. The owner and admins still see it.
- `acceptsSubmissions` together with a deadline that has not passed decides whether the Submit button appears.
- `tone`: `neutral | info | success | warning | danger | brand` (badge colour).
- Built-in challenge fields are title, summary, description (markdown), category, stage, reward and deadline.

### `submission`

```ts
submission: {
  summaryLabel: "Abstract",
  summaryHelp: "...",
  summaryMinLength: 100,
  fields: [ /* extra fields solvers fill in */ ],
  statuses: [
    { key: "received", label: "Received", notifyAuthor: false },
    { key: "awarded",  label: "Bounty awarded", tone: "success" },
  ],
  defaultStatus: "received",
  visibility: "restricted",     // "public" | "restricted" (author + challenge owner only)
  maxPerSolverPerChallenge: 3,
  allowEditAfterSubmit: false,
}
```

Built-in submission fields are title and summary. Editing a submission resets
and re-runs its AI evaluation.

### Field definitions

Used by `challenge.fields`, `submission.fields` and `roles.*.profileFields`.

```ts
{
  key: "code_url",            // lower_snake_case, stored in a JSON column
  label: "Code repository",
  type: "url",                // text | textarea | markdown | url | email | number | date
                              // select | multiselect | tags | boolean
  required: true,
  help: "Public repo or archive",
  placeholder: "https://...",
  options: ["A", "B"],        // select / multiselect only
  min: 10, max: 2000,         // length for text types, value for number, item count for tags
  includeInEvaluation: true,  // send to the AI evaluator (default true)
  showOnCard: false,          // show in list cards
  private: false,             // only the author + challenge owner (+ admins) can see it
}
```

Values are stored as JSON, so **adding, removing or renaming fields needs no
migration**. Old values for a removed key are simply ignored.

### `features`

`upvotes`, `endorsements`, `leaderboard`. Each is a boolean and defaults to `true`.
The leaderboard only appears when submissions are public.

### `evaluation`

```ts
evaluation: {
  enabled: true,
  trigger: "on-submit",          // or "manual" (owner clicks "Run", or cron/CLI)
  visibility: "public",          // "public" | "owner-and-author" | "owner-only"
  persona: "You are a careful scientific referee ...",
  gate: { label: "Addresses the problem", question: "Does the submission ...?" },   // optional
  criteria: [
    { key: "rigor", label: "Rigour", description: "...", weight: 4, min: 0, max: 10 },
    { key: "readiness", label: "Readiness", description: "...", weight: 1, min: 1, max: 9,
      anchors: { "1": "Concept only", "9": "Deployed at scale" } },
  ],
  instructions: ["You cannot open links; ..."],
  flags: ["unverified_claim", "incomplete"],
  summary: { label: "Referee pre-screen", guidance: "...", maxLength: 400 },
  disclaimer: "Automated pre-screen only. ...",
}
```

**Scoring.** For each criterion the model returns an integer in `[min, max]`
plus a one-line rationale. The overall score is

```
overall = 100 × Σ weightᵢ × (scoreᵢ − minᵢ)/(maxᵢ − minᵢ)  ÷  Σ weightᵢ
```

so weights are relative (`3, 2, 1` and `0.5, 0.33, 0.17` give the same
result). If a `gate` is defined and the model says it failed, the overall score
is 0. `flags` are restricted to the list you define.

**Prompt.** The app builds the prompt from `persona`, the challenge, the
submission (only fields with `includeInEvaluation`), the gate, the criteria
with anchors, `instructions` and the output schema. User content is wrapped in
delimiter tags, and the model is told to treat it as data, which is a basic
prompt-injection mitigation. Preview it with `npm run config:check -- --prompt`.

**When it runs.** With `trigger: "on-submit"` it runs in the background right
after a submission or edit, using Next.js `after()`. Failures and crashed
runs are retried by `GET /api/cron/evaluate` (up to 3 attempts), by
`npm run eval:pending`, or by the "Run pending now" button in `/admin`.
Owners can re-run a single evaluation from the submission page.

## Recipes

**Hackathon.** Use `platform.config.ts` as is. Rename `category` to "Track",
use stages `registration` (not accepting yet), `hacking` (`acceptsSubmissions`),
`judging` and `results`. Add submission fields `repo_url` (required), `demo_url`
and `team` (tags). Use statuses `submitted`, `finalist`, `winner`.

**Bug / feature bounty.** Use the research preset as a base. Rename
`challenge` to "Bounty" and `submission` to "Fix", and set `visibility:
"restricted"`. Use criteria `correctness` (weight 4), `test_coverage` (2) and
`code_quality` (1). Use statuses `received`, `in_review`, `paid`, `rejected`.

**Grant call / RFP.** Rename `submission` to "Application" and `endorsement` to
{ verb: "Fund", past: "Funded" }. Set `permissions.createChallenge: ["admin"]`.
Add submission fields `budget` (number), `timeline` (markdown) and `team_cv_url`.
Use `evaluation.visibility: "owner-only"`.

**Student capstone marketplace.** Rename owners to "Industry partner" and solvers
to "Student team". Set `auth.allowedEmailDomains: ["university.example"]`, and
use `endorse: "any-owner"` so any partner can adopt a project.

**No AI.** Set `evaluation.enabled: false`. Scores, the AI panel and the cron
work all disappear. Ranking falls back to endorsements and upvotes.

## Changing things that *do* need code

- A new built-in column (e.g. a real `budget DECIMAL` for SQL filtering): edit
  `src/lib/db/schema.ts`, then run `npm run db:generate` and `npm run db:migrate`.
- A new field *type*: extend `fieldTypes` in `schema.ts`, then handle it in
  `src/lib/fields.ts` (validation and parsing) and `src/components/field-input.tsx`
  and `field-display.tsx` (rendering).
- A new permission rule: everything lives in `src/lib/permissions.ts`.
