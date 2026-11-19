/**
 * Study planner: pure decisions only (no I/O, no imports) so it runs in Deno edge functions
 * and in vitest. See docs/superpowers/specs/2026-11-19-study-plan-generator-design.md.
 */

export type Section = 'English' | 'Math' | 'Reading' | 'Science';
export type FormPrefix = 'FA' | 'FB' | 'FC';

export interface LessonInfo { skillId: string; section: Section; orderIndex: number; bankQuestions: number }
export interface SkillStats { correct: number; total: number }
export type SkillBucket = 'solid' | 'shaky' | 'careless' | 'gap';

export interface PlannerInput {
  today: string;
  testDate: string | null;
  targetScore: number | null;
  dailyMinutes: number;
  timeMultiplier: number;
  scienceRequired: boolean;
  simPreferredDow: number | null;
  sectionEstimates: Partial<Record<Section, { score: number; source: 'diagnostic' | 'self' }>>;
  lessons: LessonInfo[];
  completedSkillIds: string[];
  mastery: Record<string, SkillStats>;
  diagnosticSkillStats: Record<string, SkillStats>;
  skillBuckets: Record<string, SkillBucket>;
  dueReviewCount: number;
  formQuestionCounts: Record<FormPrefix, number>;
}

export type PlanTaskType = 'LEARN' | 'DRILL' | 'REVIEW' | 'SIM' | 'WARMUP';
export interface PlannedTask { type: PlanTaskType; skillId: string | null; size: number; minutes: number }
export interface PlannedDay { date: string; kind: 'learning' | 'exam' | 'final' | 'warmup'; tasks: PlannedTask[] }
export interface PlanSummary {
  lessonsRemaining: number;
  daysUntilTest: number | null;
  lessonsPerDay: number;
  lessonsThatFit: number;
  lessonsLeftOut: number;
  extraMinutesPerDay: number;
  nextExam: { form: FormPrefix; date: string } | null;
}

export interface TimedAnswer { correct: boolean | null; timeMs: number; targetMs: number }

export const SECTION_TARGET_MS: Record<Section, number> = {
  English: 30000,
  Math: 60000,
  Reading: 45000,
  Science: 45000,
};

const MINUTES = { lesson: 12, drill: 8, review: 10, warmup: 15, sim: 175 };
const DRILL_SIZE = 5;
const REVIEW_MAX = 10;
const WARMUP_SIZE = 10;
const MIN_BANK_FOR_DRILL = 5;
const MAX_LESSONS_PER_SECTION_PER_DAY = 2;
const FINAL_WEEK_DAYS = 6;
const EXAM_OFFSETS = [21, 14, 7];
const FORMS: FormPrefix[] = ['FA', 'FB', 'FC'];
const MAX_DAILY_MINUTES = 240;

// ── dates (YYYY-MM-DD, UTC) ────────────────────────────────────────────────
const DAY_MS = 86400000;
const toMs = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
const toDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const addDays = (d: string, n: number) => toDate(toMs(d) + n * DAY_MS);
const daysBetween = (from: string, to: string) => Math.round((toMs(to) - toMs(from)) / DAY_MS);
const dow = (d: string) => new Date(toMs(d)).getUTCDay();

// ── estimates, buckets, strengths ──────────────────────────────────────────
export function currentEstimate(e: { score: number; source: 'diagnostic' | 'self' } | undefined): number {
  if (!e) return 18;
  if (e.source === 'self') return e.score;
  return Math.round(1 + (35 * e.score) / 100);
}

export function classifyAnswer(a: TimedAnswer): SkillBucket {
  if (a.correct === null) return 'gap';
  const fast = a.timeMs <= a.targetMs;
  if (a.correct) return fast ? 'solid' : 'shaky';
  if (a.timeMs < a.targetMs * 0.25) return 'gap'; // guess
  return fast ? 'careless' : 'gap';
}

const BUCKET_SEVERITY: Record<SkillBucket, number> = { solid: 0, shaky: 1, careless: 2, gap: 3 };

