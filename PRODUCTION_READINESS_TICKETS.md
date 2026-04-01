# Production Readiness Tickets

**Project:** SAT Prep App (React + Supabase + Stripe)
**Date:** 2026-03-03
**Total Tickets:** 25 | **Blockers:** 10

---

## BLOCKER — B-001: CI Pipeline with Required Checks

**Priority:** Blocker
**Owner:** DevOps
**Estimate:** 4h

**Description:**
No CI/CD pipeline exists. Create a GitHub Actions workflow (`.github/workflows/ci.yml`) that runs on every push and PR to `main`/`staging`.

**Acceptance Criteria:**
- [ ] Lint (`eslint`) runs and must pass
- [ ] TypeScript compilation (`tsc --noEmit`) runs and must pass
- [ ] Unit tests (`vitest run`) run and must pass
- [ ] E2E tests (`playwright test`) run against a preview build and must pass
- [ ] Deno edge-function tests (`deno test`) run and must pass
- [ ] Build (`vite build`) succeeds with zero warnings treated as errors
- [ ] All checks are marked as **required** in GitHub branch protection (see B-002)
- [ ] Pipeline fails fast: lint → typecheck → unit → build → e2e (sequential stages)

**Context:**
`playwright.config.ts` already uses `process.env.CI` for retries and workers. Vitest and Deno test configs exist.

---

## BLOCKER — B-002: Branch Protection Rules

**Priority:** Blocker
**Owner:** DevOps / Engineering Lead
**Estimate:** 1h

**Description:**
Configure GitHub branch protection on `main` and `staging` branches.

**Acceptance Criteria:**
- [ ] `main` requires PR with at least 1 approving review
- [ ] `main` requires all status checks from B-001 to pass before merge
- [ ] `main` disables force push and branch deletion
- [ ] `staging` requires all status checks from B-001 to pass before merge
- [ ] `staging` allows direct push from CI (deploy bot) only
- [ ] Dismiss stale reviews on new pushes enabled for `main`
- [ ] Admin override documented but discouraged

---

## BLOCKER — B-003: Environment Variable Inventory + Secret Storage

**Priority:** Blocker
**Owner:** DevOps / Security
**Estimate:** 3h

**Description:**
Supabase URL and anon key are hardcoded in `src/lib/env.ts`. No `.env.example` exists. Secrets are untracked.

**Acceptance Criteria:**
- [ ] Create `.env.example` documenting every required variable (no real values)
- [ ] Migrate `src/lib/env.ts` to read from `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY` instead of hardcoded strings
- [ ] Complete inventory table:

| Variable | Where Used | Secret? | Storage |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Frontend client | No | `.env` / CI vars |
| `VITE_SUPABASE_ANON_KEY` | Frontend client | No | `.env` / CI vars |
| `VITE_SENTRY_DSN` | Frontend error tracking | No | `.env` / CI vars |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge functions, scripts | **Yes** | Supabase secrets / GitHub Secrets |
| `STRIPE_SECRET_KEY` | Edge functions | **Yes** | Supabase secrets / GitHub Secrets |
| `STRIPE_WEBHOOK_SECRET` | Edge functions | **Yes** | Supabase secrets / GitHub Secrets |
| `STRIPE_PRICE_MONTHLY` | Edge functions | No | Supabase secrets / CI vars |
| `STRIPE_PRICE_90_DAY` | Edge functions | No | Supabase secrets / CI vars |
| `STRIPE_PRICE_12_MONTH` | Edge functions | No | Supabase secrets / CI vars |
| `CRON_SECRET` | cron-daily edge function | **Yes** | Supabase secrets / GitHub Secrets |
| `OPENAI_API_KEY` (if used) | AI edge functions | **Yes** | Supabase secrets / GitHub Secrets |

- [ ] All secrets stored in **GitHub Secrets** (CI) and **Supabase Dashboard > Secrets** (runtime)
- [ ] No secret values committed to the repository — verified with `git log` scan

---

## BLOCKER — B-004: Staging vs Production Separation

**Priority:** Blocker
**Owner:** DevOps
**Estimate:** 4h

**Description:**
No environment separation exists. A single Supabase project and Stripe account serve all traffic.

