# Architecture & Data Model Production Readiness Audit

**Date:** December 2025  
**Scope:** Architecture and Data Model Sanity Check

---

## Executive Summary

This audit reviews the database schema, relational integrity, indexing strategy, Edge Functions architecture, and environment separation for production readiness.

**Overall Status:** ⚠️ **Needs Attention** - Several critical issues identified that should be addressed before production.

---

## 1. Data Model Review

### ✅ Core Tables Status

| Table | Status | Notes |
|-------|--------|-------|
| `profiles` | ✅ Final | Well-structured, proper FK to auth.users |
| `study_plan_days` | ✅ Final | No duplicate with `lesson_schedule` (was dropped) |
| `study_tasks` | ✅ Final | Comprehensive task tracking |
| `questions` | ✅ Final | Question bank with proper relationships |
| `skills` | ✅ Final | Skills taxonomy properly defined |
| `mastery` | ⚠️ Needs FK | Missing foreign key to auth.users |
| `review_queue` | ✅ Final | Spaced repetition system |
| `sessions` | ⚠️ Needs FK | Missing foreign key to auth.users |
| `responses` | ✅ Final | Proper FK to sessions |
| `diagnostics` | ⚠️ Needs FK | Missing foreign key to auth.users |
| `sim_results` | ⚠️ Needs FK | Missing foreign key to auth.users |
| `attempts` | ⚠️ Needs FK | Missing foreign key to auth.users |
| `calculator_practice` | ⚠️ Needs FK | Missing foreign key to auth.users |

### ✅ Duplicate Table Check

**RESOLVED:** No duplicate tables found.
- `lesson_schedule` was dropped in migration `20251102150403`
- `study_plan_days` is the single source of truth for daily plans

---

## 2. Relational Integrity Issues

### 🔴 CRITICAL: Missing Foreign Keys

The following tables reference `auth.users(id)` but **do not have foreign key constraints**:

1. **`diagnostics.user_id`**
   - **Impact:** No referential integrity, orphaned records possible
   - **Fix:** Add `REFERENCES auth.users(id) ON DELETE CASCADE`
   - **Migration:** `20250911223816_db00d07b-f2dd-42df-9d79-2cdcb842f851.sql`

2. **`sim_results.user_id`**
   - **Impact:** No referential integrity, orphaned records possible
   - **Fix:** Add `REFERENCES auth.users(id) ON DELETE CASCADE`
   - **Migration:** `20250911225735_c618360d-2650-4f0e-96bc-332fedfd57eb.sql`

3. **`sessions.user_id`**
   - **Impact:** No referential integrity, orphaned records possible
   - **Fix:** Add `REFERENCES auth.users(id) ON DELETE CASCADE`
   - **Migration:** `20250914093417_b0019de9-bab3-48c1-be75-ad08db49c271.sql`
   - **Note:** Has index but no FK

4. **`mastery.user_id`**
   - **Impact:** No referential integrity, orphaned records possible
   - **Fix:** Add `REFERENCES auth.users(id) ON DELETE CASCADE`
   - **Migration:** `20250914093417_b0019de9-bab3-48c1-be75-ad08db49c271.sql`
   - **Note:** Has index but no FK

5. **`attempts.user_id`**
   - **Impact:** No referential integrity, orphaned records possible
   - **Fix:** Add `REFERENCES auth.users(id) ON DELETE CASCADE`
   - **Migration:** `20250914083103_71feab81-a76b-46a7-801c-12dec29db695.sql`

6. **`calculator_practice.user_id`**
   - **Impact:** No referential integrity, orphaned records possible
   - **Fix:** Add `REFERENCES auth.users(id) ON DELETE CASCADE`
   - **Migration:** `20251121104924_6368d3b2-ba88-4977-9d0a-56736d55e9f8.sql`

### ✅ Foreign Keys That Are Correct

- `profiles.id` → `auth.users(id) ON DELETE CASCADE` ✅
- `progress.user_id` → `auth.users(id) ON DELETE CASCADE` ✅
- `review_queue.user_id` → `auth.users(id) ON DELETE CASCADE` ✅
- `error_bank.user_id` → `auth.users(id) ON DELETE CASCADE` ✅
- `study_plan_days.user_id` → `auth.users(id) ON DELETE CASCADE` ✅
- `study_tasks.user_id` → `auth.users(id) ON DELETE CASCADE` ✅
- `responses.session_id` → `sessions(id) ON DELETE CASCADE` ✅
- `tutor_sessions.user_id` → `auth.users(id) ON DELETE CASCADE` ✅
- `tutor_messages.session_id` → `tutor_sessions(id) ON DELETE CASCADE` ✅
- `user_roles.user_id` → `auth.users(id) ON DELETE CASCADE` ✅
- `accommodations.user_id` → `auth.users(id) ON DELETE CASCADE` ✅
- `user_preferences.user_id` → `auth.users(id) ON DELETE CASCADE` ✅