export function worstBucket(buckets: SkillBucket[]): SkillBucket | null {
  if (buckets.length === 0) return null;
  return buckets.reduce((worst, b) => (BUCKET_SEVERITY[b] > BUCKET_SEVERITY[worst] ? b : worst));
}

export function isStrength(skillId: string, input: PlannerInput): boolean {
  const bucket = input.skillBuckets[skillId];
  if (bucket) return bucket === 'solid';
  const m = input.mastery[skillId];
  if (m && m.total >= 5 && m.correct / m.total >= 0.9) return true;
  const d = input.diagnosticSkillStats[skillId];
  return !!d && d.total >= 2 && d.correct === d.total;
}

/** Accuracy proxy used for ranking (buckets override measured accuracy). */
function skillAccuracy(skillId: string, input: PlannerInput): number {
  const bucket = input.skillBuckets[skillId];
  if (bucket === 'gap') return 0;
  if (bucket === 'careless') return 0.25;
  if (bucket === 'shaky') return 0.75;
  const d = input.diagnosticSkillStats[skillId];
  if (d && d.total > 0) return d.correct / d.total;
  const m = input.mastery[skillId];
  if (m && m.total > 0) return m.correct / m.total;
  return 0.5;
}

/** No target given: aim 4 points above the average section estimate (a composite goal). */
function defaultTarget(input: PlannerInput): number {
  const sections: Section[] = input.scienceRequired ? ['English', 'Math', 'Reading', 'Science'] : ['English', 'Math', 'Reading'];
  const avg = sections.reduce((sum, s) => sum + currentEstimate(input.sectionEstimates[s]), 0) / sections.length;
  return Math.min(36, Math.round(avg) + 4);
}

function priority(lesson: LessonInfo, input: PlannerInput): number {
  const estimate = currentEstimate(input.sectionEstimates[lesson.section]);
  const target = input.targetScore ?? defaultTarget(input);
  const gap = Math.max(0, target - estimate);
  return (gap + 1) * (1.5 - skillAccuracy(lesson.skillId, input));
}

/** Full practice tests set up as lessons: never planned (the plan schedules its own practice tests). */
export const PRACTICE_TEST_LESSONS = new Set(['E10.A', 'E10.B', 'M10.F', 'M10.G']);
/** Capstones and mixed reviews: planned only after every other lesson. */
export const CAPSTONE_LESSONS = new Set(['E9.A', 'E9.B', 'E9.C', 'E10.C', 'M10.H']);

function eligible(input: PlannerInput): LessonInfo[] {
  const completed = new Set(input.completedSkillIds);
  return input.lessons.filter(l =>
    !PRACTICE_TEST_LESSONS.has(l.skillId) &&
    (input.scienceRequired || l.section !== 'Science') &&
    !completed.has(l.skillId) &&
    !isStrength(l.skillId, input)
  );
}

function byPriority(list: LessonInfo[], input: PlannerInput): LessonInfo[] {
  return list
    .map(l => ({ l, p: priority(l, input) }))
    .sort((a, b) =>
      Number(CAPSTONE_LESSONS.has(a.l.skillId)) - Number(CAPSTONE_LESSONS.has(b.l.skillId)) ||
      b.p - a.p || a.l.orderIndex - b.l.orderIndex || a.l.skillId.localeCompare(b.l.skillId))
    .map(x => x.l);
}

const isDrillOnly = (skillId: string, input: PlannerInput) =>
  input.skillBuckets[skillId] === 'shaky' || input.skillBuckets[skillId] === 'careless';

/** Lessons still to learn, highest priority first. */
export function rankLessons(input: PlannerInput): LessonInfo[] {
  return byPriority(eligible(input).filter(l => !isDrillOnly(l.skillId, input)), input);
}

/** Skills that need speed/accuracy drills only (shaky, careless), highest priority first. */
function rankDrillOnly(input: PlannerInput): LessonInfo[] {
  return byPriority(
    eligible(input).filter(l => isDrillOnly(l.skillId, input) && l.bankQuestions >= MIN_BANK_FOR_DRILL),
    input
  );
}

