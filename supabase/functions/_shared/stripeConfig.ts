/**
 * Shared Stripe configuration loaded from environment variables.
 * Maps price IDs → plan types. No product IDs needed.
 *
 * Required env vars (set in Supabase Edge Function secrets):
 *   STRIPE_PRICE_MONTHLY, STRIPE_PRICE_90_DAY, STRIPE_PRICE_12_MONTH
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

/** Returns a price-ID → plan-type mapping from env. */
export function getPriceToPlan(): Record<string, PlanType> {
  const ids = getPriceIds();
  return {
    [ids.monthly]: "monthly",
    [ids["90_day"]]: "90_day",
    [ids["12_month"]]: "12_month",
  };
}

/** Duration in days for one-time (non-subscription) plans. */
export const PLAN_DURATIONS: Record<string, number> = {
  "90_day": 90,
  "12_month": 365,
};
