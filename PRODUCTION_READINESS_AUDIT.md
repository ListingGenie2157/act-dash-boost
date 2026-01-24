# Production Readiness Audit Report

**Date:** January 24, 2026  
**Platform:** ACT Dash Boost (Preppit)  
**Auditor:** Principal Software Engineer / Security Auditor  

---

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend | React 18.3 + TypeScript (Strict Mode) |
| Build | Vite 5.4 + SWC |
| Backend | Supabase (Auth, PostgreSQL, Edge Functions) |
| Data Fetching | TanStack React Query 5.83 |
| UI Components | Radix UI + Tailwind CSS 3.4 |
| Forms | React Hook Form + Zod Validation |
| Error Tracking | Sentry React 10.27 (installed) |
| Sanitization | DOMPurify 3.2.7 |
| Testing | Vitest + Playwright |

---

## Executive Summary

### Recommendation: **CONDITIONAL GO** ⚠️

The application demonstrates solid foundational security practices and is architecturally sound for production. However, there are **2 Critical Blockers** that must be addressed before launch, and **6 High Priority issues** that should be resolved within the first sprint post-launch.

**Strengths:**
- Strong TypeScript configuration (strict mode, no implicit any)
- XSS protection via DOMPurify on all HTML rendering
- Row Level Security (RLS) implemented with tests
- Rate limiting on edge functions
- Auth protection on routes
- Global error boundary with Sentry integration

**Risk Summary:**
| Severity | Count |
|----------|-------|
| Critical (Must Fix) | 2 |
| High Priority | 6 |
| Tech Debt | 8 |

---

## 1. Security & Data Privacy

### ✅ Passed Checks

| Item | Status | Evidence |
|------|--------|----------|
| XSS Prevention | ✅ Pass | All `dangerouslySetInnerHTML` uses wrapped in `sanitizeHTML()` via DOMPurify |
| SQL Injection | ✅ Pass | Using Supabase JS client with parameterized queries |
| Auth Route Protection | ✅ Pass | `RequireAuth` component wraps protected routes |
| Admin Route Protection | ✅ Pass | `ProtectedAdminRoute` validates admin role via `user_roles` table |
| PKCE Auth Flow | ✅ Pass | `flowType: 'pkce'` configured in Supabase client |
| Input Validation | ✅ Pass | Zod schemas validate all edge function inputs |
| Rate Limiting | ✅ Pass | Database-backed rate limiting on critical endpoints |

### 🔴 Critical Issues

#### CRITICAL-1: Hardcoded Supabase Credentials in Source
**File:** `src/lib/env.ts`
```typescript
const SUPABASE_URL = 'https://hhbkmxrzxcswwokmbtbz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIs...';
```

**Risk:** While anon keys are designed to be public, hardcoding them bypasses environment variable management, makes rotation difficult, and violates security best practices.

**Fix:** Use `VITE_` prefixed environment variables and document the deployment configuration.

#### CRITICAL-2: Legacy CORS Wildcard Still Present
**File:** `supabase/functions/_shared/cors.ts`
```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',  // DANGEROUS
  ...
};
```

**Risk:** While `getCorsHeaders()` validates origins properly, the exported `corsHeaders` object allows any origin. If any edge function imports this legacy export, it bypasses CORS protection.

**Fix:** Remove the legacy `corsHeaders` export or deprecate it by throwing an error.

### 🟡 High Priority Issues

#### HIGH-1: Console Logging PII Risk
**Finding:** 230 `console.log/error/warn` calls across 72 files.

**Risk:** Student names, emails, and scores could be logged to browser console in production, accessible to browser extensions or devtools.

**Files with highest risk:**
- `src/pages/ParentPortal.tsx` (10 console calls)
- `src/pages/Simulation.tsx` (5 console calls)
- `src/components/StudyPlanWizard.tsx` (8 console calls)

**Fix:** Replace with `logger` utility that only logs in development mode.

#### HIGH-2: User Data Ownership Verification
**Finding:** RLS policies exist but edge functions should double-check ownership.