// ── calendar ───────────────────────────────────────────────────────────────
function activeTestDate(input: PlannerInput): string | null {
  return input.testDate && daysBetween(input.today, input.testDate) > 0 ? input.testDate : null;
}

export function examDates(input: PlannerInput): Array<{ form: FormPrefix; date: string }> {
  const test = activeTestDate(input);
  if (!test) return [];
  const preferred = input.simPreferredDow ?? 6;
  const dates = EXAM_OFFSETS
    .map(offset => {
      const base = addDays(test, -offset);
      return addDays(base, preferred - dow(base)); // snap to preferred weekday in that week (Sun-start)
    })
    .filter(d => d >= input.today && d < test);
  const unique = [...new Set(dates)].sort();
  const forms = FORMS.filter(f => (input.formQuestionCounts[f] ?? 0) > 0);
  const n = Math.min(forms.length, unique.length);
  const used = unique.slice(unique.length - n);
  return used.map((date, i) => ({ form: forms[i], date }));
}

// ── day filling ────────────────────────────────────────────────────────────
interface FillState { lessons: LessonInfo[]; drills: LessonInfo[] }

function fillLearningDay(
  date: string,
  state: FillState,
  input: PlannerInput,
  dailyMinutes: number,
  lessonTarget: number,
): PlannedDay {
  const mult = input.timeMultiplier || 1;
  const m = (k: keyof typeof MINUTES) => Math.round(MINUTES[k] * mult);
  const tasks: PlannedTask[] = [];
  let left = dailyMinutes;

  if (input.dueReviewCount > 0 && m('review') <= left) {
    tasks.push({ type: 'REVIEW', skillId: null, size: Math.min(input.dueReviewCount, REVIEW_MAX), minutes: m('review') });
    left -= m('review');
  }

  const perSection: Record<string, number> = {};
  let placed = 0;
  // Interleave by rank: lessons (up to the pace target) and drill-only skills.
  const queue = [...state.lessons.map(l => ({ l, kind: 'learn' as const })), ...state.drills.map(l => ({ l, kind: 'drill' as const }))]
    .map(x => ({ ...x, p: priority(x.l, input) }))
    .sort((a, b) =>
      Number(CAPSTONE_LESSONS.has(a.l.skillId)) - Number(CAPSTONE_LESSONS.has(b.l.skillId)) ||
      b.p - a.p || a.l.orderIndex - b.l.orderIndex);

  for (const item of queue) {
    if (item.kind === 'drill') {
      if (m('drill') > left) continue;
      tasks.push({ type: 'DRILL', skillId: item.l.skillId, size: DRILL_SIZE, minutes: m('drill') });
      left -= m('drill');
      state.drills = state.drills.filter(d => d !== item.l);
      continue;
    }
    if (placed >= lessonTarget) continue;
    if ((perSection[item.l.section] ?? 0) >= MAX_LESSONS_PER_SECTION_PER_DAY) continue;
    if (m('lesson') > left) continue;
    tasks.push({ type: 'LEARN', skillId: item.l.skillId, size: 1, minutes: m('lesson') });
    left -= m('lesson');
    if (item.l.bankQuestions >= MIN_BANK_FOR_DRILL && m('drill') <= left) {
      tasks.push({ type: 'DRILL', skillId: item.l.skillId, size: DRILL_SIZE, minutes: m('drill') });
      left -= m('drill');
    }
    perSection[item.l.section] = (perSection[item.l.section] ?? 0) + 1;
    placed++;
    state.lessons = state.lessons.filter(l => l !== item.l);
  }

  return { date, kind: 'learning', tasks };
}

function finalDay(date: string, input: PlannerInput, drillPool: LessonInfo[], dailyMinutes: number): PlannedDay {
  const mult = input.timeMultiplier || 1;
  const tasks: PlannedTask[] = [];
  let left = dailyMinutes;
  const reviewMin = Math.round(MINUTES.review * mult);
  if (input.dueReviewCount > 0 && reviewMin <= left) {
    tasks.push({ type: 'REVIEW', skillId: null, size: Math.min(input.dueReviewCount, REVIEW_MAX), minutes: reviewMin });
    left -= reviewMin;
  }
  const drillMin = Math.round(MINUTES.drill * mult);
  for (const l of drillPool) {
    if (drillMin > left) break;
    tasks.push({ type: 'DRILL', skillId: l.skillId, size: DRILL_SIZE, minutes: drillMin });
    left -= drillMin;
  }
  return { date, kind: 'final', tasks };
}

