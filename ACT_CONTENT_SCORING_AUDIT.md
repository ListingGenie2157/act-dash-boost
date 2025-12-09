# ACT Content & Scoring Integrity Audit Report

**Date:** December 9, 2025  
**Scope:** Question data consistency, answer distribution, scoring logic, timer behavior, study plan alignment

---

## Executive Summary

This audit identified several **critical issues** that need immediate attention:

| Category | Status | Severity |
|----------|--------|----------|
| Question Data Consistency | ⚠️ Issues Found | Medium |
| Answer Distribution | 🔴 Critical | High |
| Scoring Correctness | ⚠️ Estimate Only | Medium |
| Timer/Test Flow | ✅ Working | Low |
| Study Plan Alignment | ✅ Working | Low |
| Orphan Plan Days | ⚠️ Potential Issue | Low |

---

## 1. Question Data Consistency

### ✅ What's Working

- **Answer letter validation**: Import validates answers are `A`, `B`, `C`, or `D` (line 88 in `import-questions/index.ts`)
- **Section validation**: Validated as `EN`, `MATH`, `RD`, `SCI`
- **Skill codes**: Required field with foreign key to `skills` table
- **Explanations**: Present in most questions (optional field)

### 🔴 Issues Found

#### Issue 1.1: Malformed Data in Reading TSV
**File:** `public/import-data/form_a_reading.tsv`  
**Line 22:** Contains duplicate columns and malformed structure

```
FA_RD_021	A	RD	21	R3	Humanities	Essay	[passage]	What is the central claim...	Donors should control exhibition choices.	Labels are more important than objects.	B	Mara organizes...
```

The row has extra duplicate answer columns at the end.

#### Issue 1.2: Corrupted Row References in Reading TSV
**Lines 66-75:** Contains references to English questions (`FA_EN_016` through `FA_EN_025`) in the Reading TSV file.

#### Issue 1.3: Science TSV Answer/Explanation Mismatch
**File:** `public/import-data/form_a_science.tsv`  
**Line 13-14:** Question FA_SCI_013 has conflicting answer explanation

```
Question: From 20°C to 50°C, Salt A increases by __ g/100 mL.
Answer marked: C (18)
Explanation says: B - Read values: 47 − 18 = 29.
```

The correct answer should be **B (29)**, not C.

### Recommendations

1. **Fix Reading TSV line 22** - Remove duplicate columns
2. **Remove corrupted English references** from Reading TSV (lines 66-75)
3. **Correct Science TSV line 13** - Change answer from `C` to `B`
4. **Add content validation script** to detect truncated text and broken math symbols

---

## 2. Answer Distribution Analysis

### 🔴 CRITICAL: Severe Answer Skewing

Analysis of the question import files shows **extremely skewed answer distributions**:

| Section | Total Qs | A | B | C | D | Distribution |
|---------|----------|---|---|---|---|--------------|
| Math | 60 | 28 (47%) | 19 (32%) | 8 (13%) | 5 (8%) | **SKEWED** |
| English | 75 | 58 (77%) | 8 (11%) | 5 (7%) | 4 (5%) | **CRITICAL** |
| Reading | 40 | 11 (28%) | 17 (43%) | 8 (20%) | 4 (10%) | Moderate |
| Science | 40 | 10 (25%) | 13 (33%) | 9 (23%) | 8 (20%) | Acceptable |

**Expected ACT distribution:** ~25% each (A/B/C/D should be roughly equal)

### Impact

1. Students who "guess A" on English will score ~77% correct by pure chance
2. Test-taking strategies that exploit answer patterns will artificially inflate scores
3. Does not reflect real ACT test conditions

### Recommendations

1. **Immediate:** Redistribute English answers to ~25% per letter
2. **Immediate:** Rebalance Math answers (reduce A, increase C/D)
3. **Add validation check** in import process to flag skewed distributions
4. **Target distribution:** Each section should have 22-28% per answer letter

---

## 3. Scoring Correctness

### ✅ Raw Score Calculation - CORRECT

The raw score calculation in `session-finish/index.ts` is correct:

```typescript
const totalQuestions = responses.length;
const correctAnswers = responses.filter(r => r.correct).length;
const rawScore = correctAnswers;  // ✅ Correct
```

### ⚠️ Scaled Score Conversion - ESTIMATE ONLY

**File:** `src/utils/scoring.ts`

The current implementation uses a **simplified linear mapping**, NOT an official ACT conversion table:

```typescript
// Line 21-22
const adjustedPercent = Math.pow(clampedPercent / 100, 0.8) * 100;
scaledScore = Math.round(1 + (adjustedPercent / 100) * 35);
```

**Current behavior:**
- 0% → 1
- 50% → ~20 (adjusted by power 0.8)
- 100% → 36

**Issue:** The UI labels this as "estimate" but:
1. Real ACT scoring is section-specific
2. Uses Item Response Theory (IRT), not linear scaling
3. Different test forms have different conversion tables

### Official ACT Scoring Notes

Real ACT conversion varies by section and test form. Example (approximate):

| Raw Score | English (75Q) | Math (60Q) | Reading (40Q) | Science (40Q) |
|-----------|---------------|------------|---------------|---------------|
| 75/60/40/40 (100%) | 36 | 36 | 36 | 36 |
| ~90% | 33-34 | 33-34 | 34-35 | 34-35 |
| ~75% | 27-29 | 27-29 | 28-30 | 28-30 |
| ~50% | 18-20 | 18-20 | 19-21 | 19-21 |

