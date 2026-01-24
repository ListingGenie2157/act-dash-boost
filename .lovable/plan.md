

# Fix Database Audit Findings

## Summary

This audit identified **14 issues** across database/schema mismatches, dead code, logic bugs, and syntax problems. I've categorized them by priority and validated each against the actual codebase.

---

## Issue Analysis

### HIGH PRIORITY - Must Fix

| ID | Issue | File | Status |
|----|-------|------|--------|
| 1 | `test_packages` query uses non-existent columns | `src/lib/content.ts` L82-86 | ✅ Valid |
| 2 | `rewards_ledger` nullable fields treated as required | `src/pages/ParentPortal.tsx` L345-350 | ✅ Valid |
| 3 | 7-day plan fetches 8 days (off-by-one) | `src/pages/Plan.tsx` L36-46 | ✅ Valid |
| 4 | WeeklyCalendar task index mismatch after filtering | `src/components/WeeklyCalendar.tsx` L160-166 | ✅ Valid |
| 5 | DrillRunner saves wrong `choice_order` | `src/pages/DrillRunner.tsx` L236-244 | ✅ Valid |
| 6 | QuizRunner saves wrong `choice_order` | `src/pages/QuizRunner.tsx` L65-72 | ✅ Valid |
| 7 | Navigate to wrong drill route | `src/pages/EnhancedLessonViewer.tsx` L159-163 | ✅ Valid |

### MEDIUM PRIORITY - Should Fix

| ID | Issue | File | Status |
|----|-------|------|--------|
| 8 | `LessonsQuickAccess` compares skill_code to skill.name incorrectly | `src/components/LessonsQuickAccess.tsx` L49-60 | ✅ Valid |

### LOW PRIORITY - Dead Code Cleanup

| ID | Issue | File | Status |
|----|-------|------|--------|
| 9 | `getLessonBySkill` and `getFullTestPackage` unused | `src/lib/content.ts` | ✅ Valid |
| 10 | `DayView` component unused | `src/components/DayView.tsx` | ✅ Valid |
| 11 | `SectionPicker` component unused | `src/components/SectionPicker.tsx` | ✅ Valid |
| 12 | `useShuffledQuestion` hooks unused | `src/hooks/useShuffledQuestion.ts` | ✅ Valid |
| 13 | `useReadingPreferences` hook unused | `src/components/ReadingPreferences.tsx` L122-131 | ✅ Valid |
| 14 | All `useQuestions` hooks unused | `src/hooks/queries/useQuestions.ts` | ✅ Valid |
| 15 | Zombie code comment | `src/hooks/use-mobile.tsx` L4 | ✅ Valid |

---

## Detailed Fixes

### 1. Fix `test_packages` Query (HIGH)

**File:** `src/lib/content.ts` (Lines 82-88)

The `test_packages` table only has columns: `id`, `label`, `created_at`

The query requests non-existent columns: `name`, `description`, `sections`, `updated_at`

**Current:**
```typescript
const { data, error } = await supabase
  .from('test_packages')
  .select('id, name, description, sections, created_at, updated_at')
  .eq('id', id)
  .maybeSingle();
```

**Fix:**
```typescript
const { data, error } = await supabase
  .from('test_packages')
  .select('id, label, created_at')
  .eq('id', id)
  .maybeSingle();
```

Since this function is unused (dead code), the cleanest fix is to **remove it entirely** along with `getLessonBySkill`.

---

### 2. Fix `rewards_ledger` Nullable Fields (HIGH)

**File:** `src/pages/ParentPortal.tsx` (Lines 21-28, 345-350)

Schema shows `student_id: string | null` and `earned_at: string | null`, but the interface and code treat them as required.

**Current Interface:**
```typescript
interface RewardLedgerEntry {
  id: string;
  student_id: string;  // Should be nullable
  rule_id: string;
  earned_at: string;   // Should be nullable
  amount_cents: number;
  status: 'PENDING' | 'APPROVED' | 'DENIED';
}
```

