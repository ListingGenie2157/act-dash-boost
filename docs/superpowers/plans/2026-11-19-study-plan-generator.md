# Study Plan Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the curriculum-order study plan with a personalized, nightly-recalculated plan that ranks lessons from the student's data, paces them to the test date, pins Forms A–C, and reports what doesn't fit.

**Architecture:** All planning decisions live in one pure, import-free module (`supabase/functions/_shared/planner.ts`) tested with vitest. The `generate-study-plan` edge function only loads data, calls the planner, and writes the next 7 days without touching finished tasks. Frontend changes make every task type launch and complete, and show a plan summary.

**Tech Stack:** Supabase (Postgres, Deno edge functions), React/Vite/TypeScript, vitest, Supabase MCP for migrations/deploys, Playwright MCP for verification.

**Spec:** `docs/superpowers/specs/2026-11-19-study-plan-generator-design.md`

## Global Constraints

- Supabase project `hhbkmxrzxcswwokmbtbz` is production; apply migrations with `apply_migration`, deploy functions with `deploy_edge_function` (include `../_shared/*` files the function imports).
- Item minutes before accommodations: lesson 12, drill 8, review block 10, warm-up 15. Multiply by `accommodations.time_multiplier` (default 1.0).
- Strength: `mastery` correct/total ≥ 0.90 with total ≥ 5, OR all onboarding-exam answers on the skill correct with ≥ 2 answers.
- Diagnostic `source='diagnostic'` score is a percent 0–100; map to 1–36 as `round(1 + 35 * pct / 100)`. `source='self'` scores are already 1–36. Neither ⇒ 18.
- Section target = `profiles.target_score`; if null, current estimate + 4 (capped at 36).
- Exams: Forms FA, FB, FC on `profiles.sim_preferred_dow` (default 6 = Saturday) in the weeks 21, 14, 7 days before the test; drop past dates and forms with 0 questions. Coach Exams C1–C5 are never scheduled.
- Final week = days with 1–6 days left: no LEARN; day with 1 day left = WARMUP only.
- Max 2 lessons per section per day. Drill only for skills with ≥ 5 `DR_*` questions.
- Never modify or delete `study_tasks` with status `DONE` or `COMPLETED`.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Work on branch `fix/question-bank-and-diagnostic`.

## Review Focus

- Test date today, in the past, or within 6 days → no LEARN tasks, no crash; past date treated as no test date.
- Student with no diagnostic, no past scores, no target → every section estimate 18, target 22, plan still fills.
- Daily minutes smaller than one lesson+drill pair (e.g. 15 min with 2.0× time) → day gets a lesson without drill if the lesson alone fits, otherwise review only; fit report says lessons were left out.
- Science not required → no Science lessons, drills or Science-weighted ranking.
- Regenerating the same day after a task was completed → that task stays COMPLETED and is not rescheduled.

---

### Task 1: Pure planner module

**Files:**
- Create: `supabase/functions/_shared/planner.ts` (no imports)
- Test: `supabase/functions/_shared/planner.test.ts` (vitest; import with a relative path)

