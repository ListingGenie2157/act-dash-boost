import { describe, it, expect } from 'vitest';
import { pickDiagnosticQuestions, pickQuickQuestions, currentSitting, QUICK_COUNTS, type PickableQuestion } from './diagnosticPicker';

const q = (id: number, skill: string, extra: Partial<PickableQuestion> = {}): PickableQuestion => ({
  question_id: String(id), skill_code: skill, ord: id, passage_id: null, passage_text: undefined, ...extra,
});
const seq = () => { let i = 0; return () => ((i++ * 0.37) % 1); }; // deterministic "random"

describe('pickDiagnosticQuestions', () => {
  it('takes 2 questions for every skill', () => {
    const pool = [q(1, 'A'), q(2, 'A'), q(3, 'A'), q(4, 'B'), q(5, 'B'), q(6, 'B'), q(7, 'C'), q(8, 'C')];
    const picked = pickDiagnosticQuestions(pool, new Set(), seq());
    const bySkill = picked.reduce<Record<string, number>>((m, x) => ({ ...m, [x.skill_code ?? '']: (m[x.skill_code ?? ''] ?? 0) + 1 }), {});
    expect(bySkill).toEqual({ A: 2, B: 2, C: 2 });
  });

  it('prefers questions the student has not answered before', () => {
    const pool = [q(1, 'A'), q(2, 'A'), q(3, 'A'), q(4, 'A')];
    const picked = pickDiagnosticQuestions(pool, new Set(['1', '2']), seq());
    expect(picked.map(x => x.question_id).sort()).toEqual(['3', '4']);
  });

  it('reuses answered questions only when a skill runs out of new ones', () => {
    const pool = [q(1, 'A'), q(2, 'A'), q(3, 'A')];
    const picked = pickDiagnosticQuestions(pool, new Set(['1', '2']), seq());
    expect(picked).toHaveLength(2);
    expect(picked.map(x => x.question_id)).toContain('3');
  });

  it('keeps questions on the same passage together and back to back', () => {
    const pool = [
      q(1, 'A', { passage_id: 'P1' }), q(2, 'B', { passage_id: 'P1' }), q(3, 'A', { passage_id: 'P1' }), q(4, 'B', { passage_id: 'P1' }),
      q(5, 'A'), q(6, 'B'), q(7, 'C', { passage_text: 'Same science text' }), q(8, 'C', { passage_text: 'Same science text' }),
    ];
    const picked = pickDiagnosticQuestions(pool, new Set(['5', '6']), seq());
    const ids = picked.map(x => x.question_id);
    // the passage group covers A and B twice, so the standalone (already seen) ones are not needed
    expect(ids.slice().sort()).toEqual(['1', '2', '3', '4', '7', '8']);
    // questions sharing a passage are adjacent
    const p1 = ids.map((id, i) => (['1', '2', '3', '4'].includes(id) ? i : -1)).filter(i => i >= 0);
    expect(p1[p1.length - 1] - p1[0]).toBe(3);
    expect(Math.abs(ids.indexOf('7') - ids.indexOf('8'))).toBe(1);
  });

  it('never takes more than 2 for a skill even from a passage group', () => {
    const pool = [q(1, 'A', { passage_id: 'P' }), q(2, 'A', { passage_id: 'P' }), q(3, 'A', { passage_id: 'P' })];
    expect(pickDiagnosticQuestions(pool, new Set(), seq())).toHaveLength(2);
  });
});