**Fixed Interface:**
```typescript
interface RewardLedgerEntry {
  id: string;
  student_id: string | null;
  rule_id: string | null;  // Also nullable per schema
  earned_at: string | null;
  amount_cents: number;
  status: string | null;  // Also nullable per schema
}
```

**Current Usage (Line 345):**
```typescript
{new Date(entry.earned_at).toLocaleDateString()}
```

**Fixed Usage:**
```typescript
{entry.earned_at ? new Date(entry.earned_at).toLocaleDateString() : 'N/A'}
```

**Current Usage (Line 350):**
```typescript
{entry.student_id.slice(0, 8)}...
```

**Fixed Usage:**
```typescript
{entry.student_id ? `${entry.student_id.slice(0, 8)}...` : 'Unknown'}
```

---

### 3. Fix 7-Day Plan Off-by-One (HIGH)

**File:** `src/pages/Plan.tsx` (Lines 36-46, 85-95)

Using `.lte(today + 7 days)` with `.gte(today)` fetches 8 days inclusive.

**Current:**
```typescript
const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split('T')[0];
// ...
.lte('the_date', sevenDaysFromNow)
```

**Fix (use 6 days for 7-day range):**
```typescript
const sixDaysFromNow = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000)
  .toISOString()
  .split('T')[0];
// ...
.lte('the_date', sixDaysFromNow)
```

This change needs to be made in **two places**: the initial fetch (L36-46) and the refetch after generation (L85-95).

---

### 4. Fix WeeklyCalendar Task Index Mismatch (HIGH)

**File:** `src/components/WeeklyCalendar.tsx` (Lines 160-166)

After filtering out SIM tasks, the loop uses `taskIdx` which is the filtered index, but the route `/task/:date/:idx` expects the original index from `tasks_json`.

**Current:**
```typescript
day.tasks
  .filter(task => task.type !== 'SIM')
  .map((task, taskIdx) => (
    <Link
      key={taskIdx}
      to={`/task/${day.date}/${taskIdx}`}  // Wrong index!
```

**Fix (preserve original index):**
```typescript
day.tasks
  .map((task, originalIdx) => ({ task, originalIdx }))
  .filter(({ task }) => task.type !== 'SIM')
  .map(({ task, originalIdx }) => (
    <Link
      key={originalIdx}
      to={`/task/${day.date}/${originalIdx}`}  // Correct index
```

---

### 5. Fix DrillRunner `choice_order` (HIGH)

**File:** `src/pages/DrillRunner.tsx` (Lines 236-244)

The UI shuffles choices but hardcodes `choice_order: [0, 1, 2, 3]` instead of the actual shuffled order.

**Current:**
```typescript
await supabase.from('attempts').insert({
  // ...
  choice_order: [0, 1, 2, 3],  // Wrong - always default order
  correct_idx: correctIdx,
  selected_idx: selectedIdx,
  // ...
});
```

The shuffle happens in `handleShuffledAnswer` which maps the shuffled index to original, but `choice_order` should store the actual shuffled sequence.

**Fix:** Pass the shuffled order to `handleAnswer`:

```typescript
const handleShuffledAnswer = async (shuffledIndex: number) => {
  if (!shuffled) return;
  
  const originalIndex = shuffled.choiceOrder[shuffledIndex];
  await handleAnswer(originalIndex, shuffled.choiceOrder);
};

const handleAnswer = async (selectedIdx: number, choiceOrder: number[] = [0, 1, 2, 3]) => {
  // ...
  await supabase.from('attempts').insert({
    // ...
    choice_order: choiceOrder,  // Now stores actual shuffle order
```

---

### 6. Fix QuizRunner `choice_order` (HIGH)

**File:** `src/pages/QuizRunner.tsx` (Lines 65-72)

