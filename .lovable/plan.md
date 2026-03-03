

## QA-003 Analysis: Monthly Subscription Stripe Checkout

### Current State: All Steps Should Pass

The full checkout flow is correctly implemented end-to-end. Here is the verification:

**Step 1 — Navigate to /pricing:** The `Pricing.tsx` page renders three plan cards (monthly, 90_day, 12_month) with correct prices from `PLAN_PRICES`. The monthly card shows a "7-day free trial" badge and a "Start Free Trial" button.

**Step 2 — Click subscribe:** `handleSelectPlan` checks for auth (redirects to `/login` if not signed in), then calls `createCheckout('monthly')` which invokes the `create-checkout` edge function.

**Step 3 — Stripe Checkout loads:** The `create-checkout` edge function sets `mode: "subscription"` for monthly, includes `trial_period_days: 7` in `subscription_data`, and uses the price from `STRIPE_PRICE_MONTHLY` env var. The trial label will appear in Stripe's hosted checkout.

**Step 4 — Complete payment:** Stripe handles this entirely.

**Step 5 — Redirect to /subscription-success:** The `success_url` is set to `${origin}/subscription-success?session_id={CHECKOUT_SESSION_ID}`. The route exists in `App.tsx`.

**Step 6 — Polling resolves:** `SubscriptionSuccess.tsx` polls via `refetch()` every 3 seconds for up to 10 attempts. The `check-subscription` edge function checks both the local `subscriptions` table (populated by webhook) and falls back to querying Stripe directly. It correctly handles `trialing` status.

**Step 7 — Database row:** The `stripe-webhook` handles `customer.subscription.created` and upserts into `subscriptions` with the correct plan_type and status from Stripe (which will be `trialing` during the trial period).

### Verdict: No Code Changes Needed

The entire QA-003 flow is correctly wired. The only prerequisites are operational:
- Stripe test mode is enabled with valid test API keys
- `STRIPE_PRICE_MONTHLY` secret is set to a valid Stripe price ID
- `STRIPE_WEBHOOK_SECRET` is set and the webhook endpoint is registered in the Stripe Dashboard for the required events
- The Supabase project is unpaused

All code paths — pricing UI, checkout creation, webhook processing, subscription polling, and success page — are aligned and should pass this test case without modifications.

