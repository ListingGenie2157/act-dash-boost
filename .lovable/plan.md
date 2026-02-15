

# Production Readiness Deep-Dive Report

---

## Summary Score

| Severity | Count | Details |
|----------|-------|---------|
| **P0** | **2** | PII in logs, `days-left` unauthenticated DB read |
| **P1** | **5** | Missing body-size caps, missing `requireEnv` consistency, `session-finish` leaks answer keys, missing rate limits on 2 endpoints, `generate-study-plan` service-key-as-bearer |
| **P2** | **4** | Duplicate RLS policies, error boundary exposes `error.message`, dual package managers, `capture-lead` hardcoded URL |

---

## 1. Security + Auth Deep Dive

### Finding 1.1 -- PII Logged in Edge Functions

**Severity: P0**
**Files:** `supabase/functions/check-subscription/index.ts:41`, `supabase/functions/customer-portal/index.ts:44`

```typescript
// check-subscription/index.ts line 41
logStep("User authenticated", { userId: user.id, email: user.email });
// customer-portal/index.ts line 44
logStep("User authenticated", { userId: user.id, email: user.email });
```

**Problem:** User email is logged to production logs. The `logStep` in `check-subscription` and `customer-portal` pass `email` to console.log. While `check-subscription` has a safe-fields filter, it allows `email` through. `customer-portal` also passes `email` directly.

**Fix:**
- `check-subscription/index.ts` line 41: Remove `email` from logStep call: `logStep("User authenticated", { userId: user.id });`
- `customer-portal/index.ts` line 44: Same fix: `logStep("User authenticated", { userId: user.id });`
- `customer-portal/index.ts` line 63: Remove `url` from logStep (contains user-specific portal URL): `logStep("Portal session created", { sessionId: portalSession.id });`

**Verify:** Deploy, trigger check-subscription, check Edge Function logs for email strings.

---

### Finding 1.2 -- `days-left` Creates Supabase Client Without Auth Header

**Severity: P0**
**File:** `supabase/functions/days-left/index.ts:57`

```typescript
// Line 57 -- client created with bare anon key, no auth header forwarded
const supabase = createClient(supabaseUrl, supabaseKey);
```

**Problem:** The Supabase client is created without passing the user's Authorization header. Even though the function validates the JWT via `getUser(token)`, the subsequent `.from('profiles').select(...)` query runs as an unauthenticated client. This means RLS policies using `auth.uid()` will fail to match, so the query returns no data (or fails silently). The function authenticates the user but then cannot read their profile due to RLS.

**Fix:** Pass the auth header to the client:
```typescript
const supabase = createClient(supabaseUrl, supabaseKey, {
  global: { headers: { Authorization: authHeader } }
});
```

**Verify:** Call `days-left` as an authenticated user with a test_date set. Confirm it returns the correct `days_left` value instead of `null`.

---

### Finding 1.3 -- Edge Function Auth Consistency Audit

All 21 edge functions verified:

| Function | Auth | Ownership Check | Schema Validation | Rate Limit | Body Size Cap |
|----------|------|-----------------|-------------------|------------|---------------|
| session-start | getUser | eq('user_id', user.id) | Zod | 20/min | **MISSING** |
| session-fetch | getUser | eq('user_id', user.id) | UUID regex | 30/min | N/A (GET) |
| session-finish | getUser | eq('user_id', user.id) | Zod | 20/min | **MISSING** |
| submit-response | getUser | eq('user_id', user.id) | Zod | 100/min | **MISSING** |
| complete-task | getUser | eq('user_id', user.id) | Zod | 50/min | **MISSING** |
| check-subscription | getUser(token) | eq('user_id') | N/A | **MISSING** | N/A |
| create-checkout | getUser(token) | N/A (creates) | planType validated | 5/min | **MISSING** |
| customer-portal | getUser(token) | N/A (email lookup) | N/A | **MISSING** | N/A |
| finish-diagnostic | getUser(token) | user_id from JWT | Zod | 10/min | **MISSING** |
| generate-study-plan | getUser | eq('user_id') | partial | 10/min | **MISSING** |
| generate-questions | getUser + admin | admin check | partial | **MISSING** | **MISSING** |
| set-baseline | getUser | eq('user_id') | manual | 10/min | **MISSING** |
| set-test-date | getUser | eq('id', user.id) | date regex | 10/min | **MISSING** |
| days-left | getUser(token) | eq('id', user.id) | N/A | **MISSING** | N/A |
| import-questions | getUser + admin | admin check | manual | 5/min | **MISSING** |
| import-lesson-content | getUser + admin | admin check | N/A | 5/min | **MISSING** |
| tutor-chat | getUser | eq('user_id') | manual validation | 20/min | **MISSING** |
| capture-lead | None (public) | N/A | email regex | 10/10min | **MISSING** |
| cron-daily | CRON_SECRET | N/A | Zod | N/A | N/A |
| stripe-webhook | Stripe signature | N/A | Stripe SDK | N/A | N/A |
| health | None (public) | N/A | N/A | N/A | N/A |