Same issue as DrillRunner - hardcoded `[0, 1, 2, 3]`.

**Current:**
```typescript
await supabase.from('attempts').insert({
  // ...
  choice_order: [0, 1, 2, 3],
```

**Fix:** Same pattern as DrillRunner - pass shuffled order from handler.

---

### 7. Fix Drill Route Navigation (HIGH)

**File:** `src/pages/EnhancedLessonViewer.tsx` (Lines 159-163)

Navigation uses `/drill/setup?...` but the actual route is `/drill/:subject/setup`.

**Current:**
```typescript
navigate(`/drill/setup?skill=${topic}&mode=learned`)
```

**Fix (use correct route pattern):**
```typescript
// Determine subject from lesson data
const subject = lesson?.subject?.toLowerCase() || 'math';
navigate(`/drill/${subject}/setup?skill=${topic}&mode=learned`)
```

---

### 8. Fix LessonsQuickAccess Skill Comparison (MEDIUM)

**File:** `src/components/LessonsQuickAccess.tsx` (Lines 49-60)

Compares `staging_items.skill_code` (which is a skill ID) against `skill.name` instead of `skill.id`.

**Current:**
```typescript
const skillsWithContent = Array.from(new Set(itemsData?.map(i => i.skill_code) || []));

const lessonsWithContent = (skillsData || [])
  .filter(skill => skillsWithContent.includes(skill.name))  // Wrong field!
  .map(skill => ({
    skill_code: skill.name,  // Wrong field!
```

**Fix:**
```typescript
const skillsWithContent = Array.from(new Set(itemsData?.map(i => i.skill_code) || []));

const lessonsWithContent = (skillsData || [])
  .filter(skill => skillsWithContent.includes(skill.id))  // Correct: use skill.id
  .map(skill => ({
    skill_code: skill.id,  // Correct: use skill.id
```

---

### 9-15. Dead Code Removal (LOW)

These files/functions are unused and can be safely removed:

| File | Action |
|------|--------|
| `src/lib/content.ts` L23-40, L82-88 | Remove `getLessonBySkill` and `getFullTestPackage` functions |
| `src/components/DayView.tsx` | Delete entire file |
| `src/components/SectionPicker.tsx` | Delete entire file |
| `src/hooks/useShuffledQuestion.ts` | Delete entire file |
| `src/components/ReadingPreferences.tsx` L122-163 | Remove `useReadingPreferences` hook (keep component) |
| `src/hooks/queries/useQuestions.ts` | Delete entire file |
| `src/hooks/use-mobile.tsx` L4 | Remove commented-out line |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/content.ts` | Remove 2 unused functions |
| `src/pages/ParentPortal.tsx` | Fix nullable types and guards |
| `src/pages/Plan.tsx` | Fix off-by-one (2 locations) |
| `src/components/WeeklyCalendar.tsx` | Preserve original task index |
| `src/pages/DrillRunner.tsx` | Save actual shuffled choice_order |
| `src/pages/QuizRunner.tsx` | Save actual shuffled choice_order |
| `src/pages/EnhancedLessonViewer.tsx` | Fix drill route navigation |
| `src/components/LessonsQuickAccess.tsx` | Fix skill ID comparison |

## Files to Delete

| File | Reason |
|------|--------|
| `src/components/DayView.tsx` | Unused component |
| `src/components/SectionPicker.tsx` | Unused component |
| `src/hooks/useShuffledQuestion.ts` | Unused hooks |
| `src/hooks/queries/useQuestions.ts` | Unused hooks |

## Files with Minor Cleanup

| File | Change |
|------|--------|
| `src/hooks/use-mobile.tsx` | Remove commented line |
| `src/components/ReadingPreferences.tsx` | Remove unused hook (lines 122-163) |

---

## Technical Notes

- No database migrations required
- No edge function changes needed
- All fixes are backwards-compatible
- Dead code removal reduces bundle size