**Acceptance Criteria:**
- [ ] Separate Supabase project created for staging (different URL, keys, DB)
- [ ] Stripe test-mode keys used for staging; live-mode keys used for production only
- [ ] Separate Stripe webhook endpoints registered per environment
- [ ] CI deploys to staging on merge to `staging` branch; to production on merge to `main`
- [ ] Edge functions deployed per-environment via `supabase functions deploy --project-ref <ref>`
- [ ] Frontend build injects correct env vars per target (staging `.env.staging`, prod `.env.production`)
- [ ] Staging URL clearly branded (banner or subdomain) to prevent confusion
- [ ] Document the environment matrix in a `docs/environments.md` file

---

## BLOCKER — B-005: Error Tracking — Complete Sentry Setup

**Priority:** Blocker
**Owner:** Frontend / DevOps
**Estimate:** 3h

**Description:**
Sentry is partially wired (`@sentry/react` in `main.tsx`, `reportError` in `errorReporter.ts`) but `VITE_SENTRY_DSN` is never set. Edge functions have no error tracking beyond `console.error`.

**Acceptance Criteria:**
- [ ] Sentry project created; DSN set in staging and production env vars
- [ ] Source maps uploaded to Sentry during CI build step (`@sentry/vite-plugin`)
- [ ] `release` and `environment` tags set on Sentry init so errors are filterable
- [ ] Verify `reportError()` sends to Sentry in production build (manual test)
- [ ] Edge function errors forwarded to Sentry or a log drain (see B-009)
- [ ] Sentry alert rule: notify Slack/email on first occurrence of any new issue
- [ ] `tracesSampleRate` tuned per environment (staging: `1.0`, production: `0.1`)

---

## BLOCKER — B-006: Uptime Checks

**Priority:** Blocker
**Owner:** DevOps / SRE
**Estimate:** 2h

**Description:**
A `/health` edge function and a `HealthCheck.tsx` page exist, but no external uptime monitoring is configured.

**Acceptance Criteria:**
- [ ] External uptime monitor (e.g., BetterUptime, Checkly, UptimeRobot) pings the following every 60s:
  - Frontend root URL (expect 200)
  - `supabase/functions/v1/health` edge function (expect 200 + JSON schema)
- [ ] Alert on 2 consecutive failures → Slack channel + PagerDuty/email
- [ ] Stripe webhook endpoint health: synthetic `checkout.session.completed` test event weekly (Stripe Dashboard test mode)
- [ ] Dashboard or status page URL documented in `docs/runbooks/uptime.md`
- [ ] Uptime SLO defined (e.g., 99.9%) and tracked

---

## BLOCKER — B-007: Edge Function Logs and Alerts

**Priority:** Blocker
**Owner:** DevOps / SRE
**Estimate:** 3h

**Description:**
Edge functions use `console.log` / `console.error` with prefixes but logs are only visible in Supabase Dashboard. No alerting on errors.

**Acceptance Criteria:**
- [ ] Supabase log drain configured to external sink (e.g., Logflare, Datadog, Axiom)
- [ ] Structured JSON logging standardized across all 20+ edge functions (timestamp, function name, level, message, request ID)
- [ ] Alert rule: any edge function returning 5xx more than 5 times in 5 minutes → Slack + email
- [ ] Alert rule: `stripe-webhook` function errors → immediate high-priority alert
- [ ] Alert rule: `cron-daily` function failure → alert within 15 minutes
- [ ] Log retention policy documented (minimum 30 days)
- [ ] Sensitive data (tokens, PII) never logged — audit existing `console.log` statements

---

## BLOCKER — B-008: Database Backup + Restore Drill

**Priority:** Blocker
**Owner:** DevOps / DBA
**Estimate:** 4h

**Description:**
94+ migrations exist but no documented backup strategy or tested restore procedure.

**Acceptance Criteria:**
- [ ] Confirm Supabase Pro plan daily backups are enabled for production project
- [ ] Enable Point-in-Time Recovery (PITR) on production if plan supports it
- [ ] Perform a full restore drill on staging:
  1. Take a manual backup of staging DB
  2. Drop a non-critical table
  3. Restore from backup
  4. Verify row counts and data integrity
  5. Document time-to-restore
- [ ] Write `docs/runbooks/db-restore.md` with step-by-step instructions
- [ ] Schedule quarterly restore drills on the team calendar
- [ ] Verify `supabase/migrations/` can be replayed cleanly on an empty DB (`supabase db reset`)

---

## BLOCKER — B-009: Rollback Runbook

