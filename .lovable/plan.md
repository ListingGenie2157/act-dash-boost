
# Fix Valid Audit Findings

## Summary
After analyzing Cursor's audit, **5 out of 8 critical/high items are valid** and should be addressed. The hardcoded Supabase credentials concern is **NOT valid** for Lovable's architecture.

---

## Changes to Implement

### 1. Fix Production Logging of Sensitive Data

**File: `src/lib/logger.ts`**
- Change `logger.warn` to only log in development (like `debug` and `info`)
- Keep `logger.error` for production (but sanitize payloads)

```typescript
warn: (...args: unknown[]) => {
  // Only log warnings in development to prevent sensitive data exposure
  if (isDev) console.warn(...args);
},
```

**File: `src/lib/offline-queue.ts`**
- Remove sensitive payload logging from `queueAttemptOffline` (line 49)
- Replace detailed logs with count-only or ID-only logs

```typescript
// Before: logger.warn('Queued attempt offline:', item);
// After: logger.warn('Queued attempt offline');
```

**File: `src/main.tsx`**
- Remove `console.error` for unhandled rejections in production
- Only log sanitized error message, not full reason

---

### 2. Add Input Validation to Edge Functions

**File: `supabase/functions/session-finish/index.ts`**
Add Zod validation (matching `session-start` pattern):

```typescript
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const SessionFinishSchema = z.object({
  session_id: z.string().uuid()
});

// In handler:
const validationResult = SessionFinishSchema.safeParse(body);
if (!validationResult.success) {
  return new Response(JSON.stringify({ 
    error: 'Invalid request data',
    details: validationResult.error.errors 
  }), { status: 400, ... });
}
```

**File: `supabase/functions/session-fetch/index.ts`**
Add UUID validation for `session_id`:

```typescript
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!session_id || !uuidRegex.test(session_id)) {
  return new Response(JSON.stringify({ error: 'Invalid session_id format' }), {
    status: 400, ...
  });
}
```

---

### 3. Fix Accessibility: Image Zoom Trigger

**File: `src/components/QuestionCard.tsx`**
Change the clickable `<div>` (line 88) to a semantic `<button>`:

```tsx
// Before:
<div className="relative group cursor-pointer" onClick={() => setImageZoomed(true)}>

// After:
<button 
  type="button"
  className="relative group cursor-pointer w-full"
  onClick={() => setImageZoomed(true)}
  aria-label="Zoom image"
>
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/logger.ts` | Make `warn` dev-only |
| `src/lib/offline-queue.ts` | Remove sensitive payload logging |
| `src/main.tsx` | Sanitize error logging in production |
| `supabase/functions/session-finish/index.ts` | Add Zod validation |
| `supabase/functions/session-fetch/index.ts` | Add UUID validation |
| `src/components/QuestionCard.tsx` | Fix a11y for image zoom button |

---

## Not Changing (Intentional Architecture)

| Item | Reason |
|------|--------|
| Hardcoded Supabase URL/anon key | Correct pattern for Lovable - these are public values |
| IndexedDB storage | Acceptable risk; data cleared on sync; user's own device |
| Optional Sentry | Works correctly when DSN is configured |
| Test coverage | Ongoing effort, documented in roadmap |

---

## Technical Notes

- Edge functions will be auto-deployed after changes
- No database migrations required
- All changes are backwards-compatible