**P1 Finding: 11 POST functions missing request body size cap.** Per memory, the standard is 512KB (`MAX_BODY_BYTES`), but it is not implemented in any function.

**P1 Finding: 4 authenticated functions missing rate limits:** `check-subscription`, `customer-portal`, `days-left`, `generate-questions`.

---

### Finding 1.4 -- `session-finish` Returns Answer Keys to Client

**Severity: P1**
**File:** `supabase/functions/session-finish/index.ts:153-191`

```typescript
// Lines 178-188: Missed questions include correct_answer and explanation
missedQuestions.push({
  question_id: response.question_id,
  staging_id: stagingId,
  question_text: stagingItem.question,
  selected: response.selected,
  correct_answer: stagingItem.answer,  // ANSWER KEY LEAKED
  explanation: stagingItem.explanation, // EXPLANATION LEAKED
  skill_code: skillCode,
  ...
});
```

**Problem:** After session completes, the full answer key and explanations are returned to the client. This is by design for review, but it queries `staging_items` directly (which includes `answer`) via the user's own Supabase client. The RLS policy on `staging_items` allows authenticated users to read drill/form items including answers. This means any authenticated user can directly query `staging_items` to scrape answer keys.

**Fix (deferred to post-launch):** The staging_items RLS policy `authenticated_users_read_drills_and_forms` grants SELECT with no column restrictions. The `v_staging_items_public` view exists to exclude answers, but the raw table is also readable. Consider restricting the RLS policy to only allow service_role access and having `session-finish` use a service client. For now, this is partially mitigated by the session pinning architecture.

**Verify:** Check if a user can run `supabase.from('staging_items').select('answer')` directly from the browser console.

---

### Finding 1.5 -- `generate-study-plan` Accepts Service Key as Bearer Token

**Severity: P1**
**File:** `supabase/functions/generate-study-plan/index.ts:418`

```typescript
const isServiceRole = token === supabaseServiceKey;
```

**Problem:** The function compares the raw Bearer token against the service role key. If `verify_jwt = true` in config.toml, Supabase's gateway should reject non-JWT tokens before the function code runs. However, this pattern is fragile -- if config ever changes to `verify_jwt = false`, this comparison would allow anyone who guesses the service key to impersonate any user via the `userId` body parameter.

**Fix:** This is acceptable as-is since `verify_jwt = true` is set. However, the cron-daily function calls it with `Authorization: Bearer ${supabaseKey}` which is the service role key -- this should work because the Supabase gateway trusts service role keys. Document this dependency clearly.

**Verify:** Confirm `config.toml` has `verify_jwt = true` for `generate-study-plan`. (Confirmed: line 10.)

---

### Finding 1.6 -- RLS/View Safety Audit

**All views use `security_invoker = on`:** Confirmed for `v_form_section`, `v_form_section_public`, `v_questions_public`, `v_staging_items_public`, `vw_user_skill_stats`.

**Answer exposure:** `v_staging_items_public` and `v_form_section_public` correctly exclude `answer` and `explanation` columns. `v_form_section` (service-role only) includes them.

**Issue: `staging_items` table has overly permissive RLS.** Policy `authenticated_users_read_drills_and_forms` allows any authenticated user to SELECT all columns (including `answer`) from staging_items where form_id matches DR_/FA_/FB_/FC_ patterns. This bypasses the view-based protection. (See Finding 1.4.)

---

### Finding 1.7 -- Secrets Scan

