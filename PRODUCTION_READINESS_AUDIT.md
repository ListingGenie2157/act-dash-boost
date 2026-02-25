# Production Readiness Audit Report

**Application:** ACT Prep Platform (Preppit)
**Audit Date:** February 25, 2026
**Auditor:** Principal Software Engineer & Security Auditor
**Branch:** `cursor/codebase-production-readiness-aaa6`

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| **Build** | Vite + SWC |
| **Frontend** | React 18.3, TypeScript 5.8 (strict mode) |
| **Routing** | React Router DOM 6.30 |
| **UI** | shadcn/ui (Radix primitives), Tailwind CSS 3.4, Lucide icons |
| **State** | TanStack React Query 5.83, React Hook Form 7.61 |
| **Validation** | Zod 3.25 |
| **Backend** | Supabase (PostgreSQL, Auth, Edge Functions, RLS) |
| **Monitoring** | Sentry (optional, via `VITE_SENTRY_DSN`) |
| **Sanitization** | DOMPurify |
| **Offline** | IndexedDB via `idb` |
| **Testing** | Vitest, Testing Library, Playwright |
| **Charts** | Recharts |

**Codebase Scale:** ~44 pages, ~117 components, ~16 hooks, ~27 lib files, ~94 DB migrations, ~20 edge functions

---

## 1. Executive Summary

### Verdict: CONDITIONAL GO — with Critical Blockers resolved first

This codebase demonstrates solid architectural foundations: strict TypeScript, RLS on all database tables, PKCE auth flow, Zod validation schemas, DOMPurify for HTML sanitization, and an offline queue for resilience. The team has clearly invested in security and correctness.

However, the platform is **not production-ready in its current state** due to a small number of critical issues that must be addressed before launch. The most urgent are: (1) the vast majority of error handlers route to `console.error` instead of the existing `reportError()` infrastructure — meaning production errors will be invisible, (2) the absence of Content-Security-Policy headers, and (3) a weak default salt in the lead capture function.

Once the 7 critical blockers below are resolved (estimated 2–3 engineering days), the platform can ship. The high-priority items should be scheduled for the first post-launch sprint.

---

## 2. Critical Blockers (Must Fix Before Launch)

### CRIT-1: Production error monitoring is effectively disabled

**Severity:** Critical | **Pillar:** Error Handling
**Impact:** Crashes, failed test submissions, and data-loss scenarios will be invisible in production.

The codebase has a well-designed `reportError()` function (`src/lib/errorReporter.ts`) that integrates with Sentry. However, only **5 files** call it. Meanwhile, **48+ files** across `src/` use raw `console.error` — totaling ~100 call sites. In production, these errors vanish.

**Affected files (sample):**
- `src/components/StudyPlanWizard.tsx` — 8 catch blocks with `console.error` only
- `src/pages/ParentPortal.tsx` — 10 catch blocks with `console.error` only
- `src/pages/EnhancedLessonViewer.tsx` — 5 catch blocks with `console.error` only
- `src/pages/Simulation.tsx` — 5 catch blocks with `console.error` only
- `src/pages/DiagnosticTest.tsx` — 3 catch blocks with `console.error` only

**Fix:** Replace all `console.error` in catch blocks with `reportError(error, { component: '...' })`. The infrastructure is already built — it just needs to be wired up.

---

### CRIT-2: No Content-Security-Policy (CSP) headers

**Severity:** Critical | **Pillar:** Security
**Impact:** Without CSP, even with DOMPurify, a single bypass could allow XSS execution across the entire app. For a platform handling student PII, this is a regulatory and trust risk.

`dangerouslySetInnerHTML` is used in 10 files (lesson content, cheatsheets, passages, charts). DOMPurify sanitizes the input — which is good — but CSP is the defense-in-depth layer that prevents execution even if sanitization fails.

**Affected files using `dangerouslySetInnerHTML`:**
- `src/components/PassageLayout.tsx`
- `src/components/lesson/RuleCard.tsx`
- `src/components/lesson/GuidedExampleCard.tsx`
- `src/pages/EnhancedLessonViewer.tsx`
- `src/pages/Cheatsheets/English.tsx`, `Math.tsx`, `Reading.tsx`, `Science.tsx`
- `src/components/ui/chart.tsx`

