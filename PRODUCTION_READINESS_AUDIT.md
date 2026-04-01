# Production Readiness Audit Report (Rev 2)

**Application:** ACT Prep Platform (Preppit)
**Audit Date:** February 25, 2026
**Revised:** February 25, 2026 — after Lovable rebuttal review
**Auditor:** Principal Software Engineer & Security Auditor
**Branch:** `cursor/codebase-production-readiness-aaa6`

---

## Revision Notes

Seven critical findings were submitted. Lovable responded with rebuttals for five of them. Each rebuttal was verified against source code. Results:

| Original | Lovable Claim | Auditor Verdict | Disposition |
|----------|---------------|-----------------|-------------|
| CRIT-1 console.error | "Sentry catches unhandled errors globally — skip" | **REJECTED — finding stands (Critical)** | Caught errors in try/catch never reach Sentry's global handler. See detailed analysis below. |
| CRIT-2 No CSP | "Valid — fixed" | Accepted | Resolved. Moved to "Fixed" section. |
| CRIT-3 Default salt | "Valid — fixed with requireEnv()" | Accepted | Resolved. Moved to "Fixed" section. |
| CRIT-4 Rate limit fails open | "By design — availability-first, industry standard" | **Accepted with caveat** | Downgraded to Tech Debt. Availability-first is a legitimate pattern, but the trade-off should be documented and monitored. |
| CRIT-5 cron-daily swallows errors | "False positive — errors are caught, logged, counted" | **Accepted** | Code-verified: `.catch(() => ({}))` on line 25 only handles empty request bodies (GET/cron invocations). Actual processing errors are caught at lines 84-87, 144-146, 152-155, 169, 193-201 and counted in the summary response. Withdrawn. |
| CRIT-6 Admin client-side only | "False positive — all 3 admin functions check server-side" | **Accepted** | Code-verified: `generate-questions` uses `has_role` (line 252), `import-questions` uses `is_admin` RPC (line 136), `import-lesson-content` uses `is_admin` RPC (line 135). All return 403 on failure. Withdrawn. |
| CRIT-7 Timing attack on === | "False positive — server-to-server cron only" | **Accepted with downgrade** | The `===` comparison at `generate-study-plan:416` is on a publicly-callable endpoint, but the service role key is a full JWT (~200 chars). Network jitter dwarfs any timing signal over HTTPS. Downgraded from Critical to Tech Debt. |

**Net result: 1 remaining Critical blocker (CRIT-1). CRIT-2 and CRIT-3 have been fixed by Lovable.**

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

### Verdict: CONDITIONAL GO — 1 Critical blocker remaining

After Lovable's fixes (CSP meta tag, `requireEnv()` for salt) and verified rebuttals (server-side admin checks, cron error handling), the codebase is significantly closer to production-ready.

The remaining **Critical blocker** is CRIT-1: the vast majority of error handlers route to `console.error` instead of the existing `reportError()` infrastructure. This means production failures in test-taking, study plan generation, and lesson loading will be completely invisible to the team. This is not theoretical — it is a concrete operational blindspot.

Once CRIT-1 is resolved (estimated 1 engineering day), the platform can launch. The High-priority items should be the first post-launch sprint.

---

## 2. Critical Blockers (Must Fix Before Launch)

### CRIT-1: Production error monitoring is effectively disabled [STANDS — rebuttal rejected]

**Severity:** Critical | **Pillar:** Error Handling
**Lovable's rebuttal:** "Sentry catches unhandled errors globally — skip"
**Why the rebuttal is wrong:**

Sentry's global handler (configured in `main.tsx:8-19`) only catches **unhandled** errors and **unhandled promise rejections**. Every error inside a `try/catch` block is, by definition, a **handled** error — it never propagates to `window.addEventListener('unhandledrejection')`.

Here is a concrete proof from the codebase. In `Simulation.tsx:312-319`:

```312:319:src/pages/Simulation.tsx
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start session. Please try again.",
        variant: "destructive",
      });
      setState('start-dialog');
```