No `sk_`, `whsec_`, or service keys found in frontend code. Supabase URL and anon key are intentionally hardcoded (publishable values). All secrets are in Supabase Edge Function secrets. Clean.

---

## 2. Payments / Stripe Deep Dive

### Finding 2.1 -- Webhook Correctness: PASS

- Signature verification via `stripe.webhooks.constructEvent` with `STRIPE_WEBHOOK_SECRET`
- Idempotency via `stripe_webhook_events` table with deduplication check
- Handles: `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.payment_failed`
- Price-ID-based mapping via `getPriceToPlan()` -- correct pattern
- States handled: active, trialing (via subscription events), past_due (via payment_failed), canceled (via subscription.deleted)

### Finding 2.2 -- Entitlement Enforcement: PASS

- **Server-side:** `session-fetch` checks `subscriptions` table for `active` or `trialing` status. Free content (D2*, ONB*) is exempt.
- **Client-side:** `RequireSubscription` component + `useSubscription` hook provide UI gating.
- **Cancel/downgrade:** `customer.subscription.deleted` webhook sets status to `canceled`. `check-subscription` also proactively marks expired subscriptions.

### Finding 2.3 -- Customer Portal: PASS

- `customer-portal` edge function works and is exposed via `useSubscription.openCustomerPortal()`.
- UI button added to Pricing page for active subscribers.
- Success URL: `/subscription-success?session_id={CHECKOUT_SESSION_ID}` -- correct.
- Cancel URL: `/pricing` -- correct.

---

## 3. Data Integrity Deep Dive

### Finding 3.1 -- Constraints + Indexes: MOSTLY DONE

Hot-path indexes already created:
- `idx_sessions_user_id_created_at` on sessions
- `idx_responses_session_question` (UNIQUE) on responses
- `idx_session_questions_session_ord` on session_questions
- `idx_subscriptions_user_id` on subscriptions
- `idx_sim_results_user_id_created` on sim_results

**Missing:** No foreign key from `responses.session_id` to `sessions.id`. No foreign key from `session_questions.session_id` to `sessions.id`. These would prevent orphaned records.

**Severity: P2** -- RLS ownership checks prevent cross-user access, but orphans could accumulate.

### Finding 3.2 -- Transactions/Consistency

`session-start` does a multi-step write (insert session, then insert session_questions). If pinning fails, the session exists without pinned questions. The code handles this gracefully -- `session-fetch` falls back to legacy query. Acceptable.

`complete-task` does multiple writes (update task, upsert progress, insert review_queue, increment error_bank). These are not transactional. A partial failure leaves the task marked COMPLETED but progress/review potentially incomplete. Acceptable for the use case -- the task status is the critical state.

### Finding 3.3 -- Timestamps

All timestamps stored as `timestamptz` (UTC). `generate-study-plan` and `cron-daily` use `America/Chicago` timezone for date calculations -- correct for ACT test dates. `set-test-date` validates against Chicago time. Consistent.

---

## 4. Frontend Production Deep Dive

### Finding 4.1 -- Error Handling

- Global `ErrorBoundary` wraps entire app (App.tsx line 82).
- Reports to Sentry in production via `reportError()`.
- **P2:** ErrorBoundary shows `error.message` in a `<details>` element. Could leak internal error messages. Consider showing only "An unexpected error occurred" in production.

### Finding 4.2 -- Auth/Session State

- `RequireAuth` uses `onAuthStateChange` listener + initial `getSession()` check. Correct pattern.
- `RequireSubscription` shows a loading spinner while checking -- no flash of premium content.
- Token refresh handled by Supabase SDK automatically.

### Finding 4.3 -- Performance

- `QueryClient` configured with `staleTime: 5 * 60 * 1000` (5 min) and `retry: 3` with exponential backoff. Good.
- Lazy loading used for heavy pages (Analytics, AdminImport, Diagnostic, Cheatsheets). Good.
- `useSubscription` has `staleTime: 60 * 1000` (1 min) and `refetchOnWindowFocus: true`. Appropriate.

---

## 5. Ops / Deployment Deep Dive

### Finding 5.1 -- Environment Separation

- CORS allowlist includes both `lovableproject.com` and `lovable.app` preview domains, plus `getpreppit.com` production domain and `localhost`. Good.
- Stripe price IDs are stored as environment variables (not hardcoded). Environment-specific. Good.