**Fix:** Add CSP meta tag to `index.html` or configure CSP headers at the hosting/CDN level. At minimum: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;`

---

### CRIT-3: Default salt weakens IP hashing in lead capture

**Severity:** Critical | **Pillar:** Security
**Impact:** If `LEAD_IP_SALT` env var is not set, the function falls back to `"default-salt"`, making IP hashes predictable and reversible via rainbow table.

```1:8:supabase/functions/capture-lead/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { requireEnv } from "../_shared/env.ts";
import { parseBodyWithLimit } from "../_shared/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://hhbkmxrzxcswwokmbtbz.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LEAD_IP_SALT = Deno.env.get("LEAD_IP_SALT") || "default-salt";
```

**Fix:** Remove the `"default-salt"` fallback. Use `requireEnv("LEAD_IP_SALT")` to fail loudly if the salt is missing, rather than silently using a weak value.

---

### CRIT-4: Rate limiting fails open when env vars are missing

**Severity:** Critical | **Pillar:** Security
**Impact:** If `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` is not set on the edge function, rate limiting is silently disabled. An attacker could abuse this to brute-force or spam endpoints.

```34:37:supabase/functions/_shared/rateLimit.ts
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('Rate limit: Missing env vars, allowing request');
      return true;
    }
```

**Fix:** Fail closed instead of open. If rate-limit infrastructure is unavailable, return `false` (deny) or return a 503 response. At minimum, log this as a critical alert.

---

### CRIT-5: Silent error swallowing in cron-daily edge function

**Severity:** Critical | **Pillar:** Error Handling
**Impact:** The daily cron job silently swallows JSON parse errors with `.catch(() => ({}))`. If the cron payload is malformed, the entire job silently no-ops — streak resets, cleanup, and other daily tasks don't execute, and no alert is raised.

**Fix:** Replace `.catch(() => ({}))` with proper error logging and alerting.

---

### CRIT-6: Admin routes lack server-side enforcement

**Severity:** Critical | **Pillar:** Security
**Impact:** `ProtectedAdminRoute` is a client-side React component. A determined user can bypass it by calling edge functions or Supabase RPC directly. Admin operations (question generation, imports, simulation generation) must validate admin role server-side.

```5:12:src/components/ProtectedAdminRoute.tsx
export function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { data: isAdmin, isLoading } = useIsAdmin();
  
  if (isLoading) return <PageLoadingSpinner />;
  if (!isAdmin) return <Navigate to="/" replace />;
  
  return <>{children}</>;
}
```

**Fix:** Every admin edge function must independently verify the caller has an admin role via `has_role` RPC or equivalent before processing requests.

---

### CRIT-7: Service role key comparison vulnerable to timing attack

**Severity:** Critical | **Pillar:** Security
**Impact:** The `generate-study-plan` edge function compares the auth token against the service role key using `===`, which is vulnerable to timing attacks.

**Fix:** Use a constant-time comparison function (e.g., `crypto.subtle.timingSafeEqual` or a manual constant-time compare).

---

## 3. High Priority (Should Fix — First Sprint Post-Launch)

### HIGH-1: Missing route-level error boundaries

**Pillar:** Error Handling
**Impact:** A single error boundary wraps the entire app. If a lesson viewer crashes, it takes down the whole app instead of just that feature. During a timed simulation, this could cost a student their entire test session.

**Fix:** Wrap major route groups (`Simulation`, `DiagnosticTest`, `Lessons`, `DrillRunner`) with individual `<ErrorBoundary>` components. The component already supports custom fallbacks.

---

### HIGH-2: Missing security headers

**Pillar:** Security
**Impact:** No `X-Frame-Options`, `X-Content-Type-Options`, or `Strict-Transport-Security` headers detected. This exposes the app to clickjacking, MIME-sniffing, and protocol downgrade attacks.

**Fix:** Configure at the hosting/CDN level:
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
```

---

### HIGH-3: CORS allows arbitrary subdomains

**Pillar:** Security
**Impact:** Any `*.lovable.app` or `*.lovableproject.com` subdomain can make authenticated requests. If another Lovable project is compromised, it could be used to exfiltrate data.

```22:24:supabase/functions/_shared/cors.ts
  const isAllowed = ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || origin.endsWith('.lovable.app') || origin.endsWith('.lovableproject.com')
  );
```

**Fix:** Remove the wildcard suffix matching. Explicitly allowlist only the production domain and the specific preview subdomain.

---

### HIGH-4: Missing pagination on list queries

**Pillar:** Performance
**Impact:** Several queries fetch large result sets without pagination, which will cause memory/performance issues as the user base grows.

| File | Limit | Issue |
|------|-------|-------|
| `SimulationResults.tsx` | 1000 | Full staging_items fetch |
| `ReviewMissed.tsx` | 100 | Missed questions fetch |
| `DrillPlayer.tsx` | 100 | Drill questions fetch |
| `ReviewSpaced.tsx` | 50 | Spaced repetition queue |
| `DrillHistory.tsx` | 50 | Drill history list |

**Fix:** Implement cursor-based or offset pagination for all list views.

---

### HIGH-5: Critical user flows lack test coverage

