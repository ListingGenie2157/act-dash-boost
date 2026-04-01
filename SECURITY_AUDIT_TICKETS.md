# Pre-Launch Security Audit — Ticket List

**App:** React + Supabase + Stripe (Preppit)
**Date:** 2026-03-03
**Branch:** `cursor/security-audit-tickets-03fe`

---

## Ticket Format

| Field | Description |
|-------|-------------|
| **ID** | SEC-### |
| **Title** | Short description |
| **Severity** | Blocker / High / Medium / Low |
| **Owner** | Tech Lead \| Frontend \| Backend/Supabase \| QA \| DevOps |
| **Description** | What to audit / fix |
| **Acceptance Criteria** | Definition of done |

---

## SEC-001 — RLS Policy Verification for All User-Scoped Tables

| Field | Value |
|-------|-------|
| **Severity** | Blocker |
| **Owner** | Backend/Supabase |
| **Description** | Verify that every user-scoped table (`sessions`, `responses`, `mastery`, `profiles`, `accommodations`, `user_preferences`, `parents`, `parent_links`, `rewards_*`) enforces `auth.uid() = user_id` on SELECT, INSERT, UPDATE, and DELETE. Confirm no policy allows cross-user reads or writes. |
| **Acceptance Criteria** | Written test suite (SQL or integration) proves that User A cannot read, update, or delete User B's rows on every user-scoped table. All 94 migrations reviewed for policy gaps. |

---

## SEC-002 — IDOR Testing on Edge Function Endpoints

| Field | Value |
|-------|-------|
| **Severity** | Blocker |
| **Owner** | QA |
| **Description** | Test every authenticated Edge Function (`session-start`, `session-fetch`, `session-finish`, `complete-task`, `submit-response`, `generate-questions`, `generate-study-plan`, `set-test-date`, `set-baseline`, `days-left`, `tutor-chat`, `finish-diagnostic`) by submitting requests with a valid JWT for User A but referencing resource IDs belonging to User B. |
| **Acceptance Criteria** | Every endpoint returns 403 or filters to the authenticated user's data only. No endpoint leaks or mutates another user's resources. Documented results per endpoint. |

---

## SEC-003 — Stripe Webhook Signature Verification Hardening

| Field | Value |
|-------|-------|
| **Severity** | Blocker |
| **Owner** | Backend/Supabase |
| **Description** | Confirm `stripe-webhook` Edge Function rejects requests with missing, malformed, or replayed `stripe-signature` headers. Verify `STRIPE_WEBHOOK_SECRET` is set in production and that the `constructEventAsync` call uses the raw body (not parsed JSON). Validate idempotency table (`stripe_webhook_events`) prevents duplicate processing. |
| **Acceptance Criteria** | Automated tests send forged, missing, expired, and replayed signatures — all rejected with 400. Legitimate Stripe test events process exactly once. Idempotency key dedup confirmed. |

---

## SEC-004 — Auth Session Handling and Token Refresh Audit

| Field | Value |
|-------|-------|
| **Severity** | Blocker |
| **Owner** | Frontend |
| **Description** | Audit the Supabase client config (`persistSession: true`, `autoRefreshToken: true`, PKCE flow). Verify that expired JWTs are not silently accepted by Edge Functions, that `onAuthStateChange` properly clears state on sign-out, and that the `RequireAuth` wrapper cannot be bypassed via direct URL navigation or React DevTools state manipulation. |
| **Acceptance Criteria** | Expired tokens return 401 from every Edge Function. Sign-out clears all local/session storage Supabase keys. Direct navigation to protected routes without a session redirects to `/login`. No auth state persists after logout. |

---

## SEC-005 — Secrets Scanning and Leak Prevention

| Field | Value |
|-------|-------|
| **Severity** | Blocker |
| **Owner** | DevOps |
| **Description** | Run `trufflehog`, `gitleaks`, or equivalent across the full git history. Flag any committed `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `LEAD_IP_SALT`, or Sentry DSN tokens. Verify that `src/lib/env.ts` contains only the public anon key and Supabase URL. Enable a pre-commit hook or CI gate to block future secret commits. |
| **Acceptance Criteria** | Zero secrets in git history (or rotated if found). Pre-commit hook blocks patterns matching service role keys, Stripe secret keys, and webhook secrets. CI pipeline includes secret scanning step. |

---

## SEC-006 — CORS Origin Allowlist Tightening

| Field | Value |
|-------|-------|
| **Severity** | Blocker |
| **Owner** | Backend/Supabase |
| **Description** | Review `supabase/functions/_shared/cors.ts`. The allowlist includes `*.lovableproject.com`, `*.lovable.app`, `localhost:5173`, and `localhost:8080`. For production launch, remove localhost origins and any wildcard development domains. Verify `getCorsHeaders(req)` returns no `Access-Control-Allow-Origin` header for unlisted origins. |
| **Acceptance Criteria** | Production deploy allows only `https://getpreppit.com` and `https://www.getpreppit.com`. Requests from any other origin receive no CORS headers. Verified via curl from disallowed origins. |

