## A) Executive Summary

**Can we ship? = NO**

### Top 10 launch blockers (in order)

1. **Client-bundled Supabase credentials** (hardcoded anon key + URL) would ship to every user. (**Fixed**)
2. **Prod migrations granted an admin role to a specific email address** (environment backdoor). (**Mitigated**)
3. **Admin import Edge Functions were incompatible with the current `is_admin()` RPC** (signature drift + missing auth context). (**Fixed**)
4. **Tutor chat had no durable rate limiting and used permissive CORS**, enabling cheap abuse and AI cost blowups. (**Fixed**)
5. **`staging_items` RLS/policy state is inconsistent with runtime usage** (user flows read it; recent migrations made it admin-only). This can hard-break drills/diagnostics/sessions depending on what’s deployed. (**Mitigated**)
6. **Answer keys/explanations are client-accessible** via direct DB reads (`questions`, `v_form_section`, `staging_items`), undermining mastery/scoring integrity.
7. **Many Edge Functions still use `Access-Control-Allow-Origin: *` + verbose logs**, increasing abuse/PII exposure risk.
8. **Env validation is inconsistent in Edge Functions** (`!` assertions can crash functions). 
9. **RLS correctness cannot be fully verified from code alone**; needs policy tests against a prod-like Supabase project.
10. **Payments/entitlements/webhooks not found** (if monetization is required at launch, it’s missing).
11. **Production dependency hygiene**: test tooling was in `dependencies`, and `npm audit` reports vulnerable `esbuild` under `vite` (dev-time risk).

---

## System Map (major flows)

### Auth
- **Client**: Supabase auth via `@supabase/supabase-js` (`src/integrations/supabase/client.ts`).
- **Guarding**: `src/components/RequireAuth.tsx`.

### Onboarding / profile setup
- **Client**: `src/pages/Onboarding.tsx` updates `profiles`.
- **DB**: `public.profiles` with RLS “own row” policies (see migrations).

### Study plan generation
- **Edge Function**: `supabase/functions/generate-study-plan/index.ts` generates `study_plan_days` + `study_tasks`.
- **Cron**: `supabase/functions/cron-daily/index.ts` triggers plan regeneration for active users.

### Sessions / simulations
- **Edge Functions**:
  - `session-start` creates a session.
  - `session-fetch` returns questions/passages for a session.
  - `submit-response` stores responses + computes correctness.
  - `session-finish` summarizes results.

### Drills / quizzes / diagnostics
- **Client direct DB reads** (current): many flows query `staging_items`, `questions`, and `v_form_section` directly.
- **Edge Functions** (partial): `finish-diagnostic`, `complete-task`, etc.

### Tutor chat
- **Client**: `src/hooks/useTutor.tsx` -> `supabase.functions.invoke('tutor-chat')`.
- **Edge Function**: `supabase/functions/tutor-chat/index.ts` -> AI gateway + logs sessions/messages.

### Admin imports
- **Client**: `src/pages/AdminImport.tsx`, `src/pages/AdminLessonImport.tsx`.
- **Edge Functions**: `import-questions`, `import-lesson-content`.
- **Admin gating**: `ProtectedAdminRoute` + `user_roles` + `is_admin()` RPC.

### Payments
- **Not found**: no Stripe/webhook/entitlement enforcement code located.

---

## B) Findings Table

> Severity levels: **BLOCKER | HIGH | MED | LOW**

| ID | Severity | Area | Where (file + lines) | How to reproduce | Why it matters | Fix plan | Effort |
|---|---|---|---|---|---|---|---|
| PR-001 | **BLOCKER** | Security | `src/lib/env.ts` (was hardcoded; now L1–L55) | Build client bundle and search for Supabase keys | Shipping credentials to all users; makes rotation hard and enables scraping | **Fixed**: env-only config + startup validation | S |
| PR-002 | **BLOCKER** | Security / Access Control | `supabase/migrations/20251025121407_...sql` (L68–L73) | Run migrations in a fresh environment that contains that email in `auth.users` | Grants admin in prod via migration (backdoor) | **Mitigated**: new migration deletes that seeded grant; admins must be assigned operationally | S |
| PR-003 | **BLOCKER** | Reliability / Admin | `supabase/functions/import-lesson-content/index.ts` (old RPC call) + `supabase/migrations/20251212093620_...sql` (L10–L21) | Call lesson import after migrating to new `is_admin()` | Import pipeline breaks; admins can’t import content | **Fixed**: call `rpc('is_admin')` with authenticated context; service role only for writes | S |
| PR-004 | **BLOCKER** | Reliability / Data | `supabase/migrations/20251212093620_...sql` (admin-only staging policy) vs runtime reads in `src/pages/*` and `supabase/functions/session-*.ts` | Deploy migrations through 20251212093620; normal user runs drills/diagnostic/sessions hitting `staging_items` | RLS failures -> broken core flows | **Mitigated**: new migration restores authenticated SELECT on `staging_items` for continuity | M |
| PR-005 | **HIGH** | Security / Abuse | `supabase/functions/tutor-chat/index.ts` (L130–L205) | Spam tutor endpoint; observe rate limiting + origin enforcement | Prevents AI cost blowups and bot abuse | **Fixed**: durable rate limit + allowlist CORS + bounded validation | S |
| PR-006 | **HIGH** | Data / Integrity | `supabase/migrations/20250911214846_...sql` (L137–L142) + `supabase/migrations/20251126230050_...sql` (L7–L29) | As authenticated user, query `questions` or `v_form_section` and read `answer`/`explanation` | Trivial cheating; mastery becomes garbage data | Long-term: move answers out of client-readable relations; use views that exclude answers + server-side scoring only | L |
| PR-007 | **HIGH** | Security / Integrity | `src/pages/DrillPlayer.tsx` (reads `staging_items.answer`) and `src/lib/content.ts` (selects `questions.answer`) | Open devtools; call Supabase from client to fetch answers | Users can cheat; invalidates analytics/mastery | Redesign drill/diagnostic to fetch questions without answers and submit answers to Edge Functions | L |
| PR-008 | MED | Security | Wildcard CORS in Edge Functions (e.g. `session-start`, `session-fetch`, `submit-response`, `generate-study-plan`) | Call from arbitrary origin | Expands attack surface; makes abuse easier | Convert to `getCorsHeaders(req)` allowlist across functions | M |
| PR-009 | MED | Security / Privacy | Verbose logs in Edge Functions include user IDs, request details (e.g. `cron-daily`, `session-*`) | Inspect function logs | PII exposure; harder compliance | Reduce prod logging; redact identifiers; add request IDs | S |
| PR-010 | MED | Reliability | Env var non-null assertions in Edge Functions (`Deno.env.get('X')!`) | Deploy with missing env -> function throws | Random 500s/outages | Add explicit env validation + safe 500 responses | S |
| PR-011 | MED | Performance | `src/pages/SimulationResults.tsx` (L50–L155) | Load results without navigation state; watch many requests | Slow + fragile at scale | **Improved**: batch skill lookups + batch question skill mapping where possible | S |
| PR-013 | **HIGH** | Security / Data | `supabase/migrations/20251124102508_...sql` (L29–L45) | Any authenticated user uploads/updates/deletes objects in `question-images` bucket | Defacement/deletion of content assets; potential outages and integrity loss | **Mitigated**: new migration drops broad policies and restricts writes to admins | S |
| PR-012 | LOW | Payments | No payments/webhook/entitlement enforcement found | Search for `stripe`, `webhook` | If monetization is expected, it’s absent | Implement webhooks with signature validation + idempotency + DB-enforced entitlements | L |
| PR-014 | MED | DevOps / Supply Chain | `package.json` + `npm audit` | Run `npm audit --omit=dev` | Larger prod deploys + higher vuln surface if test deps ship; dev-time esbuild vuln affects dev server | **Mitigated**: moved test tooling to `devDependencies`; track `vite/esbuild` advisory and upgrade when safe | S |

