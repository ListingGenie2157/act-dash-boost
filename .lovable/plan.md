

## QA-002 Analysis: Login + Session Persistence

### Current State: All Steps Should Pass

**Step 1 — Login with onboarding-complete account → /dashboard:** In `Login.tsx`, after successful `signInWithPassword`, the code queries `profiles.onboarding_complete`. If `true`, it calls `navigate('/dashboard')`. Correct.

**Step 2 — Login with onboarding-incomplete account → /onboarding:** Same code path — if `profile?.onboarding_complete` is falsy, it calls `navigate('/onboarding')`. Correct.

**Step 3 — Session persistence across tab close:** The Supabase client in `client.ts` is configured with `persistSession: true`. The session is stored in localStorage automatically. On reopen, `RequireAuth` calls `getSession()` which reads from localStorage. Correct.

**Step 4 — Auto token refresh:** The client has `autoRefreshToken: true`. Supabase JS SDK handles this internally — it schedules a refresh before the JWT expires (default 1 hour). The `onAuthStateChange` listener in `RequireAuth` will pick up the refreshed session. Correct.

**Step 5 — Wrong password error:** `signInWithPassword` returns an error object from Supabase (e.g., "Invalid login credentials"). The code sets `setError(error.message)` which renders in the red error banner with `AlertCircle` icon. No session is created. Correct.

### Verdict: No Code Changes Needed

All five steps are correctly implemented. The auth configuration (`persistSession`, `autoRefreshToken`, `detectSessionInUrl`, PKCE flow) and the routing logic in `Login.tsx` and `RequireAuth` align with every requirement in this test case.

The only operational prerequisite is having two test accounts — one with `onboarding_complete = true` and one with `false` — in the Supabase auth system.

