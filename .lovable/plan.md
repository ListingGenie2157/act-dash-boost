

## QA-006 Analysis: Subscription Gating Enforcement

### Current State: Partially Implemented — Client-Side Gating Component Exists But Is Not Used

**Finding: `RequireSubscription` component is defined but never imported or used anywhere in the app.**

The component exists in `src/components/RequireSubscription.tsx` and correctly redirects unsubscribed users to `/pricing`. However, it is not wrapped around any route in `App.tsx`. No route uses `RequireSubscription`.

This means **client-side gating is not enforced** — any authenticated user can navigate to any protected route regardless of subscription status.

### Server-Side Gating: Correctly Implemented

The `session-fetch` edge function (lines 93-113) properly enforces server-side gating:
- Exempts diagnostic (`D2`) and onboarding (`ONB`) form IDs
- Checks `subscriptions` table for `active` or `trialing` status
- Validates `current_period_end` hasn't passed
- Returns 403 if subscription is missing or expired

The `check-subscription` edge function correctly returns `subscribed: true/false` with `plan_type`.

### What Needs to Change

The `RequireSubscription` wrapper needs to be added to premium routes in `App.tsx`. Based on the server-side exemptions (diagnostic and onboarding are free), the following routes should be gated:

- `/simulation`, `/simulation-results`
- `/drill/:subject/setup`, `/drill/:subject/play`, `/drill-history`, `/drill-detail/:taskId`, `/drill/:subject`
- `/quiz/:section`
- `/weak-areas`
- `/calculator-lab`
- `/pacing-lab`
- `/review/missed`, `/review/spaced`
- `/plan`, `/task/:date/:idx`
- `/lesson/:topic`, `/lessons`
- `/cheatsheets/*`

Routes that should remain free (no subscription required):
- `/dashboard` — needs to be accessible to show upsell
- `/onboarding` — onboarding flow
- `/diagnostic`, `/diagnostic-test/*`, `/diagnostic-results/*` — diagnostic assessment
- `/analytics` — could go either way, but dashboard-adjacent
- `/parent-portal` — parent access
- Admin routes — admin access

### Implementation Plan

1. **Wrap premium routes with `RequireSubscription`** in `App.tsx`. Import `RequireSubscription` and wrap each premium route's element, e.g.:
   ```
   <Route path="/simulation" element={<RequireSubscription><LazyLoader><LazySimulation /></LazyLoader></RequireSubscription>} />
   ```

2. No changes needed to edge functions or the `RequireSubscription` component itself — they are correctly implemented.

### Technical Details

- `RequireSubscription` uses the `useSubscription` hook which calls `check-subscription` edge function
- The hook has a 1-minute stale time and refetches on window focus
- The component shows a loading spinner while checking, then redirects to `/pricing` if not subscribed
- Server-side enforcement in `session-fetch` provides defense-in-depth

