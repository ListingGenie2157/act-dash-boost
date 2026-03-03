# ACT Prep Platform — Deployment Readiness Task List

**Date:** 2026-03-03
**Product:** ACT Dashboard Boost (Preppit)
**Stack:** React 18 + Vite 5 + TypeScript 5.8 + Supabase (Postgres, RLS, Edge Functions) + Stripe
**Target:** Production launch sign-off for dev agency (Lovable)

---

## Assumptions

1. Lovable handles frontend hosting via their publish flow; no custom Docker/CI required for initial launch.
2. Supabase project `hhbkmxrzxcswwokmbtbz` is the production instance. Edge Functions deploy through Supabase CLI or Lovable integration.
3. Stripe is in **test mode** today. A live-mode key swap is required before real payments.
4. The `PRODUCTION_FIXES_SUMMARY.md` in the repo confirms critical React Hooks violations, global error handlers, health check, and Sentry scaffolding are resolved. This task list assumes those fixes are merged to the working branch.
5. `RequireSubscription` component exists but is **not wired into any routes**, meaning premium features are currently ungated. This must be resolved before launch.
6. No CI/CD pipeline exists. Manual verification steps substitute until a pipeline is added.
7. The Sentry DSN (`VITE_SENTRY_DSN`) is not yet configured in the production environment.
8. The cron Edge Function (`cron-daily`) requires an external scheduler (e.g., Supabase cron or third-party) to invoke it.
9. CORS allowlist in `_shared/cors.ts` currently includes Lovable dev domains and `localhost`. Production must restrict this.
10. Content (questions, lessons, passages) is assumed imported and QA'd separately by the content team.

---

## 1. Scope Freeze

| # | Task | Goal | Verification Steps | Pass/Fail Criteria | Owner | Priority |
|---|------|------|-------------------|-------------------|-------|----------|
| SF-1 | Lock feature list | Prevent scope creep after this date. No new features until post-launch stabilization. | 1. Review `PROJECT_STATUS.md` features vs. this task list. 2. Confirm every route in `App.tsx` maps to a completed feature. 3. Confirm no open feature PRs remain in the branch. | All listed features (auth, roles, diagnostics, study plans, lessons, mastery, spaced repetition, dashboards, coach mode, payments, analytics) are present and render without blank screens. | PM (Lovable) | Blocker |
| SF-2 | Remove or feature-flag incomplete code | Eliminate dead code paths that could confuse users or crash the app. | 1. Search for `TODO` and `FIXME` across the codebase (`rg 'TODO\|FIXME' src/`). 2. Verify `SimpleLogin.tsx` is removed or unreachable in production routes. 3. Verify no routes point to placeholder/stub pages. | Zero user-reachable TODO stubs. `SimpleLogin` not in production route table. | Dev Lead (Lovable) | Blocker |
| SF-3 | Freeze database schema | Prevent migration conflicts during launch window. | 1. Run `supabase db diff` — output must be empty. 2. Confirm the latest numbered migration in `supabase/migrations/` matches what is deployed to the production Supabase project. 3. No pending ALTER TABLE statements in any open branch. | `supabase db diff` returns no changes. Migration count matches production. | Backend Dev (Lovable) | Blocker |
| SF-4 | Freeze Edge Function signatures | Ensure client and server agree on request/response shapes. | 1. For each of the 19+ Edge Functions, compare the Zod schema in `src/lib/validation/edgeFunctionSchemas.ts` to the function's actual request parsing logic. 2. Run `npm run typecheck` — zero errors. | Type check passes. Every Edge Function request/response matches its client-side schema. | Full-Stack Dev (Lovable) | Blocker |
| SF-5 | Pin dependency versions | Prevent supply-chain drift between dev and prod builds. | 1. Verify `package-lock.json` exists and is committed. 2. Run `npm ci` (not `npm install`) — must succeed. 3. Run `npm audit --production` — zero high/critical vulnerabilities. | `npm ci` succeeds. `npm audit --production` reports zero high/critical issues. | Dev Lead (Lovable) | Blocker |

---

## 2. Acceptance Criteria

### 2.1 Authentication & Onboarding

