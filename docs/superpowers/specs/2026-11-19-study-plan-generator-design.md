# Study Plan Generator — Design

Date: 2026-11-19 · Status: draft for approval

## Why

Today every student gets the same curriculum-order plan. The generator ignores the diagnostic, reads weak
skills from an empty table, never schedules practice exams (plan mode is unset for everyone), and several
task types can't be launched or checked off. Students should get a plan built from what we know about
them — test date, past scores, target score, daily time, accommodations and onboarding-exam results — that
covers the lessons they actually need at a pace that fits, and tells them honestly when it doesn't fit.

## Goals

- Rank every ACT lesson for the student and skip the skills they've already shown they know.
- Pace the remaining lessons (each followed by a drill) across the days until the test, within their daily minutes.
- Pin the 3 full simulations (Forms A, B, C) to fixed dates before the test.
- Recalculate nightly so missed days re-balance automatically.
- When the work doesn't fit, schedule the highest-priority lessons and say what was left out and how much
  extra daily time would cover it.
- Every task in the plan launches and gets checked off when done.

## Non-goals

- Coach Exams (C1–C5) are **not** scheduled. They stay available anytime on Practice Tests ("use as needed").
- No full up-front calendar to the test date (decided: rolling recalculation, 7 days visible).
- No changes to lesson, drill or exam content.

## Anti-goals (would make this a failure even if it works)

- A plan that quietly over-schedules beyond the minutes the student said they have.
- Regeneration that erases or un-completes work the student already finished.
- Drills scheduled for skills with no questions (student hits "No questions found").
- AP Chemistry or the old 4-day / 1-week course appearing anywhere.

## Inputs (what exists today and what changes)

| Input | Where it lives | Change |
|---|---|---|
| Test date | `profiles.test_date` | — |
| Past scores (1–36 per section) | `diagnostics` rows, `source='self'` | — |
| Target composite | only a text note in `diagnostics.notes`, and lost if no past scores | **new `profiles.target_score` (int 1–36)**, written by the wizard; backfill from notes where present |
| Daily minutes | `user_preferences.daily_minutes` (fallback `profiles.daily_time_cap_mins`, then 30) | — |
| Accommodations | `accommodations.time_multiplier` (1.0 / 1.5 / 2.0) | — |
| Science required | `profiles.science_required` | false ⇒ Science dropped from the plan |
| Onboarding exam | `diagnostics` `source='diagnostic'` (section %), plus `attempts` for D2*/ONB forms joined to `staging_items.skill_code` (per-skill right/wrong) | — |
| Ongoing performance | `mastery` (per skill total/correct) | used instead of the empty `progress` table |
| Lessons | `lesson_content` (119 ACT lessons after cleanup) | — |
| Bank questions per skill | `staging_items` `DR_*` | drill only scheduled if skill has ≥ 5 |
| Preferred exam day | `profiles.sim_preferred_dow` | default Saturday when unset |

## How it works (decided: recalculate nightly, show 7 days)

Each run (nightly cron, after wizard/diagnostic, and on "regenerate"):

1. **Build the lesson queue.** All ACT lessons for the student's sections, minus:
   - lessons already completed (lesson task DONE, or checkpoint quiz passed), and
   - **strengths**: skills mastered — `mastery` ≥ 90% over ≥ 5 answers, or every onboarding-exam question
     on that skill correct with ≥ 2 questions.
2. **Rank the queue.** Priority = section gap × skill weakness, with curriculum order as tie-break
   (foundations before advanced within a section).
   - *Section gap*: target section score − current section estimate. Current estimate = onboarding-exam
     section % mapped to the 1–36 scale; else past score; else 18. Target section score = target composite
     (else current estimate + 4).
   - *Skill weakness*: from onboarding exam / mastery accuracy on that skill; untested skills get a neutral value.
   - Sections are interleaved so a day isn't all one subject (max 2 lessons per section per day).
3. **Work out the calendar.** From today to the test date:
   - **Exam days**: Forms A, B, C on the preferred weekday in the weeks 3, 2 and 1 before the test (dates
     in the past are dropped; forms with no questions are skipped). An exam day holds only the exam.
   - **Final week** (last 6 days before test): no new lessons — missed-question review and drills on the
     weakest skills; day before the test: short warm-up only.
   - **Learning days**: everything else.
4. **Pace.** lessons/day = remaining queue ÷ learning days, capped by what fits in daily minutes.
   - Minutes per item, multiplied by the accommodation time multiplier: lesson 12, drill (5 questions) 8,
     review block 10.
   - Each day: due spaced-review block first (if any), then lesson + its drill pairs in rank order until
     minutes run out.
5. **If it doesn't fit**, the lowest-ranked lessons fall off the end. The run records how many, and how many
   extra minutes per day would cover them.
6. **Write the next 7 days** to `study_plan_days` / `study_tasks`. Never touch tasks already DONE; only
   replace PENDING future tasks.
7. **No test date**: plan the next 7 days at the student's daily minutes in rank order, no exams, and the
   summary prompts them to set a test date.

## What the student sees

Plan page gains a summary line above the 7 days:

```
62 lessons to go · 48 days until your test · ~1.3 lessons/day · On track
Form B practice test: Sat Dec 14
```
When it doesn't fit:
```
At 30 min/day, 90 lessons fit before your test — 33 lower-priority lessons were left out.
Add 15 min/day to cover them.  [Change daily time]
```

## Tasks must launch and complete

| Task | Launches | Marked done when |
|---|---|---|
| LEARN | `/lesson/:skill` | checkpoint quiz finished |
| DRILL | skill drill (bank questions) | drill finished (already works) |
| REVIEW | `/review/spaced` | review session finished |
| SIM (Form A/B/C) | that form on Practice Tests | all sections finished |
| WARMUP | short mixed drill | finished |

