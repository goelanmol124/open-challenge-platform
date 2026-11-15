# Deployment

What you need everywhere:

1. **A MySQL 8 database.** Use your host's add-on, or PlanetScale, Aiven, AWS RDS,
   Google Cloud SQL or similar. MariaDB 10.6+ works too.
2. **Environment variables** from `.env.example`. As a minimum: `DATABASE_URL`,
   `AUTH_SECRET` (32+ chars), `APP_URL`, `NEXT_PUBLIC_PLATFORM_PRESET`, `AI_PROVIDER`
   with its key, and `CRON_SECRET`.
3. **Migrations:** `npm run db:migrate`. Run it as a pre-deploy step on every deploy.
4. **A scheduler** that calls `GET /api/cron/evaluate` with header
   `Authorization: Bearer $CRON_SECRET` every 5-15 minutes. It retries failed
   or interrupted evaluations.
5. **First admin:** set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`, then run
   `npm run db:seed` once. Alternatively, sign up normally and promote yourself with
   `UPDATE users SET role='admin' WHERE email='you@...';`.

> `NEXT_PUBLIC_PLATFORM_PRESET` is baked in at build time. Changing it means a rebuild.

## Railway

`railway.json` is included. It builds with Nixpacks, runs `npm run db:migrate`
before each deploy and health-checks `/api/health`.

1. Create a project and add the **MySQL** plugin.
2. Add a service from your repo. In its variables, set
   `DATABASE_URL=${{MySQL.MYSQL_URL}}` and the rest of the env.
3. Cron: Railway services can run on a cron schedule. Add a small second
   service (any image with `curl`). Set its start command to
   `curl -fsS -H "Authorization: Bearer $CRON_SECRET" $APP_URL/api/cron/evaluate`
   and its *Cron Schedule* to `*/10 * * * *`. Any external HTTP cron works too.

The in-memory rate limiter works well on Railway's single long-running process.

## Vercel

1. Import the repo and set the env vars. Use an external MySQL.
2. Run migrations from CI or your machine: `DATABASE_URL=... npm run db:migrate`.
   You can also set the build command to `npm run db:migrate && npm run build`.
3. Cron: add a `vercel.json`:

   ```json
   { "crons": [{ "path": "/api/cron/evaluate", "schedule": "*/10 * * * *" }] }
   ```

   Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically when a
   `CRON_SECRET` env var exists.
4. Background evaluation uses Next.js `after()`, which Vercel supports. Long
   evaluations are bounded by your plan's function duration. The cron picks up
   anything that timed out.
5. The rate limiter is per-instance on serverless. For real abuse protection,
   swap `src/lib/rate-limit.ts` for Upstash Redis or Vercel's firewall rules.

## Docker / any VM

```bash
docker build --build-arg NEXT_PUBLIC_PLATFORM_PRESET=custom -t challenge-platform .
docker run -p 3000:3000 --env-file .env.production challenge-platform
```

Run migrations from a machine with the repo checked out (`npm run db:migrate`).
You can also add a one-off container step that runs it.

## Production checklist

- [ ] `AUTH_SECRET` is long and random. Rotating it signs everyone out.
- [ ] `NODE_ENV=production` (hosts set it). This hides demo accounts on the login page.
- [ ] Demo data removed: `npm run db:seed -- --reset` deletes **everything**. Run it only on an empty or dev database.
- [ ] `auth.allowedEmailDomains` / `ownerApprovalRequired` set to match your audience.
- [ ] Evaluation calibrated on realistic examples (see `docs/AI_PROVIDERS.md`).
- [ ] Cron configured and returning `{"considered":...}`.
- [ ] Privacy notice and terms pages added for your jurisdiction (not included).
