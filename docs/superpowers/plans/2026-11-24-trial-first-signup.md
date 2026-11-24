# Trial-First Signup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every new family picks a plan, starts a 7-day card-required trial, then onboards (diagnostic or skip). No one is inside the app without an active plan or trial.

**Architecture:**
- **One pure routing function decides where a signed-in user goes:** `getPostAuthRoute(state)`. Login, the email-confirm landing page (`/start`) and the checkout success page all call it.
- **The chosen plan travels through signup** as a `?plan=` query param and in `sessionStorage`.
- **Sign-up comes before checkout:** the user signs up, confirms their email, and then checkout starts automatically.
- **Route guard:** every in-app route sits behind `RequireSubscription`.

**Tech Stack:** React 18 + TS + React Router 6, Vitest + Testing Library, Supabase Auth, Stripe Checkout (`create-checkout`, already sets `trial_period_days: 7` and `payment_method_collection: 'always'`).

**Spec:** Founder decisions, 2026-11-24:
- Flow: pick a plan → sign up → checkout with a 7-day trial → onboarding → diagnostic or skip → dashboard.
- The card is required. The trial is 7 days. Every plan includes the trial.

## Global Constraints

- **Trial terms:** 7 days, card required. Already true in `supabase/functions/create-checkout/index.ts:93-117`. Don't change Stripe settings.
- **Plan ids:** exactly `'monthly' | '90_day' | '12_month'`, the same type `useSubscription().createCheckout` takes.
- **Admins** bypass every gate, as `RequireSubscription` does today.
- **Free accounts** that already exist and have no plan are sent to `/pricing` after signing in. No data is deleted.
- **Pricing and Login copy** must state: "7 days free, then [price]. Card required. Cancel anytime before the trial ends and you won't be charged."
- **Email confirmation stays on.** The confirm link must land on `/start`. Owner action: the Supabase redirect-URL allowlist includes `https://getpreppit.com/**`.

## Review Focus

1. **The webhook lags Stripe's redirect.** The user returns from checkout before the `subscriptions` row exists. The success page must poll `check-subscription` (which syncs from Stripe) before routing on, never bounce to `/pricing`.
2. **The confirm-email link opens on another device or browser,** where `sessionStorage` has no plan. `/start` must use `?plan=` from the link, and show `/pricing` if neither source has a valid plan.
3. **A user abandons checkout** (Stripe cancel). They return to `/pricing` already signed in, and choosing a plan goes straight to checkout with no second sign-up.
4. **An existing subscriber signs in.** They go to `/dashboard`, or `/onboarding` if not onboarded, never to checkout.
5. **The plan param is invalid** (`?plan=free`). It is ignored, never passed to `create-checkout`.

---

### Task 0: Every plan gets the 7-day trial (founder decision 2026-11-24)

Passes were one-time payments charged immediately, with no trial. They become Stripe subscriptions billed every 90 or 365 days with the same 7-day card-required trial. On creation, the webhook sets `cancel_at = trial_end + 90/365 days` so a pass bills once and never renews.

**Files:**
- `supabase/functions/_shared/stripeConfig.ts`: add `passCancelAt(planType, trialEnd): number | null`. Tested in `stripeConfig.test.ts`.
- `supabase/functions/create-checkout/index.ts`: `mode: "subscription"` and the trial for every plan.
- `supabase/functions/stripe-webhook/index.ts`: on subscription created or updated, set `cancel_at` for passes once.
- **Owner action:** in Stripe, create two recurring prices: $89 every 90 days and $199 every 365 days. Set the secrets `STRIPE_PRICE_90_DAY` and `STRIPE_PRICE_12_MONTH` to the new price ids. Then deploy `create-checkout` and `stripe-webhook`.

### Task 1: The post-auth routing function

**Files:**
- Create: `src/lib/postAuthRoute.ts`
- Test: `src/lib/postAuthRoute.test.ts`

**Interfaces:**
- Produces:
  - `type PlanId = 'monthly' | '90_day' | '12_month'`
  - `parsePlan(v: string | null | undefined): PlanId | null`
  - `getPostAuthRoute(s: { isAdmin: boolean; hasAccess: boolean; onboardingComplete: boolean; plan: PlanId | null }): { kind: 'navigate'; to: string } | { kind: 'checkout'; plan: PlanId }`
  - `PLAN_STORAGE_KEY = 'preppit.selectedPlan'`