| # | Task | Goal | Verification Steps | Pass/Fail Criteria | Owner | Priority |
|---|------|------|-------------------|-------------------|-------|----------|
| AC-1 | Email/password sign-up | New user can register and land on onboarding. | 1. Go to `/login`. 2. Register with a new email. 3. Confirm Supabase Auth creates user. 4. User is redirected to `/onboarding`. | User row exists in `auth.users`. `profiles` row created. Onboarding wizard loads with 7 steps. | QA (Lovable) | Blocker |
| AC-2 | Onboarding wizard completion | All 7 steps save data and redirect to dashboard. | 1. Complete all 7 onboarding steps. 2. Check `profiles`, `user_preferences`, `user_goals`, `accommodations` tables for persisted data. 3. Confirm redirect to `/dashboard`. | All relevant tables populated. Dashboard loads with personalized data. | QA (Lovable) | Blocker |
| AC-3 | Login / Logout | Existing user can log in and log out cleanly. | 1. Log in with valid credentials — dashboard loads. 2. Log out — redirected to `/login`. 3. Attempt to access `/dashboard` when logged out — redirected to `/login`. | Session cookie set/cleared. `RequireAuth` blocks unauthenticated access. | QA (Lovable) | Blocker |
| AC-4 | Password reset | User can reset password via email link. | 1. Click "Forgot password" on `/login`. 2. Receive Supabase reset email. 3. Follow link to `/update-password`. 4. Set new password and log in. | Password updated. User can log in with new password. | QA (Lovable) | High |

### 2.2 Roles & Permissions

| # | Task | Goal | Verification Steps | Pass/Fail Criteria | Owner | Priority |
|---|------|------|-------------------|-------------------|-------|----------|
| AC-5 | Student role default | New users get student capabilities by default. | 1. Register new user. 2. Query `user_roles` — should have no admin role. 3. Confirm user can access student routes (`/dashboard`, `/plan`, `/lessons`, etc.). 4. Confirm user cannot access `/admin-import`. | Student can access all student routes. Admin routes return 403/redirect. | QA (Lovable) | Blocker |
| AC-6 | Admin role enforcement | Admin-only routes are gated by `ProtectedAdminRoute`. | 1. As non-admin, navigate to `/admin-import` — expect redirect to `/`. 2. Insert admin role for test user in `user_roles`. 3. Refresh — admin page loads. | `useIsAdmin` correctly queries `user_roles`. Non-admins cannot access admin pages. | QA (Lovable) | Blocker |
| AC-7 | Parent portal access | Parent can view linked student's progress. | 1. Create parent account. 2. Link to student via `parent_links`. 3. Navigate to `/parent-portal`. 4. Confirm student progress data is visible. | Parent sees only their linked student's data. RLS enforces scoping. | QA (Lovable) | High |
| AC-8 | Coach Mode (Tutor) | AI tutor chat functions end-to-end. | 1. Open tutor panel from dashboard. 2. Send a message. 3. Confirm `tutor-chat` Edge Function responds. 4. Message saved to `tutor_messages`. | Chat round-trip completes. Messages persist in DB. Rate limiting active. | QA (Lovable) | High |

### 2.3 Subscription & Payments (Stripe)

| # | Task | Goal | Verification Steps | Pass/Fail Criteria | Owner | Priority |
|---|------|------|-------------------|-------------------|-------|----------|
| AC-9 | Wire `RequireSubscription` into routes | Premium features must be gated behind active subscription. | 1. Identify which routes should be premium (study plans, simulations, AI tutor, spaced repetition — confirm with PM). 2. Wrap those routes with `RequireSubscription` in `App.tsx`. 3. Unsubscribed user hitting a premium route is redirected to `/pricing`. | Unsubscribed users cannot access premium features. Subscribed users pass through. | Full-Stack Dev (Lovable) | Blocker |
| AC-10 | Stripe checkout (test mode) | User can initiate checkout and receive a subscription. | 1. As logged-in user, go to `/pricing`. 2. Click a plan. 3. `create-checkout` Edge Function creates Stripe Checkout session. 4. Complete with Stripe test card `4242 4242 4242 4242`. 5. Redirected to `/subscription-success`. 6. `subscriptions` table updated with `status = 'active'`. | Checkout completes. Subscription row created with correct `plan_type`, `stripe_customer_id`, `stripe_subscription_id`. | QA (Lovable) | Blocker |
| AC-11 | Stripe webhook processing | Webhook events update subscription state. | 1. In Stripe dashboard, trigger `customer.subscription.updated` (e.g., cancel). 2. Confirm `stripe-webhook` Edge Function receives event. 3. Confirm `stripe_webhook_events` row created (idempotency). 4. Confirm `subscriptions` table updated. | Webhook signature validated. Subscription status reflects Stripe state. Duplicate events ignored. | Backend Dev (Lovable) | Blocker |
| AC-12 | Customer portal | User can manage billing via Stripe portal. | 1. As subscribed user, click "Manage Subscription". 2. `customer-portal` Edge Function returns portal URL. 3. User lands on Stripe billing portal. 4. User can cancel — webhook updates local DB. | Portal session created. Cancellation flows back through webhook. | QA (Lovable) | High |
| AC-13 | Switch Stripe to live mode | Move from test keys to production keys. | 1. In Supabase Edge Function secrets, set `STRIPE_SECRET_KEY` to live key. 2. Set `STRIPE_WEBHOOK_SECRET` to live webhook signing secret. 3. Set `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_90_DAY`, `STRIPE_PRICE_12_MONTH` to live price IDs. 4. Create live webhook endpoint in Stripe dashboard pointing to `stripe-webhook` Edge Function URL. 5. Run a $1 test charge and refund. | Live charge succeeds. Webhook received. Subscription created. Refund processed. | Backend Dev (Lovable) | Blocker |

