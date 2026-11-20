# Preppit — Product & Technical Specification

> **Signature product:** **Coach Mode** — the voice in a student's head that nudges pacing, strategy, and focus inside real timed practice until the right test‑day habits become automatic.

**Document type:** Official product + technical specification
**Audience:** Founders, investors, prospective buyers, new engineers, partners
**Prepared from:** Live codebase audit (React/TS frontend, Supabase backend, 21 deployed edge functions, 38 Postgres tables)
**Live URLs:** https://getpreppit.com (custom domain) · https://act-dash-boost.lovable.app (Lovable host)
**Supabase project ref:** `hhbkmxrzxcswwokmbtbz`

---

## 1. Product Overview

### 1.1 Product Name & Positioning
**Preppit** is an ACT prep platform whose flagship feature is **Coach Mode** — an embedded AI‑style "voice in your head" that delivers context‑aware nudges, pacing alerts, and strategy reminders **inside live timed simulations and drills**. Coach Mode is what students experience first and what they re‑subscribe for: it trains test‑day instincts (flag and move on, two‑pass, guess blanks at T‑2:00, watch the Desmos mode) until they fire automatically without prompting.

Around Coach Mode, Preppit ships a complete ACT engine: authentic Enhanced‑ACT simulations (50/45/36/40), an AI study planner, an AI tutor, a 120‑skill mastery system, a parent portal, and the well‑known **"Calculator Hacks"** library — a supporting differentiator (not the core), used both as a top‑of‑funnel hook and as the proof point that Preppit teaches *how to take* the test, not just the content.

### 1.2 Mission / Problem Solved
The ACT is a high‑stakes, **pace‑constrained** exam. Most prep tools (Khan Academy, prep books, $200/hr tutors) drill *content* but ignore *how a real teen performs under a 35–50 minute timer* — especially teens with ADHD, anxiety, or weak time‑management. Knowing the math isn't the same as knowing when to bail on a problem at 0:75, when to start the second pass, when to fill bubbles, or when to switch Desmos out of radian mode. Preppit solves three specific problems:

1. **Internalizing pace & strategy** — **Coach Mode** rides along during every drill and simulation, surfacing the *right* nudge at the *right* moment (60s‑per‑question warning, midpoint encouragement, "guess the blanks" at T‑5:00, two‑pass triggers, section‑specific tactics). Over weeks of practice the prompts stop being needed — the voice has moved inside the student's head. That transfer of strategy from app → instinct is the product.
2. **ADHD & executive‑function support** — Bail+Bank, Streak counter, Chunk Timer, Two‑Pass indicator, Miss‑Reason tagging, and Pomodoro break modals live *inside* a real test simulation rather than as a separate "study mode."
3. **Calculator literacy** — a Calculator Lab teaching TI‑84 and Desmos hacks specific to the Digital ACT (one of the few ACT‑legal force multipliers most students never learn). Marketed externally as "Calculator Hacks" to draw attention; functionally one of many lesson tracks inside the platform.

### 1.3 Target Users
- **Primary:** High‑school students (grades 9–12) preparing for the ACT, especially those who self‑identify as having ADHD, slow processing speed, or test anxiety.
- **Secondary:** Parents who want visibility into a teen's prep (Parent Portal + reward ledger).
- **Tertiary:** Tutors, school counselors, and small test‑prep franchises that want a white‑label ACT engine (future roadmap).

### 1.4 Value Proposition
> "Coach Mode trains the test‑day voice in your head — so by exam morning, the pacing, the bail‑outs, and the calculator moves are already automatic. For the price of one tutoring hour a month."

### 1.5 Competitive Advantages
| # | Differentiator | How Preppit does it | Why competitors don't |
|---|---|---|---|
| 1 | **Coach Mode** (flagship) | Context‑aware, section‑aware nudges fire inside live timed practice via `TestCompanion` + `companionTips.ts` (50+ tip variants across pacing, two‑pass, digital nav, OMIT strategy, plug‑in‑answers, Desmos mode, evidence‑finding, axis‑label reading, etc.). Designed to fade as habits internalize. | Khan/Magoosh show static "tips" in lesson copy; nothing speaks to the student *while the timer is running*. |
| 2 | ADHD‑native test simulation | Bail+Bank, Streak, Chunk Timer, Two‑Pass, Miss‑Reason — all wired into Coach Mode | Treated as separate accommodations, not core UX |
| 3 | Coached vs. Timed dual mode | Coach Mode toasts in Coached; absolute silence in Timed (true test‑day rehearsal) | Most apps are one or the other |
| 4 | Calculator Hacks library | Dedicated Calculator Lab (TI‑84 + Desmos) with 15 timed challenges; supporting hero feature for marketing | Most platforms avoid calculator strategy because it "feels like cheating" |
| 5 | Authentic Enhanced‑ACT format | Real 50/45/36/40 split, real passage layouts, server‑graded with answer pinning | Generic SAT/ACT hybrids; no real digital simulation |
| 6 | Server‑side answer protection | `session_questions` pinning, answer keys never reach the client | Most indie prep apps leak answers in network responses |

---

## 2. User Roles & Permissions

Roles are stored in `public.user_roles` keyed on `(user_id, role)` with a `app_role` enum, validated through a `SECURITY DEFINER` `has_role()` function to prevent RLS recursion.

| Role | How assigned | Permissions |
|---|---|---|
| **Anonymous visitor** | Default | Landing page, /pricing, /terms, /privacy, /login, lead capture (`capture-lead`) |
| **Student (authenticated)** | Email/password signup via Supabase Auth | All `/dashboard` routes, own profile, own sessions/attempts/responses, own error_bank, own study_plan_days, own mastery, own sim_results. Gated by **subscription** for `/simulation`, `/cheatsheets/*`, `/plan`, `/task/*`, `/lesson/*`, `/lessons`, `/drills*`, `/quiz/*`, `/weak-areas`, `/calculator-lab`, `/pacing-lab`, `/review/*` |
| **Parent** | Row in `parent_links` (`parent_id`, `student_id`) | `/parent-portal` — read student mastery, study tasks, rewards_ledger; can issue rewards via `rewards_rules` |
| **Admin** | `user_roles.role = 'admin'` | Bypasses `RequireSubscription`; all `/admin-*` and `/admin/*` routes (Import, Lesson Import, Skill Codes, Question Generator, Simulation Generator); can run `cron-daily` manually via `AdminCronButton` |
| **System / AI** | Service role (Edge Functions only) | `generate-study-plan`, `generate-questions`, `cron-daily`, `stripe-webhook`, `finish-diagnostic` — bypass RLS via service_role; **never exposed to client** |

