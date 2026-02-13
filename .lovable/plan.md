

## Harden Edge Functions: Rate Limiting, Request Caps, and PII-Safe Logging

This plan addresses two audit findings: (4) uneven abuse protection across edge functions, and (5) PII/minors logging risk.

### Current State

| Function | Auth | Admin-only | Rate Limit | Schema Validation | Request Size Cap |
|---|---|---|---|---|---|
| tutor-chat | Yes | No | 20/min | Yes (custom) | Yes (5KB messages) |
| generate-study-plan | Yes | No | 10/min | No | No |
| generate-questions | Yes | Yes (admin) | **None** | No | No |
| import-questions | Yes | Yes (admin) | 5/min | Row-level | No |
| import-lesson-content | Yes | Yes (admin) | 5/min | No | No |
| session-start | Yes | No | 20/min | Yes (Zod) | No |
| session-fetch | Yes | No | **None** | UUID regex | No |
| session-finish | Yes | No | 20/min | Yes (Zod) | No |
| submit-response | Yes | No | 100/min | Yes (Zod) | No |
| create-checkout | Yes | No | 5/min | Yes | No |
| capture-lead | No (public) | No | 10/10min | Email regex | No |

### What Needs Fixing

**Issue 4: Missing rate limits and request size caps**

1. `generate-questions` -- admin-only AI endpoint with NO rate limit. A compromised admin token could rack up AI costs.
2. `session-fetch` -- no rate limit at all. Could be used to scrape question data.
3. All functions lack a request body size cap, so a malicious user could send a 100MB payload.

**Issue 5: PII logging in production**

4. `generate-questions` logs item counts (fine) but `console.error` could leak raw error objects containing user data.
5. `session-fetch` and `session-finish` use `console.error('Error:', error)` which logs full stack traces that could contain request body data.
6. `capture-lead` logs `error.message` directly which is generally safe, but should be consistent.
7. No "data deletion request" route exists beyond the privacy policy text.

### Implementation Plan

#### Step 1: Create a shared `safeLog` utility in `_shared/mod.ts`

Add a `safeLog` function and a `MAX_BODY_BYTES` constant (512KB) to the shared module. The `safeLog` function will strip error stack traces in production and never log request bodies.

```typescript
export const MAX_BODY_BYTES = 512 * 1024; // 512KB

export function safeLog(fn: string, step: string, detail?: string) {
  console.log(`[${fn}] ${step}${detail ? ` - ${detail}` : ''}`);
}

export function safeError(fn: string, step: string, err: unknown) {
  const msg = err instanceof Error ? err.message : 'Unknown error';
  console.error(`[${fn}] ${step}: ${msg}`);
}
```

#### Step 2: Add request body size guard helper

Add a reusable `parseBodyWithLimit` function in `_shared/mod.ts` that reads the body as text first, checks length against `MAX_BODY_BYTES`, then parses JSON. Returns `{ ok, data, error }`.

#### Step 3: Add rate limit to `generate-questions`

Import `checkRateLimit` and add a 3/min rate limit for the admin user after auth/admin check.

#### Step 4: Add rate limit to `session-fetch`

Import `checkRateLimit` and add a 30/min rate limit after auth check.

#### Step 5: Apply `parseBodyWithLimit` to all POST edge functions

Replace raw `await req.json()` calls with the size-guarded version in:
- `generate-questions`
- `generate-study-plan`
- `import-questions`
- `import-lesson-content`
- `session-start`
- `session-finish`
- `submit-response`
- `create-checkout`
- `tutor-chat`
- `capture-lead`

#### Step 6: Replace raw `console.error` with `safeError` in all functions

Update error logging in:
- `generate-questions` (multiple `console.error` calls)
- `session-fetch` (`console.error('[session-fetch] Error:', error)`)
- `session-finish` (`console.error('Error in session-finish function:', error)`)
- `submit-response` (`console.error('Error in submit-response:', error)`)
- `import-questions` (`console.error('Error in import-questions function:', error)`)
- `import-lesson-content` (`console.error('Import error:', error)`)

#### Step 7: Add a `delete-my-data` edge function

Create a new edge function that:
- Requires auth
- Rate limited to 1/hour
- Deletes the user's data from: `study_plan_days`, `study_tasks`, `responses`, `sessions`, `mastery`, `progress`, `error_bank`, `review_queue`, `diagnostics`, `attempts`, `tutor_messages`, `tutor_sessions`, `calculator_practice`, `accommodations`, `user_preferences`, `user_goals`, `profiles`
- Uses service role to bypass RLS for deletion
- Does NOT delete the auth.users record (user must do that via Supabase dashboard or a separate admin action)
- Returns a confirmation

Config in `supabase/config.toml`:
```toml
[functions.delete-my-data]
verify_jwt = false
```

### Files Modified
- `supabase/functions/_shared/mod.ts` -- add `safeLog`, `safeError`, `parseBodyWithLimit`, `MAX_BODY_BYTES`
- `supabase/functions/generate-questions/index.ts` -- add rate limit (3/min), body size cap, safe logging
- `supabase/functions/session-fetch/index.ts` -- add rate limit (30/min)
- `supabase/functions/generate-study-plan/index.ts` -- add body size cap, safe logging
- `supabase/functions/import-questions/index.ts` -- add body size cap, safe logging
- `supabase/functions/import-lesson-content/index.ts` -- add body size cap, safe logging
- `supabase/functions/session-start/index.ts` -- add body size cap
- `supabase/functions/session-finish/index.ts` -- add body size cap, safe logging
- `supabase/functions/submit-response/index.ts` -- add body size cap, safe logging
- `supabase/functions/create-checkout/index.ts` -- add body size cap
- `supabase/functions/tutor-chat/index.ts` -- add body size cap
- `supabase/functions/capture-lead/index.ts` -- add body size cap
- `supabase/functions/delete-my-data/index.ts` -- NEW: data deletion endpoint
- `supabase/config.toml` -- add `delete-my-data` function config

