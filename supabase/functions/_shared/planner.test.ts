import { describe, it, expect } from 'vitest';
import {
  buildPlan,
  classifyAnswer,
  currentEstimate,
  examDates,
  isStrength,
  rankLessons,
  worstBucket,
  type LessonInfo,
  type PlannerInput,
  type PlannedDay,
} from './planner';

const lessons: LessonInfo[] = [
  { skillId: 'E1.A', section: 'English', orderIndex: 1, bankQuestions: 10 },
  { skillId: 'E1.B', section: 'English', orderIndex: 2, bankQuestions: 10 },
  { skillId: 'M1.A', section: 'Math', orderIndex: 1, bankQuestions: 10 },
  { skillId: 'M1.B', section: 'Math', orderIndex: 2, bankQuestions: 10 },
  { skillId: 'R1.A', section: 'Reading', orderIndex: 1, bankQuestions: 10 },
  { skillId: 'R1.B', section: 'Reading', orderIndex: 2, bankQuestions: 10 },
  { skillId: 'S1.A', section: 'Science', orderIndex: 1, bankQuestions: 10 },
  { skillId: 'S1.B', section: 'Science', orderIndex: 2, bankQuestions: 10 },
];

function makeInput(overrides: Partial<PlannerInput> = {}): PlannerInput {
  return {
    today: '2026-12-01',
    testDate: null,
    targetScore: null,
    dailyMinutes: 30,
    timeMultiplier: 1,
    scienceRequired: true,
    simPreferredDow: null,
    sectionEstimates: {},
    lessons,
    completedSkillIds: [],
    mastery: {},
    diagnosticSkillStats: {},
    skillBuckets: {},
    dueReviewCount: 0,
    formQuestionCounts: { FA: 40, FB: 40, FC: 40 },
    ...overrides,
  };
}

const minutesOf = (day: PlannedDay) => day.tasks.reduce((sum, t) => sum + t.minutes, 0);
const learnSkills = (days: PlannedDay[]) => days.flatMap(d => d.tasks.filter(t => t.type === 'LEARN').map(t => t.skillId));

describe('currentEstimate', () => {
  it('maps a diagnostic percent to the 1–36 scale', () => {
    expect(currentEstimate({ score: 50, source: 'diagnostic' })).toBe(19);
  });
  it('uses a self-reported score as is', () => {
    expect(currentEstimate({ score: 27, source: 'self' })).toBe(27);
  });
  it('defaults to 18 with no data', () => {
    expect(currentEstimate(undefined)).toBe(18);
  });
});

describe('classifyAnswer / worstBucket', () => {
  it('classifies the four buckets against the target time', () => {
    expect(classifyAnswer({ correct: true, timeMs: 20000, targetMs: 30000 })).toBe('solid');
    expect(classifyAnswer({ correct: true, timeMs: 40000, targetMs: 30000 })).toBe('shaky');
    expect(classifyAnswer({ correct: false, timeMs: 20000, targetMs: 30000 })).toBe('careless');
    expect(classifyAnswer({ correct: false, timeMs: 40000, targetMs: 30000 })).toBe('gap');
  });
  it('treats a very fast wrong answer as a guess (gap) and unanswered as gap', () => {
    expect(classifyAnswer({ correct: false, timeMs: 5000, targetMs: 30000 })).toBe('gap');
    expect(classifyAnswer({ correct: null, timeMs: 0, targetMs: 30000 })).toBe('gap');
  });
  it('picks the worst bucket', () => {
    expect(worstBucket(['solid', 'careless', 'shaky'])).toBe('careless');
    expect(worstBucket(['solid', 'gap'])).toBe('gap');
    expect(worstBucket([])).toBeNull();
  });
});

describe('isStrength', () => {
  it('uses mastery accuracy over at least 5 answers', () => {
    expect(isStrength('E1.A', makeInput({ mastery: { 'E1.A': { correct: 9, total: 10 } } }))).toBe(true);
    expect(isStrength('E1.A', makeInput({ mastery: { 'E1.A': { correct: 4, total: 4 } } }))).toBe(false);
  });
  it('counts all-correct onboarding answers with at least 2 questions', () => {
    expect(isStrength('E1.A', makeInput({ diagnosticSkillStats: { 'E1.A': { correct: 2, total: 2 } } }))).toBe(true);
    expect(isStrength('E1.A', makeInput({ diagnosticSkillStats: { 'E1.A': { correct: 1, total: 1 } } }))).toBe(false);
  });
  it('lets a bucket override accuracy', () => {
    expect(isStrength('E1.A', makeInput({ skillBuckets: { 'E1.A': 'solid' } }))).toBe(true);
    expect(isStrength('E1.A', makeInput({
      skillBuckets: { 'E1.A': 'shaky' },
      mastery: { 'E1.A': { correct: 9, total: 10 } },
    }))).toBe(false);
  });
});