**Priority:** Blocker
**Owner:** DevOps / SRE
**Estimate:** 3h

**Description:**
No rollback procedure documented. A bad deploy could leave production broken with no fast recovery path.

**Acceptance Criteria:**
- [ ] `docs/runbooks/rollback.md` created covering:
  - **Frontend rollback:** revert to previous deployment (hosting platform rollback or re-deploy last known good commit)
  - **Edge function rollback:** `supabase functions deploy` from last known good commit tag
  - **Database rollback:** when to use PITR vs. manual revert migration; decision tree
  - **Stripe config rollback:** webhook URL revert, price ID revert
- [ ] Git tagging strategy: every production deploy tags `prod-YYYY-MM-DD-HHMM`
- [ ] CI workflow includes a manual `rollback` job that deploys a specified git tag
- [ ] Rollback tested end-to-end on staging at least once before go-live
- [ ] Runbook reviewed and signed off by at least 2 engineers

---

## BLOCKER — B-010: Remove Hardcoded Secrets from Source

**Priority:** Blocker
**Owner:** Security / Frontend
**Estimate:** 2h

**Description:**
`src/lib/env.ts` contains hardcoded Supabase URL and anon key. While anon keys are public-facing, this pattern prevents environment separation and risks leaking non-public values if the pattern is copied.

**Acceptance Criteria:**
- [ ] `src/lib/env.ts` reads all values from `import.meta.env.*` with runtime validation (throw on missing)
- [ ] `scripts/smoke.ts` reads from `process.env` (already does, but verify no fallback to hardcoded)
- [ ] Run `git log -S "eyJ" --all` and `git log -S "sk_" --all` — zero hits for real secret keys
- [ ] Add a CI step that scans for leaked secrets (e.g., `gitleaks` or `trufflehog`)
- [ ] Pre-commit hook or CI check prevents future hardcoded secrets

---

## HIGH — H-001: Deployment Pipeline (CD)

**Priority:** High
**Owner:** DevOps
**Estimate:** 4h

**Description:**
CI (B-001) validates code but does not deploy. Set up continuous deployment.

**Acceptance Criteria:**
- [ ] On merge to `staging`: build and deploy frontend to staging hosting (Vercel/Netlify/Cloudflare Pages), deploy edge functions to staging Supabase project
- [ ] On merge to `main`: build and deploy frontend to production hosting, deploy edge functions to production Supabase project
- [ ] Deployment creates a git tag (`staging-*` or `prod-*`)
- [ ] Deployment posts success/failure to Slack
- [ ] Smoke test (`scripts/smoke.ts`) runs post-deploy and gates the deployment

---

## HIGH — H-002: Content Security Policy Hardening

**Priority:** High
**Owner:** Security / Frontend
**Estimate:** 2h

**Description:**
`index.html` has a CSP meta tag but it may be overly permissive. Verify and tighten.

**Acceptance Criteria:**
- [ ] Audit current CSP directives against actual resource origins
- [ ] Remove `unsafe-inline` from `script-src` if possible (use nonces or hashes)
- [ ] Ensure `frame-src` only allows Stripe domains needed for checkout
- [ ] Add `report-uri` or `report-to` directive pointing to Sentry CSP reporting
- [ ] Test checkout flow, Supabase auth, and AI features still function with tightened CSP

---

## HIGH — H-003: Stripe Webhook Signature Verification Audit

**Priority:** High
**Owner:** Backend
**Estimate:** 2h

**Description:**
`stripe-webhook/index.ts` validates signatures, but edge cases (replay attacks, clock skew) need verification.

**Acceptance Criteria:**
- [ ] Verify `stripe.webhooks.constructEvent` uses the correct `STRIPE_WEBHOOK_SECRET` per environment
- [ ] Confirm idempotency table (`stripe_webhook_events`) prevents duplicate processing
- [ ] Add TTL or cleanup policy for `stripe_webhook_events` (delete rows older than 90 days)
- [ ] Verify webhook endpoint uses HTTPS only (no HTTP fallback)
- [ ] Test with Stripe CLI: `stripe trigger checkout.session.completed` and verify end-to-end in staging

---

## HIGH — H-004: Rate Limiting on Edge Functions

**Priority:** High
**Owner:** Backend / Security
**Estimate:** 3h

**Description:**
No rate limiting exists on public-facing edge functions. Abuse of AI endpoints (`tutor-chat`, `generate-questions`) could spike costs.