### 2.4 Diagnostics & Assessments

| # | Task | Goal | Verification Steps | Pass/Fail Criteria | Owner | Priority |
|---|------|------|-------------------|-------------------|-------|----------|
| AC-14 | Diagnostic test flow | Student can take a full diagnostic across all 4 sections. | 1. Start diagnostic from `/diagnostic`. 2. Select a form. 3. Answer questions for all 4 sections (English, Math, Reading, Science). 4. Submit — `finish-diagnostic` Edge Function processes results. 5. Results page loads at `/diagnostic-results/:formId`. | Questions load without errors. Timer functions correctly. Results saved to `diagnostics` table. Scores displayed per section. | QA (Lovable) | Blocker |
| AC-15 | Study plan generation | Diagnostic results trigger a personalized study plan. | 1. Complete diagnostic (AC-14). 2. Navigate to `/plan`. 3. `generate-study-plan` Edge Function creates plan. 4. `study_plan_days` and `study_tasks` tables populated. 5. Daily tasks visible on plan page. | Plan generated with tasks mapped to weak areas. Tasks are launchable. | QA (Lovable) | Blocker |
| AC-16 | Simulation test | Full-length practice test works end-to-end. | 1. Navigate to `/simulation`. 2. Complete all sections with timing. 3. Submit — results saved to `sim_results`. 4. Results page loads at `/simulation-results`. | All sections render. Timer enforces limits. Results persist and display. | QA (Lovable) | High |

### 2.5 Lessons, Mastery & Review

| # | Task | Goal | Verification Steps | Pass/Fail Criteria | Owner | Priority |
|---|------|------|-------------------|-------------------|-------|----------|
| AC-17 | Lesson viewer | Lessons render all 3 tabs (Overview, Examples, Practice). | 1. Navigate to `/lessons`. 2. Select a lesson. 3. Confirm all 3 tabs render content from `lesson_content`/`staging_items`. 4. Practice tab allows answering questions. | No blank tabs. Content loads from DB. Practice questions functional. | QA (Lovable) | High |
| AC-18 | Mastery tracking | Quiz completion updates mastery levels. | 1. Complete a quiz for a specific skill. 2. Check `mastery` table — row updated with new level. 3. Dashboard mastery badges reflect the change. 4. Verify 5-level system (Not Started → Beginner → Learning → Proficient → Mastered). | Mastery updates on quiz submit. Badges render correctly. Levels calculate per `src/lib/mastery.ts` logic. | QA (Lovable) | High |
| AC-19 | Spaced repetition queue | Review queue surfaces due cards. | 1. Complete practice sessions to generate review items. 2. Navigate to `/review/spaced`. 3. Confirm cards appear based on SRS schedule. 4. Answer a card — next review date updates in `review_queue`. | Due cards appear. Answering correctly extends interval. Answering incorrectly shortens interval. | QA (Lovable) | High |
| AC-20 | Error bank / missed questions | Missed questions are captured and reviewable. | 1. Answer questions incorrectly in a drill. 2. Navigate to `/review/missed`. 3. Confirm missed questions appear from `error_bank`. 4. Re-answer correctly — item removed or marked resolved. | Missed items captured automatically. Review page loads and functions. | QA (Lovable) | High |

### 2.6 Dashboards & Analytics