**Subscription gating** is enforced in two places: `src/components/RequireSubscription.tsx` (UI) AND server‑side checks in gated edge functions (e.g., `complete-task`, `session-start`).

---

## 3. Complete Feature Inventory

Every shipped feature, audited from the codebase. Status legend: ✅ Shipped · 🟡 Partial · 🔴 Stub.

### 3.1 Authentication
- **Purpose:** Email/password signup + password reset.
- **Flow:** `/login` → Supabase Auth → `handle_new_user()` trigger seeds `profiles` row → routes to `/onboarding` (new) or `/dashboard` (returning).
- **Components:** `Login.tsx`, `UpdatePassword.tsx`, `RequireAuth.tsx`, `hooks/queries/useAuth.ts`.
- **Tables:** `auth.users`, `profiles`, `user_roles`.
- **Functions:** None (uses Supabase Auth directly).
- **Status:** ✅ Shipped. Google OAuth not yet enabled.
- **Limitations:** No MFA, no magic link.

### 3.2 Onboarding (7‑step wizard)
- **Purpose:** Collect test date, target score, baseline, accommodations, ADHD preferences, parent email, digital‑vs‑paper preference.
- **Components:** `Onboarding.tsx`, `CalendarField.tsx`.
- **Tables:** `profiles`, `accommodations`, `user_preferences`, `user_goals`.
- **Functions:** `set-test-date`, `set-baseline`.
- **Business rule:** Test format (digital vs paper) drives whether `Digital ACT Coaching` tips appear.
- **Status:** ✅ Shipped.

### 3.3 Diagnostic Assessment (Quick + Thorough)
- **Purpose:** Establish baseline subscores per subject and seed weak‑area detection.
- **Modes:**
  - **Quick** — `ONB_*` forms, ~10–15 questions per section, used during onboarding.
  - **Thorough** — `D2_*` forms, full‑section diagnostic for returning users.
- **Components:** `Diagnostic.tsx`, `DiagnosticTest.tsx`, `DiagnosticResults.tsx`, `DiagnosticResultsComplete.tsx`, `FormPicker.tsx`.
- **Tables:** `diagnostics`, `forms`, `form_questions`, `questions`, `attempts`, `session_questions`.
- **Functions:** `session-start`, `session-fetch`, `submit-response`, `session-finish`, `finish-diagnostic`.
- **Business rules:** Answers de‑shuffled server‑side for grading (`Diagnostic Scoring Integrity`); one attempt per form/section enforced via session lockout.
- **Status:** ✅ Shipped.

### 3.4 Study Plan (AI‑generated, daily)
- **Purpose:** Generate a per‑day task list balancing all 4 subjects, weak skills, and days‑to‑test.
- **Algorithm:** `generate-study-plan/index.ts` (1046 lines). Round‑robin subject balancing, max 2 tasks per subject per day. Uses Lovable AI Gateway (Gemini) for narrative coaching.
- **Components:** `Plan.tsx`, `StudyPlanWidget.tsx`, `StudyPlanWizard.tsx`, `TaskLauncher.tsx`.
- **Tables:** `study_plan_days` (one row per `user_id, the_date`, `tasks_json`), `study_tasks` (one row per task instance).
- **Functions:** `generate-study-plan`, `complete-task`, `cron-daily` (regen for active users), `days-left`.
- **Auto‑regen:** Returning users get their plan regenerated on login if `generated_at` is stale.
- **Status:** ✅ Shipped.

### 3.5 Lessons (Enhanced 3‑tab viewer) — Full Inventory

- **Purpose:** Concept teaching with Overview / Examples / Practice tabs, plus a 10‑question checkpoint quiz per lesson.
- **Viewer components:** `EnhancedLessonViewer.tsx`, `LessonsLibrary.tsx`, `lesson/RuleCard`, `GuidedExampleCard`, `IndependentPracticeCard`, `CommonTrapsAlert`, `YouTubeEmbed`, `PeriodicTable`.
- **Storage:** `lesson_content` (24 columns per lesson: `overview_html`, `concept_explanation`, `objectives`, `guided_practice`, `error_analysis`, `common_traps`, `independent_practice`, `independent_practice_answers`, `checkpoint_quiz_q1`–`q10`, `recap`, `estimated_minutes`, `difficulty`, `skill_code`).
- **Import pipeline:** `import-lesson-content` edge function (admin only) → `/admin-lesson-import` UI.
- **Status:** ✅ Shipped.

#### 3.5.1 Library size (live DB count)

| Track | Lessons in `lesson_content` |
|---|---:|
| **ACT English** | **47** |
| **ACT Math** | **46** |
| **ACT Reading** | **16** |
| **ACT Science** | **10** |
| **Total full lessons in DB** | **119** |

In addition to DB lessons, Preppit ships a **calculator lesson library** (`src/data/calculatorLessons.ts`, 872 lines). The daily Study Plan is built from the DB lessons by the study planner (see the study plan design doc).

#### 3.5.2 Calculator Hacks Library (`calculatorLessons.ts`)

15 lessons, each shipped with a `VirtualCalculator` interactive walkthrough and a Timed Challenge (`calculator_practice` table records `time_saved_ms`).

