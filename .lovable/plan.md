

# Fix Remaining Audit Findings

## Audit Analysis Summary

| Finding | Verdict | Rationale |
|---------|---------|-----------|
| CRITICAL-1: Hardcoded Supabase credentials | **NOT VALID** | Intentional architecture for Lovable - these are public/publishable values (documented in memory) |
| CRITICAL-2: Legacy CORS wildcard export | **VALID** | 5 edge functions still use wildcard `*` CORS |
| HIGH-1: 230 console.log calls | **PARTIALLY VALID** | Edge functions have verbose logging; client-side mostly fixed |
| HIGH-3: Sentry DSN not configured | **CONFIG ISSUE** | Not a code fix - user needs to add DSN to secrets |
| HIGH-4: Inconsistent error reporting | **LOW PRIORITY** | Error boundary already reports to Sentry when configured |
| HIGH-5: 6 components exceed 500 lines | **NOT BLOCKING** | Maintainability concern, not a security/launch blocker |
| HIGH-6: No image optimization | **LOW PRIORITY** | Performance optimization, not blocking |

---

## Changes to Implement

### 1. Fix 5 Edge Functions with Wildcard CORS (CRITICAL-2)

The following functions define local `corsHeaders` with `'*'` instead of using the secure `getCorsHeaders(req)`:

| Function | Current Issue |
|----------|---------------|
| `check-subscription` | Local wildcard CORS |
| `create-checkout` | Local wildcard CORS |
| `customer-portal` | Local wildcard CORS |
| `generate-questions` | Local wildcard CORS |
| `stripe-webhook` | Local wildcard CORS (but webhooks need special handling) |

**Note:** `stripe-webhook` is a special case - Stripe webhooks come from Stripe's servers, not our frontend, so CORS isn't relevant. However, we should still clean up the code for consistency.

**Changes:**
```typescript
// Remove local corsHeaders definition
// Add import at top:
import { getCorsHeaders } from '../_shared/cors.ts';

// In handler, replace static corsHeaders with:
const corsHeaders = getCorsHeaders(req);
```

### 2. Remove Legacy CORS Export

**File: `supabase/functions/_shared/cors.ts`**

Delete the legacy export (lines 35-43) that enables wildcard CORS:
```typescript
// DELETE THIS:
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  ...
};
```

This ensures no function can accidentally import the insecure version.

### 3. Clean Up Edge Function Logging (HIGH-1)

Replace verbose `console.log` with structured logging that doesn't leak full payloads:

**File: `supabase/functions/generate-study-plan/index.ts`**
- Line 968: Remove `JSON.stringify(allStudyTasks[0])` - log count only
- Line 991: Remove `JSON.stringify(allStudyTasks.slice(0,2))` - log error only
- Line 1026: Log summary stats, not full response

**File: `supabase/functions/generate-questions/index.ts`**
- Line 874: Remove full AI response logging

**File: `supabase/functions/create-checkout/index.ts` & `customer-portal/index.ts`**
- Modify `logStep` to not stringify arbitrary objects, or remove `details` parameter

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/_shared/cors.ts` | Remove legacy `corsHeaders` export |
| `supabase/functions/check-subscription/index.ts` | Use `getCorsHeaders(req)` |
| `supabase/functions/create-checkout/index.ts` | Use `getCorsHeaders(req)`, sanitize logging |
| `supabase/functions/customer-portal/index.ts` | Use `getCorsHeaders(req)`, sanitize logging |
| `supabase/functions/generate-questions/index.ts` | Use `getCorsHeaders(req)`, remove payload logging |
| `supabase/functions/stripe-webhook/index.ts` | Use `getCorsHeaders(req)` for consistency |
| `supabase/functions/generate-study-plan/index.ts` | Remove sensitive payload logging |

---

## Not Changing (By Design)

| Item | Reason |
|------|--------|
| Hardcoded Supabase URL/anon key | Correct Lovable architecture pattern |
| Sentry DSN | Configuration, not code - add to Supabase secrets when ready |
| Large component files | Refactoring scope - not a launch blocker |
| Image optimization | Performance enhancement - not a launch blocker |

---

## Technical Notes

- All 7 edge functions will be auto-deployed after changes
- Removing legacy CORS export is a breaking change if any function imports it - but search confirms none do
- `stripe-webhook` doesn't truly need CORS (webhook calls from Stripe servers), but using `getCorsHeaders` is cleaner
- After this fix, all 19 edge functions will use consistent, secure CORS handling

