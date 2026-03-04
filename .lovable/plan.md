

## Revert Display Prices

The prices shown before my edit ($39/mo, $89, $199) were correct for your current Stripe account. The Stripe account connected to Lovable's MCP tools is your old account with different pricing. I should not have changed them.

### Changes

**`src/hooks/useSubscription.ts`** — Revert `PLAN_PRICES` back to:
- Monthly: $39/month
- 90-Day: $89 one-time, "Save $28 vs 3 months"
- 12-Month: $199 one-time, "Save $269 vs 12 months"

### Checkout Failing — Next Steps

Since checkout is failing and the Stripe tools are connected to the wrong account, we need to:
1. Revert the prices (this plan)
2. Investigate the checkout error by checking browser console/network errors when clicking "Start Free Trial"
3. Verify the Supabase secrets (`STRIPE_SECRET_KEY`, `STRIPE_PRICE_*`) match your current (correct) Stripe account — this is a manual step you'd need to do in the Supabase dashboard

### Files to Edit
- `src/hooks/useSubscription.ts` (revert prices)