**TI‑84 Hacks:**
1. Skip the Algebra: Solve Systems Without Substitution
2. Skip the Factoring: Find Roots Instantly
3. Graph Both Sides: Skip Solving Equations
4. Match the Answers: Decimal ↔ Fraction in 1 Click
5. Skip the Arithmetic: Stats Without Adding
6. Never Memorize the Quadratic Formula Again
7. Guess & Check on Steroids
8. Degree vs. Radian Mode (CRITICAL — the #1 score‑killer on Digital ACT)
9. Type It, See It, Click the Answer

**Desmos Hacks (Digital ACT):**
10. Graph Systems Instead of Solving
11. Find Roots Without Factoring
12. Let Desmos Find the Pattern
13. Slide to the Answer (sliders for parameter sweeps)
14. See the Solution Region Instantly (inequality shading)
15. Stats in One Line of Code (regressions, mean/median in a single Desmos table)

#### 3.5.4 Lesson Coverage Map (by ACT skill family)

| Section | Skill families covered in `lesson_content` |
|---|---|
| **English** (47 lessons) | E1 — Sentence Boundaries & Punctuation · E2 — Verbs (Tense, Form, S‑V Agreement) · E3 — Pronouns · E4 — Modifiers · E5 — Sentence Structure & Parallelism · E6 — Word Choice & Style · E7 — Rhetoric & Strategy · E8 — Organization & Transitions · E9 — Author's Purpose · E10 — Conventions Review |
| **Math** (46 lessons) | M1 — Arithmetic & Number Properties · M2 — Algebra (Linear) · M3 — Algebra (Quadratics, Polynomials) · M4 — Functions · M5 — Coordinate Geometry · M6 — Plane Geometry · M7 — Trigonometry · M8 — Statistics & Probability · M9 — Word Problems & Modeling · M10 — Advanced / Pre‑Calc topics |
| **Reading** (16 lessons) | Passage mapping, evidence finding, inference, vocab in context, comparative passages, paired Q&A timing |
| **Science** (10 lessons) | Data representation, research summaries, conflicting viewpoints, axis/graph reading, experimental design |

> **Content gap (documented honestly):** the 120‑row `skills` taxonomy is broader than the 119 published lessons. Many skills are covered as a sub‑section of a larger lesson; a small number of skills have no dedicated lesson yet — closing this gap is the #1 content roadmap item (see §13).

### 3.6 Drills (timed, single‑skill)
- **Purpose:** Short pacing‑focused practice on a single skill or subject.
- **Components:** `DrillSetup.tsx`, `DrillPlayer.tsx`, `DrillRunner.tsx`, `DrillHistory.tsx`, `DrillDetail.tsx`, `TimerBar.tsx`, `ChunkTimerBar.tsx`.
- **Tables:** `study_tasks`, `attempts`, `responses`, `sessions`, `error_bank`, `mastery`.
- **Functions:** `session-start`, `session-fetch`, `submit-response`, `session-finish`, `complete-task`.
- **Data source:** `DR_*` forms.
- **ADHD wrappers:** Sprint / Marathon / Pomodoro run‑styles (`src/lib/runStyles.ts`).
- **Coach Mode:** Available inside Coached drills (see §3.8a).
- **Status:** ✅ Shipped.

### 3.7 Quizzes
- **Purpose:** Medium‑length section practice.
- **Components:** `QuizRunner.tsx`, `QuizComponent.tsx`.
- **Tables:** Same as Drills.
- **Status:** ✅ Shipped.

### 3.8 Simulations (full‑length, authentic ACT)
- **Purpose:** Full‑length practice tests matching the Enhanced ACT (50/45/36/40).
- **Modes:**
  - **Timed (default)** — silent, no coaching, identical to test day.
  - **Coached** — strategic toasts (no answers), ADHD tools (Bail+Bank, Chunk Timer, Two‑Pass, Miss‑Reason).
- **Components:** `Simulation.tsx`, `SimulationStartDialog.tsx`, `SimulationResults.tsx`, `TestCompanion.tsx`, `BailBankButton.tsx`, `BreakModal.tsx`, `TwoPassIndicator.tsx`, `LiveStreakCounter.tsx`, `MissReasonTagger.tsx`.
- **Tables:** `sessions`, `session_questions` (anti‑scraping pin), `attempts`, `responses`, `sim_results`, `study_tasks`.
- **Functions:** `session-start`, `session-fetch`, `submit-response`, `session-finish`.
- **Data source:** `FA_*` forms.
- **Calculator:** Available **only** in Math section; force‑hidden elsewhere.
- **Integrity:** Timer `started_at` calculated server‑side; daily cap 15 tests/user (DB trigger 500/day hard cap); answer keys never sent to client.
- **Status:** ✅ Shipped.

### 3.8a Coach Mode 🏆 *(flagship differentiator)*

- **Purpose:** Act as the **voice in the student's head** — pacing nudges, strategy reminders, and digital‑navigation prompts delivered in‑context during live timed practice. The goal is **internalization**: after enough reps, students hear the same prompts automatically on test day without the app.
- **Where it runs:** Inside every **Coached** simulation, drill, and quiz session. Disabled entirely in **Timed** mode (true exam rehearsal).
- **Core component:** `src/components/TestCompanion.tsx` — listens for trigger events emitted by the session runner and surfaces a transient on‑screen "coach card" / toast with a short message.
- **Tip library:** `src/data/companionTips.ts` (200+ lines, 50+ tip variants across 18 trigger categories). Tips are randomized per trigger so the student doesn't memorize a single line — they internalize the *pattern*.
- **Trigger categories** (`TIP_KEYS`):
  - **Pacing:** `TIME_WARNING_60S`, `TIME_WARNING_90S`, `PACE_WARNING`, `MIDPOINT_ENCOURAGEMENT`, `GUESS_BLANKS` (T‑5:00), `FINAL_PUSH` (T‑2:00).
  - **Digital ACT navigation:** `MARK_FOR_REVIEW`, `REVIEW_FLAGGED`, `DIGITAL_NAVIGATION`.
  - **Two‑Pass Strategy:** `QUICK_PASS_REMINDER`, `DEEP_DIVE_START`.
  - **Section‑aware (English):** `SECTION_START`, `OMIT_STRATEGY` ("see an OMIT option? Take it seriously"), `COMMA_SPLICE`.
  - **Section‑aware (Math):** `PLUG_IN_ANSWERS`, `CALCULATOR_CHECK`, `DESMOS_TIP` ("use Desmos to graph intersections instead of solving").
  - **Section‑aware (Reading):** `FIND_EVIDENCE`, `ELIMINATE_STRATEGY`, `DIGITAL_READING` ("don't turn the highlight tool into an art project").
  - **Section‑aware (Science):** `READ_GRAPHS`, `DATA_COMPARISON`.
- **Selection logic:** `getCompanionTip(tipKey, section, context)` — checks section‑specific tip table first (`ENGLISH_TIPS`, `MATH_TIPS`, `READING_TIPS`, `SCIENCE_TIPS`), falls back to `GENERAL_TIPS`. Random pick from the matching variant array.
- **Integrity guarantee:** Coach Mode **never reveals the answer**, never gives a per‑question hint, and never mentions a specific choice letter. It coaches *behavior*, not content. That guarantee is what lets it run inside otherwise‑graded simulations.
- **Companion ADHD tools controlled by Coach Mode:**
  - `BailBankButton` — one‑tap "bail and bank" with reason capture.
  - `ChunkTimerBar` — segments long sections into mental chunks.
  - `TwoPassIndicator` — visual state for Quick Pass vs Deep Dive.
  - `LiveStreakCounter` — in‑session correct streak.
  - `MissReasonTagger` — post‑question tag (Careless / Concept / Time / Trick).
  - `BreakModal` — Pomodoro and between‑section breathers.
- **Why this is the biggest selling point:** every competitor teaches *what* to do; Coach Mode is the only product that **says it out loud at the exact moment it matters** until the student no longer needs to hear it. It is the engine behind every retention story ("I heard your voice during my real ACT and bailed at 0:75 — I finished the section for the first time ever").
- **Tables:** none directly — Coach Mode is stateless UI; trigger events derive from `sessions`, `responses`, server timer, and `user_preferences.coach_mode_enabled`.
- **Status:** ✅ Shipped. Expanding tip library and personalization (tone, frequency, ADHD‑aware throttle) is an active roadmap item.



### 3.9 Pacing Lab (unified hub)
- **Purpose:** Centralized entry to all timed practice with run‑style picker.
- **Components:** `PacingLab.tsx` (legacy `/drills` and `/drill-runner` redirect here).
- **Status:** ✅ Shipped.

### 3.10 Calculator Lab
- **Purpose:** Teach TI‑84 and Desmos hacks specific to the Digital ACT (signature brand feature).
- **Components:** `CalculatorLab.tsx`, `calculator/VirtualCalculator.tsx`, `CalculatorScreen.tsx`, `GuidedPractice.tsx`, `TimedChallenge.tsx`, `ti84Layout.ts`.
- **Tables:** `calculator_practice`.
- **Data:** `src/data/calculatorLessons.ts` (TI‑84 + Desmos lessons).
- **Status:** ✅ Shipped.

### 3.11 Cheatsheets (per subject)
- **Purpose:** Quick‑reference for English / Math / Reading / Science.
- **Components:** `pages/Cheatsheets/{English,Math,Reading,Science}.tsx`.
- **Status:** ✅ Shipped. Static content.

### 3.12 Weak Areas
- **Purpose:** Auto‑detect skills below mastery thresholds and surface them.
- **Logic:** `src/lib/weakAreas.ts` + `src/lib/chooseWeakSkills.ts`. Thresholds: Critical <60%, High 60–74%, Medium 75–89%.
- **Components:** `WeakAreas.tsx`, `WeakAreasCard.tsx`.
- **Tables:** `mastery`, `skills`.
- **Status:** ✅ Shipped.

### 3.13 Mastery Tracking
- **Purpose:** 5‑level skill mastery (Mastered / Proficient / Learning / Beginner / Not Started).
- **Logic:** `src/lib/mastery.ts`. Auto‑updated by DB trigger `update_mastery_on_response()`.
- **Components:** `MasteryBadge.tsx`, `MasteryDashboard.tsx`, `MasteryProgressBar.tsx`.
- **Tables:** `mastery` (user_id, skill_id, total, correct, avg_time_ms, last_updated).
- **Status:** ✅ Shipped. 120 skills tracked in aggregate dashboard mastery progress.

### 3.14 Spaced Repetition Review
- **Components:** `ReviewSpaced.tsx`, `lib/spacedRepetition.ts`.
- **Tables:** `review_queue` (next_review_at, interval_days, ease).
- **Status:** ✅ Shipped.

### 3.15 Error Bank / Missed Questions Review
- **Components:** `ReviewMissed.tsx`.
- **Tables:** `error_bank` (user_id, question_id [staging_id text], miss_count, last_missed_at).
- **Function:** `increment_error_bank()` atomic RPC.
- **Status:** ✅ Shipped.

### 3.16 AI Tutor
- **Purpose:** In‑context chat tutor that knows the current question/skill/section.
- **Components:** `tutor/TutorPanel.tsx`, `TutorMessage.tsx`, `TutorTrigger.tsx`, `TutorContextDisplay.tsx`, `hooks/useTutor.tsx`.
- **Tables:** `tutor_sessions`, `tutor_messages`.
- **Function:** `tutor-chat` (Lovable AI Gateway, Gemini default).
- **Guardrail:** Server never returns the answer letter for the active question.
- **Status:** ✅ Shipped.

### 3.17 Parent Portal
- **Purpose:** Read‑only progress + parent‑issued rewards.
- **Components:** `ParentPortal.tsx`, `ParentBanner.tsx`.
- **Tables:** `parents`, `parent_links`, `rewards_rules`, `rewards_ledger`.
- **Status:** ✅ Shipped.

### 3.18 Streak / Achievements
- **Components:** `StreakCounter.tsx`, `LiveStreakCounter.tsx`, `AchievementBadges.tsx`, `hooks/useStreak.ts`, `useAchievements.ts`.
- **Status:** ✅ Shipped.

### 3.19 Analytics
- **Components:** `Analytics.tsx`, recharts.
- **Tables:** `responses`, `attempts`, `mastery`, `sim_results`.
- **Status:** ✅ Shipped.

### 3.20 Subscriptions & Payments
- **Components:** `Pricing.tsx`, `SubscriptionSuccess.tsx`, `hooks/useSubscription.ts`.
- **Tables:** `subscriptions`, `stripe_webhook_events`.
- **Functions:** `create-checkout`, `check-subscription`, `customer-portal`, `stripe-webhook`.
- **Plans:** Monthly $39 (7‑day free trial), 90‑day $89 one‑time, 12‑month $199 one‑time.
- **Status:** ✅ Shipped (Stripe live).

### 3.21 Lead Capture
- **Purpose:** Public funnel for waitlist / beta interest.
- **Function:** `capture-lead` (no auth).
- **Table:** `leads` (hashed IP via `LEAD_IP_SALT`).
- **Status:** ✅ Shipped.

### 3.22 Admin Tools
- `AdminImport.tsx` — bulk question import from CSV/TSV → `staging_items`.
- `AdminLessonImport.tsx` → `lesson_content`.
- `AdminSkillCodes.tsx` — skills taxonomy.
- `AdminQuestionGenerator.tsx` — AI question generation targeted at a form.
- `AdminSimulationGenerator.tsx` — generate full Enhanced ACT simulations (50/45/36/40).
- **Functions:** `import-questions`, `import-lesson-content`, `generate-questions`.
- **Status:** ✅ Shipped.

### 3.23 Health & Monitoring
- `/health` page + `health` edge function (no JWT). Integration tests in `supabase/functions/health/integration.test.ts`.
- **Status:** ✅ Shipped.

---

## 4. User Experience Flows

### 4.1 Signup → First Drill
1. Landing `/` → "Get Started" → `/login` (sign up).
2. `handle_new_user()` trigger seeds `profiles`.
3. Redirect → `/onboarding` (7 steps): test date, target score, baseline, accommodations, ADHD prefs, parent email, digital/paper.
4. Optional Quick Diagnostic (`ONB_*` form).
5. `/pricing` if no subscription → Stripe Checkout (7‑day trial on monthly).
6. `/dashboard` → today's `study_plan_day` rendered as task cards.
7. Click first task → `/task/:date/:idx` → `TaskLauncher` routes to drill/quiz/lesson.

### 4.2 Daily Learning Loop
Dashboard widget shows today's tasks → `complete-task` writes results → `update_mastery_on_response()` trigger updates `mastery` → weak‑area card refreshes → streak counter ticks → tomorrow's plan auto‑regenerates via `cron-daily`.

### 4.3 Simulation Flow
`/simulation` → `SimulationStartDialog` (pick form + section, mode Timed vs Coached) → `session-start` (pins questions in `session_questions`, calcs server `started_at`) → `session-fetch` (no answer keys) → questions presented, calculator gated to Math only → answers POSTed to `submit-response` → on completion `session-finish` grades server‑side, writes `sim_results` and `attempts`, redirects to `/simulation-results`.

### 4.4 Subscription Flow
`/pricing` → `create-checkout` mints Stripe Checkout Session → Stripe → webhook (`stripe-webhook`) writes `subscriptions` row idempotently (7‑day event dedupe via `stripe_webhook_events`) → `/subscription-success` calls `check-subscription` → redirect to `/dashboard`.

### 4.5 Admin Content Pipeline
`/admin-import` → CSV upload → `import-questions` validates and writes to `staging_items` → admin promotes to `questions` + maps into `forms`/`form_questions` via `AdminSimulationGenerator`.

### 4.6 Parent Flow
Parent signs up separately → links to student via `parent_links` → `/parent-portal` shows aggregate mastery, last tasks, rewards balance → parent can mint rewards from `rewards_rules`.

---

## 5. Learning Engine Documentation

### 5.1 ACT Skill System
- **Subjects:** English, Math, Reading, Science (mapped from short codes `EN`, `MATH`, `RD`, `SCI` in `src/lib/sectionMapping.ts`).
- **Skills table:** 120 distinct skill rows, each with `name`, `subject`, `cluster`, `order_index`, `prereq_skill_ids[]`.
- **Clusters** group related skills (e.g., English → Punctuation, Sentence Structure, Rhetorical Skills).

### 5.2 Mastery Calculation (`src/lib/mastery.ts` + DB trigger)
Per (user, skill): `correct / total` → level:
- ≥0.90 with ≥10 attempts → **Mastered**
- ≥0.75 → **Proficient**
- ≥0.60 → **Learning**
- ≥0.40 → **Beginner**
- else → **Not Started**

DB trigger `update_mastery_on_response()` runs on every `responses` insert and updates running totals + avg_time_ms.

### 5.3 Adaptive / Weakness Detection (`src/lib/chooseWeakSkills.ts`)
Returns top weak skills weighted by (mastery deficit) × (recency of miss) × (subject test‑weight). Used by study plan generator and Weak Areas page.

### 5.4 Study Plan Algorithm (`generate-study-plan/index.ts`)
- Inputs: user profile, days‑to‑test, mastery snapshot, accommodations, ADHD prefs, last 7 days of `study_plan_days`.
- Round‑robin across 4 subjects.
- Max 2 tasks per subject per day.
- Inserts at least one REVIEW or FLASH every other day if `error_bank` has entries.
- Schedules one full SIM every 10–14 days, more often as test approaches.
- Calls Lovable AI Gateway (Gemini) for narrative `content_hint`.
- Writes single row to `study_plan_days` (`tasks_json` JSONB).

### 5.5 Scoring Logic
- **Question grading:** server‑side in `submit-response` / `session-finish`. Client never sees answer key.
- **Simulation scaled scores:** `src/utils/scoring.ts` maps raw correct → 1–36 scale per section, then averages.
- **Diagnostic scoring integrity:** answer choices are shuffled per user via seeded Fisher‑Yates, and de‑shuffled server‑side before grading.

### 5.6 Question Selection Rules
- Drill: pull from `form_questions` filtered by skill, exclude questions already in current `session_questions`.
- Simulation: full form, fixed order (`form_questions.ord`).
- Review Missed: pull from `error_bank` ordered by `miss_count desc, last_missed_at asc`.
- Spaced Review: pull from `review_queue` where `next_review_at <= now()`.

### 5.7 Spaced Repetition (`src/lib/spacedRepetition.ts`)
SM‑2 inspired: correct → interval *= ease (default 2.5); incorrect → reset to 1 day, ease −= 0.2 (min 1.3).

### 5.8 Simulation Scheduling
Driven by study plan algorithm; cadence scales with `days_to_test` (from `days-left` function).

---

## 6. Content Architecture

| Layer | Table | Notes |
|---|---|---|
| Subjects | hardcoded enum (EN/MATH/RD/SCI) | Section standardization in `src/lib/sectionMapping.ts` |
| Skills | `skills` | 120 rows, clustered, ordered, prereqs |
| Forms | `forms` (`FA_*` simulations, `D2_*` diagnostics, `DR_*` drills, `ONB_*` onboarding) | `is_active` flag |
| Form questions | `form_questions` (form_id, section, ord, question_id, passage_id) | Defines test order |
| Questions | `questions` (20 cols incl. choice_a–e, calculator_allowed, underlined_text, line_numbers_enabled, passage_format) | UUID PK |
| Staging | `staging_items` (24 cols) | Raw import buffer with numeric `staging_id`; `error_bank` references this id |
| Passages | `passages` (12 cols incl. chart_image_url) | Reading + Science |
| Lessons | `lesson_content` (24 cols) | Linked to `skills` via `skill_code` |
| Difficulty | `questions.difficulty` | (easy/medium/hard) |

**Hybrid Question ID architecture:** the app supports both numeric `staging_id` (legacy/import path, used by `error_bank`) and UUID (`questions.id`). Both must be validated in edge functions.

**English passage rendering** is two‑column with alternating answer choices and inline superscript markers `[N]` (see `EnglishPassageLayout.tsx`).

---

## 7. Technical Architecture

| Layer | Stack |
|---|---|
| Frontend | React 18, TypeScript 5 (strict), Vite 5, Tailwind CSS v3, shadcn/ui, Radix UI |
| State / data | TanStack Query (3 retries, 5min stale, no refetch on focus) |
| Routing | React Router v6 with lazy loading via `LazyComponents.tsx` |
| Charts | Recharts |
| Forms | React Hook Form + Zod |
| Sanitization | DOMPurify (`src/lib/sanitize.ts`) |
| Backend | Supabase (Postgres + Auth + Edge Functions + Storage) |
| Edge runtime | Deno (21 functions, 6,071 LOC) |
| AI | Lovable AI Gateway (Gemini default) for tutor + question generation + study plan narratives |
| Payments | Stripe (Checkout + Billing Portal + Webhooks) |
| Storage | `question-images` bucket (public read) |
| Offline | IndexedDB queue (`src/lib/offline-persistence`) for network drops |
| Auth | Supabase email/password (JWT); auth header forwarded into all edge functions to preserve RLS |
| Deployment | Lovable hosting (Vite build); custom domain `getpreppit.com` |
| Package manager | **npm only** (strict — no yarn/pnpm/bun) |

### Environment Variables / Secrets
Client (.env, public): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`.
Edge functions (Supabase secrets): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_90_DAY`, `STRIPE_PRICE_12_MONTH`, `LOVABLE_API_KEY`, `CRON_SECRET`, `LEAD_IP_SALT`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`. All validated via `_shared/env.ts` `requireEnv()` (fail‑fast).

---

## 8. Database Documentation

38 tables in `public`. Full column listing available via `information_schema`; the table below summarizes purpose and key columns.

| Table | Cols | Purpose | Key columns |
|---|---:|---|---|
| profiles | 19 | User profile + prefs | id (FK auth.users), first_name, last_name, test_date, target_score, digital_format, font_size |
| user_roles | 3 | Roles (anti‑recursion via has_role) | user_id, role (app_role enum) |
| accommodations | 6 | Extended time | user_id, time_multiplier |
| user_preferences | 10 | Study prefs / ADHD toggles | user_id, run_style, two_pass_enabled |
| user_goals | 5 | Target score, target date | user_id, target_score |
| skills | 9 | Taxonomy (120 rows) | id, name, subject, cluster, prereq_skill_ids |
| forms | 4 | Test forms | id (FA_/DR_/D2_/ONB_), label, is_active |
| form_questions | 5 | Ordered questions per form | form_id, section, ord, question_id |
| questions | 20 | Question bank | id (uuid), stem, choice_a–e, answer, skill_code, calculator_allowed |
| passages | 12 | Reading / Science | id, title, body_html, chart_image_url |
| staging_items | 24 | Raw import buffer | staging_id (numeric), all question fields |
| lesson_content | 24 | Lessons | skill_code, overview_html, concept_explanation, guided_practice_* |
| sessions | 10 | A practice session | id, user_id, type, started_at, finished_at |
| session_questions | 4 | Anti‑scrape pin | session_id, question_id, ord |
| attempts | 11 | One attempt per question | session_id, question_id, choice_order, selected_idx, correct_idx |
| responses | 7 | Final response | session_id, question_id, correct, time_ms |
| mastery | 6 | Per skill totals | user_id, skill_id, total, correct, avg_time_ms |
| progress | 7 | Alt progress | user_id, skill_id |
| error_bank | 4 | Missed questions | user_id, question_id (text/staging), miss_count |
| review_queue | 7 | Spaced rep | user_id, question_id, next_review_at, interval_days, ease |
| study_plan_days | 5 | Daily plan | user_id, the_date, tasks_json |
| study_tasks | 14 | Task instance | user_id, type, skill_id, the_date, status, accuracy |
| diagnostics | 10 | Diagnostic results | user_id, section, responses (jsonb), score |
| sim_results | 8 | Simulation final | user_id, form_id, raw_*, scale_* |
| calculator_practice | 8 | Cal Lab | user_id, lesson_id, time_saved_ms |
| tutor_sessions | 7 | AI tutor chat | user_id, context_type, context_id |
| tutor_messages | 5 | Tutor msgs | session_id, role, content |
| parents | 3 | Parent accounts | id, email |
| parent_links | 2 | Parent↔student | parent_id, student_id |
| rewards_rules | 6 | Parent reward catalog | parent_id, points_required, label |
| rewards_ledger | 6 | Reward txns | student_id, parent_id, delta, reason |
| subscriptions | 11 | Stripe sub state | user_id, status, plan, current_period_end, trial_end |
| stripe_webhook_events | 2 | 7‑day idempotency | event_id, received_at |
| leads | 14 | Lead capture | email, role, utm_*, ip_hash |
| rate_limits | 3 | Rolling window | key, count, window_start |
| test_packages, test_package_sections | 3/6 | Form bundles | id, label |
| _orphan_cleanup_log | 4 | Janitor audit | table_name, orphan_count |

### RLS Policies (high level)
All user‑data tables enable RLS. Standard policy shape: `auth.uid() = user_id`. Service role bypasses. Admin reads go through `is_admin()` SECURITY DEFINER. `user_roles` is auth‑only (no anon grant) and accessed via `has_role()`.

### Triggers
- `handle_new_user()` — seeds `profiles` from `auth.users`.
- `update_mastery_on_response()` — running mastery on each `responses` insert.
- `update_updated_at_column()` — generic timestamp.
- `check_sim_results_daily_limit()` — hard cap 500 sim_results / user / day.

### Key Functions
- `has_role(user_id, role)` — anti‑recursion role check.
- `is_admin()` — convenience.
- `increment_error_bank(user_id, question_id)` — atomic upsert.
- `check_rate_limit(key, limit, window_ms)` — rolling window limiter.
- `cleanup_old_webhook_events()` — janitor (7‑day Stripe event TTL).

---

## 9. Edge Functions / API Documentation

21 functions, 6,071 LOC total. JWT verification per `supabase/config.toml`.

| Function | LOC | JWT | Purpose | Inputs | Outputs | Tables | Deps |
|---|---:|---|---|---|---|---|---|
| `health` | 23 | ❌ | Liveness + integration check | – | `{status, checks}` | – | – |
| `capture-lead` | 143 | ❌ | Public funnel intake | email, role, utm | `{ok}` | leads | LEAD_IP_SALT |
| `create-checkout` | 136 | ✅ | Mint Stripe Checkout | `{plan}` | `{url}` | – | STRIPE_SECRET_KEY, STRIPE_PRICE_* |
| `check-subscription` | 170 | ✅ | Refresh sub state | – | `{subscribed, plan, period_end}` | subscriptions | Stripe |
| `customer-portal` | 84 | ✅ | Billing portal link | – | `{url}` | – | Stripe |
| `stripe-webhook` | 205 | ❌ | Handle Stripe events idempotently | raw body | 200 | subscriptions, stripe_webhook_events | STRIPE_WEBHOOK_SECRET |
| `tutor-chat` | 360 | ✅ | AI tutor (no answers leaked) | `{messages, context}` | streamed text | tutor_sessions, tutor_messages | LOVABLE_API_KEY |
| `generate-study-plan` | 1046 | ✅ | Build daily plan | `{user_id?, date?}` | `{tasks_json}` | study_plan_days, mastery, error_bank | LOVABLE_API_KEY |
| `generate-questions` | 1018 | ✅ | AI question generation | `{skill, count, form_id}` | `{inserted}` | staging_items, questions, form_questions | LOVABLE_API_KEY |
| `cron-daily` | 220 | ❌ (CRON_SECRET header) | Daily plan regen + cleanup | – | `{ok}` | study_plan_days | service role |
| `days-left` | 117 | ✅ | Days to test date | – | `{days_left}` | profiles | – |
| `set-test-date` | 172 | ✅ | Onboarding test date | `{date}` | `{ok}` | profiles | – |
| `set-baseline` | 148 | ✅ | Onboarding baseline | `{section, score}` | `{ok}` | profiles | – |
| `complete-task` | 257 | ✅ | Finalize a task | `{task_id, results}` | `{ok}` | study_tasks, mastery, error_bank | – |
| `finish-diagnostic` | 356 | ✅ | Grade diagnostic | `{form_id, responses}` | `{score, weak_skills}` | diagnostics, mastery | – |
| `session-start` | 207 | ✅ | Start session, pin questions | `{form_id, section, mode}` | `{session_id}` | sessions, session_questions | – |
| `session-fetch` | 310 | ✅ | Fetch pinned questions (no answers) | `{session_id}` | `{questions[]}` | sessions, session_questions, questions | – |
| `submit-response` | 208 | ✅ | Save one response server‑side | `{session_id, question_id, selected}` | `{correct?}` | responses, attempts, error_bank | – |
| `session-finish` | 251 | ✅ | Grade + write results | `{session_id}` | `{score, scaled}` | sessions, responses, sim_results, attempts | – |
| `import-questions` | 355 | ✅ (admin) | CSV → staging | CSV body | `{rows}` | staging_items, questions, form_questions | – |
| `import-lesson-content` | 285 | ✅ (admin) | Import lesson HTML | JSON body | `{rows}` | lesson_content | – |

**Common standards** (`_shared/env.ts`, `_shared/cors.ts`, `_shared/rateLimit.ts`):
- 100 KB request body cap.
- Per‑function rate limits via `check_rate_limit` RPC.
- All errors logged through `safeError` (no PII).
- All log lines go through `safeLog` (sanitize emails, tokens, bodies).
- `Authorization` header forwarded so RLS sees `auth.uid()`.

---

## 10. Subscription & Business Model

| Plan | Price | Billing | Trial | Stripe secret |
|---|---|---|---|---|
| Monthly | **$39/mo** | Recurring | **7‑day free trial** | `STRIPE_PRICE_MONTHLY` |
| 90‑Day Pass | **$89** | One‑time | – (Save $28 vs 3 mo) | `STRIPE_PRICE_90_DAY` |
| 12‑Month Pass | **$199** | One‑time | – (Save $269 vs 12 mo) | `STRIPE_PRICE_12_MONTH` |

### Free vs Paid
- **Free / unauth:** landing, pricing, lead capture, login.
- **Free authenticated:** dashboard, onboarding, quick diagnostic, analytics.
- **Paid only:** simulations, full study plan tasks, lessons, drills, quizzes, weak areas, calculator lab, pacing lab, cheatsheets, review queues.
- **Admins:** bypass via `RequireSubscription`.

### Trial Logic
Monthly only. `subscriptions.trial_end` populated by Stripe; client checks `status in (trialing, active)`. Cancellation in‑app via `customer-portal` → Stripe Billing Portal.

### Payment Flow
`/pricing` → `create-checkout` → Stripe Checkout → success URL `/subscription-success` → `check-subscription` polled → `/dashboard`. Webhook (`stripe-webhook`) is source of truth, idempotent for 7 days via `stripe_webhook_events`.

### Refund Policy
7‑day trial on monthly; one‑time passes refundable per Stripe policy within the documented window (see Terms).

### Daily Caps
- 15 sim sessions/user/day (app‑level).
- 500 sim_results/user/day (DB trigger hard cap).

---

## 11. Admin System

| Surface | Path | Capability |
|---|---|---|
| Question Import | `/admin-import` | CSV/TSV bulk import → `staging_items` |
| Lesson Import | `/admin-lesson-import` | Upload structured lessons → `lesson_content` |
| Skill Codes | `/admin/skill-codes` | View / edit skills taxonomy |
| Question Generator | `/admin/generate-questions` | AI gen targeted at a form |
| Simulation Generator | `/admin/generate-simulation` | Auto‑build 50/45/36/40 sim |
| Cron Trigger | Embedded `AdminCronButton` | Manually run `cron-daily` |

Admin gating: `ProtectedAdminRoute.tsx` → `useIsAdmin()` → `has_role(auth.uid(), 'admin')`. RLS on admin‑only tables also enforces `is_admin()`.

User management is currently performed in the Supabase dashboard (no in‑app user CRUD). Analytics are aggregate (`/analytics`) — no admin per‑user drilldown yet.

---

## 12. Security & Scalability

### Authentication
Supabase email/password JWT. Auth header forwarded to all edge functions. No MFA yet.

### Authorization
- RLS on every user‑data table (`auth.uid() = user_id`).
- Roles in separate table (`user_roles`) — no role columns on `profiles`.
- `service_role_key` only inside edge functions; never reaches client.

### Data Protection
- DOMPurify on all user‑rendered HTML.
- `safeLog` / `safeError` sanitize logs (no emails, no bodies, no tokens).
- Answer keys never sent to client — pinned in `session_questions` and graded server‑side.
- Stripe webhook idempotency 7 days.
- `LEAD_IP_SALT` hashes lead IPs.

### Performance
- Lazy‑loaded routes (`LazyComponents.tsx`).
- TanStack Query caching (5 min stale).
- Atomic RPCs (`increment_error_bank`, `check_rate_limit`) avoid race conditions.
- Offline IndexedDB queue for spotty mobile.
- Server‑side `started_at` for timer integrity.
- `pg_cron` daily plan regen.

### Scaling Limitations
- Single Supabase project (no read replica).
- AI tutor + study plan generator both call Lovable AI Gateway — cost scales linearly with usage; rate limiting in place.
- Stripe price IDs hardcoded per environment — multi‑region/currency would need refactor.
- 1000‑row default Postgres response limit not yet paginated everywhere in admin views.
- No background queue (Inngest/Trigger) yet — all generation runs in‑request.

### Compliance
- GDPR/COPPA user data deletion endpoint planned (see memory).
- Terms + Privacy pages shipped.
- Cookie Consent banner.

---

## 13. Product Roadmap

### ✅ Currently Built
Everything in §3, including: auth, onboarding, quick + thorough diagnostics, study plan (cron + auto‑regen), lessons (3‑tab), drills (Sprint/Marathon/Pomodoro), quizzes, simulations (Timed + Coached + ADHD tools), pacing lab, calculator lab (TI‑84 + Desmos), cheatsheets, weak areas, mastery, spaced repetition, error bank, AI tutor, parent portal + rewards, streak/achievements, analytics, full Stripe billing with 7‑day trial, lead capture, admin import/generation/cron, health monitoring, offline persistence, log sanitization, answer pinning.

### 🟡 In Progress / Partial
- **Content coverage:** not all 120 skills have full `lesson_content` populated.
- **Admin user management:** read‑only — no in‑app CRUD.
- **Per‑user admin analytics drilldown:** aggregate only.
- **GDPR/COPPA deletion endpoint:** specified, not implemented.

### 🟢 Recommended Next
1. **Google OAuth + magic link signup** — reduce signup friction.
2. **Lesson content gap fill** — 120 skills × 24 columns.
3. **Admin per‑user drilldown + cohort analytics**.
4. **In‑app referral / sharing loop** (esp. parent‑to‑parent).
5. **Mobile PWA install prompt** + push notifications for daily streak.
6. **GDPR delete‑my‑data self‑serve flow**.
7. **Background job queue** for AI generation to free up edge function timeouts.

### 🔮 Future Versions
- White‑label / school‑district tenancy.
- SAT / PSAT / Digital SAT engine reusing the same architecture.
- AI proctor (camera + eye tracking) for simulation integrity.
- Marketplace for tutor‑authored cheatsheets and packs.
- Native iOS/Android wrappers with offline mode.
- Group / classroom mode with assignment dashboards.

---

## 14. Investor / Sale Summary

### What Has Been Built
A production‑grade, subscription SaaS for ACT prep. The flagship product is **Coach Mode** — the embedded "voice in your head" that nudges pacing, two‑pass strategy, and digital‑navigation moves *inside* live timed simulations until those behaviors become automatic. Coach Mode is wrapped in a complete learning engine: 21 edge functions, 38 Postgres tables, 40+ React pages, 120‑skill taxonomy, 119 published lessons (English 47, Math 46, Reading 16, Science 10) and a 15‑lesson **Calculator Hacks** library (TI‑84 + Desmos) used as the top‑of‑funnel hook. Full Enhanced‑ACT (50/45/36/40) simulation engine, AI tutor, AI study planner, AI question generator, Stripe billing live with 7‑day trial, parent portal with rewards ledger. Domain live at **getpreppit.com**.

### Technology Assets
- **Codebase:** ~40k LOC TypeScript (strict mode), 6,071 LOC Deno edge functions, fully typed Supabase schema.
- **Database:** 38 tables with RLS, triggers, security‑definer role functions, atomic RPCs, anti‑scrape question pinning.
- **AI integrations:** Lovable AI Gateway (Gemini) for tutor, study plan, and question generation — provider‑agnostic.
- **Content:** ACT skill taxonomy, ONB_/D2_/DR_/FA_ form library with passage support, growing lesson library.
- **Infrastructure:** Lovable hosting + Supabase + Stripe + custom domain + cron + offline queue + health monitoring.

### Intellectual Property
- **Coach Mode** — proprietary in‑session coaching engine (`TestCompanion` + `companionTips.ts`) with 50+ context‑aware nudge variants across pacing, two‑pass, digital navigation, and section‑specific tactics. Designed to *fade* as habits internalize. **This is the headline IP and the primary moat.**
- ADHD‑native test‑simulation UX (Bail+Bank, Chunk Timer, Two‑Pass, Miss‑Reason, Streak) integrated into a *real* timed sim — defensible UX patent‑adjacent.
- "Calculator Hacks" brand and 15‑lesson TI‑84/Desmos library (top‑of‑funnel hook).
- Server‑side answer pinning architecture (`session_questions` + de‑shuffle on grade) — anti‑scrape moat.
- AI study‑plan algorithm with subject round‑robin + ADHD pacing wrappers.
- Coached vs. Timed dual‑mode simulation engine — the chassis Coach Mode rides on.

### Market Opportunity
- **TAM:** ~1.4M US ACT test‑takers/year; ~$1.5B US test‑prep market; growing Digital ACT cohort (2025+) creates a re‑education event.
- **Pricing power:** $39/mo undercuts $200/hr tutoring and matches Magoosh/PrepScholar.
- **Defensible niche:** Coach Mode + ADHD‑native UX is unique in the market — no incumbent speaks to the student *while the timer is running*. ~15% of US teens have an ADHD diagnosis — a large underserved segment that incumbents ignore. Calculator Hacks library widens the funnel beyond that niche.

### Remaining Work Before Public Launch
- Complete `lesson_content` for all 120 skills (highest‑leverage gap).
- Ship GDPR / COPPA deletion endpoint.
- Add Google OAuth.
- Add admin per‑user drilldown + cohort retention reporting.
- Load test simulation engine to 1k concurrent.
- Marketing site polish + SEO content engine.

### Acquisition Readiness
- Clean Supabase tenancy (single project, easy migration).
- All secrets in Supabase (no leaked keys; documented `.env.example`).
- Stripe billing already live (revenue can transfer with account).
- Strict TypeScript + tests (Vitest + Playwright smoke) — short ramp for new engineers.
- Memory document + this spec serve as full onboarding for a new dev or buyer.

---

*End of document.*