## Also in scope

- **Cleanup**: delete AP Chemistry (12 lessons, 12 skills, its plan tasks and mastery rows, tutor subject);
  delete unused `src/data/curriculum.ts` (4-day intensive, 1-week crash course, rapid-fire foundations) and
  any other unused files tied to it; correct the product spec so it no longer describes them.
- Remove the duplicate nightly job (two cron jobs call the same function; keep the one with the cron secret).
- Wizard saves `target_score` even when no past scores are entered.

## Approaches considered

1. **Recalculate nightly, show 7 days** — chosen. Missed days re-balance on their own; reuses the existing
   nightly job and 7-day view.
2. **Full schedule built up front** — rejected: visible far ahead, but wrong after the first missed day and
   needs a reschedule flow.

## Calls made by the builder (correct any of these)

- Strength = 90% over ≥ 5 answers, or all-correct on ≥ 2 onboarding-exam questions for that skill.
- Section target = target composite (the ACT composite is the average of sections).
- Diagnostic % → 1–36 via a simple linear map (0% → 1, 100% → 36).
- Item minutes: lesson 12, drill 8, review 10, scaled by accommodations.
- Exams on the preferred weekday 3/2/1 weeks out, default Saturday; exam day replaces lessons regardless of daily minutes.
- Final week = last 6 days; no new lessons there.
- Lessons on skills with < 5 bank questions get no drill (the lesson still counts).

## Left to the builder

Exact ranking weights, query shapes, the nightly job's batching, and the summary UI styling (follow
existing Plan page components).

## Addendum (2026-11-19): skill buckets and per-question timing

Agreed with the user after the design was approved:

- **Per-question time is recorded** (`attempts.time_ms`) in drills, lesson/skill quizzes and the diagnostic,
  from this build onward.
- **Each skill gets a bucket** from its timed answers: right+fast = **solid**, right+slow = **shaky**,
  wrong+fast = **careless**, wrong+slow = **gap**. Fast = at or under the section target time
  (English 30s, Math 60s, Reading 45s, Science 45s, × accommodation multiplier). A wrong answer under 25% of
  the target is a guess and counts as **gap**; unanswered counts as **gap**. A skill's bucket is the worst of
  its recent answers (gap > careless > shaky > solid — builder's call).
- **The plan acts on buckets:** gap → lesson then drill; shaky → timed drill only; careless → accuracy drill
  only; solid → skipped (strength). Skills with no timed answers fall back to the accuracy rules above.
- **Diagnostic v2 is a separate, later project.** The user is writing a dedicated diagnostic question pool
  (4–5 questions per skill). Each sitting will draw ~2 per skill the student hasn't seen; resuming continues
  the same set; Reading/Science use mini-passages. When that pool is imported it supplies buckets to this
  planner without changing it.
- **Skills the thorough diagnostic measures: 103 of 120.** Source of truth: `Preppit_skill_ids_diagnostic.csv`
  (repo root; one row per skill ID, `in_thorough_diagnostic` Yes/No, `reason_if_not` for every No; checked
  against the live `skills` table on 2026-11-19 — all 120 IDs match). The picker draws only from Yes skills.
  Left out (17), because one question can't measure them:
  - English (12): 6 Review skills (E1.F4, E2.T, E3.D, E6.E, E7.D, E8.D — covered by the skills they review);
    3 Mixed Practice (E9.A, E9.B, E9.C); 3 Practice Test/Capstone (E10.A, E10.B, E10.C)
  - Math (3): Practice Test/Capstone (M10.F, M10.G, M10.H)
  - Reading (1): R5.A Timing & Order Strategy
  - Science (1): S5.B Time Management & Section Strategy
  Used: English 35, Math 43, Reading 15, Science 10. Left-out skills keep their lessons; the study plan still
  ranks them using mastery and drill/quiz timing, just never a diagnostic result.
- **Passages in the thorough diagnostic pool (Reading and Science).** Each skill's 2 drawn questions share one
  passage, and the passage text is stored only on the first question of its group (`passage_id` links them).
  Rules for the picker and the test screen:
  - The picker draws a passage group as a unit: for a passage-based skill it picks one unseen group and takes
    both of its questions together, never one question from a group alone.
  - The test screen resolves the passage by `passage_id` (from whichever question in the group carries the
    text), so every question shows it regardless of which row stores it. Questions in a group are shown
    back to back.
  - "Unseen" for a passage skill means the student hasn't answered any question from that group.
- **Quick diagnostic (approved 2026-11-19).** Replaces the fixed 30-question `ONB` form (same 30 for everyone,
  24 of 103 skills). Draws from the same diagnostic pool and picker as the thorough diagnostic:
  - ~30–35 questions split like the ACT: English ~10, Math ~12, Reading ~6–7, Science ~6–7, spread at random
    across the 103 Yes skills (passage groups drawn whole, as above).
  - Unseen questions first, so a retake — or a later thorough diagnostic — does not repeat them.
  - Feeds the plan section estimates only. Each answer counts like a single drill answer toward that
    skill's timing/accuracy; one question never marks a skill a gap or a strength.
  - Untimed for the student (time per question recorded); both diagnostic screens show matching time
    estimates (today the wizard says thorough = 60 min and the Diagnostic page says ~80).
  - Built right after the thorough picker, once the new pool is imported.

## Lesson order (2026-11-19)
Need decides which subject gets each lesson slot; within a subject, lessons always follow the
curriculum order in `skills.order_index` (capstones last). Lessons already completed or shown to be
strengths are skipped. Diagnostic scores are percent correct and are converted to 1-36 once, in
`currentEstimate` (shared curve in `_shared/actScore.ts`).