**Interfaces:**
- Produces:
```ts
export type Section = 'English' | 'Math' | 'Reading' | 'Science';
export interface LessonInfo { skillId: string; section: Section; orderIndex: number; bankQuestions: number }
export interface SkillStats { correct: number; total: number }          // mastery, per skill
export type SkillBucket = 'solid' | 'shaky' | 'careless' | 'gap';
export interface PlannerInput {
  today: string;                       // YYYY-MM-DD
  testDate: string | null;
  targetScore: number | null;
  dailyMinutes: number;
  timeMultiplier: number;
  scienceRequired: boolean;            // false only when profiles.science_required === false
  simPreferredDow: number | null;
  sectionEstimates: Partial<Record<Section, { score: number; source: 'diagnostic' | 'self' }>>; // raw stored score
  lessons: LessonInfo[];
  completedSkillIds: string[];         // LEARN tasks DONE/COMPLETED
  mastery: Record<string, SkillStats>;
  diagnosticSkillStats: Record<string, SkillStats>;
  skillBuckets: Record<string, SkillBucket>;   // from timed answers (Task 2b); may be empty
  dueReviewCount: number;
  formQuestionCounts: Record<'FA' | 'FB' | 'FC', number>;
}
export type PlanTaskType = 'LEARN' | 'DRILL' | 'REVIEW' | 'SIM' | 'WARMUP';
export interface PlannedTask { type: PlanTaskType; skillId: string | null; size: number; minutes: number }
export interface PlannedDay { date: string; kind: 'learning' | 'exam' | 'final' | 'warmup'; tasks: PlannedTask[] }
export interface PlanSummary {
  lessonsRemaining: number; daysUntilTest: number | null; lessonsPerDay: number;
  lessonsThatFit: number; lessonsLeftOut: number; extraMinutesPerDay: number;
  nextExam: { form: 'FA' | 'FB' | 'FC'; date: string } | null;
}
export function currentEstimate(e: { score: number; source: 'diagnostic' | 'self' } | undefined): number;
export function isStrength(skillId: string, input: PlannerInput): boolean;   // bucket 'solid' ⇒ true; other buckets ⇒ false; no bucket ⇒ accuracy rule
export interface TimedAnswer { correct: boolean | null /* null = unanswered */; timeMs: number; targetMs: number }
export function classifyAnswer(a: TimedAnswer): SkillBucket;
export function worstBucket(buckets: SkillBucket[]): SkillBucket | null;  // gap > careless > shaky > solid
export const SECTION_TARGET_MS: Record<Section, number>;  // English 30000, Math 60000, Reading 45000, Science 45000
export function rankLessons(input: PlannerInput): LessonInfo[];   // excludes completed, strengths, Science when not required
export function examDates(input: PlannerInput): Array<{ form: 'FA' | 'FB' | 'FC'; date: string }>;
export function buildPlan(input: PlannerInput, horizonDays?: number /* default 7 */): { days: PlannedDay[]; summary: PlanSummary };
```
- SIM tasks carry `skillId` = form prefix (`'FA'|'FB'|'FC'`), `size` 4 (sections), `minutes` 175 × multiplier. REVIEW `skillId` null, size `min(dueReviewCount, 10)`. WARMUP `skillId` null, size 10.

- [ ] **Step 1: Write failing tests** in `planner.test.ts`, using a `makeInput(overrides)` helper (today `2026-12-01`, 30 min/day, 1.0×, science required, no scores, 8 lessons: 2 per section, each with 10 bank questions, forms FA/FB/FC with 40 questions):
  - `currentEstimate({score:50,source:'diagnostic'})` → 19; `({score:27,source:'self'})` → 27; `(undefined)` → 18.
  - `classifyAnswer`: correct & 20s/30s → solid; correct & 40s/30s → shaky; wrong & 20s/30s → careless; wrong & 40s/30s → gap; wrong & 5s/30s (under 25%) → gap; unanswered → gap. `worstBucket(['solid','careless','shaky'])` → careless; `[]` → null.
  - Buckets: skill with bucket `shaky` or `careless` gets a DRILL but no LEARN; `gap` gets LEARN then DRILL ranked above unbucketed skills; `solid` is excluded.
  - `isStrength` true for mastery `{correct:9,total:10}`; false for `{correct:4,total:4}`; true for diagnostic `{correct:2,total:2}`; false for diagnostic `{correct:1,total:1}`.
  - `rankLessons`: completed and strength skills absent; with `scienceRequired:false` no Science lessons; with Math estimate 15 (self) and English 30 (self), target 28, the first ranked lesson is Math; ties keep `orderIndex` order.
  - `examDates` with test date `2027-02-27` (Sat), dow null → `[FA 2027-02-06, FB 2027-02-13, FC 2027-02-20]`; with `formQuestionCounts.FB = 0` → FB absent; test date `2026-12-10` → only dates ≥ today remain.
  - `buildPlan` no test date → 7 days, all `learning`, each with LEARN+DRILL pairs totalling ≤ 30 min, `summary.daysUntilTest` null.
  - `buildPlan` test date `2026-12-05` → no LEARN in any day; the day `2026-12-04` has only one WARMUP task.
  - `buildPlan` daily 15 min, multiplier 2.0 → no day exceeds 15 min; `summary.lessonsLeftOut` > 0 and `extraMinutesPerDay` is a positive multiple of 5.
  - `buildPlan` with a lesson whose `bankQuestions` is 3 → its LEARN has no DRILL after it.
  - `buildPlan` with `dueReviewCount: 25` → each learning day starts with REVIEW size 10.
  - No day has more than 2 LEARN tasks from one section.
  - Past test date (`2026-11-01`) behaves like no test date.

