

# Study Plan Generation Deep Dive - Analysis & Fix Plan

## Executive Summary

I've identified **5 critical issues** causing the study plan system to malfunction when users return after being away. The core problem is a **multi-layered failure** where the cron job runs but fails, the UI shows stale/empty plans, and there's no fallback mechanism.

---

## Issue #1: Duplicate Cron Jobs with Wrong Auth (ROOT CAUSE)

**Evidence from database:**
```
jobid:1 - "daily-study-plan-generation" at 0 11 * * * (11 AM UTC)
  → Uses x-cron-secret header ✅ CORRECT
  
jobid:2 - "regenerate-study-plans-daily" at 0 2 * * * (2 AM UTC)  
  → Uses Authorization: Bearer <anon_key> ❌ WRONG - will fail auth check!
```

**Problem:** Job #2 uses the anon key instead of x-cron-secret, so the `cron-daily` edge function rejects it with 401 Unauthorized. The logs show both jobs running successfully at the Postgres level, but job #2's HTTP call gets rejected.

**Fix:** Delete the duplicate cron job #2.

---

## Issue #2: Cron Job Runs But Generate-Study-Plan Fails Silently

**Evidence from edge function logs:**
```
ERROR ❌ Error saving study tasks: duplicate key value violates unique constraint "study_tasks_user_date_type_unique"
```

**Problem:** There are **two conflicting unique constraints** on `study_tasks`:
```sql
study_tasks_user_date_type_skill_unique (user_id, the_date, type, skill_id)  -- Used by code
study_tasks_user_date_type_unique (user_id, the_date, type)                   -- Causing conflict
```

The edge function uses `onConflict: 'user_id,the_date,type,skill_id'` but there's a stricter constraint `(user_id, the_date, type)` that blocks inserts when the same user has multiple tasks of the same type on the same day.

**Impact:** Plans save to `study_plan_days` ✅ but tasks fail to save to `study_tasks` ❌

**Fix:** Drop the overly restrictive constraint:
```sql
DROP INDEX IF EXISTS study_tasks_user_date_type_unique;
```

---

## Issue #3: No Auto-Regeneration on Login

**Current flow when user logs in after 2+ weeks:**
1. Dashboard loads → checks `has_study_plan = true`
2. Shows `StudyPlanWidget` 
3. Widget queries `study_plan_days` for today's date
4. Returns **empty** because old plans are all past dates
5. Shows "No Study Plan Yet" with manual generate button

**Missing:** There's no automatic regeneration when plans are stale!

**Fix:** Add auto-regeneration check in Dashboard or StudyPlanWidget when:
- User has `has_study_plan = true` 
- BUT no future `study_plan_days` exist

---

## Issue #4: WeeklyCalendar Shows Empty When Plans Expired

**Evidence from database:**
```
user_id: 7ad8d9c5... has:
  - has_study_plan: true
  - future_plans: 0
  - last_generated: 2025-12-14 (47 days ago!)
  - latest_plan_date: 2025-12-20 (all expired)
```

The calendar queries for future dates but finds nothing, showing an empty week.

**Root cause:** Same as Issue #3 - no auto-regeneration.

---

## Issue #5: Dashboard Checks study_tasks Instead of study_plan_days

**Code in Dashboard.tsx (lines 61-67):**
```typescript
// Check for actual study tasks
const { data: planCheck } = await supabase
  .from('study_tasks')
  .select('id')
  .eq('user_id', session.user.id)
  .limit(1);

const actuallyHasPlan = profileData.has_study_plan || (planCheck && planCheck.length > 0);
```