| # | Task | Goal | Verification Steps | Pass/Fail Criteria | Owner | Priority |
|---|------|------|-------------------|-------------------|-------|----------|
| AC-21 | Student dashboard | Dashboard loads with all widgets populated. | 1. Log in as student with activity history. 2. Navigate to `/dashboard`. 3. Confirm: streak counter, weak areas card, study plan widget, mastery overview, upcoming tasks all render. | No blank widgets. Data matches DB records. Page loads in <3s on 4G. | QA (Lovable) | Blocker |
| AC-22 | Analytics page | Performance analytics render charts and data. | 1. Navigate to `/analytics`. 2. Confirm score trend chart, skill breakdown, time-per-question stats render. 3. Verify data matches `sessions`, `responses`, `mastery` tables. | Charts render with real data. No console errors. | QA (Lovable) | High |
| AC-23 | Weak areas page | Weak areas identified and actionable. | 1. Navigate to `/weak-areas`. 2. Confirm skills sorted by priority (Critical/High/Medium). 3. Click a skill — navigates to relevant practice. | Skills ranked correctly per `src/lib/weakAreas.ts`. Links functional. | QA (Lovable) | High |

---

## 3. Edge Cases

| # | Task | Goal | Verification Steps | Pass/Fail Criteria | Owner | Priority |
|---|------|------|-------------------|-------------------|-------|----------|
| EC-1 | Empty state: new user with no data | App must not crash when tables are empty. | 1. Register new user. 2. Navigate to `/dashboard`, `/plan`, `/analytics`, `/weak-areas`, `/review/spaced`, `/review/missed`. 3. Confirm each page shows empty-state UI (not errors or blank screens). | Every page shows a meaningful empty state message or CTA. Zero console errors. | QA (Lovable) | Blocker |
| EC-2 | Session timeout / expired JWT | Graceful handling when Supabase token expires. | 1. Log in. 2. Manually expire the session (clear cookies or wait). 3. Attempt any authenticated action. 4. User redirected to `/login` with a toast notification. | No white screen. User is redirected. No data loss for in-progress work (e.g., partial diagnostic answers saved client-side). | Full-Stack Dev (Lovable) | Blocker |
| EC-3 | Concurrent tab usage | Multiple tabs don't corrupt state. | 1. Open app in 2 tabs. 2. Complete a quiz in Tab A. 3. Refresh Tab B — data reflects Tab A's changes. 4. No auth conflicts or double submissions. | Data consistent across tabs. No duplicate rows in `responses` or `mastery`. | QA (Lovable) | High |
| EC-4 | Network interruption during quiz | Offline queue captures responses. | 1. Start a drill. 2. Disable network (airplane mode). 3. Answer 2–3 questions. 4. Re-enable network. 5. Confirm offline-queued responses sync to DB. | `src/lib/offline-queue.ts` captures actions. Data syncs on reconnect. User notified. | Full-Stack Dev (Lovable) | High |
| EC-5 | Stripe webhook out-of-order delivery | Subscription state handles late/duplicate webhooks. | 1. In Stripe test mode, trigger `checkout.session.completed` twice (duplicate event ID). 2. Trigger `customer.subscription.deleted` before `customer.subscription.created`. 3. Confirm `stripe_webhook_events` deduplication works. 4. Final subscription state is correct. | Idempotency key prevents duplicates. Out-of-order events resolve to correct final state. | Backend Dev (Lovable) | Blocker |
| EC-6 | Subscription lapsed mid-session | User's subscription expires while they are using the app. | 1. Set subscription `current_period_end` to past. 2. Trigger webhook `customer.subscription.updated` with `status=past_due`. 3. User's next navigation to a premium route should redirect to `/pricing`. | `RequireSubscription` re-checks on route change. User sees upgrade prompt, not a crash. | Full-Stack Dev (Lovable) | High |
| EC-7 | Large diagnostic form (100+ questions) | Performance under load within a single form. | 1. Import a form with 100+ questions. 2. Start diagnostic. 3. Navigate between questions. 4. Submit. | Page transitions <200ms. No memory leaks. Submit completes <5s. | QA (Lovable) | Med |
| EC-8 | Special characters in user input | XSS/injection prevention. | 1. In onboarding, enter `<script>alert('xss')</script>` as name. 2. In tutor chat, send `'; DROP TABLE profiles; --`. 3. Confirm sanitization (DOMPurify) strips HTML. 4. Confirm Supabase parameterized queries prevent SQL injection. | No script execution. No SQL injection. Data stored safely. | Security (Lovable) | Blocker |
| EC-9 | Rate limit enforcement | Abusive requests are throttled. | 1. Call `create-checkout` 6 times in 1 minute (limit is 5). 2. Confirm 6th request returns 429. 3. Call `capture-lead` 11 times in 10 minutes (limit is 10). 4. Confirm 11th request returns 429. | Rate limits enforced per `_shared/rateLimit.ts`. User sees friendly error. | Backend Dev (Lovable) | Blocker |
| EC-10 | Mobile responsiveness | App usable on phone screens. | 1. Open app on 375px-wide viewport (iPhone SE). 2. Navigate through: login → dashboard → diagnostic → lesson → analytics. 3. Confirm no horizontal scroll, no overlapping elements, tap targets ≥44px. | All pages usable on mobile. No layout breaks. | QA (Lovable) | High |
| EC-11 | Accommodations (extended time) | Students with accommodations get extra time. | 1. Enable extended time in onboarding (1.5x). 2. Start a timed drill or diagnostic. 3. Confirm timer reflects extended duration. | Timer = base time × accommodation multiplier. Stored in `accommodations` table. | QA (Lovable) | High |