**Pillar:** Code Quality
**Impact:** The 13 test files cover utility functions, RLS policies, and smoke tests — but zero tests cover the core student workflows: taking a simulation, submitting a diagnostic, or recording a drill score. A regression in scoring logic could silently misgrade thousands of students.

**Missing test coverage for:**
- `Simulation.tsx` / `SimulationResults.tsx` — full test-taking flow
- `DiagnosticTest.tsx` / `DiagnosticResults.tsx` — diagnostic submission
- `DrillRunner.tsx` / `DrillPlayer.tsx` — drill scoring
- `QuizComponent.tsx` — quiz answer validation
- `scoring.ts` — already has tests, but integration coverage is missing

**Fix:** Add integration tests (Playwright or Testing Library) for the test-taking, submission, and scoring pipeline.

---

### HIGH-6: Lazy loading missing on images

**Pillar:** Performance
**Impact:** Images in `PassageLayout.tsx` and `QuestionCard.tsx` load eagerly, adding unnecessary payload on initial page load — especially in test sessions with many passage images.

**Fix:** Add `loading="lazy"` to all `<img>` tags below the fold. Consider migrating to a `next/image`-like component or an `<img>` wrapper with lazy loading defaults.

---

### HIGH-7: Missing `aria-labels` on interactive test elements

**Pillar:** Accessibility
**Impact:** Question navigation buttons, answer selection buttons, and timer displays in `Simulation.tsx`, `DiagnosticTest.tsx`, and `DrillRunner.tsx` lack `aria-labels`. Screen readers cannot convey the purpose of these interactive elements — a compliance risk for an educational platform.

**Fix:** Add descriptive `aria-label` attributes (e.g., `aria-label="Question 5 of 40"`, `aria-label="Select answer A"`). Add `aria-live="polite"` to the timer in `Simulation.tsx`.

---

### HIGH-8: Missing `aria-live` regions for dynamic content

**Pillar:** Accessibility
**Impact:** Timer updates in `Simulation.tsx` and score changes are not announced to assistive technology users. The timer in `DrillRunner.tsx` correctly uses `aria-live="polite"`, but `Simulation.tsx` does not.

**Fix:** Add `aria-live="polite"` to the simulation timer and `aria-live="assertive"` for time warnings.

---

## 4. Tech Debt (Fix Later — Scheduled Sprints)

### DEBT-1: Large files need decomposition

Several files exceed 400 lines and mix concerns (state management, API calls, UI rendering):

| File | Lines | Recommendation |
|------|-------|---------------|
| `Simulation.tsx` | 690 | Extract `useSimulationState` hook, `SimulationTimer`, `QuestionGrid` components |
| `DiagnosticTest.tsx` | 559 | Extract `useDiagnosticState` hook, share `QuestionGrid` with Simulation |
| `StudyPlanWizard.tsx` | 525+ | Extract step components and validation into separate modules |
| `SimulationResults.tsx` | 477 | Extract chart components and score calculation |
| `DrillRunner.tsx` | 459 | Extract drill state management into a custom hook |
| `PassageLayout.tsx` | 373 | Extract question navigation and passage rendering |
| `Dashboard.tsx` | 358 | Extract dashboard widgets into individual components |

---

### DEBT-2: Inconsistent error handling pattern

The codebase has three error-handling mechanisms that are used inconsistently:
1. `reportError()` — correct, used in 5 files
2. `logger.error()` — production-safe, used in 0 non-library files
3. `console.error()` — unsafe in production, used in 48+ files

**Recommendation:** Establish a lint rule (`no-console`) with autofix pointing to `reportError()` for errors and `logger.warn()` for warnings. Add this to the ESLint config.

---

### DEBT-3: Missing `React.memo` / `useMemo` / `useCallback` optimizations

No `React.memo` usage detected in the codebase. During timed tests, unnecessary re-renders from parent components (e.g., timer ticking) could cause UI lag on lower-end devices.

**High-value targets:**
- `QuestionCard` — renders answer options, should be memoized
- `PassageLayout` — expensive DOM, should be memoized
- `MasteryDashboard` / `WeakAreasCard` — dashboard widgets that re-render on timer ticks

---

### DEBT-4: Hardcoded Supabase URL scattered across codebase

The Supabase project URL appears as a hardcoded string in 5+ files beyond `env.ts`:
- `src/lib/captureLead.ts`
- `scripts/smoke.ts`
- `supabase/functions/capture-lead/index.ts`
- `public/thank-you.html`
- `public/cheatsheet.html`

**Fix:** Centralize into `env.ts` for client code, and use `Deno.env.get("SUPABASE_URL")` without fallback for edge functions. Remove hardcoded URLs from static HTML files.

---

### DEBT-5: Missing keyboard navigation for test-taking

