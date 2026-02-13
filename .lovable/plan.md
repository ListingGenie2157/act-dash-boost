

# Fix Session Integrity in submit-response

## Problem

The `submit-response` edge function has two issues flagged by the ChatGPT audit:

1. **Broken query**: It queries `v_form_section` (line 127), which was revoked from `authenticated` users in our Blocker #3 fix. This means UUID-based question lookups will silently fail, returning "Question not found" for packaged form content.

2. **Defense-in-depth**: The session ownership check uses a two-step pattern (fetch then compare) instead of a single `.eq('user_id', user.id)` in the query. While RLS protects against abuse, the recommendation is to add the constraint at the query level too.

Additionally, `session-finish` line 113 updates sessions without `.eq('user_id', user.id)` -- RLS covers this, but we should add it for defense-in-depth.

## Plan

### 1. Fix `submit-response` session query (defense-in-depth)

Change the session lookup from two-step to single-query:

```typescript
// Before (lines 77-94):
const { data: session } = await supabase
  .from('sessions')
  .select('user_id, form_id, section')
  .eq('id', session_id)
  .single();
// then: if (session.user_id !== user.id) return 403

// After:
const { data: session } = await supabase
  .from('sessions')
  .select('user_id, form_id, section')
  .eq('id', session_id)
  .eq('user_id', user.id)
  .single();
// Remove the separate user_id !== user.id check
```

### 2. Fix `submit-response` answer lookup (broken query)

For UUID-based questions, use a `service_role` client to query the original `v_form_section` (which has answers and is service-role-only), since the edge function needs the answer to grade the response:

```typescript
const serviceClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
  auth: { persistSession: false },
});

// Use serviceClient for answer lookups on v_form_section
const { data, error } = await serviceClient
  .from('v_form_section')
  .select('answer, question_id')
  .eq('form_id', session.form_id)
  .eq('section', session.section)
  .eq('question_id', question_id)
  .single();
```

### 3. Fix `session-finish` update query (defense-in-depth)

Add `.eq('user_id', user.id)` to the session update:

```typescript
// Before (line 110-113):
.update({ ended_at: new Date().toISOString() })
.eq('id', session_id);

// After:
.update({ ended_at: new Date().toISOString() })
.eq('id', session_id)
.eq('user_id', user.id);
```

### 4. Deploy both updated edge functions

- Deploy `submit-response`
- Deploy `session-finish`

## Files Changed

- `supabase/functions/submit-response/index.ts` -- fix session query + use service_role for answer lookup
- `supabase/functions/session-finish/index.ts` -- add user_id to update query

## What Was Already Fine

- `session-fetch`: Already has `.eq('user_id', user.id)` on session lookup
- `session-start`: Creates sessions with `user_id: user.id` (insert, not lookup)
- `session-finish`: Session SELECT already has `.eq('user_id', user.id)` -- only the UPDATE was missing it
- All tables have RLS policies enforcing `auth.uid() = user_id` as a safety net