### ⚠️ ON DELETE Behavior Review

**Current ON DELETE behaviors:**
- Most user-scoped tables: `ON DELETE CASCADE` ✅ (Correct - user deletion should clean up data)
- `study_tasks.skill_id`: `ON DELETE SET NULL` ✅ (Correct - task can exist without skill)
- `form_questions.passage_id`: `ON DELETE SET NULL` ✅ (Correct - question can exist without passage)
- `rewards_ledger.rule_id`: `ON DELETE SET NULL` ✅ (Correct - ledger entry preserved if rule deleted)

**Recommendation:** All behaviors appear intentional and correct.

---

## 3. Indexing Issues

### 🔴 CRITICAL: Missing Indexes on Foreign Keys

**Missing `user_id` indexes:**
1. **`diagnostics.user_id`** - Used in WHERE clauses, no index
2. **`sim_results.user_id`** - Used in WHERE clauses, no index  
3. **`calculator_practice.user_id`** - Used in WHERE clauses, no index

**Missing composite/indexes for common queries:**
4. **`attempts.question_id`** - Used in JOINs, no index
5. **`diagnostics(user_id, completed_at)`** - Common query pattern, no composite index
6. **`sim_results(user_id, created_at DESC)`** - Common query pattern, no composite index

### ✅ Indexes That Are Correct

- `sessions.user_id` ✅ (has index)
- `sessions(user_id, form_id, section, coached)` ✅ (composite index)
- `mastery(user_id, skill_id)` ✅ (composite primary key + index)
- `progress.user_id` ✅
- `review_queue(user_id, due_at)` ✅
- `error_bank.user_id` ✅
- `study_plan_days(user_id, the_date)` ✅
- `study_tasks(user_id, the_date)` ✅
- `study_tasks(user_id, phase)` ✅
- `study_tasks(user_id, the_date) WHERE is_critical` ✅ (partial index)
- `responses.session_id` ✅
- `tutor_sessions.user_id` ✅
- `tutor_messages.session_id` ✅
- `attempts(user_id, form_id)` ✅

---

## 4. Edge Functions Review

### Function Responsibilities

| Function | Lines | Responsibility | Status |
|----------|-------|---------------|--------|
| `generate-study-plan` | 1040 | Generate 7-day study plans | ⚠️ Too large |
| `complete-task` | 259 | Mark task complete, update progress | ✅ Clear |
| `session-start` | 149 | Create practice session | ✅ Clear |
| `session-fetch` | ? | Fetch session data | ✅ Clear |
| `session-finish` | ? | End session, calculate results | ✅ Clear |
| `submit-response` | ? | Submit answer to question | ✅ Clear |
| `finish-diagnostic` | ? | Complete diagnostic test | ✅ Clear |
| `set-baseline` | ? | Set user baseline | ✅ Clear |
| `set-test-date` | ? | Update test date | ✅ Clear |
| `days-left` | ? | Calculate days until test | ✅ Clear |
| `tutor-chat` | ? | AI tutor conversation | ✅ Clear |
| `import-questions` | ? | Admin: import questions | ✅ Clear |
| `import-lesson-content` | ? | Admin: import lessons | ✅ Clear |
| `cron-daily` | ? | Daily cron jobs | ✅ Clear |
| `health` | ? | Health check | ✅ Clear |

### ⚠️ Potential "God Function"

**`generate-study-plan` (1040 lines)**
- **Issue:** Very large function doing multiple things:
  - Plan generation logic
  - Task selection algorithms
  - SIM date calculation
  - Database operations
  - Business logic mixing
- **Recommendation:** Consider splitting into:
  - `generate-study-plan` (orchestration)
  - `calculate-sim-dates` (pure function, can be shared)
  - `select-tasks` (pure function, can be shared)
  - `save-study-plan` (database operations)

**However:** The function is well-structured with clear helper functions. This is a **low priority** refactor.

---

## 5. Environment Separation

### ⚠️ Configuration Review

**Current State:**
- `supabase/config.toml` contains single `project_id = "hhbkmxrzxcswwokmbtbz"`
- No explicit dev/prod separation visible in config
- Edge functions use `Deno.env.get()` for environment variables

**Recommendations:**
1. ✅ **Verify** that dev and prod Supabase projects are separate
2. ✅ **Verify** that different `SUPABASE_URL` and `SUPABASE_ANON_KEY` are used per environment
3. ✅ **Document** environment variable requirements in `.env.example`
4. ⚠️ **Consider** using Supabase CLI with different project references for dev/prod

**Action Required:** Manual verification that:
- Dev project has different project_id
- Production keys are not in dev environment
- Edge functions deployed to correct project

---

## 6. Detailed Issue List