**Problem:** Queries `study_tasks` which may have failed to save (Issue #2), not `study_plan_days` which is the source of truth.

---

## Database Evidence Summary

| User ID | has_study_plan | future_plans | last_generated | Status |
|---------|---------------|--------------|----------------|--------|
| 0ea65a... | true | 7 | Today | ✅ Working |
| 7ad8d9c... | true | 0 | Dec 14, 2025 | ❌ Stale |
| 88da1f1... | true | 0 | Dec 10, 2025 | ❌ Stale |
| 073c5c4... | false | 0 | - | ⚠️ No plan |

---

## Implementation Plan

### Phase 1: Database Fixes (Critical)

**1.1 Drop the conflicting unique constraint:**
```sql
-- Run in Supabase SQL Editor
DROP INDEX IF EXISTS study_tasks_user_date_type_unique;
```

**1.2 Delete the duplicate/broken cron job:**
```sql
SELECT cron.unschedule('regenerate-study-plans-daily');
```

### Phase 2: Add Auto-Regeneration on Login

**File: `src/components/StudyPlanWidget.tsx`**

Add logic to detect stale plans and auto-regenerate:

```typescript
const loadTodaysTasks = async () => {
  // ... existing code ...
  
  // If user should have a plan but none exists for today, check if we need to regenerate
  if (!planDay?.tasks_json || rawTasks.length === 0) {
    // Check if there are ANY future plans
    const { data: futurePlans } = await supabase
      .from('study_plan_days')
      .select('the_date')
      .eq('user_id', user.id)
      .gte('the_date', today)
      .limit(1);
    
    // If no future plans exist, auto-regenerate
    if (!futurePlans || futurePlans.length === 0) {
      console.log('No future plans found, auto-regenerating...');
      await generatePlan();
      return; // generatePlan already calls loadTodaysTasks
    }
  }
  // ... rest of function ...
};
```

### Phase 3: Fix Dashboard Source of Truth

**File: `src/pages/Dashboard.tsx`**

Change the plan check from `study_tasks` to `study_plan_days`:

```typescript
// OLD (broken):
const { data: planCheck } = await supabase
  .from('study_tasks')  // ❌ May have failed to save
  .select('id')
  .eq('user_id', session.user.id)
  .limit(1);

// NEW (correct):
const today = new Date().toISOString().split('T')[0];
const { data: planCheck } = await supabase
  .from('study_plan_days')  // ✅ Source of truth
  .select('the_date')
  .eq('user_id', session.user.id)
  .gte('the_date', today)
  .limit(1);

const actuallyHasPlan = profileData.has_study_plan || (planCheck && planCheck.length > 0);
```

### Phase 4: Immediate Data Recovery

For users with stale plans, trigger regeneration:

```sql
-- Run manually or via admin button
-- This will cause the cron job to regenerate plans for all stale users
-- Or call the edge function directly for specific users
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/StudyPlanWidget.tsx` | Add auto-regeneration when no future plans exist |
| `src/pages/Dashboard.tsx` | Query `study_plan_days` instead of `study_tasks` |

## Database Changes Required

| Action | SQL |
|--------|-----|
| Drop conflicting constraint | `DROP INDEX IF EXISTS study_tasks_user_date_type_unique;` |
| Remove duplicate cron job | `SELECT cron.unschedule('regenerate-study-plans-daily');` |

---

## Root Cause Flow

```text
User logs in after 2 weeks
    ↓
Dashboard loads → has_study_plan = true
    ↓
StudyPlanWidget queries study_plan_days for TODAY
    ↓
Returns empty (old plans are all past dates)
    ↓
UI shows "No Study Plan Yet" button (but user expects their plan!)
    ↓
Meanwhile, cron job runs daily BUT...
    ↓
Job #1 (correct) calls generate-study-plan
    ↓
generate-study-plan creates study_plan_days ✅
    ↓
BUT study_tasks insert fails due to constraint conflict ❌
    ↓
Error is logged but function returns "success"
    ↓
User still sees empty calendar
```

---

## Testing Plan

After fixes:

1. Manually trigger `cron-daily` function
2. Verify no constraint errors in logs
3. Check `study_plan_days` has 7 future days for test users
4. Check `study_tasks` has corresponding tasks
5. Login as a stale user and verify calendar populates