---

## 4. Release Gates

| # | Gate | Goal | Verification Steps | Pass/Fail Criteria | Owner | Priority |
|---|------|------|-------------------|-------------------|-------|----------|
| RG-1 | TypeScript compilation | Zero type errors in the build. | Run `npm run typecheck`. | Exit code 0. Zero errors. | Dev Lead (Lovable) | Blocker |
| RG-2 | ESLint clean | No errors (warnings acceptable with documented exceptions). | Run `npm run lint`. | Zero errors. Warnings documented in `KNOWN_LINT_WARNINGS.md` if any remain. | Dev Lead (Lovable) | Blocker |
| RG-3 | Production build | Vite build succeeds with no errors. | Run `npm run build`. Confirm `dist/` output. | Exit code 0. `dist/index.html` exists. No build warnings about missing imports. | Dev Lead (Lovable) | Blocker |
| RG-4 | Unit test suite | All existing tests pass. | Run `npm run test`. | Exit code 0. Zero failures. | Dev Lead (Lovable) | Blocker |
| RG-5 | E2E smoke test | Playwright smoke tests pass against a staging build. | 1. Start preview server (`npm run preview`). 2. Run `npx playwright test`. | All specs in `e2e/smoke.spec.ts` pass. | QA (Lovable) | Blocker |
| RG-6 | Dependency audit | No high/critical vulnerabilities in production deps. | Run `npm audit --production`. | Zero high or critical severity findings. | Dev Lead (Lovable) | Blocker |
| RG-7 | RLS policy verification | Row-Level Security enforced on all user-data tables. | 1. Run existing RLS tests (`src/tests/rls.test.ts`). 2. For each table in the schema, confirm `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` in migrations. 3. Attempt cross-user data access via Supabase client with anon key — must fail. | All RLS tests pass. No table allows cross-user reads. | Backend Dev (Lovable) | Blocker |
| RG-8 | Edge Function health | All 19+ Edge Functions respond to basic requests. | 1. Call `/health` Edge Function — expect `{ status: "ok" }`. 2. For each authenticated function, call with invalid JWT — expect 401. 3. For `stripe-webhook`, call without signature — expect 400. | Health returns 200. Auth-required functions reject bad tokens. Webhook rejects unsigned payloads. | Backend Dev (Lovable) | Blocker |
| RG-9 | Sentry configuration | Error tracking operational in production. | 1. Set `VITE_SENTRY_DSN` in production environment. 2. Deploy. 3. Trigger a client-side error (e.g., navigate to a route that throws). 4. Confirm event appears in Sentry dashboard within 60s. | Sentry receives errors. Source maps uploaded (if enabled). Alert rules configured. | DevOps (Lovable) | Blocker |
| RG-10 | CORS lockdown | Production CORS rejects unauthorized origins. | 1. Review `_shared/cors.ts`. 2. Remove `localhost` and Lovable dev domains from allowlist. 3. Add only the production domain (`getpreppit.com` or equivalent). 4. Deploy. 5. Curl from non-allowed origin — confirm CORS rejection. | Only production domain in allowlist. Non-allowed origins receive no `Access-Control-Allow-Origin` header. | Backend Dev (Lovable) | Blocker |
| RG-11 | Environment secrets audit | All secrets set; none hardcoded. | 1. Verify in Supabase dashboard: `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*`, `CRON_SECRET`, `LOVABLE_API_KEY` are set. 2. Run `rg 'sk_live\|sk_test\|whsec_\|service_role' src/` — zero matches. 3. Confirm `VITE_SENTRY_DSN` is set in build environment. | All required secrets present. Zero hardcoded secrets in source. | DevOps (Lovable) | Blocker |
| RG-12 | Bundle size budget | Production bundle is reasonable for target audience (students on mobile). | 1. Run `npm run build`. 2. Check `dist/assets/` file sizes. 3. Total JS (gzipped) must be <500 KB. | Gzipped JS total <500 KB. Largest chunk <250 KB. | Dev Lead (Lovable) | High |
| RG-13 | Lighthouse performance | Core Web Vitals pass for key pages. | 1. Run Lighthouse on `/login`, `/dashboard`, `/lessons`. 2. Performance score ≥70. LCP <2.5s. CLS <0.1. | All three pages meet thresholds. | QA (Lovable) | High |
| RG-14 | Content integrity | Question bank and lesson content are complete and valid. | 1. Run `src/tests/contentIntegrity.test.ts`. 2. Spot-check 10 random questions per section — confirm correct answers, valid choices, no broken passage references. | Content integrity tests pass. Spot-check finds zero broken items. | QA (Lovable) | Blocker |
| RG-15 | Cron job configured | Daily cron Edge Function is scheduled. | 1. Configure Supabase cron (or external scheduler) to call `cron-daily` with `CRON_SECRET` header daily at 00:00 UTC. 2. Trigger manually. 3. Confirm function runs without error (check Supabase function logs). | Cron executes successfully. Logs confirm completion. | Backend Dev (Lovable) | High |