This catch block:
1. Catches the error (so Sentry's global handler never sees it)
2. Logs it to `console.error` (invisible in production — no console access)
3. Shows a toast to the user (good UX, but the team has zero visibility)

The same pattern exists in **48+ files** with **~100 catch-block call sites**. Every one of these is a handled error that Sentry will never capture.

**What goes invisible in production:**
- Failed session starts during a simulation (`Simulation.tsx:312`)
- Failed answer submissions mid-test (`Simulation.tsx:354, 358`)
- Failed session finishes — student completes test but results aren't saved (`Simulation.tsx:412`)
- Failed study plan generation (`StudyPlanWizard.tsx:193`)
- Failed parent portal operations — 10 separate catch blocks (`ParentPortal.tsx`)
- Failed lesson loading (`EnhancedLessonViewer.tsx:61,69,78,89,114,142`)
- Failed diagnostic test operations (`DiagnosticTest.tsx` — 3 catch blocks)
- Failed subscription checks (`useSubscription.ts:30`)
- Failed admin operations (`AdminImport.tsx`, `AdminQuestionGenerator.tsx`)

The infrastructure to fix this already exists — `reportError()` in `src/lib/errorReporter.ts` correctly routes to Sentry in production and console in development. It is called in only 5 files. It needs to be wired into the other 48.

**Fix:** In every catch block that currently has `console.error(...)`, add a call to `reportError()`:

```typescript
} catch (error) {
  const err = error instanceof Error ? error : new Error(String(error));
  reportError(err, { component: 'Simulation', page: 'simulation' });
  toast({ title: "Error", description: err.message, variant: "destructive" });
}
```

**Effort estimate:** ~1 day. The pattern is mechanical — search for `console.error` in catch blocks, add `reportError()` alongside.

---

## 3. Fixed Issues (Verified)

| ID | Issue | Resolution |
|----|-------|------------|
| CRIT-2 | No Content-Security-Policy headers | Lovable added CSP meta tag to `index.html` |
| CRIT-3 | Default salt in lead capture | Lovable replaced fallback with `requireEnv()` — function now fails fast if salt is missing |

---

## 4. Withdrawn Findings (Rebuttals Accepted)

### ~~CRIT-5~~ cron-daily error swallowing — WITHDRAWN

**Lovable's rebuttal:** "Errors are caught, logged, and counted in summary"
**Verification:** Confirmed. The `.catch(() => ({}))` on line 25 only handles empty `req.json()` for GET/cron invocations where no body is expected. All actual processing errors are properly caught:
- User fetch errors: lines 84-87 (throws, caught by outer try/catch)
- Plan generation HTTP errors: lines 143-146 (logged, tracked in `errorCount`)
- Plan generation exceptions: lines 152-154 (logged, returned with success=false)
- Batch promise rejections: line 169 (logged, increments `errorCount`)
- Outer catch: lines 193-201 (returns 500 with error message)

The summary response includes `failed_generations: errorCount`, giving visibility into failures.

### ~~CRIT-6~~ Admin routes lack server-side enforcement — WITHDRAWN

**Lovable's rebuttal:** "All 3 admin edge functions verify is_admin/has_role server-side"
**Verification:** Confirmed. All three admin edge functions enforce server-side role checks:
- `generate-questions/index.ts:251-252` — calls `has_role` RPC with `_role: "admin"`, returns 403 if not admin
- `import-questions/index.ts:136` — calls `is_admin` RPC, returns 403 on failure
- `import-lesson-content/index.ts:135` — calls `is_admin` RPC, returns 403 on failure

The client-side `ProtectedAdminRoute` is correctly a UX convenience, not the security boundary.

---

## 5. Downgraded Findings (Rebuttals Partially Accepted)

### CRIT-4 → DEBT-9: Rate limiting fails open (downgraded to Tech Debt)

**Lovable's rebuttal:** "Availability-first, industry standard"
**Assessment:** Fair. Failing open on rate-limit infrastructure failure is a common pattern to prevent self-DoS. However:
- The `console.warn` should be upgraded to a structured alert so the team knows rate limiting is degraded
- Consider adding a fallback in-memory rate limiter for when the DB is unreachable
- Document this as an accepted risk in an ADR (Architecture Decision Record)

### CRIT-7 → DEBT-10: Timing attack on `===` (downgraded to Tech Debt)

**Lovable's rebuttal:** "Server-to-server cron only"
**Assessment:** Partially fair. The `generate-study-plan` endpoint is publicly callable (any authenticated user can invoke it), and the `===` comparison at line 416 does check the Bearer token against the service role key. However, the service role key is a full JWT (~200 characters), and extracting timing signal over an HTTPS network connection is not practically exploitable. Downgraded to tech debt — still worth fixing with `crypto.subtle.timingSafeEqual` as a best practice, but not a launch blocker.

---

## 6. High Priority (Should Fix — First Sprint Post-Launch)

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

**Fix:** Add `loading="lazy"` to all `<img>` tags below the fold.

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

## 7. Tech Debt (Fix Later — Scheduled Sprints)

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

### DEBT-9: Rate limiting fails open (downgraded from CRIT-4)

Availability-first is an accepted pattern. However, add a structured alert (not just `console.warn`) when rate limiting degrades, and document the trade-off in an ADR.

---

### DEBT-10: Service role key comparison uses `===` (downgraded from CRIT-7)

Not practically exploitable over HTTPS with a 200-char JWT, but worth fixing with `crypto.subtle.timingSafeEqual` as a defense-in-depth best practice.

---

## 8. What's Done Well

Credit where due — these areas demonstrate strong engineering:

| Area | Details |
|------|---------|
| **Row Level Security** | RLS enabled on all tables with 27+ migration files configuring policies. RLS test suite (`rls.test.ts`) validates cross-user isolation. |
| **Auth Architecture** | PKCE flow, auto-refresh tokens, session persistence, `RequireAuth` wrapper on all protected routes. |
| **Server-Side Admin Checks** | All 3 admin edge functions independently verify admin role via `is_admin`/`has_role` RPC before processing. |
| **Input Validation** | Zod schemas in `lib/validation/edgeFunctionSchemas.ts` for edge function inputs. |
| **HTML Sanitization** | DOMPurify configured and used consistently for all `dangerouslySetInnerHTML` instances. |
| **CSP Headers** | Content-Security-Policy meta tag added to `index.html` (recently fixed). |
| **Offline Resilience** | IndexedDB-backed offline queue for attempts — students don't lose work if connectivity drops mid-test. |
| **Error Boundary** | App-level error boundary with production-safe error messages (no stack traces exposed to users). |
| **Code Splitting** | Lazy loading for heavy routes (analytics, cheatsheets, review, parent portal). Vendor/Supabase chunk splitting in Vite config. |
| **Rate Limiting** | Database-backed rate limiting on edge functions with proper 429 responses. |
| **Type Safety** | Strict TypeScript with near-zero `any` usage. Generated Supabase types. |
| **Global Error Handlers** | `unhandledrejection` and `error` event listeners in `main.tsx` route to `reportError`. |
| **Production Logger** | `logger.ts` suppresses debug/info/warn in production and sanitizes error objects. |
| **Cron Job Resilience** | `cron-daily` processes users in batches, catches per-user errors, and returns a summary with success/failure counts. |

---

## 9. Revised Summary Scorecard

| Pillar | Score | Change | Notes |
|--------|-------|--------|-------|
| **Security & Data Privacy** | 7.5/10 | +1.5 | CSP fixed, salt fixed, server-side admin checks verified |
| **Error Handling & Resilience** | 4.5/10 | +0.5 | Cron rebuttal accepted; CRIT-1 still stands as the primary gap |
| **Performance & Scalability** | 7/10 | — | Good code splitting and lazy loading; needs pagination and memoization |
| **Code Quality & Maintainability** | 6/10 | — | Strong types and validation; large files need refactoring; test coverage gaps |
| **UX & Accessibility** | 5/10 | — | Semantic HTML is decent; missing aria-labels, keyboard nav, and skip links |

**Overall: 6.0/10 — Conditional Go with 1 critical fix remaining (CRIT-1)**

---

## 10. Revised Prioritized Fix Plan

### Pre-Launch (1 day)
1. Wire up `reportError()` across all 48+ files with `console.error` in catch blocks (CRIT-1)

### Sprint 1 (Post-Launch)
2. Add route-level error boundaries (HIGH-1)
3. Configure security headers at CDN/hosting level (HIGH-2)
4. Tighten CORS allowlist — remove wildcard subdomain matching (HIGH-3)
5. Add pagination to list queries (HIGH-4)
6. Add `aria-labels` to test UI (HIGH-7, HIGH-8)
7. Add image lazy loading (HIGH-6)

### Sprint 2 (Post-Launch)
8. Write integration tests for critical flows (HIGH-5)
9. Decompose large files (DEBT-1)
10. Establish `no-console` lint rule (DEBT-2)
11. Add `React.memo` optimizations (DEBT-3)
12. Add keyboard navigation (DEBT-5)
13. Add skip-to-content link (DEBT-6)
14. Install and configure Sentry properly (DEBT-8)
15. Add structured alerting for rate-limit degradation (DEBT-9)
16. Switch to `crypto.subtle.timingSafeEqual` for key comparison (DEBT-10)