- [ ] **Step 1: Write the failing tests:**
  - `parsePlan('monthly')` returns `'monthly'`.
  - `parsePlan('free')`, `parsePlan(null)` and `parsePlan('')` return `null`.
  - Admin or `hasAccess`, not onboarded: `{kind:'navigate', to:'/onboarding'}`.
  - Admin or `hasAccess`, onboarded: `{kind:'navigate', to:'/dashboard'}`, even if a plan is present.
  - No access with `plan='90_day'`: `{kind:'checkout', plan:'90_day'}`.
  - No access with `plan=null`: `{kind:'navigate', to:'/pricing'}`.
- [ ] **Step 2:** Run `npx vitest run src/lib/postAuthRoute.test.ts`. Expected: FAIL (module missing).
- [ ] **Step 3:** Implement `src/lib/postAuthRoute.ts`.
- [ ] **Step 4:** Run the same command. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(auth): post-auth routing rules for trial-first signup`.

### Task 2: Carry the plan through sign-up, and add `/start`

**Files:**
- Modify: `src/pages/Pricing.tsx:116-120`. When signed out, store the plan under `PLAN_STORAGE_KEY` and navigate to `/login?mode=signup&plan=<id>`.
- Modify: `src/pages/Login.tsx`:
  - Read `mode`/`plan` from the URL; `mode=signup` opens the sign-up form.
  - Set `emailRedirectTo` to `${origin}/start?plan=<id>` when a plan is known, otherwise `${origin}/start`.
  - On sign-in, replace the `onboarding_complete` branch (lines 72-74) with `navigate('/start' + (plan ? '?plan='+plan : ''))`.
  - Show the trial copy line from Global Constraints under the sign-up button when a plan is present.
- Create: `src/pages/Start.tsx`.
  - Inputs: the signed-in user, `useSubscription()`, `useIsAdmin()`, `profiles.onboarding_complete`, and the plan from `?plan=` or else `sessionStorage`.
  - Call `getPostAuthRoute`. On `checkout`, clear the stored plan and call `createCheckout(plan)`. On `navigate`, `navigate(to, {replace:true})`.
  - While deciding, show a spinner reading "Setting up your trial…".
  - On checkout error, show the error and a "Back to plans" link to `/pricing`.
- Modify: `src/App.tsx`. Add `/start` inside the authenticated routes, not behind `RequireSubscription`.
- Test: `src/pages/Start.test.tsx`, with `useSubscription` and `useIsAdmin` mocked.

- [ ] **Step 1: Write the failing tests:**
  - `?plan=monthly` with no access calls `createCheckout('monthly')`.
  - With no `?plan` but `sessionStorage` holding `'12_month'`, it calls `createCheckout('12_month')`.
  - `hasAccess` and not onboarded navigates to `/onboarding`.
  - No plan anywhere navigates to `/pricing`.
  - `?plan=free` navigates to `/pricing`, and `createCheckout` is not called (Review Focus 2 and 5).
- [ ] **Step 2:** Run `npx vitest run src/pages/Start.test.tsx`. Expected: FAIL.
- [ ] **Step 3:** Implement `Start.tsx` and the Pricing, Login and App changes.
- [ ] **Step 4:** Run the same command, then `npm run typecheck`. Expected: PASS, exit 0.
- [ ] **Step 5:** Commit: `feat(auth): plan-first sign-up via /start`.

### Task 3: After checkout, wait for the trial, then onboard

**Files:**
- Modify: `src/pages/SubscriptionSuccess.tsx`.
  - Poll `check-subscription` every 2 s for up to 30 s, reusing the existing refresh at line 51.
  - Once `isSubscribed`, route through `getPostAuthRoute` (new users land on `/onboarding`).
  - After 30 s with no subscription, show "Your payment went through, we're finishing setup" with a Retry button. Never redirect to `/pricing` (Review Focus 1).
  - Remove the "Go to dashboard" and "Onboarding" buttons.
- Modify: `src/pages/Onboarding.tsx:83-84`. Replace `navigate('/dashboard')` with a final step offering two buttons:
  - "Take the diagnostic (about 45 min)" goes to `/diagnostic`.
  - "Skip for now" goes to `/dashboard`.
  - Confirm the real diagnostic length from `src/pages/Diagnostic.tsx` before writing the copy.
- Modify: the Dashboard. If the user has no diagnostic result, show a card: "Take your diagnostic to personalize your plan", linking to `/diagnostic`. Find the existing "has diagnostic" signal the Dashboard already uses; don't add a query if one exists.
- Test: `src/pages/SubscriptionSuccess.test.tsx` and `src/pages/Onboarding.test.tsx`.

- [ ] **Step 1: Write the failing tests:**
  - Success page with a subscription arriving on the 3rd poll navigates to `/onboarding`.
  - Success page with no subscription after the timeout shows "finishing setup" and does not navigate to `/pricing`.
  - Onboarding submit shows both buttons; "Skip for now" navigates to `/dashboard`.
- [ ] **Step 2:** Run `npx vitest run src/pages/SubscriptionSuccess.test.tsx src/pages/Onboarding.test.tsx`. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run the same command. Expected: PASS.
- [ ] **Step 5:** Commit: `feat(onboarding): land on onboarding after trial starts, diagnostic or skip`.

### Task 4: Gate the whole app, and point every sign-up button at plans

**Files:**
- Modify: `src/App.tsx`. Wrap `/dashboard`, `/onboarding`, `/diagnostic`, `/diagnostic-test/:formId`, `/diagnostic-results/:formId`, `/diagnostic-results-complete` and `/analytics` in `RequireSubscription`. `/start`, `/pricing`, `/subscription-success` and `/parent-portal` stay outside it; the parent portal has its own access model.
- Modify: `src/pages/LandingPage.tsx:80,87,156`. "Get started" / "Start free trial" buttons go to `/pricing`; "Sign in" stays `/login`. Button copy: "Start 7-day free trial".
- Modify: `src/pages/Pricing.tsx`. Show the trial copy line from Global Constraints on each plan card. The CTA reads "Start 7-day free trial".
- Test: extend `src/tests/` route tests, or add `src/App.routes.test.tsx`. With no subscription and not admin, `/dashboard` and `/diagnostic` redirect to `/pricing`; `/start` does not.

- [ ] **Step 1:** Write the failing route test.
- [ ] **Step 2:** Run `npx vitest run src/App.routes.test.tsx`. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run `npm test && npm run typecheck && npm run build`. Expected: all pass.
- [ ] **Step 5:** Commit: `feat(paywall): every in-app route requires a plan or trial; CTAs start the trial`.
- [ ] **Step 6 (Owner action):** On the Lovable preview, run the full flow with a Stripe test card: pick a plan, sign up, confirm the email, finish checkout, complete onboarding, then skip, then dashboard. Also cancel checkout once and confirm you return to `/pricing` still signed in (Review Focus 3).

### Task 5: Remove the free-diagnostic exceptions (after Task 4 is live)

**Files:**
- Create: `supabase/migrations/<ts>_diagnostic_requires_access.sql`. Recreate `v_staging_items_public` without the `form_id ~~ 'D2%' OR form_id ~~ 'ONB%'` bypass, so all rows require `has_active_access`. Update the view comment.
- Modify: `supabase/tests/database/access_lockdown.test.sql`. The "free user still sees diagnostic items" test now expects `0`.
- Modify: `supabase/functions/session-fetch/index.ts:94-115`. Remove `isExemptForm` and always require access, using `has_active_access` via RPC in place of the hand-rolled subscription query.

- [ ] **Step 1:** Change the test expectation. Run `bash scripts/test-db.sh`. Expected: FAIL on that one assertion.
- [ ] **Step 2:** Write the migration. Run `bash scripts/test-db.sh`. Expected: 32/32 ok.
- [ ] **Step 3:** Update `session-fetch`, then deploy it with `supabase functions deploy session-fetch`.
- [ ] **Step 4 (Owner approval):** Apply the migration to production only after Task 4 is deployed. Otherwise free users mid-diagnostic break before the new flow exists.
- [ ] **Step 5:** Commit: `fix(db): diagnostic now requires a plan or trial`.