---

## 5. Launch Plan

### Phase 1: Pre-Launch (T-7 days)

| # | Task | Goal | Verification Steps | Pass/Fail Criteria | Owner | Priority |
|---|------|------|-------------------|-------------------|-------|----------|
| LP-1 | Staging environment smoke test | Full feature walkthrough on staging. | 1. Deploy current branch to staging (Lovable preview). 2. Walk through every AC item (AC-1 through AC-23) on staging. 3. Document any failures. | All AC items pass on staging. | QA (Lovable) | Blocker |
| LP-2 | Stripe live-mode dry run | Confirm live payments work before public launch. | 1. Complete AC-13 (live key swap). 2. Process a real $1 charge with a real card. 3. Confirm webhook received. 4. Refund the charge. | Charge succeeds. Webhook processes. Refund issued. | PM (Lovable) | Blocker |
| LP-3 | Supabase backup verification | Confirm database backups are enabled and restorable. | 1. In Supabase dashboard, confirm daily backups are enabled (Pro plan required). 2. Note the most recent backup timestamp. 3. If available, perform a test restore to a separate project. | Backups enabled. Most recent backup <24h old. | DevOps (Lovable) | Blocker |
| LP-4 | DNS & SSL | Production domain resolves to deployed app with valid cert. | 1. Confirm DNS A/CNAME records point to Lovable hosting. 2. Visit `https://getpreppit.com` (or production domain) — loads app. 3. Check SSL certificate — valid, not expired, covers the domain. | HTTPS works. No mixed content warnings. Certificate valid ≥30 days. | DevOps (Lovable) | Blocker |
| LP-5 | Legal pages | Terms of Service and Privacy Policy are live and linked. | 1. Visit `/terms` — content renders. 2. Visit `/privacy` — content renders. 3. Links present in footer and during sign-up flow. | Legal pages accessible. Content reviewed by legal counsel (confirm with PM). | PM (Lovable) | Blocker |
| LP-6 | SEO & meta tags | Key pages have proper meta titles, descriptions, and OG tags. | 1. Check `index.html` for `<title>`, `<meta name="description">`, OG tags. 2. Confirm `robots.txt` allows crawling of public pages. 3. Confirm `/login`, `/pricing` have appropriate meta. | Meta tags present. `robots.txt` configured. | Dev Lead (Lovable) | Med |
| LP-7 | Email templates | Supabase Auth emails (verification, password reset) are branded. | 1. In Supabase dashboard → Authentication → Email Templates. 2. Confirm custom templates for: Confirm signup, Reset password, Magic link (if used). 3. Send test emails — confirm branding and links work. | Emails are branded (not default Supabase). Links resolve correctly. | PM (Lovable) | High |
| LP-8 | Create `.env.example` | Document all required environment variables for future developers. | 1. Create `.env.example` in repo root listing every env var with placeholder values and comments. 2. Include both client-side (`VITE_*`) and Edge Function vars. | File committed. All vars from Assumption #2 and RG-11 documented. | Dev Lead (Lovable) | High |

### Phase 2: Launch Day (T-0)