**Evidence:** `submit-response/index.ts` lines 90-95 properly verify session ownership:
```typescript
if (session.user_id !== user.id) {
  return new Response(JSON.stringify({ error: 'Unauthorized...' }), { status: 403 });
}
```

**Status:** Partially implemented. Verify all edge functions follow this pattern.

---

## 2. Error Handling & Resilience

### ✅ Passed Checks

| Item | Status | Evidence |
|------|--------|----------|
| Global Error Boundary | ✅ Pass | `ErrorBoundary` component wraps entire app |
| Unhandled Rejection Handler | ✅ Pass | `main.tsx` handles `unhandledrejection` |
| Sentry Integration | ✅ Pass | Configured with session replay masking |
| No Empty Catch Blocks | ✅ Pass | Grep found 0 empty catch blocks |
| Graceful Edge Function Failures | ✅ Pass | All return proper HTTP status codes |

### 🟡 High Priority Issues

#### HIGH-3: Sentry DSN Not Configured
**Finding:** Sentry is installed and configured but requires `VITE_SENTRY_DSN` environment variable.

```typescript
// main.tsx line 32
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
```

**Risk:** Production errors will not be tracked until DSN is configured.

**Fix:** Ensure `VITE_SENTRY_DSN` is set in production environment.

#### HIGH-4: Inconsistent Error Reporting
**Finding:** Many `console.error` calls don't also call `reportError()`.

**Example:** `src/components/WeakAreasCard.tsx`
```typescript
} catch (error) {
  console.error('Error fetching weak areas:', error);  // Not reported to Sentry
}
```

**Fix:** Create a `handleError()` utility that both logs and reports.

---

## 3. Performance & Scalability

### ✅ Passed Checks

| Item | Status | Evidence |
|------|--------|----------|
| Lazy Loading | ✅ Pass | Heavy components lazy-loaded via `LazyComponents.tsx` |
| React Query Caching | ✅ Pass | 5-minute stale time, retries configured |
| Code Splitting | ✅ Pass | Vendor chunks for React/Supabase in `vite.config.ts` |
| Minimal `any` Usage | ✅ Pass | Only 2 files with `any` type |

### 🟡 High Priority Issues

#### HIGH-5: Large Component Files
**Finding:** Several files exceed 500 lines, reducing maintainability:

| File | Lines |
|------|-------|
| `Simulation.tsx` | 689 |
| `AdminImport.tsx` | 665 |
| `AdminSimulationGenerator.tsx` | 655 |
| `AdminLessonImport.tsx` | 571 |
| `DiagnosticTest.tsx` | 552 |
| `StudyPlanWizard.tsx` | 524 |

**Risk:** Large files are harder to test, review, and maintain.

**Fix:** Extract sub-components and custom hooks.

#### HIGH-6: Image Optimization Missing
**Finding:** No evidence of:
- Responsive images (`srcset`)
- Lazy loading images (`loading="lazy"`)
- Image compression/WebP fallbacks

**Risk:** Slower page loads, especially on mobile networks during timed tests.

---

## 4. Code Quality & Maintainability

### ✅ Passed Checks

| Item | Status | Evidence |
|------|--------|----------|
| TypeScript Strict Mode | ✅ Pass | `strict: true`, `noImplicitAny: true` |
| Low `any` Usage | ✅ Pass | Only 2 instances found |
| Consistent Exports | ✅ Pass | Pages use default exports, components use named |
| Linting | ✅ Pass | ESLint configured with React hooks rules |

### 🟠 Tech Debt

#### DEBT-1: Minimal Test Coverage
**Finding:** Only 8 test files exist:

**Unit Tests:**
- `scoring.test.ts` - 250 lines ✅
- `mastery.test.ts`
- `chooseWeakSkills.test.ts`
- `spacedRepetition.test.ts`
- `review.test.ts`

**Integration Tests:**
- `smoke.test.tsx` - 50 lines (minimal)
- `rls.test.ts` - RLS policy verification ✅