---

## SEC-007 — Rate Limiting Abuse Testing

| Field | Value |
|-------|-------|
| **Severity** | Blocker |
| **Owner** | QA |
| **Description** | For every rate-limited endpoint, send requests exceeding the configured limit and confirm 429 responses. Test fail-closed endpoints (`create-checkout`, `customer-portal`, `generate-questions`, `submit-response`, `session-start`, `session-finish`) to ensure they block when the rate limit DB call fails. Test `capture-lead` IP-based limit (10/10min) with spoofed and real IPs. |
| **Acceptance Criteria** | Exceeding the limit returns 429 with `Retry-After` or equivalent. Fail-closed endpoints reject on DB error. `capture-lead` cannot be abused by rotating `X-Forwarded-For`. Documented test results per endpoint with exact thresholds. |

---

## SEC-008 — Logging and PII Review

| Field | Value |
|-------|-------|
| **Severity** | Blocker |
| **Owner** | Backend/Supabase |
| **Description** | Audit all `console.log` calls in the 21 Edge Functions. Confirm `SAFE_LOG_FIELDS` whitelist is enforced everywhere. The `check-subscription` function uses `JSON.stringify(details)` which may log fields outside the whitelist. Verify no email addresses, full names, IP addresses (unhashed), payment details, or session tokens appear in logs. Review client-side `logger.ts` to confirm production mode suppresses all non-error output. |
| **Acceptance Criteria** | Every Edge Function log statement passes through a safe-field filter. `check-subscription` logging fixed to use whitelist. Grep of all functions shows zero PII fields in log output. Client logger emits nothing in production except sanitized error messages. |

---

## SEC-009 — Dependency Audit and Known Vulnerability Scan

| Field | Value |
|-------|-------|
| **Severity** | Blocker |
| **Owner** | DevOps |
| **Description** | Run `npm audit` on the client package. Audit Deno/ESM imports in Edge Functions (e.g., `stripe@18.5.0` from `esm.sh`). Check for known CVEs in React 18.3.1, Vite 5.4.19, Supabase JS 2.56.0, Sentry 10.27.0, and all Radix UI packages. Pin all ESM imports to exact versions with integrity hashes where supported. |
| **Acceptance Criteria** | Zero critical or high vulnerabilities in `npm audit`. All ESM imports pinned to exact versions. Dependency review documented with sign-off. CI step added to fail on new critical/high CVEs. |

---

## SEC-010 — Service Role Key Usage Audit in Edge Functions

| Field | Value |
|-------|-------|
| **Severity** | Blocker |
| **Owner** | Tech Lead |
| **Description** | Identify every Edge Function that creates a Supabase client with `SUPABASE_SERVICE_ROLE_KEY`. Verify each usage is strictly necessary (bypassing RLS for webhook writes, cron jobs, admin operations). Confirm that no user-supplied input is passed unsanitized into service-role queries. Verify `cron-daily` and `stripe-webhook` (both `verify_jwt = false`) cannot be invoked by external callers beyond their intended trigger. |
| **Acceptance Criteria** | Service role key usage documented per function with justification. No function uses service role where anon/user client suffices. `cron-daily` protected by shared secret or IP allowlist. No SQL injection vectors in service-role queries. |

---

## SEC-011 — Admin Role Escalation Testing

| Field | Value |
|-------|-------|
| **Severity** | Blocker |
| **Owner** | QA |
| **Description** | Test that non-admin users cannot: (a) insert rows into `user_roles`, (b) call admin-only Edge Functions, (c) bypass `ProtectedAdminRoute` on the client, (d) access `staging_items`, `questions`, or `leads` tables. Verify `is_admin()` DB function uses `SECURITY DEFINER` with `auth.uid()` and cannot be spoofed. |
| **Acceptance Criteria** | Non-admin user receives 403/empty result on all admin endpoints and tables. Direct RPC call to `is_admin()` returns false for non-admins. `user_roles` INSERT policy blocks non-admin writes. |

---

## SEC-012 — Stripe Checkout Price Tampering Prevention