- [ ] **Step 2: Run `npx vitest run supabase/functions/_shared/planner.test.ts`** — expected FAIL (module not found).

- [ ] **Step 3: Implement `planner.ts`.** Ranking: `priority = (max(0, target − estimate) + 1) × (1.5 − accuracy)` where accuracy is the skill's diagnostic accuracy, else mastery accuracy, else 0.5; sort by priority desc, then orderIndex asc. Pacing: learning days = days from today to test minus exam/final days; `lessonsPerDay = ceil(remaining / learningDays)`; per day fill REVIEW first, then pairs in rank order (respecting the 2-per-section cap and minutes; a lesson without room for its drill is still placed if the lesson alone fits). Fit report: `capacity` = lessons that fit across all learning days to the test (simulate the whole horizon, return only `horizonDays`); `lessonsThatFit = min(remaining, capacity)`; `lessonsLeftOut = max(0, remaining − capacity)`; `extraMinutesPerDay = ceil(leftOut × pairMinutes / learningDays / 5) × 5`. Final days (2–6 left): REVIEW (if due) + DRILLs on the top-ranked skills with drills until minutes run out. Exam day: only the SIM task.

- [ ] **Step 4: Run the same command** — expected PASS, all tests.

- [ ] **Step 5: Commit** `feat(plan): pure study planner with ranking, pacing and fit report`.

### Task 2: Database changes

**Files:**
- Create: `supabase/migrations/20261119140000_study_plan_v2.sql`
- Modify: `src/integrations/supabase/types.ts` (regenerate)

**Interfaces:**
- Produces: `profiles.target_score int` (check 1–36), `profiles.plan_summary jsonb` (shape = `PlanSummary` with snake_case keys: `lessons_remaining, days_until_test, lessons_per_day, lessons_that_fit, lessons_left_out, extra_minutes_per_day, next_exam`), `profiles.plan_summary_at timestamptz`.

- [ ] **Step 1: Write the migration:**
  - add the three columns;
  - backfill `target_score` from `diagnostics.notes` matching `Target composite: (\d+)` (latest per user);
  - delete AP Chemistry: `lesson_content`, `study_tasks`, `mastery`, `study_plan_days` task entries, and `skills` where skill id/code starts with `APCHEM` (delete dependents before `skills`);
  - `select cron.unschedule('regenerate-study-plans-daily');` (the 2am job using the anon key; keep `daily-study-plan-generation`).
- [ ] **Step 2: Apply with `apply_migration`**, then verify: `select count(*) from lesson_content` = 119; `select count(*) from skills where id like 'APCHEM%'` = 0; `select jobname from cron.job` lists only `daily-study-plan-generation`.
- [ ] **Step 3: Regenerate types** with `generate_typescript_types` into `src/integrations/supabase/types.ts`; `npm run typecheck` passes.
- [ ] **Step 4: Commit** `feat(plan): target score, plan summary, remove AP Chemistry`.

### Task 2b: Record time per question

**Files:**
- Migration in Task 2's file: `alter table attempts add column time_ms integer check (time_ms >= 0)`.
- Modify: `src/components/DrillComponent.tsx` (per-question elapsed ms passed in `DrillResult.timesMs: number[]`), `src/pages/DrillPlayer.tsx`, `src/pages/DrillRunner.tsx`, `src/pages/QuizRunner.tsx` + `src/components/QuizComponent.tsx` (`onAnswerGraded` gains `timeMs`), `src/pages/DiagnosticTest.tsx` (accumulate time per question across revisits; write on save)