### Finding 5.2 -- Build Reproducibility

- **P2:** Both `bun.lockb` and `package-lock.json` exist in the repo. Should use one package manager. (Cannot fix in Lovable environment.)
- Tests: Vitest unit tests, Playwright E2E, Deno edge function tests all present.

### Finding 5.3 -- Monitoring

- Sentry integration present via `@sentry/react` and `errorReporter.ts`.
- `SENTRY_DSN` is in the deployment checklist but needs manual configuration.
- `/health` endpoint exists and returns `{ status: "healthy" }`.
- Production logs sanitized via safe-fields filtering pattern.

---

## 6. Consolidated Patch List

### P0 Fixes (Must ship with 0)

| # | File | Fix |
|---|------|-----|
| 1 | `supabase/functions/check-subscription/index.ts:41` | Remove `email` from logStep: `logStep("User authenticated", { userId: user.id });` |
| 2 | `supabase/functions/customer-portal/index.ts:44` | Remove `email` from logStep: `logStep("User authenticated", { userId: user.id });` |
| 3 | `supabase/functions/customer-portal/index.ts:63` | Remove `url` from logStep |
| 4 | `supabase/functions/days-left/index.ts:57` | Pass auth header to client: `createClient(supabaseUrl, supabaseKey, { global: { headers: { Authorization: authHeader } } })` |

### P1 Fixes (Max 3 allowed with mitigations)

| # | File(s) | Fix |
|---|---------|-----|
| 5 | All 11 POST edge functions | Add body size cap: `const body = await req.text(); if (body.length > 524288) return 413;` then `JSON.parse(body)` |
| 6 | `check-subscription`, `customer-portal`, `days-left`, `generate-questions` | Add rate limiting calls (e.g., 30/min for check-subscription, 10/min for others) |
| 7 | `session-finish/index.ts` | Consider using service client for staging_items query to match the answer-protection architecture, or restrict `staging_items` RLS to exclude `answer` column for non-admin |
| 8 | `_shared/env.ts` usage | Apply `requireEnv` consistently in `check-subscription`, `customer-portal`, `days-left` (currently use manual `Deno.env.get`) |

### P2 Fixes (Nice to have)

| # | File | Fix |
|---|------|-----|
| 9 | `ErrorBoundary.tsx:28` | In production, replace `error.message` display with generic message |
| 10 | `capture-lead/index.ts:4` | Replace hardcoded `SUPABASE_URL` with `Deno.env.get('SUPABASE_URL')` |
| 11 | Database migration | Add FK constraints: `responses.session_id -> sessions.id`, `session_questions.session_id -> sessions.id` |
| 12 | Duplicate RLS policies on `profiles`, `mastery`, `rewards_ledger`, `study_tasks`, `sim_results` | Drop duplicate policies to reduce confusion |

---

## Verification Script

```text
1. User signup/login
   - Create account -> verify email redirect works
   - Login -> lands on /dashboard
   - Logout -> redirected to /login on protected routes

2. Start session -> answer -> submit
   - Navigate to simulation
   - Start session (verify session-start returns session_id)
   - Fetch questions (verify session-fetch returns questions without answers)
   - Submit response (verify submit-response returns correct/incorrect)
   - Finish session (verify session-finish returns summary)

3. Purchase -> webhook -> unlock
   - Click pricing -> select plan -> complete Stripe checkout
   - Verify webhook fires (check stripe_webhook_events table)
   - Verify subscriptions table updated
   - Verify premium content now accessible

4. Cancel -> lock
   - Open customer portal -> cancel subscription
   - Verify webhook fires for customer.subscription.deleted
   - Verify subscriptions.status = 'canceled'
   - Verify premium content now returns 403

5. Abuse test: rate limit triggers
   - Call session-start 16+ times in one day -> expect 429
   - Call create-checkout 6+ times in 1 minute -> expect 429
   - Call session-fetch 31+ times in 1 minute -> expect 429
```

---

## Ship Gate

- **P0 count: 2** -- Must reach 0 before ship
- **P1 count: 5** -- Must reduce to max 3 (body size caps and rate limits are the quickest wins)
- **P2 count: 4** -- Acceptable to defer

**Recommendation:** Fix P0s immediately (4 line changes across 3 files). Then add body size caps and rate limits to close P1s to within threshold.

