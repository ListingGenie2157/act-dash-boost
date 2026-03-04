

## Free Trial & Stripe Configuration — Issues Found

### Issue 1: Stripe May Be in Test Mode (MANUAL CHECK REQUIRED)

The `STRIPE_SECRET_KEY` secret is set, but I cannot verify whether it's a **test key** (`sk_test_...`) or a **live key** (`sk_live_...`). If Cursor flagged that Stripe is not live, the secret likely contains a test key. No checkout or subscription-check logs exist, which suggests either the functions haven't been called or they're failing silently.

**Action (manual — cannot be done in code):** Go to the Stripe Dashboard → API Keys, copy the **live** secret key, and update the `STRIPE_SECRET_KEY` secret in Supabase. Similarly, verify that `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_90_DAY`, and `STRIPE_PRICE_12_MONTH` contain **live-mode** price IDs (not test-mode ones).

The current live prices in your Stripe account are:
- Monthly: `price_1SpNOrHa0TfiT4jGfXpytR29` ($29.99/mo, recurring)
- 90-Day: `price_1SpNPAHa0TfiT4jGAQvwWd2W` ($119, one-time)
- 12-Month: `price_1SpNPOHa0TfiT4jGIC35qxLq` ($249, one-time)

### Issue 2: Display Prices Don't Match Stripe Prices

The UI shows **$39/mo**, **$89**, and **$199** but your actual Stripe prices are **$29.99/mo**, **$119**, and **$249**. Customers would see one price on your site and a different price at checkout.

**Fix:** Update `PLAN_PRICES` in `src/hooks/useSubscription.ts` to match the real Stripe prices.

### Issue 3: Free Trial Has No `trial_period_days` on the Stripe Price

The checkout code sets `trial_period_days: 7` in `subscription_data`, which is correct and should work. However, the Stripe price object itself shows `trial_period_days: null`. This is fine — the checkout-level override takes precedence. So the trial config in code is correct, but it only works if the Stripe key is live and the price IDs match.

### Implementation Plan

1. **`src/hooks/useSubscription.ts`** — Update `PLAN_PRICES` to match actual Stripe prices ($29.99, $119, $249) and savings calculations.

2. **Manual steps (user must do):**
   - Verify `STRIPE_SECRET_KEY` is the **live** key from Stripe Dashboard
   - Verify the three `STRIPE_PRICE_*` secrets contain the live price IDs listed above
   - Verify the Stripe webhook endpoint is registered with the live signing secret

### Files to Edit
- `src/hooks/useSubscription.ts` (fix display prices)

