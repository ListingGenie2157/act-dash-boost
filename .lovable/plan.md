

## Current State

### What's Already Tested
- 7 public pages render (smoke tests)
- Section mapping logic (20+ tests)
- Edge function schemas (27+ tests)
- Subscription hooks
- Edge function HTTP endpoints (17+ integration tests)

### What's NOT Tested
1. **Quiz/Drill question loading** — no test verifies that `QuizRunner`, `DrillRunner`, or `Simulation` actually fetch and render questions
2. **Calculator Lab content** — no test checks that lessons render or that guided practice / timed challenge flows work
3. **Coach Mode logic** — the `useTestCompanion` hook has zero unit tests despite complex timing/trigger logic
4. **Simulation flow** — no test covers form selection → session start → question rendering → finish

### Simulation Question Counts (Current Data)
Your simulation forms are significantly under-filled vs. authentic ACT:

| Form | EN | Math | Reading | Science |
|------|-----|------|---------|---------|
| FA_* | 15 | 10 | 10 | 12 |
| FD_* | 75 | 60 | — | — |
| FE_* | 141 | 100 | — | 43 |
| **ACT Target** | **75** | **60** | **40** | **40** |

FA is far too small for a real sim. FD has correct EN/Math counts but no Reading/Science. FE has excess English/Math.

---

## How Coach Mode Currently Works

The `useTestCompanion` hook fires toast notifications based on these triggers:

**Time-on-question triggers:**
- **60s stuck** → "MARK_FOR_REVIEW" tip (flag & move on)
- **90s stuck** → "TIME_WARNING_90S" tip

**Progress/pacing triggers:**
- **50%+ time used, <40% done** → "PACE_WARNING"
- **<5 min left, 5+ blanks** → "GUESS_BLANKS"
- **<2 min left, any blanks** → "FINAL_PUSH"

**Flagged question triggers:**
- **Flagged > 0, 4-5 min left** → "REVIEW_FLAGGED"

**Two-Pass triggers:**
- **Quick pass, question 5** → "QUICK_PASS_REMINDER"
- **Deep pass, flagged > 0** → "DEEP_DIVE_START"

**Section lifecycle triggers:**
- **Question 0** (3s delay) → "SECTION_START" (section-specific strategy tip)
- **Midpoint** → "MIDPOINT_ENCOURAGEMENT"
- **Question 3** → "DIGITAL_NAVIGATION"

**Guard rails:**
- 45-second cooldown between tips
- Max 15 tips per session
- Each tip key fires only once

**Section-specific tip content:**
- **English:** OMIT strategy, comma splice detection, conciseness
- **Math:** 4-choice format reminder, plug-in-answers, Desmos/calculator tips
- **Reading:** question-first strategy, evidence finding, elimination
- **Science:** graph/data focus, axis labels, pattern comparison

---

## Plan: Expand Automated Tests + Content Audit

### 1. Add `useTestCompanion` unit tests
- Test each trigger fires at correct thresholds (60s, 90s, pace, guess-blanks, final-push)
- Test cooldown prevents rapid-fire tips
- Test max tip cap (15)
- Test each-tip-fires-once dedup
- Test section-specific tips resolve correctly (EN → OMIT, MATH → plug-in, etc.)
- Test Two-Pass triggers (quick pass reminder at Q5, deep dive start)

### 2. Add Calculator Lab content rendering test
- Verify `calculatorLessons` data has entries for both TI-84 and Desmos models
- Verify each lesson has required fields (title, steps, whenToUse)
- Verify `GuidedPractice` renders step instructions when `interactiveSteps` exist
- Verify `TimedChallenge` renders intro phase with expected times

### 3. Add simulation/drill data integrity tests
- Query `staging_items` counts per form and assert minimums (flag forms below ACT thresholds)
- Verify DR_* drill forms exist for all 4 sections
- Verify at least one full simulation form (FA/FB/FC) exists per section with enough questions

### 4. Add edge function integration tests for session flow
- Hit `session-start` → verify session_id returned
- Hit `session-fetch` → verify questions array is non-empty
- Verify question objects have required fields (question, choice_a-d, etc.)

### 5. Content gap: populate FA_* simulation forms
- FA_EN needs 60 more questions (15 → 75)
- FA_MA needs 50 more questions (10 → 60)
- FA_RD needs 30 more questions (10 → 40)
- FA_SC needs 28 more questions (12 → 40)
- Or: designate FD as the primary full-length sim form and add Reading/Science to it

