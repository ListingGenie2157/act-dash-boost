

## Comprehensive Automated Test Suite

### What This Covers

Three testing layers that let you verify the entire app with minimal manual effort:

1. **Edge Function Integration Tests** -- Call every deployed function and verify it responds correctly
2. **Frontend Unit Tests** -- Render critical pages/components and verify they don't crash
3. **Expanded E2E Tests** -- Playwright tests covering the public user journey (landing, login, health check)

---

### Layer 1: Edge Function Integration Tests (new file)

Create `supabase/functions/_shared/integration.test.ts` that hits every deployed edge function endpoint via HTTP and checks for valid responses (not 500 errors). Functions tested:

| Function | Test |
|---|---|
| health | GET returns 200 + `status: "healthy"` |
| check-subscription | POST without auth returns 401 |
| capture-lead | POST with email returns 200 |
| session-start | POST without auth returns 401 |
| submit-response | POST without auth returns 401 |
| session-fetch | POST without auth returns 401 |
| session-finish | POST without auth returns 401 |
| set-baseline | POST without auth returns 401 |
| set-test-date | POST without auth returns 401 |
| days-left | POST without auth returns 401 |
| generate-study-plan | POST without auth returns 401 |
| complete-task | POST without auth returns 401 |
| finish-diagnostic | POST without auth returns 401 |
| create-checkout | POST without auth returns 401 |
| customer-portal | POST without auth returns 401 |
| tutor-chat | POST without auth returns 401 |
| generate-questions | POST without auth returns 401 |

This confirms every function is deployed, reachable, and correctly rejects unauthenticated requests (no 500 crashes).

### Layer 2: Frontend Component Smoke Tests (new file)

Create `src/tests/pages.test.tsx` that renders each major public page inside a test wrapper and asserts it doesn't throw:

- LandingPage
- Login
- Pricing
- Terms
- Privacy
- HealthCheck
- NotFound

These catch import errors, missing dependencies, and render crashes without needing authentication.

### Layer 3: Expanded Playwright E2E Tests (update existing file)

Update `e2e/smoke.spec.ts` to add:

- Health check endpoint returns "OK" or "UNHEALTHY" text
- Landing page has call-to-action buttons
- Pricing page loads and shows plan options
- Login page shows email input
- 404 page renders for invalid routes

---

### Technical Details

**Files created:**
- `supabase/functions/_shared/integration.test.ts` -- Deno test file calling all 17+ edge functions
- `src/tests/pages.test.tsx` -- Vitest tests for public page rendering

**Files modified:**
- `e2e/smoke.spec.ts` -- Add 3-4 more Playwright specs

**How to run:**
- Edge function tests: Run via the Deno test tool (I'll run them after creating)
- Frontend tests: Run via Vitest (existing setup)
- E2E tests: Playwright (existing setup)

**No database changes or new dependencies required.**

