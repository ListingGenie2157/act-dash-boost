

# Production Readiness Plan

## Current Status Assessment

Based on my analysis of the codebase, security scans, and previous audit fixes, here's where we stand:

### Already Completed (Previous Fixes)
- React Hooks violations in DiagnosticTest.tsx
- Global error handlers in main.tsx
- Health check endpoint at /health
- Answer key protection (using v_staging_items_public view)
- N+1 query fixes in multiple components
- CORS hardening (getCorsHeaders implementation)
- Logger sanitization for production
- Dead code removal (unused components/hooks)
- Type safety improvements in edge functions

### Remaining Issues Organized by Priority

---

## PHASE 1: Security & Stability (Critical - Do Before Launch)

### 1.1 Configure Sentry Error Tracking
**Why**: Errors in production are currently only going to console.error with no alerting
**What**: Add SENTRY_DSN secret to enable real error tracking

| Action | Details |
|--------|---------|
| Add secret | `SENTRY_DSN` to Supabase Edge Function secrets |
| Verify | Error tracking integration already exists in main.tsx |

### 1.2 Database Security Hardening
**Why**: Supabase linter found 5 issues

| Issue | Fix |
|-------|-----|
| RLS Enabled No Policy | Review tables with RLS but no policies - add appropriate policies |
| Extension in Public | Move extensions to dedicated `extensions` schema |
| Auth OTP Long Expiry | Reduce OTP expiry in Supabase Auth settings |
| Leaked Password Protection | Enable in Supabase Auth settings |
| Postgres Version | Apply available security patches via Supabase dashboard |

### 1.3 Edge Function Input Validation
**Why**: Security scan found missing validation in some functions

| Function | Fix |
|----------|-----|
| `tutor-chat` | Add Zod schema for subject, topic, mode, messages array |
| `cron-daily` | Add basic request validation (manual trigger flag) |
| `session-fetch` | Add UUID regex validation for session_id |

### 1.4 Remove Debug Login Page
**Why**: SimpleLogin.tsx is labeled "for debugging" and shouldn't be in production

| Option | Action |
|--------|--------|
| Remove | Delete src/pages/SimpleLogin.tsx and remove from router |
| Or Gate | Add admin-only access check |

---

## PHASE 2: Code Quality (High Priority - Should Fix)

### 2.1 Fix Remaining TypeScript `any` Types (~15 instances)

| File | Line | Current | Fix |
|------|------|---------|-----|
| `AdminLessonImport.tsx` | 101 | `Partial<ExtractedContent>` loop | Type the accumulator properly |
| `AdminLessonImport.tsx` | 240, 333 | Multiple `any` | Define proper interfaces |
| `DiagnosticResultsComplete.tsx` | 61 | `Map<string, any>` | `Map<string, SkillResult>` |
| `Simulation.tsx` | 55 | `Record<string, any>` | `Record<string, unknown>` |
| `ReviewMissed.tsx` | 85 | `any` in map | Type the staging data properly |
| `companionTips.ts` | 114 | `any` | `Record<string, string[]>` |
| `useTestCompanion.ts` | 72 | `any` | `Record<string, unknown>` |

### 2.2 Replace Ungated Console Statements

| File | Lines | Action |
|------|-------|--------|
| `offline-queue.ts` | 94 | Replace `console.log` with `logger.debug` |
| `AdminLessonImport.tsx` | 171, 196 | Replace with `logger.info` / `logger.warn` |
| `DrillRunner.tsx` | 159, 169 | Replace `console.warn` with `logger.warn` |
| `AdminImport.tsx` | 273 | Replace with `logger.warn` |
| `AdminCronButton.tsx` | 27, 29 | Replace with `logger.warn` / `logger.error` |

### 2.3 Clean Up Unused Dependencies

| Package | Action |
|---------|--------|
| `@hookform/resolvers` | Remove - not imported anywhere |
| `@radix-ui/react-switch` | Remove - custom Switch implementation used |
| `@testsprite/testsprite-mcp` | Remove - not imported |
| `vite-plugin-pwa` | Remove - not configured |
| `@testing-library/user-event` | Move to devDependencies |

