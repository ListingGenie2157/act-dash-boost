/**
 * Shared Stripe configuration loaded from environment variables.
 * This avoids hardcoding product/price IDs in code, making it safe
 * to switch Stripe environments or recreate products.
 *
 * Required env vars (set in Supabase Edge Function secrets):
 *   STRIPE_PRICE_MONTHLY, STRIPE_PRICE_90_DAY, STRIPE_PRICE_12_MONTH
 *   STRIPE_PRODUCT_MONTHLY, STRIPE_PRODUCT_90_DAY, STRIPE_PRODUCT_12_MONTH
 */

const VALID_PLAN_TYPES = ["monthly", "90_day", "12_month"] as const;
export type PlanType = (typeof VALID_PLAN_TYPES)[number];

export function isValidPlanType(value: unknown): value is PlanType {
  return typeof value === "string" && VALID_PLAN_TYPES.includes(value as PlanType);
}

/** Returns price IDs from env, throwing if any are missing. */
export function getPriceIds(): Record<PlanType, string> {
  const monthly = Deno.env.get("STRIPE_PRICE_MONTHLY");
  const ninety = Deno.env.get("STRIPE_PRICE_90_DAY");
  const twelve = Deno.env.get("STRIPE_PRICE_12_MONTH");

  if (!monthly || !ninety || !twelve) {
    throw new Error(
      "Missing Stripe price env vars. Set STRIPE_PRICE_MONTHLY, STRIPE_PRICE_90_DAY, STRIPE_PRICE_12_MONTH."
    );
  }

  return { monthly, "90_day": ninety, "12_month": twelve };
}

/** Returns a product-ID → plan-type mapping from env, throwing if any are missing. */
export function getProductToPlan(): Record<string, PlanType> {
  const monthly = Deno.env.get("STRIPE_PRODUCT_MONTHLY");
  const ninety = Deno.env.get("STRIPE_PRODUCT_90_DAY");
  const twelve = Deno.env.get("STRIPE_PRODUCT_12_MONTH");

  if (!monthly || !ninety || !twelve) {
    throw new Error(
      "Missing Stripe product env vars. Set STRIPE_PRODUCT_MONTHLY, STRIPE_PRODUCT_90_DAY, STRIPE_PRODUCT_12_MONTH."
    );
  }

  return {
    [monthly]: "monthly",
    [ninety]: "90_day",
    [twelve]: "12_month",
  };
}

/** Duration in days for one-time (non-subscription) plans. */
export const PLAN_DURATIONS: Record<string, number> = {
  "90_day": 90,
  "12_month": 365,
};