| # | Task | Goal | Verification Steps | Pass/Fail Criteria | Owner | Priority |
|---|------|------|-------------------|-------------------|-------|----------|
| LP-9 | Deploy to production | Ship the verified build. | 1. Merge scope-frozen branch to main. 2. Publish via Lovable. 3. Verify production URL loads. 4. Run E2E smoke test against production URL. | App loads. Smoke tests pass. No console errors on key pages. | Dev Lead (Lovable) | Blocker |
| LP-10 | Verify Stripe webhooks on production | Live webhooks flow through. | 1. Check Stripe dashboard → Webhooks → recent events. 2. If no organic events yet, trigger a test event from Stripe. 3. Confirm `stripe_webhook_events` row created in production DB. | Webhook endpoint returns 200. Event recorded. | Backend Dev (Lovable) | Blocker |
| LP-11 | Verify Sentry on production | Errors are captured in production. | 1. Open browser console on production. 2. Trigger `window.dispatchEvent(new ErrorEvent('error', { error: new Error('launch-test') }))`. 3. Confirm event in Sentry within 60s. | Sentry event received with correct environment tag. | DevOps (Lovable) | Blocker |
| LP-12 | Verify health check | Health endpoint confirms connectivity. | 1. Visit `/health` on production. 2. Confirm `{ status: "ok", database: "connected" }` or equivalent. | Health returns 200 with OK status. | DevOps (Lovable) | Blocker |
| LP-13 | Monitor first 10 sign-ups | Confirm real-user flows work. | 1. Watch Supabase Auth dashboard for new users. 2. Check `profiles` table for new rows. 3. Monitor Sentry for errors during first hour. | First 10 users complete onboarding without errors in Sentry. | PM (Lovable) | Blocker |

### Phase 3: Post-Launch (T+1 to T+7)

| # | Task | Goal | Verification Steps | Pass/Fail Criteria | Owner | Priority |
|---|------|------|-------------------|-------------------|-------|----------|
| LP-14 | Triage Sentry errors | Address any production errors within SLA. | 1. Review Sentry daily. 2. P0 (crash): fix within 4 hours. 3. P1 (feature broken): fix within 24 hours. 4. P2 (cosmetic): fix within 1 week. | Zero unresolved P0s after 24 hours. P1 backlog <5 after 1 week. | Dev Lead (Lovable) | Blocker |
| LP-15 | Collect conversion metrics | Understand sign-up → subscription funnel. | 1. Query `auth.users` count. 2. Query `subscriptions` where `status = 'active'` count. 3. Calculate conversion rate. 4. Report to PM daily for first week. | Report delivered daily. Funnel data accurate. | PM (Lovable) | High |

---

## 6. Post-Launch Monitoring

| # | Task | Goal | Verification Steps | Pass/Fail Criteria | Owner | Priority |
|---|------|------|-------------------|-------------------|-------|----------|
| PM-1 | Sentry error rate alerting | Get notified when error rate spikes. | 1. In Sentry, create alert rule: >10 events/hour triggers Slack/email notification. 2. Test by triggering 11 errors. 3. Confirm alert fires. | Alert configured and tested. Team receives notification. | DevOps (Lovable) | Blocker |
| PM-2 | Supabase database monitoring | Track connection pool, query performance, storage. | 1. In Supabase dashboard → Reports. 2. Confirm active connections <80% of pool limit. 3. Check for slow queries (>1s). 4. Set up weekly review cadence. | No queries >1s in normal operation. Connection usage healthy. | Backend Dev (Lovable) | High |
| PM-3 | Stripe webhook failure monitoring | Detect failed webhook deliveries. | 1. In Stripe dashboard → Webhooks → check failure rate. 2. Set up Stripe email notifications for failed webhooks. 3. Weekly review: zero failed webhooks. | Webhook success rate >99%. Failed deliveries investigated within 24h. | Backend Dev (Lovable) | High |
| PM-4 | Edge Function latency monitoring | Ensure Edge Functions respond within SLA. | 1. In Supabase dashboard → Edge Functions → check invocation logs. 2. P95 latency for `create-checkout`, `tutor-chat`, `generate-study-plan` should be <3s. 3. P95 for CRUD functions (`session-start`, `submit-response`) should be <500ms. | Latency within thresholds. Outliers investigated. | Backend Dev (Lovable) | High |
| PM-5 | Uptime monitoring | External health check pings the app. | 1. Set up external uptime monitor (e.g., UptimeRobot, Better Uptime) for production URL and `/health` endpoint. 2. Configure 5-minute check interval. 3. Alert on 2 consecutive failures. | Monitor configured. Alert tested. 99.9% uptime target. | DevOps (Lovable) | Blocker |
| PM-6 | Weekly security review | Ongoing dependency and access audit. | 1. Run `npm audit --production` weekly. 2. Review Supabase Auth logs for anomalies (brute force, suspicious IPs). 3. Verify no new secrets committed (`rg 'sk_live\|sk_test' src/`). | Weekly report filed. Zero new high/critical vulns unaddressed >7 days. | Dev Lead (Lovable) | High |
| PM-7 | Test coverage improvement plan | Raise coverage from current level toward 70%. | 1. After launch stabilization (T+14), identify top 10 untested critical paths. 2. Write tests for 2 paths per week. 3. Track coverage with `vitest --coverage`. | Coverage increases week-over-week. Target: 30% by T+30, 50% by T+60, 70% by T+90. | Dev Lead (Lovable) | Med |
| PM-8 | User feedback loop | Capture and triage user-reported issues. | 1. Add a "Report a Problem" link in the app (can be a mailto or form). 2. Review incoming reports daily for first 2 weeks, then weekly. 3. Triage into P0/P1/P2. | Feedback mechanism live at launch. Triage SLA: P0 within 4h, P1 within 24h. | PM (Lovable) | High |