| Field | Value |
|-------|-------|
| **Severity** | Blocker |
| **Owner** | Backend/Supabase |
| **Description** | Verify `create-checkout` Edge Function uses server-side price IDs from environment variables (`STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_90_DAY`, `STRIPE_PRICE_12_MONTH`) and does not accept client-supplied `price_id` or `amount`. Confirm `plan_type` from the request body is validated against an allowlist before mapping to a price ID. Test that sending an arbitrary `price_id` in the request body has no effect. |
| **Acceptance Criteria** | Sending a custom `price_id`, `amount`, or `unit_amount` in the request body does not change the Checkout Session price. Only `monthly`, `90_day`, `12_month` plan types are accepted. Any other value returns 400. |

---

## SEC-013 — Content Security Policy and Security Headers

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Owner** | DevOps |
| **Description** | Add or verify production security headers: `Content-Security-Policy` (restrict `script-src`, `connect-src` to known domains), `Strict-Transport-Security` (HSTS with `max-age=31536000; includeSubDomains`), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`. |
| **Acceptance Criteria** | Security headers present on every response from the hosting platform. CSP blocks inline scripts except hashed/nonce. HSTS enabled. Verified via `securityheaders.com` or equivalent with A+ grade. |

---

## SEC-014 — Supabase Storage Bucket Access Control

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Owner** | Backend/Supabase |
| **Description** | Review RLS on `storage.objects`. Current policy allows public read for images and authenticated uploads. Verify that uploaded files cannot overwrite other users' files, that file type validation prevents uploading executable content (`.html`, `.svg` with scripts, `.js`), and that bucket size/count limits are in place. |
| **Acceptance Criteria** | User A cannot overwrite User B's files. Upload rejects non-image MIME types. Max file size enforced (server-side, not just client). No stored XSS via uploaded SVG or HTML. |

---

## SEC-015 — Input Validation and Body Size Limits

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Owner** | Backend/Supabase |
| **Description** | Verify `parseBodyWithLimit` (512 KB cap) is used on every Edge Function that accepts a body. Audit all functions for missing input validation — check that `user_id`, `session_id`, and other IDs are validated as UUIDs before use in queries. Test oversized payloads and malformed JSON. |
| **Acceptance Criteria** | Every POST Edge Function uses `parseBodyWithLimit`. Payloads over 512 KB return 413. Non-UUID IDs return 400. Malformed JSON returns 400. No function crashes on unexpected input shapes. |

---

## SEC-016 — Unauthenticated Endpoint Hardening

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Owner** | Backend/Supabase |
| **Description** | Four endpoints have `verify_jwt = false`: `health`, `stripe-webhook`, `capture-lead`, `cron-daily`. Verify: `health` returns no sensitive info. `stripe-webhook` validates Stripe signature. `capture-lead` is rate-limited and sanitizes all input. `cron-daily` cannot be triggered externally or is protected by a shared secret/authorization header. |
| **Acceptance Criteria** | `health` returns only status. `capture-lead` rejects payloads with script tags or oversized fields. `cron-daily` rejects calls without the correct authorization secret. All four endpoints tested for abuse vectors. |

---

## SEC-017 — Subscription Status Enforcement on Protected Routes

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Owner** | Frontend |
| **Description** | Verify `RequireSubscription` wrapper cannot be bypassed. Confirm that subscription checks happen server-side (in Edge Functions) for any data-mutating action, not just client-side route guards. Test that an expired subscription user cannot invoke `generate-questions`, `tutor-chat`, `submit-response`, or `session-start`. |
| **Acceptance Criteria** | Expired/cancelled subscription users are blocked at the Edge Function level, not just the React router. Direct API calls from expired users return 403. Client redirects to `/pricing`. |

---

## SEC-018 — Error Response Information Leakage

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Owner** | Tech Lead |
| **Description** | Review all Edge Function error responses to ensure they do not leak stack traces, internal table names, SQL errors, or Stripe API details to the client. Verify `errorReporter.ts` on the client sends details to Sentry but shows users only generic messages. |
| **Acceptance Criteria** | Every Edge Function catches errors and returns a generic message with appropriate HTTP status. No `stack`, `query`, `table`, or third-party error details in response bodies. Sentry receives full details server-side. |

---

## SEC-019 — `check-subscription` Logging Fix

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Owner** | Backend/Supabase |
| **Description** | The `check-subscription` Edge Function logs subscription details via `JSON.stringify(details)` without filtering through `SAFE_LOG_FIELDS`. This may expose email, name, or payment metadata in runtime logs. Refactor to use the same safe-field whitelist pattern as `stripe-webhook`. |
| **Acceptance Criteria** | `check-subscription` logging uses an explicit field whitelist. No unfiltered `JSON.stringify` of user or subscription objects remains. Verified by code review and log output inspection. |

---

## SEC-020 — PKCE Flow and OAuth Redirect Validation

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Owner** | Frontend |
| **Description** | Verify the Supabase PKCE auth flow is correctly implemented. Confirm `detectSessionInUrl: true` does not allow open redirect attacks via crafted callback URLs. Test that `resetPasswordForEmail` redirect URL is restricted to the app's domain. |
| **Acceptance Criteria** | Auth callback only accepts redirects to `getpreppit.com`. Password reset emails link only to the app domain. PKCE code verifier is stored securely and cleared after use. No open redirect via auth callback parameters. |

---

## SEC-021 — CI Pipeline Security Gates

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Owner** | DevOps |
| **Description** | Add or verify CI checks: `npm audit --audit-level=high`, secret scanning (gitleaks), TypeScript strict mode (`noImplicitAny`), lint for `console.log` in production builds, and SAST (e.g., Semgrep) for common vulnerability patterns. |
| **Acceptance Criteria** | CI pipeline fails on high/critical npm vulnerabilities, committed secrets, TypeScript `any` types, and SAST findings. All gates documented in pipeline config. |

---

## SEC-022 — Supabase Edge Function Environment Variable Validation

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Owner** | Backend/Supabase |
| **Description** | Verify `requireEnv()` is called for every secret in every function that needs it, at function startup (not lazily). Confirm that a missing env var causes an immediate, safe failure (500 with generic message) rather than a partial execution that could leave data in an inconsistent state. |
| **Acceptance Criteria** | Every Edge Function calls `requireEnv()` for all required variables at the top of the handler. Missing vars return 500 with a generic error. No partial writes occur if an env var is absent mid-execution. |

---

## SEC-023 — Client-Side Data Caching and Sensitive Data in localStorage

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Owner** | Frontend |
| **Description** | Audit `localStorage` and `sessionStorage` for sensitive data beyond Supabase session tokens. Verify React Query cache does not persist sensitive subscription or payment data to disk. Confirm that shared/public computers are warned or that sensitive cache is cleared on logout. |
| **Acceptance Criteria** | Only Supabase auth tokens in local storage. React Query cache is memory-only (no persister). Logout clears all app-related storage keys. No payment details, PII, or admin flags cached client-side. |

---

## SEC-024 — `capture-lead` Input Sanitization and Anti-Spam

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Owner** | Backend/Supabase |
| **Description** | `capture-lead` is unauthenticated and writes to the `leads` table. Verify all input fields (email, name, source) are sanitized against XSS and SQL injection. Confirm the IP hash (`LEAD_IP_SALT`) cannot be reversed. Test that the 10/10min rate limit holds under burst traffic. Add honeypot field or CAPTCHA consideration. |
| **Acceptance Criteria** | Script tags and SQL metacharacters in input fields are rejected or escaped. IP salt is cryptographically strong and not logged. Rate limit holds under 50 concurrent requests. Spam mitigation strategy documented. |

---

## SEC-025 — Production Environment Lockdown Checklist

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Owner** | Tech Lead |
| **Description** | Final pre-launch checklist: (1) Supabase dashboard MFA enabled for all team members, (2) Stripe test mode disabled / live keys rotated, (3) Supabase project API keys rotated if ever exposed, (4) Database connection pooling and max connections configured, (5) Edge Function cold-start timeouts tested, (6) Sentry DSN set for production, (7) `supabase/config.toml` reviewed for any `verify_jwt = false` that should be `true`. |
| **Acceptance Criteria** | All items verified and signed off by Tech Lead. MFA enabled. Keys rotated. Config reviewed. Documented sign-off from Tech Lead and DevOps. |

---

## Summary

| Severity | Count |
|----------|-------|
| Blocker | 12 |
| High | 7 |
| Medium | 6 |
| **Total** | **25** |

| Owner | Count |
|-------|-------|
| Backend/Supabase | 9 |
| QA | 3 |
| DevOps | 3 |
| Frontend | 4 |
| Tech Lead | 3 |
| **Unassigned** | **0** |

### Required Coverage Checklist

- [x] RLS / IDOR testing (SEC-001, SEC-002)
- [x] Auth / session handling checks (SEC-004, SEC-011, SEC-020)
- [x] Dependency audit (SEC-009)
- [x] Secrets scanning (SEC-005)
- [x] CORS restrictions (SEC-006)
- [x] Rate limiting / abuse tests (SEC-007)
- [x] Webhook verification (SEC-003)
- [x] Logging / PII review (SEC-008, SEC-019)
