/**
 * Where a signed-in user goes next. Used by /start (after sign-in or the
 * email-confirm link) and by the checkout success page.
 *
 * Every family needs a plan or trial to be inside the app, so:
 * - with access: onboarding first, then the dashboard
 * - without access, plan chosen: straight to checkout
 * - without access, no plan: the pricing page
 */
export type PlanId = 'monthly' | '90_day' | '12_month';

export const PLAN_STORAGE_KEY = 'preppit.selectedPlan';

const PLAN_IDS: readonly PlanId[] = ['monthly', '90_day', '12_month'];

export function parsePlan(value: string | null | undefined): PlanId | null {
  return PLAN_IDS.includes(value as PlanId) ? (value as PlanId) : null;
}

export interface PostAuthState {
  isAdmin: boolean;
  hasAccess: boolean;
  onboardingComplete: boolean;
  plan: PlanId | null;
}

export type PostAuthRoute =
  | { kind: 'navigate'; to: string }
  | { kind: 'checkout'; plan: PlanId };

export function getPostAuthRoute(s: PostAuthState): PostAuthRoute {
  if (s.isAdmin || s.hasAccess) {
    return { kind: 'navigate', to: s.onboardingComplete ? '/dashboard' : '/onboarding' };
  }
  if (s.plan) return { kind: 'checkout', plan: s.plan };
  return { kind: 'navigate', to: '/pricing' };
}
