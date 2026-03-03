

## QA-001 Analysis: Signup + Email Confirmation

I reviewed the full auth flow (`Login.tsx`, `RequireAuth.tsx`, `App.tsx`, `Onboarding.tsx`) against your test plan. Here is what is solid and what needs fixing before this test case can pass.

### Current State

**Working correctly:**
- Sign Up form with first/last name, email, password, confirm password
- Client-side validation: empty fields, invalid email, short password (<8 chars), name length (<2 chars), password mismatch
- Password strength indicator (weak/medium/strong)
- "Check Your Email" success screen after signup
- Profile auto-creation via `handle_new_user()` DB trigger
- Sign-in redirects to `/onboarding` or `/dashboard` based on `onboarding_complete`

**Validation error states covered:**
- Missing fields: "Please fill in all fields"
- Invalid email: "Please enter a valid email address"
- Short name: "Names must be at least 2 characters"
- Short password: "Password must be at least 8 characters"
- Mismatch: "Passwords do not match" (inline + on submit)
- Duplicate email: Supabase returns error message, displayed in error banner

### Issue Found: Post-Confirmation Redirect

The test plan expects: *"Click confirmation link → redirect to `/onboarding`"*

**Current behavior:** `emailRedirectTo` is set to `window.location.origin + '/'` (the landing page). After clicking the confirmation link, the user lands on `/` (LandingPage), not `/onboarding`. They would need to manually navigate to `/login` and sign in.

This needs to be fixed so the confirmation link redirects to a route that detects the new session and routes the user to `/onboarding`.

### Plan

#### 1. Fix the email confirmation redirect URL
In `Login.tsx` line 64, change `emailRedirectTo` from `window.location.origin + '/'` to `window.location.origin + '/dashboard'`. Since `/dashboard` is behind `RequireAuth`, the confirmed user will be authenticated (Supabase sets the session from the confirmation link's token), and the dashboard page already checks `onboarding_complete` — but actually, it doesn't redirect to onboarding automatically.

**Better approach:** Change redirect to `window.location.origin + '/onboarding'`. Since `/onboarding` is behind `RequireAuth`, unauthenticated users get bounced to `/login`, and confirmed users land directly on onboarding. The onboarding page should also handle the case where `onboarding_complete` is already true (redirect to dashboard).

#### 2. Add onboarding guard for already-completed users
In `Onboarding.tsx`, add a check: if the user's profile already has `onboarding_complete === true`, redirect to `/dashboard` instead of showing the form again.

#### 3. No other code changes needed
All validation paths, error states, and the success screen are already implemented correctly per the test plan.

### Technical Details

**File changes:**

| File | Change |
|---|---|
| `src/pages/Login.tsx` (line 64) | Change `emailRedirectTo` to `${window.location.origin}/onboarding` |
| `src/pages/Onboarding.tsx` | Add profile query on mount; if `onboarding_complete === true`, `navigate('/dashboard')` |

