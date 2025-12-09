# ACT Content & Scoring Integrity Review

## Executive Summary

This review examines the ACT-specific content and scoring integrity across five critical areas:
1. Question data consistency
2. Answer randomness distribution
3. Scoring correctness
4. Timer and test flow
5. Study plan vs content alignment

---

## 1. Question Data Consistency

### ✅ **Correct Answer Letter Validation**

**Status: PARTIALLY VALIDATED**

**Findings:**
- ✅ Answer validation exists in `submit-response/index.ts` (line 14): `z.string().length(1).regex(/^[A-E]$/)`
- ✅ Import validation in `import-questions/index.ts` (line 88): Checks for A, B, C, or D
- ✅ Frontend filtering in `DrillRunner.tsx` (lines 94-100): Filters out questions with invalid answers
- ⚠️ **ISSUE**: Questions table stores `answer` as string, but no database constraint ensures it's A-E
- ⚠️ **ISSUE**: No validation that `answer` matches one of the choice columns (choice_a, choice_b, etc.)

**Recommendations:**
1. Add database CHECK constraint: `answer IN ('A', 'B', 'C', 'D', 'E')`
2. Add validation function to ensure answer letter matches actual choice content
3. Create data integrity check query to find mismatches

### ✅ **Explanation Matching**

**Status: VALIDATED**

**Findings:**
- ✅ `questions` table has `explanation` field (nullable string)
- ✅ Explanations are displayed in `QuizComponent.tsx` (line 264)
- ✅ Explanations imported from staging in `import-questions/index.ts` (line 192)
- ⚠️ **ISSUE**: No validation that explanations exist for all questions
- ⚠️ **ISSUE**: No check for truncated or malformed explanations

**Recommendations:**
1. Add data quality check: `SELECT id, stem FROM questions WHERE explanation IS NULL OR explanation = ''`
2. Validate explanation length (min 10 chars, max 2000 chars)
3. Check for common truncation patterns (ending with "...", incomplete sentences)

### ✅ **Section and skill_code Consistency**

**Status: VALIDATED WITH CONCERNS**

**Findings:**
- ✅ Questions linked to skills via `skill_id` foreign key
- ✅ Skills have `code` field (nullable) and `subject` field
- ✅ `form_questions` table links questions to forms with `section` field
- ⚠️ **ISSUE**: No validation that question's skill.subject matches form_questions.section
- ⚠️ **ISSUE**: `skill_code` in staging_items may not match `skills.code`

**Recommendations:**
1. Add database constraint: Ensure skill.subject matches section when question is in form
2. Create validation query:
   ```sql
   SELECT q.id, q.skill_id, s.subject, fq.section
   FROM questions q
   JOIN skills s ON q.skill_id = s.id
   JOIN form_questions fq ON q.id = fq.question_id
   WHERE s.subject != fq.section
   ```
3. Add check for orphaned skill_codes in staging_items

### ⚠️ **Text Quality (Truncation, Symbols, Math)**

**Status: NOT VALIDATED**

**Findings:**
- ❌ No validation for truncated text
- ❌ No validation for broken math notation
- ❌ No validation for weird symbols (non-printable characters)
- ✅ Text fields are stored as strings with no length limits

**Recommendations:**
1. Add validation function to detect:
   - Truncated text (ending with "...", incomplete sentences)
   - Broken LaTeX/math (unclosed `$`, `\(`, `\[`)
   - Non-printable characters (except newlines, tabs)
   - HTML entities that aren't properly closed
2. Create data quality report query
3. Add sanitization on import

---

## 2. Answer Randomness Distribution

### ⚠️ **Distribution Analysis**

**Status: NOT IMPLEMENTED**

**Findings:**
- ❌ No analysis of answer distribution across A/B/C/D
- ✅ Questions are shuffled via `shuffleQuestionChoices` in `lib/shuffle.ts`
- ✅ Choice order is randomized per user via seed
- ⚠️ **ISSUE**: No validation that correct answers are evenly distributed

**Recommendations:**
1. Create analysis query:
   ```sql
   SELECT 
     section,
     answer,
     COUNT(*) as count,
     ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (PARTITION BY section), 2) as percentage
   FROM questions q
   JOIN form_questions fq ON q.id = fq.question_id
   GROUP BY section, answer
   ORDER BY section, answer;
   ```
2. Add validation: Each section should have ~25% distribution (±5% tolerance)
3. Flag sections with >30% or <20% for any answer choice
4. Add automated test to check distribution after imports

---

## 3. Scoring Correctness

### ✅ **Raw Score Calculation**

**Status: CORRECT**