describe('currentSitting', () => {
  const at = (id: number, created: string) => ({ question_id: id, created_at: created });
  const skillOf = (id: string) => ({ '1': 'A', '2': 'A', '3': 'A', '5': 'A', '6': 'B' } as Record<string, string>)[id] ?? null;

  it('resumes the newest batch started after the last finished diagnostic', () => {
    const rows = [at(1, '2026-11-01T10:00:00Z'), at(2, '2026-11-01T10:00:00Z'), at(5, '2026-11-19T09:00:00Z'), at(6, '2026-11-19T09:00:00Z')];
    expect(currentSitting(rows, '2026-11-02T00:00:00Z', skillOf)).toEqual(['5', '6']);
  });

  it('starts fresh after the section was finished', () => {
    const rows = [at(5, '2026-11-19T09:00:00Z')];
    expect(currentSitting(rows, '2026-11-19T10:00:00Z', skillOf)).toBeNull();
  });

  it('ignores an old whole-form batch (more than 2 questions for a skill)', () => {
    const rows = [1, 2, 3, 6].map(id => at(id, '2026-11-19T09:00:00Z'));
    expect(currentSitting(rows, null, skillOf)).toBeNull();
  });

  it('with a limit of 1 per skill, rejects a batch that repeats a skill', () => {
    const rows = [1, 6].map(id => at(id, '2026-11-19T09:00:00Z'));
    expect(currentSitting(rows, null, skillOf, 1)).toEqual(['1', '6']);
    expect(currentSitting([...rows, at(2, '2026-11-19T09:00:00Z')], null, skillOf, 1)).toBeNull();
  });

  it('does not resume questions that are no longer in the pool', () => {
    expect(currentSitting([at(99, '2026-11-19T09:00:00Z')], null, skillOf)).toBeNull();
  });
});

describe('pickQuickQuestions', () => {
  const sec = (section: string, id: number, skill: string, extra: Partial<PickableQuestion> = {}) =>
    ({ ...q(id, skill, extra), section });

  it('takes the ACT-style count per section, one question per skill, sections in test order', () => {
    const pool = [
      ...Array.from({ length: 40 }, (_, i) => sec('Math', 100 + i, `M${i % 20}`)),
      ...Array.from({ length: 30 }, (_, i) => sec('English', 200 + i, `E${i % 15}`)),
      ...Array.from({ length: 20 }, (_, i) => sec('Reading', 300 + i, `R${i % 10}`)),
      ...Array.from({ length: 20 }, (_, i) => sec('Science', 400 + i, `S${i % 10}`)),
    ];
    const picked = pickQuickQuestions(pool, new Set(), seq());
    const count = (s: string) => picked.filter(x => x.section === s).length;
    expect([count('English'), count('Math'), count('Reading'), count('Science')])
      .toEqual([QUICK_COUNTS.English, QUICK_COUNTS.Math, QUICK_COUNTS.Reading, QUICK_COUNTS.Science]);
    expect(new Set(picked.map(x => x.skill_code)).size).toBe(picked.length);
    const order = [...new Set(picked.map(x => x.section))];
    expect(order).toEqual(['English', 'Math', 'Reading', 'Science']);
  });

  it('uses the rest of an opened passage for other skills, shown together', () => {
    const pool = [
      sec('Reading', 1, 'R1', { passage_id: 'P' }), sec('Reading', 2, 'R2', { passage_id: 'P' }), sec('Reading', 3, 'R1', { passage_id: 'P' }),
      sec('Reading', 4, 'R3'),
    ];
    const ids = pickQuickQuestions(pool, new Set(['4']), seq()).map(x => x.question_id);
    // one question per skill: R2, one of the two R1s, and R3
    expect(ids).toHaveLength(3);
    expect(ids).toContain('2');
    expect(ids).toContain('4');
    // the two passage questions sit next to each other
    const onPassage = ids.map((id, i) => (['1', '2', '3'].includes(id) ? i : -1)).filter(i => i >= 0);
    expect(onPassage[1] - onPassage[0]).toBe(1);
  });

  it('prefers questions not answered before', () => {
    const pool = [sec('Science', 1, 'S1'), sec('Science', 2, 'S1')];
    expect(pickQuickQuestions(pool, new Set(['1']), seq()).map(x => x.question_id)).toEqual(['2']);
  });
});
