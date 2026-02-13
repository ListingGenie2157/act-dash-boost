

## Store Stripe Price IDs and Update Display Pricing

### Step 1: Store 3 Stripe Price IDs as Supabase Secrets

| Secret Name | Value |
|---|---|
| STRIPE_PRICE_MONTHLY | price_1T09BdEQ5F8iLeKcnQBvuyLE |
| STRIPE_PRICE_90_DAY | price_1T0C4ZEQ5F8iLeKcfnWn0x3A |
| STRIPE_PRICE_12_MONTH | price_1T0C8fEQ5F8iLeKc8KhCLW2u |

### Step 2: Update Display Prices in `src/hooks/useSubscription.ts`

Update the `PLAN_PRICES` constant:

| Plan | Old Price | New Price | Savings |
|---|---|---|---|
| Monthly | $29.99/mo | $39/mo | -- |
| 90-Day Pass | $119 | $89 | Save $28 vs 3 months |
| 12-Month Pass | $249 | $199 | Save $269 vs 12 months |

### Step 3: No Edge Function Changes Needed

The `create-checkout`, `check-subscription`, and `stripe-webhook` functions already read price IDs from environment variables via `getPriceIds()` and `getPriceToPlan()`. The 7-day free trial remains on the monthly plan only.

### Files Modified
- `src/hooks/useSubscription.ts` -- update `PLAN_PRICES` amounts and savings strings