### Priority 1: Critical (Fix Before Production)

1. **Add Foreign Key: `diagnostics.user_id`**
   ```sql
   ALTER TABLE diagnostics 
   ADD CONSTRAINT diagnostics_user_id_fkey 
   FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
   ```

2. **Add Foreign Key: `sim_results.user_id`**
   ```sql
   ALTER TABLE sim_results 
   ADD CONSTRAINT sim_results_user_id_fkey 
   FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
   ```

3. **Add Foreign Key: `sessions.user_id`**
   ```sql
   ALTER TABLE sessions 
   ADD CONSTRAINT sessions_user_id_fkey 
   FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
   ```

4. **Add Foreign Key: `mastery.user_id`**
   ```sql
   ALTER TABLE mastery 
   ADD CONSTRAINT mastery_user_id_fkey 
   FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
   ```

5. **Add Foreign Key: `attempts.user_id`**
   ```sql
   ALTER TABLE attempts 
   ADD CONSTRAINT attempts_user_id_fkey 
   FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
   ```

6. **Add Foreign Key: `calculator_practice.user_id`**
   ```sql
   ALTER TABLE calculator_practice 
   ADD CONSTRAINT calculator_practice_user_id_fkey 
   FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
   ```

7. **Add Index: `diagnostics.user_id`**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_diagnostics_user_id ON diagnostics(user_id);
   ```

8. **Add Index: `sim_results.user_id`**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_sim_results_user_id ON sim_results(user_id);
   ```

9. **Add Index: `calculator_practice.user_id`**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_calculator_practice_user_id ON calculator_practice(user_id);
   ```

10. **Add Index: `attempts.question_id`**
    ```sql
    CREATE INDEX IF NOT EXISTS idx_attempts_question_id ON attempts(question_id);
    ```

### Priority 2: Important (Fix Soon)

11. **Add Composite Index: `diagnostics(user_id, completed_at DESC)`**
    ```sql
    CREATE INDEX IF NOT EXISTS idx_diagnostics_user_completed 
    ON diagnostics(user_id, completed_at DESC);
    ```

12. **Add Composite Index: `sim_results(user_id, created_at DESC)`**
    ```sql
    CREATE INDEX IF NOT EXISTS idx_sim_results_user_created 
    ON sim_results(user_id, created_at DESC);
    ```

### Priority 3: Nice to Have

13. **Refactor `generate-study-plan` function** (split into smaller functions)
    - Low priority - function works correctly, just large
    - Consider for maintainability

14. **Document environment separation**
    - Add `.env.example` with dev/prod notes
    - Document Supabase project setup

---

## 7. Summary Checklist

### Data Model
- [x] Core tables reviewed and finalized
- [x] No duplicate tables found
- [ ] **All foreign keys defined** ⚠️ (6 missing)
- [x] ON DELETE behaviors reviewed and correct

### Indexing
- [ ] **All user_id columns indexed** ⚠️ (3 missing)
- [ ] **All JOIN/WHERE fields indexed** ⚠️ (1 missing: attempts.question_id)
- [x] Composite indexes for common queries (mostly done)

### Edge Functions
- [x] Each function has clear responsibility
- [x] No "god functions" (generate-study-plan is large but acceptable)
- [x] Proper error handling
- [x] Input validation (Zod schemas)

### Environment Separation
- [ ] **Dev/prod projects verified separate** ⚠️ (manual check needed)
- [ ] **Different keys/URLs documented** ⚠️ (documentation needed)

---

## 8. Recommended Migration

Create a new migration file to fix all Priority 1 issues:

```sql
-- Migration: Add missing foreign keys and indexes
-- Date: 2025-12-XX

-- Add foreign keys
ALTER TABLE diagnostics 
ADD CONSTRAINT diagnostics_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE sim_results 
ADD CONSTRAINT sim_results_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE sessions 
ADD CONSTRAINT sessions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE mastery 
ADD CONSTRAINT mastery_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE attempts 
ADD CONSTRAINT attempts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE calculator_practice 
ADD CONSTRAINT calculator_practice_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_diagnostics_user_id ON diagnostics(user_id);
CREATE INDEX IF NOT EXISTS idx_sim_results_user_id ON sim_results(user_id);
CREATE INDEX IF NOT EXISTS idx_calculator_practice_user_id ON calculator_practice(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_question_id ON attempts(question_id);

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_diagnostics_user_completed 
ON diagnostics(user_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_sim_results_user_created 
ON sim_results(user_id, created_at DESC);
```

---

## Next Steps

1. ✅ Review this audit
2. ⏳ Create migration for Priority 1 fixes
3. ⏳ Test migration on dev environment
4. ⏳ Verify environment separation
5. ⏳ Apply to production

---

**Audit Completed:** December 2025  
**Next Review:** After Priority 1 fixes are applied
