import { describe, it, expect } from 'vitest';
import { pickDiagnosticQuestions, currentSitting, type PickableQuestion } from './diagnosticPicker';

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
});