describe('rankLessons', () => {
  it('drops completed lessons and strengths', () => {
    const ranked = rankLessons(makeInput({
      completedSkillIds: ['E1.A'],
      mastery: { 'M1.A': { correct: 10, total: 10 } },
    })).map(l => l.skillId);
    expect(ranked).not.toContain('E1.A');
    expect(ranked).not.toContain('M1.A');
  });
  it('drops Science when it is not required', () => {
    const ranked = rankLessons(makeInput({ scienceRequired: false }));
    expect(ranked.some(l => l.section === 'Science')).toBe(false);
  });
  it('puts the section furthest below target first', () => {
    const ranked = rankLessons(makeInput({
      targetScore: 28,
      sectionEstimates: { Math: { score: 15, source: 'self' }, English: { score: 30, source: 'self' } },
    }));
    expect(ranked[0].section).toBe('Math');
  });
  it('without a target, ranks the weakest section first (target = average estimate + 4)', () => {
    const ranked = rankLessons(makeInput({
      sectionEstimates: {
        Math: { score: 18, source: 'self' },
        English: { score: 25, source: 'self' },
        Reading: { score: 30, source: 'self' },
        Science: { score: 25, source: 'self' },
      },
    }));
    expect(ranked[0].section).toBe('Math');
  });
  it('never schedules practice-test lessons (the plan has its own practice tests)', () => {
    const withTests: LessonInfo[] = [
      ...lessons,
      { skillId: 'E10.A', section: 'English', orderIndex: 90, bankQuestions: 10 },
      { skillId: 'M10.F', section: 'Math', orderIndex: 90, bankQuestions: 10 },
    ];
    const ranked = rankLessons(makeInput({ lessons: withTests })).map(l => l.skillId);
    expect(ranked).not.toContain('E10.A');
    expect(ranked).not.toContain('M10.F');
  });
  it('puts capstone and mixed-review lessons after every other lesson', () => {
    const withCapstones: LessonInfo[] = [
      { skillId: 'M10.H', section: 'Math', orderIndex: 0, bankQuestions: 10 },
      { skillId: 'E9.A', section: 'English', orderIndex: 0, bankQuestions: 10 },
      ...lessons,
    ];
    const ranked = rankLessons(makeInput({
      lessons: withCapstones,
      targetScore: 30,
      sectionEstimates: { Math: { score: 10, source: 'self' } },
    })).map(l => l.skillId);
    expect(ranked.slice(-2).sort()).toEqual(['E9.A', 'M10.H']);
  });
  it('keeps curriculum order on ties', () => {
    const ranked = rankLessons(makeInput()).filter(l => l.section === 'English').map(l => l.skillId);
    expect(ranked).toEqual(['E1.A', 'E1.B']);
  });
});

describe('examDates', () => {
  it('places Forms A, B, C on Saturdays 3, 2 and 1 weeks out', () => {
    expect(examDates(makeInput({ testDate: '2027-02-27' }))).toEqual([
      { form: 'FA', date: '2027-02-06' },
      { form: 'FB', date: '2027-02-13' },
      { form: 'FC', date: '2027-02-20' },
    ]);
  });
  it('skips forms with no questions, using the latest dates', () => {
    expect(examDates(makeInput({ testDate: '2027-02-27', formQuestionCounts: { FA: 40, FB: 0, FC: 40 } }))).toEqual([
      { form: 'FA', date: '2027-02-13' },
      { form: 'FC', date: '2027-02-20' },
    ]);
  });
  it('drops dates in the past', () => {
    expect(examDates(makeInput({ testDate: '2026-12-10' }))).toEqual([{ form: 'FA', date: '2026-12-05' }]);
  });
});

