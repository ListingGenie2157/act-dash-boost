import { describe, it, expect } from 'vitest';
import { planSummaryText, type PlanSummaryRow } from './planSummary';

const base: PlanSummaryRow = {
  lessons_remaining: 114,
  days_until_test: 90,
  lessons_per_day: 1.3,
  lessons_that_fit: 114,
  lessons_left_out: 0,
  extra_minutes_per_day: 0,
  next_exam: null,
  daily_minutes: 45,
};

describe('planSummaryText', () => {
  it('reports pace when everything fits', () => {
    expect(planSummaryText(base)).toEqual({
      kind: 'fits',
      headline: '114 lessons to go · 90 days until your test · ~1.3 lessons/day · On track',
      detail: null,
    });
  });

  it('names the next practice test', () => {
    const t = planSummaryText({ ...base, next_exam: { form: 'FB', date: '2027-02-13' } });
    expect(t.detail).toBe('Form B practice test: Sat Feb 13');
  });

  it('explains what was left out and the extra minutes needed', () => {
    const t = planSummaryText({ ...base, lessons_that_fit: 80, lessons_left_out: 34, extra_minutes_per_day: 15 });
    expect(t.kind).toBe('short');
    expect(t.headline).toBe('At 45 min/day, 80 lessons fit before your test — 34 lower-priority lessons were left out. Add 15 min/day to cover them.');
  });

  it('asks for a test date when there is none', () => {
    expect(planSummaryText({ ...base, days_until_test: null })).toEqual({
      kind: 'no-date',
      headline: 'Set your test date to get a paced plan.',
      detail: null,
    });
  });
});