**Interfaces:**
- Produces: `attempts.time_ms` written by every client attempt insert/update; time = ms the question was on screen until the answer, summed across revisits.

- [ ] **Step 1:** Add the column (Task 2 migration), regenerate types.
- [ ] **Step 2:** Track and write `time_ms` in each listed file. DrillPlayer currently writes no attempts: insert one attempts row per graded answer (`form_id` from the question, `task_id` null) so its timing is captured.
- [ ] **Step 3: Verify** with Playwright: run a 10-question drill and a lesson quiz on localhost, then `select count(*) from attempts where time_ms is not null and created_at > now() - interval '10 minutes'` ≥ 20.
- [ ] **Step 4: Commit** `feat: record time per question`.

### Task 3: Generator uses the planner

**Files:**
- Modify: `supabase/functions/generate-study-plan/index.ts` (replace everything after auth/rate-limit; keep request/response contract `{ force?: boolean, userId?: string }` → `{ days, summary }`)

**Interfaces:**
- Consumes: `buildPlan`, `PlannerInput` from `../_shared/planner.ts`; columns from Task 2.
- Produces: `study_plan_days.tasks_json` items `{ sequence, type, skill_id, size, estimated_mins, title }` (same shape as today; SIM title `"Practice Test – Form A"` etc., REVIEW `"Review N missed questions"`, WARMUP `"Test-day warm-up"`); `study_tasks` rows with `skill_id` = form prefix for SIM; `profiles.plan_summary` written each run.

- [ ] **Step 1: Load inputs** in parallel: profile (`test_date, target_score, daily_time_cap_mins, science_required, sim_preferred_dow`), `user_preferences.daily_minutes`, `accommodations.time_multiplier` (`maybeSingle`), latest `diagnostics` per section (prefer `diagnostic` over `self`, latest `completed_at`), `lesson_content` joined to `skills` (`order_index`, `subject`), DR_ question counts per `skill_code`, `mastery`, onboarding-exam skill stats (attempts with `form_id` like `D2%` or `ONB%` joined to `staging_items.skill_code`, correct = `selected_idx = correct_idx`), skill buckets (per skill, its last 4 attempts with `time_ms` not null joined to `staging_items.skill_code` → `classifyAnswer` with `SECTION_TARGET_MS[section] × timeMultiplier` → `worstBucket`), completed LEARN skill ids (`study_tasks` type LEARN status in DONE/COMPLETED), due review count (`review_queue.due_at <= now()`), question counts for FA_/FB_/FC_ forms.
- [ ] **Step 2: Write the plan:** delete this user's `study_tasks` with status PENDING/STARTED and `the_date >= today`, and `study_plan_days` with `the_date >= today`; insert days and tasks from `buildPlan`, skipping any task whose `(the_date, type, skill_id)` already exists with status DONE/COMPLETED (insert with `onConflict: 'user_id,the_date,type,skill_id', ignoreDuplicates: true`). Remove the old "skip if 7 days exist" early return except when called by cron without `force` and today's plan was generated today.
- [ ] **Step 3: Deploy** with `deploy_edge_function` (files: `generate-study-plan/index.ts`, `_shared/planner.ts`, `_shared/cors.ts`, `_shared/rateLimit.ts`, `_shared/mod.ts`).
- [ ] **Step 4: Verify** by invoking for the admin user (Playwright: `supabase.functions.invoke('generate-study-plan', { body: { force: true } })` from the logged-in page) and querying: 7 `study_plan_days` rows from today; no LEARN for `APCHEM%`; every DRILL skill has ≥ 5 DR_ questions; `profiles.plan_summary` populated; a COMPLETED task from today still COMPLETED.
- [ ] **Step 5: Commit** `feat(plan): generate-study-plan uses personalized planner`.

### Task 4: Every task launches and completes