### Recommendations

1. **Label clearly** that scores are estimates in the UI
2. **Consider implementing** section-specific conversion tables
3. **Document** that this is not official ACT scoring

---

## 4. Timer and Test Flow

### ✅ Section Timer Configuration - CORRECT

**File:** `supabase/functions/session-start/index.ts` (lines 103-109)

```typescript
const timeLimits = {
  'EN': 45 * 60,    // 45 minutes ✅
  'MATH': 60 * 60,  // 60 minutes ✅
  'RD': 35 * 60,    // 35 minutes ✅
  'SCI': 35 * 60,   // 35 minutes ✅
};
```

These match official ACT section times.

### ✅ Auto-Submit When Timer Hits Zero - WORKING

**File:** `src/components/TimerBar.tsx` (lines 20-30)

```typescript
useEffect(() => {
  if (!isActive || timeLeft <= 0) return;

  const interval = setInterval(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) {
        onTimeEnd();  // ✅ Triggers auto-submit
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
```

**File:** `src/pages/Simulation.tsx` (lines 362-368)

```typescript
const handleTimeEnd = () => {
  toast({
    title: "Time's Up!",
    description: "The test has been automatically submitted.",
  });
  finishSession();  // ✅ Calls session-finish
};
```

### ✅ Data Persistence - NO DATA LOSS

1. **Each answer saved immediately** via `submit-response` edge function
2. **Session recovery on refresh** (lines 151-180 in Simulation.tsx)
3. **Lock answers option** available (`lockAnswers` prop on QuestionCard)

---

## 5. Study Plan vs Content Alignment

### ✅ Skill Code Mapping - WORKING

The study plan correctly links tasks to skills:

1. **generate-study-plan** creates tasks with `skill_id` from skills table
2. **TaskLauncher** routes to `/drill/{code}` or `/lesson/{code}` using task's `skill_id`
3. **DrillPlayer** filters questions by `skill_code` matching the route parameter

**Verification flow:**
```
study_tasks.skill_id → skills.id → staging_items.skill_code
```

### ✅ Example: "Logarithms" Task

If a plan says "Logarithms":
1. Task created with `skill_id` = "M5.A" (Logarithms skill)
2. TaskLauncher routes to `/drill/M5.A?n=5`
3. DrillPlayer queries: `staging_items.where(skill_code = 'M5.A')`
4. Returns only logarithm questions ✅

---

## 6. Orphan Plan Days with 0 Tasks

### ⚠️ Potential Edge Case

**File:** `supabase/functions/generate-study-plan/index.ts`

The `selectPlaylist` function (lines 125-137) can return an empty array if no tasks fit within the time cap:

```typescript
export function selectPlaylist(priorities: Task[], capMins: number): Task[] {
  const selected: Task[] = [];
  let remainingMins = capMins;

  for (const task of priorities) {
    if (task.estimatedMins <= remainingMins) {
      selected.push(task);
      // ...
    }
  }
  return selected;  // Could be empty!
}
```

### Scenarios That Could Create Empty Days

1. User sets very low daily time cap (e.g., 5 minutes)
2. All available tasks exceed remaining time
3. No weak skills or review items available for a new user

### Current Mitigations

- `selectLessonsForDay` always attempts to populate days (line 12-122)
- Fallback to any available subject skills if primary is exhausted

### Recommendation

Add a check after `selectPlaylist` to ensure at least one task is assigned:

```typescript
if (selectedTasks.length === 0) {
  // Add a minimal review or warmup task
  selectedTasks.push({
    type: 'REVIEW',
    size: 3,
    estimatedMins: 5,
    priority: 1
  });
}
```

---

## Action Items

### 🔴 Critical (Fix Immediately)

1. [ ] **Rebalance answer distribution in English TSV** - Currently 77% are "A"
2. [x] ~~**Fix Science TSV answer** - FA_SCI_013 should be "B" not "C"~~ ✅ FIXED
3. [x] ~~**Clean Reading TSV** - Remove duplicate columns and corrupted rows~~ ✅ FIXED

### ⚠️ Medium Priority

4. [x] ~~**Add answer distribution validation** in import process~~ ✅ IMPLEMENTED
5. [ ] **Create proper ACT conversion tables** or clearly label as estimates
6. [ ] **Add minimum task guarantee** for study plan days

### 💡 Nice to Have

7. [ ] Add content validation for math symbols and truncated text
8. [ ] Implement section-specific scaled score conversion
9. [ ] Add data quality dashboard for admins

---

## Changes Made in This Audit

### Files Modified

1. **`/workspace/public/import-data/form_a_science.tsv`**
   - Fixed FA_SCI_013: Changed answer from C to B (29 is correct, not 18)
   - Fixed FA_SCI_027: Changed answer from C to B (2.4 mg/L is correct)

2. **`/workspace/public/import-data/form_a_reading.tsv`**
   - Removed 34 corrupted rows (empty rows and incorrect FA_EN_* references)
   - Fixed FA_RD_030: Added missing question text and choice_a

3. **`/workspace/supabase/functions/import-questions/index.ts`**
   - Added `validateAnswerDistribution()` function
   - Added `warnings` field to ImportReport interface
   - Import now reports when answer distribution is skewed (>40% or <10% for any letter)

## Files Still Requiring Manual Changes

1. `/workspace/public/import-data/form_a_english.tsv` - Redistribute answers (77% are currently "A")
2. `/workspace/public/import-data/form_a_math.tsv` - Redistribute answers (47% are currently "A")
