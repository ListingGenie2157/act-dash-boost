

## QA-007 Analysis: Row-Level Security Cross-User Data Isolation

### Current State: All Steps Should Pass — No Code Changes Needed

**Step 1 — User A queries User B's data (sessions, responses, mastery, profiles, error_bank, review_queue):**
All these tables use `USING (auth.uid() = user_id)` for SELECT policies (responses uses a subquery through sessions). Querying with `user_id = <User B's ID>` will return 0 rows because the RLS filter overrides the WHERE clause. Correct.

**Step 2 — User A attempts UPDATE on User B's profile:**
The `profiles` UPDATE policy uses `USING (auth.uid() = id)`. Since User A's JWT UID does not match User B's profile `id`, the update is silently rejected (0 rows affected). Correct.

**Step 3 — User A attempts DELETE on User B's session:**
The `sessions` table has no DELETE policy at all — DELETE is completely blocked for all users. Correct.

**Step 4 — Non-admin queries staging_items:**
The SELECT policy `authenticated_users_read_drills_and_forms` allows reading rows where `form_id LIKE 'DR_%' OR 'FA_%' OR 'FB_%' OR 'FC_%'`. This means non-admin users CAN read drill/form staging items (by design — these are the question content for drills). The test step says "Verify 0 rows" which is incorrect for this table. If there are staging items with DR_/FA_/FB_/FC_ prefixed form_ids, non-admin users will see them. Currently the table is empty so 0 rows would be returned, but this is data-dependent, not policy-enforced for those prefixes. Admin-only content (other form_ids) is correctly blocked.

**Step 5 — Non-admin queries leads:**
The `leads` table SELECT policy uses `is_admin()`. Non-admin users get 0 rows. Correct.

**Step 6 — Non-admin queries user_roles:**
The `user_roles` table has two policies: `Users can view own roles` with `USING (auth.uid() = user_id)` and `Admins can manage all roles`. A non-admin user will only see their own role row(s). Correct.

### Existing Test Coverage

The `src/tests/rls.test.ts` file already covers several of these scenarios but has gaps:
- It tests anonymous access and basic authenticated access
- It does NOT test cross-user isolation (User A reading User B's data)
- It does NOT test UPDATE/DELETE rejection across users
- It does NOT test `user_roles` visibility

### Verdict: No Code Changes Needed

All RLS policies are correctly configured for cross-user data isolation. The existing policies use restrictive (not permissive) mode consistently, which means access is denied by default unless explicitly granted.

**One clarification for the test plan:** Step 4 (staging_items returning 0 rows for non-admin) is only true when querying non-drill form_ids. Drill content (`DR_*`, `FA_*`, `FB_*`, `FC_*`) is intentionally readable by all authenticated users — this is by design for the drill/quiz feature to function.

### Technical Summary

| Table | SELECT Policy | Cross-User Blocked? |
|-------|--------------|---------------------|
| sessions | `auth.uid() = user_id` | Yes |
| responses | subquery through sessions | Yes |
| mastery | `user_id = auth.uid()` | Yes |
| profiles | `auth.uid() = id` | Yes |
| error_bank | `auth.uid() = user_id` | Yes |
| review_queue | `auth.uid() = user_id` | Yes |
| leads | `is_admin()` | Yes |
| user_roles | `auth.uid() = user_id` | Yes (own only) |
| staging_items | DR/FA/FB/FC readable; rest admin-only | Partial (by design) |