**Findings:**
- ✅ Raw score = count of correct answers in `session-finish/index.ts` (line 107)
- ✅ Correctness determined by comparing `selected` to `answer` in `submit-response/index.ts` (line 96)
- ✅ Per-section scoring: Responses filtered by session.section
- ✅ No issues found in raw score calculation logic

**Code Reference:**
```typescript
// session-finish/index.ts:107
const rawScore = correctAnswers;
```

### ⚠️ **Scaled Score Conversion**

**Status: ESTIMATE ONLY - NOT OFFICIAL**

**Findings:**
- ⚠️ **CRITICAL ISSUE**: `scoring.ts` uses a **simple linear estimate**, not official ACT conversion tables
- ⚠️ Comment in code (line 2): "Note: This is an estimate until proper IRT scaling tables are implemented"
- ⚠️ Uses `percentToScaledScore()` which maps 0-100% to 1-36 with a power curve adjustment
- ❌ No section-specific conversion tables
- ❌ No form-specific conversion (ACT uses different curves per test form)

**Current Implementation:**
```typescript
// scoring.ts:21-22
const adjustedPercent = Math.pow(clampedPercent / 100, 0.8) * 100;
scaledScore = Math.round(1 + (adjustedPercent / 100) * 35);
```

**Recommendations:**
1. **URGENT**: Implement official ACT raw-to-scaled conversion tables
2. Store conversion tables per form_id (different ACT forms have different curves)
3. Use section-specific tables (English/Math/Reading/Science have different curves)
4. Add disclaimer: "Estimated score - not official ACT scoring"
5. Reference: ACT publishes concordance tables for each test form

### ✅ **Composite Score Calculation**

**Status: CORRECT**

**Findings:**
- ✅ Composite = average of section scores, rounded (line 38 in `scoring.ts`)
- ✅ Handles missing sections correctly (filters undefined)
- ✅ Rounds to nearest integer (line 38)
- ✅ Tests cover edge cases (all 1s, all 36s, partial completion)

---

## 4. Timer and Test Flow

### ✅ **Section Timer Accuracy**

**Status: CORRECT**

**Findings:**
- ✅ Timer initialized from `session.time_limit_sec` in `Simulation.tsx` (line 238)
- ✅ Timer accounts for elapsed time: `remaining = time_limit_sec - elapsed` (line 237)
- ✅ TimerBar component decrements every second (line 24)
- ✅ Timer persists across page refreshes (loads from session.started_at)

**Code Reference:**
```typescript
// Simulation.tsx:235-238
const startedAt = new Date(sessionRecord.started_at).getTime();
const elapsed = Math.floor((Date.now() - startedAt) / 1000);
const remaining = Math.max(0, time_limit_sec - elapsed);
```

### ✅ **Timer Zero Behavior**

**Status: CORRECT**

**Findings:**
- ✅ `TimerBar.tsx` calls `onTimeEnd()` when `prev <= 1` (line 26)
- ✅ `Simulation.tsx` handles `handleTimeEnd()` which calls `finishSession()` (line 367)
- ✅ `finishSession()` saves all responses and navigates to results (line 322)
- ✅ Responses are saved incrementally via `submitAnswer()` (line 263)
- ✅ No data loss: All answers saved before timer ends

**Code Flow:**
```
TimerBar (timeLeft <= 1) 
  → onTimeEnd() 
  → finishSession() 
  → session-finish edge function 
  → Navigate to results
```

**Recommendations:**
1. ✅ Already implemented: Auto-submit on timer zero
2. Consider adding visual warning at 1 minute remaining (already shows at 5 min)
3. Consider disabling answer selection when timer hits 0 (currently allows until finishSession completes)

### ⚠️ **Answer Locking**

**Status: PARTIAL**

**Findings:**
- ✅ `QuestionCard` has `lockAnswers` prop (line 39)
- ⚠️ **ISSUE**: `lockAnswers` not set to true when timer hits zero
- ⚠️ **ISSUE**: User can still change answers during `finishSession()` async call

**Recommendations:**
1. Set `lockAnswers={true}` when `timeLeft <= 0`
2. Disable answer buttons immediately when timer ends
3. Show "Time's up - submitting..." message

---

## 5. Study Plan vs Content Alignment

### ⚠️ **Skill Code Matching**

**Status: VALIDATED WITH CONCERNS**

**Findings:**
- ✅ Study plan generation uses `skill_id` from `skills` table
- ✅ Tasks include `skill_id` in `study_tasks` table (line 1050 in types.ts)
- ✅ Study plan selects weak skills based on diagnostic results
- ⚠️ **ISSUE**: Study plan uses `skill_id`, but drills may filter by `skill_code`
- ⚠️ **ISSUE**: `skills.code` is nullable - may not match `staging_items.skill_code`
- ⚠️ **ISSUE**: No validation that plan's skill_id has corresponding questions