interface Simulation { days: PlannedDay[]; scheduledLessons: number; learningDays: number }

function simulate(input: PlannerInput, dailyMinutes: number, horizonDays: number): Simulation {
  const test = activeTestDate(input);
  const ranked = rankLessons(input);
  const state: FillState = { lessons: [...ranked], drills: rankDrillOnly(input) };
  const exams = new Map(examDates(input).map(e => [e.date, e.form]));
  const totalDays = test ? daysBetween(input.today, test) : horizonDays;

  const dates = Array.from({ length: totalDays }, (_, i) => addDays(input.today, i));
  const kindOf = (date: string): PlannedDay['kind'] => {
    if (exams.has(date)) return 'exam';
    if (!test) return 'learning';
    const left = daysBetween(date, test);
    if (left === 1) return 'warmup';
    if (left <= FINAL_WEEK_DAYS) return 'final';
    return 'learning';
  };
  const learningDays = dates.filter(d => kindOf(d) === 'learning').length;
  const finalDrillPool = [...rankDrillOnly(input), ...ranked].filter(l => l.bankQuestions >= MIN_BANK_FOR_DRILL);

  const days: PlannedDay[] = [];
  let scheduledLessons = 0;
  let learningLeft = learningDays;
  const mult = input.timeMultiplier || 1;

  for (const date of dates) {
    const kind = kindOf(date);
    if (kind === 'exam') {
      days.push({ date, kind, tasks: [{ type: 'SIM', skillId: exams.get(date)!, size: 4, minutes: Math.round(MINUTES.sim * mult) }] });
    } else if (kind === 'warmup') {
      days.push({ date, kind, tasks: [{ type: 'WARMUP', skillId: null, size: WARMUP_SIZE, minutes: Math.round(MINUTES.warmup * mult) }] });
    } else if (kind === 'final') {
      days.push(finalDay(date, input, finalDrillPool, dailyMinutes));
    } else {
      const target = test ? Math.ceil(state.lessons.length / Math.max(1, learningLeft)) : Number.POSITIVE_INFINITY;
      const before = state.lessons.length;
      days.push(fillLearningDay(date, state, input, dailyMinutes, target));
      scheduledLessons += before - state.lessons.length;
      learningLeft--;
    }
  }
  return { days, scheduledLessons, learningDays };
}

export function buildPlan(input: PlannerInput, horizonDays = 7): { days: PlannedDay[]; summary: PlanSummary } {
  const test = activeTestDate(input);
  const remaining = rankLessons(input).length;
  const sim = simulate(input, input.dailyMinutes, horizonDays);

  let lessonsThatFit = Math.min(remaining, sim.scheduledLessons);
  const lessonsLeftOut = test ? remaining - lessonsThatFit : 0;
  let extraMinutesPerDay = 0;
  if (lessonsLeftOut > 0) {
    for (let mins = input.dailyMinutes + 5; mins <= MAX_DAILY_MINUTES; mins += 5) {
      extraMinutesPerDay = mins - input.dailyMinutes;
      if (simulate(input, mins, horizonDays).scheduledLessons >= remaining) break;
    }
  }
  if (!test) lessonsThatFit = sim.scheduledLessons;

  const lessonsPerDay = test
    ? Math.round((lessonsThatFit / Math.max(1, sim.learningDays)) * 10) / 10
    : Math.round((sim.scheduledLessons / horizonDays) * 10) / 10;

  const nextExam = examDates(input)[0] ?? null;
  return {
    days: sim.days.slice(0, horizonDays),
    summary: {
      lessonsRemaining: remaining,
      daysUntilTest: test ? daysBetween(input.today, test) : null,
      lessonsPerDay,
      lessonsThatFit,
      lessonsLeftOut,
      extraMinutesPerDay,
      nextExam,
    },
  };
}