---

## PHASE 3: Monitoring & Observability (Important for Launch)

### 3.1 Verify Health Check Endpoint
- Test `/health` endpoint returns correct status
- Ensure it checks database connectivity
- Set up monitoring to ping this endpoint

### 3.2 Edge Function Logging Review
The edge functions have good logging for debugging but should be reviewed:
- `generate-study-plan`: Lines 960-967 have detailed debug logs
- `generate-questions`: Lines 342, 356 log insertion counts
- These are acceptable for server-side but consider log levels

---

## PHASE 4: Final Cleanup (Nice to Have)

### 4.1 Update Documentation
- Update PRODUCTION_READINESS_REVIEW.md to mark completed items
- Update PRODUCTION_FIXES_SUMMARY.md with final status
- Consider removing outdated audit files after launch

### 4.2 Consider for Post-Launch
- Test coverage improvement (currently 1.5%)
- Performance optimization review
- Bundle size analysis

---

## Implementation Order

```text
+------------------+     +------------------+     +------------------+
|   PHASE 1        |     |   PHASE 2        |     |   PHASE 3        |
|   Security       | --> |   Code Quality   | --> |   Monitoring     |
+------------------+     +------------------+     +------------------+
| 1. Sentry DSN    |     | 1. Fix `any`     |     | 1. Test /health  |
| 2. DB Security   |     | 2. Console logs  |     | 2. Review logs   |
| 3. Edge Validate |     | 3. Dependencies  |     +------------------+
| 4. Debug page    |     +------------------+
+------------------+
```

---

## Files to Modify

| File | Priority | Changes |
|------|----------|---------|
| `supabase/functions/tutor-chat/index.ts` | HIGH | Add Zod input validation |
| `supabase/functions/cron-daily/index.ts` | HIGH | Add request validation |
| `supabase/functions/session-fetch/index.ts` | HIGH | Add UUID validation |
| `src/pages/SimpleLogin.tsx` | HIGH | Delete or gate behind admin |
| `src/App.tsx` | HIGH | Remove SimpleLogin route if deleting |
| `src/pages/AdminLessonImport.tsx` | MEDIUM | Fix `any` types |
| `src/pages/DiagnosticResultsComplete.tsx` | MEDIUM | Fix `Map<string, any>` |
| `src/pages/Simulation.tsx` | MEDIUM | Fix `Record<string, any>` |
| `src/pages/ReviewMissed.tsx` | MEDIUM | Fix `any` type |
| `src/data/companionTips.ts` | LOW | Fix `any` type |
| `src/hooks/useTestCompanion.ts` | LOW | Fix `any` type |
| `src/lib/offline-queue.ts` | LOW | Use logger |
| `src/components/AdminCronButton.tsx` | LOW | Use logger |
| `package.json` | LOW | Remove unused dependencies |

---

## External Actions Required (Supabase Dashboard)

These cannot be done via code and require manual action:

1. **Add SENTRY_DSN secret** - Edge Functions secrets page
2. **Enable Leaked Password Protection** - Auth settings
3. **Reduce OTP Expiry** - Auth settings  
4. **Move Extensions** - Run SQL to move from public schema
5. **Upgrade Postgres** - Database settings
6. **Review RLS policies** - Ensure all tables have appropriate policies

---

## Summary

| Phase | Items | Effort |
|-------|-------|--------|
| Phase 1 (Critical) | 4 items | ~2 hours |
| Phase 2 (High) | 3 categories | ~3 hours |
| Phase 3 (Important) | 2 items | ~30 min |
| Phase 4 (Nice to Have) | 2 items | ~1 hour |

**Total estimated effort: 6-7 hours**

The application is currently **deployable** with the critical fixes already completed. This plan addresses remaining polish items and security hardening to ensure a robust production launch.