Students using keyboard-only input cannot navigate questions efficiently during simulations and diagnostics. No keyboard shortcuts (e.g., 1-4 for answer selection, arrow keys for question navigation) are implemented.

**Recommendation:** Add keyboard event handlers for answer selection (A/B/C/D keys), question navigation (left/right arrows), and submit (Enter).

---

### DEBT-6: Missing skip-to-content link

No "Skip to main content" link found. This is a basic accessibility requirement for keyboard users and screen readers.

**Fix:** Add a visually-hidden skip link at the top of `AppLayout.tsx`.

---

### DEBT-7: `any` type usage is minimal but data files need tighter typing

TypeScript `any` usage is very low (only 4 files in `src/`). However, the `[key: string]: unknown` pattern in `errorReporter.ts` and some data files could be tightened with specific interfaces.

---

### DEBT-8: Sentry is conditionally loaded but not guaranteed

Sentry only initializes if `VITE_SENTRY_DSN` is set **and** `@sentry/react` is installed. The `package.json` does not include `@sentry/react` as a dependency. This means production error tracking is currently non-functional even if the DSN is configured.

**Fix:** Add `@sentry/react` to `package.json` dependencies and ensure `VITE_SENTRY_DSN` is set in the production environment.

---

## 5. What's Done Well

Credit where due — these areas demonstrate strong engineering:

| Area | Details |
|------|---------|
| **Row Level Security** | RLS enabled on all tables with 27+ migration files configuring policies. RLS test suite (`rls.test.ts`) validates cross-user isolation. |
| **Auth Architecture** | PKCE flow, auto-refresh tokens, session persistence, `RequireAuth` wrapper on all protected routes. |
| **Input Validation** | Zod schemas in `lib/validation/edgeFunctionSchemas.ts` for edge function inputs. |
| **HTML Sanitization** | DOMPurify configured and used consistently for all `dangerouslySetInnerHTML` instances. |
| **Offline Resilience** | IndexedDB-backed offline queue for attempts — students don't lose work if connectivity drops mid-test. |
| **Error Boundary** | App-level error boundary with production-safe error messages (no stack traces exposed to users). |
| **Code Splitting** | Lazy loading for heavy routes (analytics, cheatsheets, review, parent portal). Vendor/Supabase chunk splitting in Vite config. |
| **Rate Limiting** | Database-backed rate limiting on edge functions with proper 429 responses. |
| **Type Safety** | Strict TypeScript with near-zero `any` usage. Generated Supabase types. |
| **Global Error Handlers** | `unhandledrejection` and `error` event listeners in `main.tsx` route to `reportError`. |
| **Production Logger** | `logger.ts` suppresses debug/info/warn in production and sanitizes error objects. |

---

## 6. Summary Scorecard

| Pillar | Score | Notes |
|--------|-------|-------|
| **Security & Data Privacy** | 6/10 | Strong RLS and auth, but missing CSP, security headers, and server-side admin enforcement |
| **Error Handling & Resilience** | 4/10 | Good infrastructure exists but is not wired up — 95% of errors go to console.error |
| **Performance & Scalability** | 7/10 | Good code splitting and lazy loading; needs pagination and memoization |
| **Code Quality & Maintainability** | 6/10 | Strong types and validation; large files need refactoring; test coverage gaps on critical paths |
| **UX & Accessibility** | 5/10 | Semantic HTML is decent; missing aria-labels, keyboard nav, and skip links for an educational platform |

**Overall: 5.6/10 — Conditional Go with 7 critical fixes required**

---

## 7. Prioritized Fix Plan

### Week 1 (Pre-Launch — Blockers)
1. Wire up `reportError()` across all 48+ files (CRIT-1)
2. Add CSP headers (CRIT-2)
3. Fix default salt fallback (CRIT-3)
4. Make rate limiting fail-closed (CRIT-4)
5. Fix cron-daily silent failure (CRIT-5)
6. Add server-side admin role checks (CRIT-6)
7. Fix timing-safe comparison (CRIT-7)

### Week 2 (Post-Launch Sprint 1)
8. Add route-level error boundaries (HIGH-1)
9. Configure security headers (HIGH-2)
10. Tighten CORS allowlist (HIGH-3)
11. Add pagination to list queries (HIGH-4)
12. Add `aria-labels` to test UI (HIGH-7, HIGH-8)
13. Add image lazy loading (HIGH-6)

### Week 3–4 (Post-Launch Sprint 2)
14. Write integration tests for critical flows (HIGH-5)
15. Decompose large files (DEBT-1)
16. Establish `no-console` lint rule (DEBT-2)
17. Add `React.memo` optimizations (DEBT-3)
18. Add keyboard navigation (DEBT-5)
19. Add skip-to-content link (DEBT-6)
20. Install and configure Sentry properly (DEBT-8)