describe('buildPlan', () => {
  it('without a test date fills 7 learning days within daily minutes', () => {
    const { days, summary } = buildPlan(makeInput());
    expect(days).toHaveLength(7);
    days.forEach(d => {
      expect(d.kind).toBe('learning');
      expect(minutesOf(d)).toBeLessThanOrEqual(30);
    });
    expect(days[0].tasks.map(t => t.type)).toEqual(['LEARN', 'DRILL']);
    expect(days[0].tasks[1].skillId).toBe(days[0].tasks[0].skillId);
    expect(summary.daysUntilTest).toBeNull();
  });

  it('treats a past test date like no test date', () => {
    const { days, summary } = buildPlan(makeInput({ testDate: '2026-11-01' }));
    expect(days).toHaveLength(7);
    expect(summary.daysUntilTest).toBeNull();
  });

  it('schedules no lessons in the final week and only a warm-up the day before', () => {
    const { days } = buildPlan(makeInput({ testDate: '2026-12-05' }));
    expect(days.map(d => d.date)).toEqual(['2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04']);
    expect(learnSkills(days)).toHaveLength(0);
    const last = days[days.length - 1];
    expect(last.kind).toBe('warmup');
    expect(last.tasks.map(t => t.type)).toEqual(['WARMUP']);
  });

  it('never exceeds daily minutes and reports what was left out', () => {
    const { days, summary } = buildPlan(makeInput({ testDate: '2027-02-27', dailyMinutes: 15, timeMultiplier: 2 }));
    days.forEach(d => expect(minutesOf(d)).toBeLessThanOrEqual(15));
    expect(summary.lessonsLeftOut).toBeGreaterThan(0);
    expect(summary.extraMinutesPerDay).toBeGreaterThan(0);
    expect(summary.extraMinutesPerDay % 5).toBe(0);
  });

  it('skips the drill for a skill with fewer than 5 bank questions', () => {
    const thin = lessons.map(l => (l.skillId === 'E1.A' ? { ...l, bankQuestions: 3 } : l));
    const { days } = buildPlan(makeInput({ lessons: thin }));
    const tasks = days.flatMap(d => d.tasks);
    expect(tasks.some(t => t.type === 'LEARN' && t.skillId === 'E1.A')).toBe(true);
    expect(tasks.some(t => t.type === 'DRILL' && t.skillId === 'E1.A')).toBe(false);
  });

  it('starts each learning day with a review block when reviews are due', () => {
    const { days } = buildPlan(makeInput({ dueReviewCount: 25 }));
    days.forEach(d => {
      expect(d.tasks[0].type).toBe('REVIEW');
      expect(d.tasks[0].size).toBe(10);
    });
  });

  it('never puts more than 2 lessons from one section on a day', () => {
    const mathOnly: LessonInfo[] = Array.from({ length: 10 }, (_, i) => ({
      skillId: `M9.${i}`, section: 'Math' as const, orderIndex: i, bankQuestions: 10,
    }));
    const { days } = buildPlan(makeInput({ lessons: mathOnly, dailyMinutes: 120 }));
    days.forEach(d => expect(d.tasks.filter(t => t.type === 'LEARN').length).toBeLessThanOrEqual(2));
  });

  it('gives shaky and careless skills a drill but no lesson; a gap puts its subject first, in order', () => {
    const { days } = buildPlan(makeInput({
      dailyMinutes: 60,
      skillBuckets: { 'E1.A': 'shaky', 'M1.A': 'careless', 'R1.B': 'gap' },
    }));
    const tasks = days.flatMap(d => d.tasks);
    expect(learnSkills(days)).not.toContain('E1.A');
    expect(learnSkills(days)).not.toContain('M1.A');
    expect(tasks.some(t => t.type === 'DRILL' && t.skillId === 'E1.A')).toBe(true);
    expect(tasks.some(t => t.type === 'DRILL' && t.skillId === 'M1.A')).toBe(true);
    // Reading has the gap, so Reading goes first, but R1.A is taught before R1.B
    expect(learnSkills(days).slice(0, 2)).toEqual(['R1.A', 'R1.B']);
  });

  it('schedules capstone lessons after all other lessons', () => {
    const { days } = buildPlan(makeInput({
      lessons: [{ skillId: 'M10.H', section: 'Math', orderIndex: 0, bankQuestions: 10 }, ...lessons],
      targetScore: 30,
      sectionEstimates: { Math: { score: 10, source: 'self' } },
      dailyMinutes: 120,
    }));
    const order = learnSkills(days);
    expect(order).toContain('M10.H');
    expect(order[order.length - 1]).toBe('M10.H');
  });

  it('puts only the practice test on an exam day', () => {
    const { days } = buildPlan(makeInput({ today: '2027-02-02', testDate: '2027-02-27' }));
    const examDay = days.find(d => d.date === '2027-02-06');
    expect(examDay?.kind).toBe('exam');
    expect(examDay?.tasks).toEqual([{ type: 'SIM', skillId: 'FA', size: 4, minutes: 175 }]);
  });

  it('reports pace and next exam when everything fits', () => {
    const { summary } = buildPlan(makeInput({ testDate: '2027-02-27' }));
    expect(summary.lessonsRemaining).toBe(8);
    expect(summary.lessonsLeftOut).toBe(0);
    expect(summary.lessonsThatFit).toBe(8);
    expect(summary.extraMinutesPerDay).toBe(0);
    expect(summary.daysUntilTest).toBe(88);
    expect(summary.nextExam).toEqual({ form: 'FA', date: '2027-02-06' });
  });
});

