/** profiles.plan_summary as written by generate-study-plan */
export interface PlanSummaryRow {
  lessons_remaining: number;
  days_until_test: number | null;
  lessons_per_day: number;
  lessons_that_fit: number;
  lessons_left_out: number;
  extra_minutes_per_day: number;
  next_exam: { form: string; date: string } | null;
  daily_minutes: number;
  plan_through?: string;
}

export interface PlanSummaryText {
  kind: 'fits' | 'short' | 'no-date';
  headline: string;
  detail: string | null;
}

const FORM_LETTER: Record<string, string> = { FA: 'A', FB: 'B', FC: 'C' };

/** "Sat Feb 13" for a YYYY-MM-DD date (no timezone shift) */
function shortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const fmt = (opts: Intl.DateTimeFormatOptions) => date.toLocaleDateString('en-US', { timeZone: 'UTC', ...opts });
  return `${fmt({ weekday: 'short' })} ${fmt({ month: 'short' })} ${d}`;
}

export function planSummaryText(s: PlanSummaryRow): PlanSummaryText {
  if (s.days_until_test === null) {
    return { kind: 'no-date', headline: 'Set your test date to get a paced plan.', detail: null };
  }
  const detail = s.next_exam
    ? `Form ${FORM_LETTER[s.next_exam.form] ?? s.next_exam.form} practice test: ${shortDate(s.next_exam.date)}`
    : null;
  if (s.lessons_left_out > 0) {
    return {
      kind: 'short',
      headline: `At ${s.daily_minutes} min/day, ${s.lessons_that_fit} lessons fit before your test — ${s.lessons_left_out} lower-priority lessons were left out. Add ${s.extra_minutes_per_day} min/day to cover them.`,
      detail,
    };
  }
  return {
    kind: 'fits',
    headline: `${s.lessons_remaining} lessons to go · ${s.days_until_test} days until your test · ~${s.lessons_per_day} lessons/day · On track`,
    detail,
  };
}
