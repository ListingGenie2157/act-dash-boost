

## Fix: Remove Anonymous Access to v_questions_public

### Problem

`v_questions_public` is currently granted to `anon`, meaning anyone without authentication can scrape all question content (stems, choices, skill codes, etc.) -- even though answers are excluded, this is still proprietary content.

### Fix

Run this single SQL statement in the Supabase SQL Editor:

```text
REVOKE ALL ON public.v_questions_public FROM anon;
```

That's it. The `authenticated` role still has access (needed for `v_form_section_public` and session loading), but unauthenticated users can no longer browse or scrape question content.

### Why This Is Safe

- The `session-fetch` edge function authenticates users before querying, so it uses the `authenticated` role -- unaffected.
- The staging items path doesn't use this view at all.
- No frontend code queries `v_questions_public` directly as `anon`.
- If you ever need a pre-auth preview (e.g., on a landing page), create a separate tiny "sample_questions" table with a handful of example items rather than exposing the full question bank.

### No Code Changes Needed

This is a database-only fix -- one REVOKE statement.