**Acceptance Criteria:**
- [ ] Implement rate limiting on AI-powered edge functions (e.g., 20 requests/min per user)
- [ ] Implement rate limiting on `capture-lead` (e.g., 5 requests/min per IP)
- [ ] Implement rate limiting on auth-related functions
- [ ] Return `429 Too Many Requests` with `Retry-After` header
- [ ] Rate limit state stored in Supabase (table or Redis if available)
- [ ] Alert on sustained rate-limit hits (potential attack)

---

## HIGH — H-005: Database Row-Level Security (RLS) Audit

**Priority:** High
**Owner:** Backend / Security
**Estimate:** 3h

**Description:**
RLS tests exist (`src/tests/rls.test.ts`) but a comprehensive audit is needed before production.

**Acceptance Criteria:**
- [ ] Every table with user data has RLS enabled — no exceptions
- [ ] Policies verified: users can only read/write their own data
- [ ] `subscriptions` table: users can read their own; only service role can write
- [ ] `stripe_webhook_events`: only service role can read/write
- [ ] Test with a non-authenticated client: zero rows returned from all user tables
- [ ] Document RLS policies in `docs/security/rls-policies.md`

---

## MEDIUM — M-001: Supabase Migration Hygiene

**Priority:** Medium
**Owner:** Backend
**Estimate:** 2h

**Description:**
94+ migration files exist. Verify they replay cleanly and are production-safe.

**Acceptance Criteria:**
- [ ] `supabase db reset` succeeds from scratch with zero errors
- [ ] No migration contains `DROP TABLE` on a table with production data (audit)
- [ ] No migration uses `ALTER TYPE ... ADD VALUE` inside a transaction (Postgres limitation)
- [ ] Migration naming convention enforced (timestamp prefix, descriptive suffix)
- [ ] Add CI step: `supabase db reset` on a test database to catch broken migrations

---

## MEDIUM — M-002: Dependency Audit + Lockfile Integrity

**Priority:** Medium
**Owner:** Frontend
**Estimate:** 2h

**Description:**
No automated dependency vulnerability scanning. `package-lock.json` or equivalent must be committed.

**Acceptance Criteria:**
- [ ] `npm audit --production` returns zero critical/high vulnerabilities (or documented exceptions)
- [ ] Lockfile committed and CI uses `npm ci` (not `npm install`)
- [ ] Add `npm audit` step to CI pipeline (fail on critical)
- [ ] Dependabot or Renovate configured for automated PR creation on dependency updates
- [ ] Deno edge function imports pinned to specific versions (audit `import` URLs)

---

## MEDIUM — M-003: Frontend Performance Budget

**Priority:** Medium
**Owner:** Frontend
**Estimate:** 2h

**Description:**
No build-size tracking. Vite bundle could grow unchecked.

**Acceptance Criteria:**
- [ ] Add `vite-plugin-bundle-analyzer` or `rollup-plugin-visualizer` to dev config
- [ ] CI step records bundle size and fails if JS bundle exceeds 300KB gzipped
- [ ] Lazy-load routes not needed on initial render (verify React Router lazy imports)
- [ ] Images in `/public` are optimized (WebP, compressed)

---

## MEDIUM — M-004: CORS Configuration for Edge Functions

**Priority:** Medium
**Owner:** Backend / Security
**Estimate:** 2h

**Description:**
Edge functions likely use a shared CORS helper. Verify allowed origins are restricted per environment.

**Acceptance Criteria:**
- [ ] CORS `Access-Control-Allow-Origin` set to specific frontend domain(s) — not `*` in production
- [ ] Staging allows staging domain only; production allows production domain only
- [ ] `OPTIONS` preflight handled correctly on all edge functions
- [ ] `stripe-webhook` does NOT set CORS headers (server-to-server, no browser calls)

---

## MEDIUM — M-005: Monitoring Dashboard

**Priority:** Medium
**Owner:** SRE
**Estimate:** 3h

**Description:**
No unified observability dashboard exists.

**Acceptance Criteria:**
- [ ] Dashboard (Grafana, Datadog, or Supabase Dashboard bookmarks) showing:
  - Frontend error rate (Sentry)
  - Edge function invocation count and error rate
  - Database connection pool usage
  - Stripe webhook success/failure rate
  - Active subscriptions count