---

## 7. Go / No-Go Checklist

All items below must be **Pass** to authorize production launch. Any single **Fail** is a hard stop.

| # | Blocking Item | Status | Verified By | Date |
|---|--------------|--------|-------------|------|
| 1 | `npm run typecheck` — zero errors (RG-1) | ☐ Pass / ☐ Fail | | |
| 2 | `npm run lint` — zero errors (RG-2) | ☐ Pass / ☐ Fail | | |
| 3 | `npm run build` — succeeds (RG-3) | ☐ Pass / ☐ Fail | | |
| 4 | `npm run test` — all pass (RG-4) | ☐ Pass / ☐ Fail | | |
| 5 | E2E smoke tests pass on staging (RG-5) | ☐ Pass / ☐ Fail | | |
| 6 | `npm audit --production` — zero high/critical (RG-6) | ☐ Pass / ☐ Fail | | |
| 7 | RLS verified on all user-data tables (RG-7) | ☐ Pass / ☐ Fail | | |
| 8 | All Edge Functions respond correctly (RG-8) | ☐ Pass / ☐ Fail | | |
| 9 | Sentry DSN configured and receiving events (RG-9) | ☐ Pass / ☐ Fail | | |
| 10 | CORS locked to production domain only (RG-10) | ☐ Pass / ☐ Fail | | |
| 11 | All secrets set in Supabase; none in source code (RG-11) | ☐ Pass / ☐ Fail | | |
| 12 | Content integrity tests pass (RG-14) | ☐ Pass / ☐ Fail | | |
| 13 | `RequireSubscription` wired into premium routes (AC-9) | ☐ Pass / ☐ Fail | | |
| 14 | Stripe live-mode checkout + webhook verified (AC-13, LP-2) | ☐ Pass / ☐ Fail | | |
| 15 | Stripe webhook idempotency verified (EC-5) | ☐ Pass / ☐ Fail | | |
| 16 | XSS/injection edge cases tested (EC-8) | ☐ Pass / ☐ Fail | | |
| 17 | Rate limiting enforced on sensitive endpoints (EC-9) | ☐ Pass / ☐ Fail | | |
| 18 | Empty-state pages render without errors (EC-1) | ☐ Pass / ☐ Fail | | |
| 19 | Session expiry handled gracefully (EC-2) | ☐ Pass / ☐ Fail | | |
| 20 | Database schema frozen — `supabase db diff` empty (SF-3) | ☐ Pass / ☐ Fail | | |
| 21 | DNS + SSL valid on production domain (LP-4) | ☐ Pass / ☐ Fail | | |
| 22 | Legal pages (Terms, Privacy) live and linked (LP-5) | ☐ Pass / ☐ Fail | | |
| 23 | Supabase backups enabled and verified (LP-3) | ☐ Pass / ☐ Fail | | |
| 24 | Uptime monitor configured and alerting (PM-5) | ☐ Pass / ☐ Fail | | |
| 25 | Sentry alert rules configured and tested (PM-1) | ☐ Pass / ☐ Fail | | |

**Decision:**
- **All 25 items Pass** → **GO** — Deploy to production.
- **Any item Fail** → **NO-GO** — Fix the failing item, re-verify, re-run checklist.

---

**Sign-off:**

| Role | Name | Go / No-Go | Date |
|------|------|------------|------|
| PM (Lovable) | | | |
| Dev Lead (Lovable) | | | |
| QA Lead (Lovable) | | | |
| Client Stakeholder | | | |