describe('curriculum order', () => {
  const math: LessonInfo[] = [
    { skillId: 'M1.A', section: 'Math', orderIndex: 1, bankQuestions: 10 },
    { skillId: 'M1.B', section: 'Math', orderIndex: 2, bankQuestions: 10 },
    { skillId: 'M2.A', section: 'Math', orderIndex: 6, bankQuestions: 10 },
    { skillId: 'M3.A', section: 'Math', orderIndex: 10, bankQuestions: 10 },
  ];
  const english: LessonInfo[] = [
    { skillId: 'E1.A', section: 'English', orderIndex: 1, bankQuestions: 10 },
    { skillId: 'E2.D', section: 'English', orderIndex: 8, bankQuestions: 10 },
  ];
  const sectionOrder = (ids: Array<string | null>, all: LessonInfo[]) => {
    const info = new Map(all.map(l => [l.skillId, l]));
    const bySection: Record<string, number[]> = {};
    for (const id of ids) {
      const l = info.get(id!)!;
      (bySection[l.section] ??= []).push(l.orderIndex);
    }
    return bySection;
  };

  it('teaches earlier lessons of a subject first, even when a later one is the weakest', () => {
    // Algebra (M2.A) is a measured gap; the basics have no data yet
    const input = makeInput({ lessons: math, scienceRequired: false, skillBuckets: { 'M2.A': 'gap' } });
    expect(rankLessons(input).map(l => l.skillId)).toEqual(['M1.A', 'M1.B', 'M2.A', 'M3.A']);
  });

  it('keeps every subject in order across the whole plan', () => {
    const all = [...math, ...english];
    const input = makeInput({
      lessons: all, scienceRequired: false, dailyMinutes: 60,
      skillBuckets: { 'M3.A': 'gap', 'E2.D': 'gap' },
      sectionEstimates: { Math: { score: 15, source: 'self' }, English: { score: 25, source: 'self' } },
    });
    const { days } = buildPlan(input, 14);
    const order = sectionOrder(learnSkills(days), all);
    for (const list of Object.values(order)) expect(list).toEqual([...list].sort((a, b) => a - b));
    expect(learnSkills(days)).toHaveLength(all.length);
  });

  it('still skips lessons the student already knows', () => {
    const input = makeInput({ lessons: math, scienceRequired: false, completedSkillIds: ['M1.A'], skillBuckets: { 'M1.B': 'solid' } });
    expect(rankLessons(input).map(l => l.skillId)).toEqual(['M2.A', 'M3.A']);
  });

  it('weaker subjects still get more of the early slots', () => {
    const all = [...math, ...english];
    const input = makeInput({
      lessons: all, scienceRequired: false,
      sectionEstimates: { Math: { score: 14, source: 'self' }, English: { score: 30, source: 'self' } },
      targetScore: 30,
    });
    expect(rankLessons(input).slice(0, 4).map(l => l.section)).toEqual(['Math', 'Math', 'Math', 'Math']);
  });
});

describe('subject variety', () => {
  const many = (section: 'English' | 'Math' | 'Reading' | 'Science', prefix: string, n: number): LessonInfo[] =>
    Array.from({ length: n }, (_, i) => ({ skillId: `${prefix}${i + 1}.A`, section, orderIndex: i + 1, bankQuestions: 10 }));
  const all = [...many('Math', 'M', 30), ...many('English', 'E', 10), ...many('Reading', 'R', 10), ...many('Science', 'S', 10)];
  const info = new Map(all.map(l => [l.skillId, l.section]));
  // Math far behind: on need alone, every slot would go to Math
  const input = makeInput({
    lessons: all, dailyMinutes: 45,
    sectionEstimates: {
      Math: { score: 14, source: 'self' }, English: { score: 27, source: 'self' },
      Reading: { score: 27, source: 'self' }, Science: { score: 27, source: 'self' },
    },
  });
  const subjectsByDay = (days: PlannedDay[]) =>
    days.filter(d => d.kind === 'learning').map(d => new Set(d.tasks.filter(t => t.type === 'LEARN').map(t => info.get(t.skillId!))));

  it('teaches every subject at least once each week', () => {
    const { days } = buildPlan(input, 14);
    for (const week of [days.slice(0, 7), days.slice(7, 14)]) {
      const taught = new Set(subjectsByDay(week).flatMap(s => [...s]));
      expect([...taught].sort()).toEqual(['English', 'Math', 'Reading', 'Science']);
    }
  });

  it('never has two single-subject days in a row while other subjects are due', () => {
    const days = subjectsByDay(buildPlan(input, 7).days);
    for (let i = 1; i < days.length; i++) {
      expect(days[i - 1].size === 1 && days[i].size === 1).toBe(false);
    }
  });

  it('still gives the weakest subject most of the lessons', () => {
    const learn = buildPlan(input, 7).days.flatMap(d => d.tasks.filter(t => t.type === 'LEARN'));
    const math = learn.filter(t => info.get(t.skillId!) === 'Math').length;
    expect(math).toBeGreaterThan(learn.length / 2);
  });
});