**Code Reference:**
```typescript
// generate-study-plan/index.ts:814-823
availableWeakSkills.slice(0, 2).forEach((skill, index) => {
  priorities.push({
    type: "DRILL",
    skillId: skill.skill_id,
    size: 5,
    ...
  });
});
```

**Recommendations:**
1. Add validation query:
   ```sql
   SELECT st.skill_id, COUNT(q.id) as question_count
   FROM study_tasks st
   LEFT JOIN questions q ON q.skill_id = st.skill_id
   WHERE st.type = 'DRILL' AND st.status = 'PENDING'
   GROUP BY st.skill_id
   HAVING COUNT(q.id) = 0;
   ```
2. Ensure `skills.code` matches `staging_items.skill_code` for drill questions
3. Add check: If plan says "Logarithms" (skill_code), verify questions have that skill_code
4. Create data integrity report for orphaned skill_ids in study plans

### ⚠️ **Orphan Plan Days**

**Status: NOT VALIDATED**

**Findings:**
- ✅ Study plan generates 7 days of tasks
- ✅ Tasks stored in `study_plan_days.tasks_json` and `study_tasks` table
- ⚠️ **ISSUE**: No validation that plan days have > 0 tasks
- ⚠️ **ISSUE**: No check for days with all tasks marked SKIPPED/COMPLETED but showing as active

**Recommendations:**
1. Add validation query:
   ```sql
   SELECT the_date, user_id, 
     jsonb_array_length(tasks_json) as task_count
   FROM study_plan_days
   WHERE jsonb_array_length(tasks_json) = 0;
   ```
2. Add check in plan generation: Ensure each day has at least 1 task
3. Add UI indicator for days with 0 available tasks

### ✅ **Content Alignment**

**Status: PARTIALLY VALIDATED**

**Findings:**
- ✅ Study plan selects skills based on weak areas from diagnostics
- ✅ Lessons linked to skills via `lesson_content.skill_code`
- ⚠️ **ISSUE**: No validation that "Logarithms" lesson day actually pulls log questions
- ⚠️ **ISSUE**: Drill tasks may pull random questions if skill_id filtering fails

**Code Reference:**
```typescript
// generate-study-plan/index.ts:834-851
const dailyLessons = selectLessonsForDay(
  lessonsPerDay,
  dayOffset,
  baselineDiagnostics,
  allSkills || [],
  assignedSkillIds,
);
```

**Recommendations:**
1. Add validation: When plan day has skill_id, verify questions exist for that skill
2. Add logging: Log which skill_code/questions are pulled for each drill task
3. Create test: Generate plan, verify each DRILL task pulls questions matching skill_id

---

## Summary of Critical Issues

### 🔴 **HIGH PRIORITY**

1. **Scaled Score Conversion**: Currently using estimate, not official ACT tables
   - Impact: Users see inaccurate scores
   - Fix: Implement official conversion tables per form/section

2. **Answer Distribution**: No validation of A/B/C/D balance
   - Impact: Tests may be unfairly easy/hard
   - Fix: Add distribution analysis and validation

3. **Skill Code Alignment**: Plan skill_id may not match question skill_code
   - Impact: Wrong content shown in drills
   - Fix: Validate skill_id → skill_code → questions chain

### 🟡 **MEDIUM PRIORITY**

4. **Answer Locking**: Answers not locked when timer hits zero
   - Impact: Users can change answers after time expires
   - Fix: Set lockAnswers=true when timeLeft <= 0

5. **Text Quality**: No validation for truncated/broken content
   - Impact: Poor user experience
   - Fix: Add data quality checks

6. **Orphan Plan Days**: No check for days with 0 tasks
   - Impact: Confusing empty days in plan
   - Fix: Validate task count per day

### 🟢 **LOW PRIORITY**

7. **Explanation Validation**: No check for missing/truncated explanations
8. **Section-Skill Mismatch**: No validation that question skill matches section

---

## Recommended Action Items

1. **Immediate**: Add official ACT raw-to-scaled conversion tables
2. **Immediate**: Add answer distribution analysis query
3. **Short-term**: Add data quality validation queries for all issues above
4. **Short-term**: Fix answer locking on timer zero
5. **Medium-term**: Add automated tests for content alignment
6. **Medium-term**: Create data integrity dashboard for admins

---

## Testing Recommendations

1. **Unit Tests**: Add tests for scoring functions with official conversion tables
2. **Integration Tests**: Test study plan generation → question fetching by skill_id
3. **Data Quality Tests**: Run validation queries on production data
4. **E2E Tests**: Test timer expiration → answer locking → auto-submit flow

---

*Review completed: [Current Date]*
*Reviewed by: AI Assistant*
*Next Review: After implementing critical fixes*