**E2E Tests:**
- `smoke.spec.ts` - 12 lines (2 basic tests)

**Critical Paths NOT Tested:**
- ❌ Taking a full simulation test
- ❌ Submitting test scores
- ❌ Diagnostic flow
- ❌ Study plan generation
- ❌ Payment/subscription flow

#### DEBT-2: Duplicated Auth Check Logic
**Finding:** Auth checking pattern repeated in multiple pages instead of using a custom hook.

**Files:** `Simulation.tsx`, `DiagnosticTest.tsx`, others

**Fix:** Extract to `useAuthRedirect()` hook.

#### DEBT-3: Form Validation Schemas Duplicated
**Finding:** Validation schemas exist in both:
- `src/lib/validation/edgeFunctionSchemas.ts`
- Individual edge function files

**Fix:** Share schemas between frontend and edge functions via a package.

---

## 5. UX & Accessibility (A11y)

### ✅ Passed Checks

| Item | Status | Evidence |
|------|--------|----------|
| Radix UI Components | ✅ Pass | Built-in a11y support |
| Semantic Buttons | ✅ Pass | Using `Button` component, not `div onClick` |
| Form Labels | ✅ Pass | `Label htmlFor` properly associated |

### 🟠 Tech Debt

#### DEBT-4: Limited ARIA Attributes
**Finding:** Only 32 aria/role attributes across 10 files (all in UI components).

**Risk:** Screen reader users may have difficulty navigating.

**Key Areas Needing Improvement:**
- Question navigation in `Simulation.tsx`
- Timer announcements
- Progress indicators

#### DEBT-5: Missing Keyboard Navigation
**Finding:** Interactive elements use click handlers but keyboard support is limited.

**Files with `<button type="button">` or div click handlers:**
- `Login.tsx` line 496 (forgot password link as button)
- Several quiz navigation elements

#### DEBT-6: No Visible Focus States
**Finding:** Focus states rely on default browser styling.

**Risk:** Low-vision users may lose track of focus during timed tests.

---

## Detailed Findings by File

### Critical Files Reviewed

| File | Security | Error Handling | Performance |
|------|----------|----------------|-------------|
| `src/lib/env.ts` | 🔴 Hardcoded creds | N/A | N/A |
| `src/integrations/supabase/client.ts` | ✅ | ✅ | ✅ |
| `src/components/RequireAuth.tsx` | ✅ | ✅ | ✅ |
| `src/lib/sanitize.ts` | ✅ | ✅ | ✅ |
| `supabase/functions/submit-response/index.ts` | ✅ | ✅ | ✅ |
| `supabase/functions/complete-task/index.ts` | ✅ | ✅ | ✅ |
| `supabase/functions/stripe-webhook/index.ts` | ✅ | ✅ | ✅ |
| `supabase/functions/_shared/cors.ts` | 🔴 Legacy wildcard | N/A | N/A |
| `supabase/functions/_shared/rateLimit.ts` | ✅ | ✅ | ✅ |

---

## Remediation Priority

### Before Launch (Critical)

1. **CRITICAL-1:** Move Supabase credentials to environment variables
2. **CRITICAL-2:** Remove or deprecate wildcard CORS export

### First Sprint Post-Launch (High)

3. **HIGH-1:** Audit and remove/replace console.log statements with logger
4. **HIGH-3:** Configure Sentry DSN in production
5. **HIGH-4:** Standardize error reporting
6. **HIGH-5:** Begin refactoring large components
7. **HIGH-6:** Add image lazy loading and optimization

### Ongoing (Tech Debt)

8. **DEBT-1:** Add integration tests for critical user flows
9. **DEBT-2:** Extract auth logic to custom hook
10. **DEBT-3:** Consolidate validation schemas
11. **DEBT-4-6:** Improve accessibility

---

## Appendix: Test Commands

```bash
# Run unit tests
npm run test

# Run linting
npm run lint

# Type checking
npm run typecheck

# E2E tests
npx playwright test
```

---

**Report Generated:** 2026-01-24  
**Next Review Recommended:** 30 days post-launch