- [ ] Dashboard URL bookmarked in team docs
- [ ] On-call rotation documented alongside dashboard access

---

## MEDIUM — M-006: Cron Job Monitoring

**Priority:** Medium
**Owner:** SRE / Backend
**Estimate:** 1h

**Description:**
`cron-daily` runs on a schedule but no dead-man's-switch monitors it.

**Acceptance Criteria:**
- [ ] Dead-man's-switch service (e.g., Cronitor, Healthchecks.io) pinged at end of `cron-daily`
- [ ] Alert fires if `cron-daily` does not check in within expected window (e.g., 25 hours)
- [ ] `CRON_SECRET` verified in the function to prevent unauthorized invocation

---

## LOW — L-001: Documentation — Architecture Diagram

**Priority:** Low
**Owner:** Engineering Lead
**Estimate:** 2h

**Description:**
No architecture overview exists for onboarding or incident response.

**Acceptance Criteria:**
- [ ] `docs/architecture.md` with diagram (Mermaid or image) showing:
  - Frontend (Vite/React) → Supabase Auth → Supabase DB
  - Frontend → Edge Functions → Stripe API
  - Edge Functions → OpenAI (if applicable)
  - Cron → Edge Functions
  - Stripe Webhooks → Edge Functions → DB
- [ ] Data flow for checkout, subscription lifecycle, and AI tutor documented

---

## LOW — L-002: Incident Response Plan

**Priority:** Low
**Owner:** SRE / Engineering Lead
**Estimate:** 2h

**Description:**
No incident response process documented.

**Acceptance Criteria:**
- [ ] `docs/runbooks/incident-response.md` covering:
  - Severity levels (SEV1–SEV3) with examples
  - Escalation path and on-call rotation
  - Communication template (status page, Slack)
  - Post-incident review template
- [ ] Links to rollback runbook (B-009), DB restore runbook (B-008), and monitoring dashboard (M-005)

---

## LOW — L-003: Load Testing Baseline

**Priority:** Low
**Owner:** SRE
**Estimate:** 3h

**Description:**
No load testing has been performed. Unknown capacity limits for edge functions and database.

**Acceptance Criteria:**
- [ ] Load test script (k6 or Artillery) targeting key flows: health check, session-start, create-checkout
- [ ] Run against staging and record: p50/p95/p99 latency, error rate, max RPS before degradation
- [ ] Document results and recommended scaling actions in `docs/performance-baseline.md`
- [ ] Supabase connection pooling settings reviewed and tuned if needed

---

## Summary Matrix

| ID | Title | Priority | Estimate |
|----|-------|----------|----------|
| B-001 | CI Pipeline with Required Checks | Blocker | 4h |
| B-002 | Branch Protection Rules | Blocker | 1h |
| B-003 | Env Var Inventory + Secret Storage | Blocker | 3h |
| B-004 | Staging vs Production Separation | Blocker | 4h |
| B-005 | Error Tracking — Complete Sentry Setup | Blocker | 3h |
| B-006 | Uptime Checks | Blocker | 2h |
| B-007 | Edge Function Logs and Alerts | Blocker | 3h |
| B-008 | DB Backup + Restore Drill | Blocker | 4h |
| B-009 | Rollback Runbook | Blocker | 3h |
| B-010 | Remove Hardcoded Secrets from Source | Blocker | 2h |
| H-001 | Deployment Pipeline (CD) | High | 4h |
| H-002 | Content Security Policy Hardening | High | 2h |
| H-003 | Stripe Webhook Signature Verification Audit | High | 2h |
| H-004 | Rate Limiting on Edge Functions | High | 3h |
| H-005 | Database Row-Level Security (RLS) Audit | High | 3h |
| M-001 | Supabase Migration Hygiene | Medium | 2h |
| M-002 | Dependency Audit + Lockfile Integrity | Medium | 2h |
| M-003 | Frontend Performance Budget | Medium | 2h |
| M-004 | CORS Configuration for Edge Functions | Medium | 2h |
| M-005 | Monitoring Dashboard | Medium | 3h |
| M-006 | Cron Job Monitoring | Medium | 1h |
| L-001 | Documentation — Architecture Diagram | Low | 2h |
| L-002 | Incident Response Plan | Low | 2h |
| L-003 | Load Testing Baseline | Low | 3h |

**Total Estimate:** ~63 hours
**Blockers Total:** ~29 hours