**Files:**
- Modify: `src/pages/TaskLauncher.tsx`, `src/pages/EnhancedLessonViewer.tsx`, `src/pages/ReviewSpaced.tsx`, `src/pages/Simulation.tsx`, `supabase/functions/session-finish/index.ts`, `src/components/StudyPlanWizard.tsx`

**Interfaces:**
- Consumes: `completeTask(supabase, { taskId, correctCount, totalCount, medianTimeMs })` from `src/lib/supabase-client.ts` (sets status COMPLETED).
- Produces: query param `taskId` on every launched route.

- [ ] **Step 1: TaskLauncher.** Existing-task lookup uses `.is('skill_id', null)` when the task has no skill. Routes: REVIEW → `/review/spaced?taskId=…`; SIM → `/simulation?form=<FA|FB|FC>&taskId=…`; WARMUP → `/drill/<weakest section>?n=10&taskId=…` (DrillRunner already completes via `taskId`).
- [ ] **Step 2: Lesson.** When the checkpoint quiz completes and the URL has `taskId`, call `completeTask` with the quiz score.
- [ ] **Step 3: Review.** When the due list empties after at least one card graded and the URL has `taskId`, call `completeTask` (correct = cards graded Good/Easy).
- [ ] **Step 4: Simulation.** `/simulation?form=FA` opens the picker filtered/scrolled to that form. In `session-finish`, after scoring, if the session's form prefix has finished sessions for all 4 sections for this user, set that user's PENDING/STARTED `study_tasks` row with type SIM and `skill_id` = prefix to COMPLETED (service client). Deploy `session-finish`.
- [ ] **Step 5: Wizard.** Save `target_score` to `profiles` whenever entered (independent of past scores).
- [ ] **Step 6: Verify** `npm run typecheck` and `npm test` (planner tests pass; pre-existing environment failures unchanged), then Playwright on localhost: launch each task type from `/plan`; LEARN quiz and a REVIEW session flip to done on `/plan`.
- [ ] **Step 7: Commit** `feat(plan): all plan tasks launch and check off`.

### Task 5: Plan summary on the Plan page

**Files:**
- Modify: `src/pages/Plan.tsx`, `src/components/StudyPlanWidget.tsx`

**Interfaces:**
- Consumes: `profiles.plan_summary` (Task 2 shape).

- [ ] **Step 1: Render** above the 7 days, copy exactly as the spec:
  - fits: `{lessons_remaining} lessons to go · {days_until_test} days until your test · ~{lessons_per_day} lessons/day · On track`, plus `Form {A|B|C} practice test: {Ddd Mmm d}` when `next_exam`;
  - doesn't fit: `At {daily} min/day, {lessons_that_fit} lessons fit before your test — {lessons_left_out} lower-priority lessons were left out. Add {extra_minutes_per_day} min/day to cover them.` with a `Change daily time` button opening the existing wizard;
  - no test date: `Set your test date to get a paced plan.` with the same button.
- [ ] **Step 2: Widget** shows the first line only.
- [ ] **Step 3: Verify** via Playwright on `/plan` for the admin user; typecheck passes.
- [ ] **Step 4: Commit** `feat(plan): plan summary and fit message`.

### Task 6: Remove leftovers

**Files:**
- Delete: `src/data/curriculum.ts`
- Modify: `src/types/tutor.ts`, `src/lib/tutorSubjectMapper.ts`, `supabase/functions/tutor-chat/index.ts` (remove `AP_CHEM`), `Preppit_Product_Technical_Spec_v2.md` (remove AP Chemistry rows and §3.5.2 A–D; Science = 10 lessons, total 119)

- [ ] **Step 1: Confirm** `grep -rn "data/curriculum\|AP_CHEM\|APCHEM" src supabase/functions` shows only the lines being removed; delete/edit.
- [ ] **Step 2: Deploy `tutor-chat`**; `npm run typecheck` and `npm test` pass as before.
- [ ] **Step 3: Verify** `/lessons` shows Science (10) and All (119).
- [ ] **Step 4: Commit** `chore: remove AP Chemistry and unused crash-course curriculum`.