---

## C) Patch Set (implemented)

### 1) Env-only Supabase config (no credentials in bundle)
- **File**: `src/lib/env.ts`
- **Change**: require `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (with node fallbacks) at startup.

### 2) Remove seeded admin grant from migrations
- **File**: `supabase/migrations/20251214101500_remove_seeded_admin_grant.sql`
- **Change**: delete the migration-seeded admin role for `listnggenie@gmail.com`.

### 3) Fix admin imports (auth context + `is_admin()` signature)
- **Files**:
  - `supabase/functions/import-questions/index.ts`
  - `supabase/functions/import-lesson-content/index.ts`
- **Change**:
  - Verify user via anon-key client with `Authorization` header.
  - Call `rpc('is_admin')` with correct signature.
  - Use service role only for privileged writes.
  - Use allowlist CORS via `getCorsHeaders(req)`.

### 4) Tutor chat hardening
- **File**: `supabase/functions/tutor-chat/index.ts`
- **Change**:
  - Durable rate limiting.
  - Allowlist CORS.
  - Strict input bounds.
  - Avoid logging raw AI error bodies.

### 5) Restore authenticated read access to `staging_items` (mitigation)
- **File**: `supabase/migrations/20251214100000_restore_staging_items_authenticated_read.sql`
- **Change**: reintroduce authenticated SELECT policy for `staging_items` so user flows don’t crash.

### 6) Reduce N+1 in simulation results
- **File**: `src/pages/SimulationResults.tsx`
- **Change**: batch skill name lookup; batch question->skill mapping for UUID question IDs.

### 7) Lock down `question-images` storage bucket writes to admins
- **File**: `supabase/migrations/20251214103000_lock_down_question_images_bucket.sql`
- **Change**: drop overly-broad authenticated write policies on `storage.objects` and replace with admin-only policy.

### 8) Production dependency hygiene
- **File**: `package.json` (+ lockfile)\n+- **Change**: moved test tooling (`@playwright/test`, `@testing-library/*`, `@testsprite/testsprite-mcp`, `vitest`, `@vitest/ui`) to `devDependencies`.

---

## D) “Missing for Launch” Checklist

### Monitoring / alerting
- **Client error monitoring**: confirm `VITE_SENTRY_DSN` is set for prod and error reporting is working.
- **Server visibility**: add request IDs + structured logs with redaction; avoid logging user content.

### Backups / recovery
- Enable Supabase Postgres backups + PITR.
- Practice restore drills.

### RLS / access control
- Run automated RLS tests against a prod-like Supabase project.
- Confirm:
  - No public/authenticated role can read answer keys (`questions.answer`, `staging_items.answer`, `v_form_section.answer`).
  - Admin-only tables (`staging_items` write access, `user_roles` management) are truly admin-only.

### Abuse protection
- Apply durable rate limiting to:
  - `submit-response`, `session-start`, `session-finish`, `generate-study-plan`, `finish-diagnostic`.
- Add per-user quotas for tutor chat.

### Data integrity
- Re-architect question delivery so answers/explanations are not client-readable.
- Compute correctness server-side only.

### Payments / entitlements (if required)
- Implement webhook verification (signature + replay protection + idempotency).
- Enforce entitlements server-side (RLS, RPCs, Edge Functions) — not “hide the button”.

### Build / deploy reproducibility
- Document required env vars for both client and Edge Functions.
- Ensure CI runs `npm run typecheck` and a minimal test suite that doesn’t depend on real Supabase prod data.
