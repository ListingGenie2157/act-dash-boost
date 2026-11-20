/**
 * diagnostics.score holds two units: a diagnostic stores PERCENT CORRECT (0-100), while a
 * self-reported score (source = 'self') is already on the ACT 1-36 scale.
 * Anything that needs a 1-36 score goes through sectionScoreOnActScale.
 */

// Rough percent-correct -> ACT scale curve (ACT section scales are not linear)
const CURVE: Array<[number, number]> = [[0, 1], [25, 13], [50, 19], [75, 26], [90, 31], [100, 36]];

export function actFromPercent(percent: number): number {
  const p = Math.min(100, Math.max(0, percent));
  for (let i = 1; i < CURVE.length; i++) {
    const [p0, s0] = CURVE[i - 1];
    const [p1, s1] = CURVE[i];
    if (p <= p1) return Math.round(s0 + ((p - p0) / (p1 - p0)) * (s1 - s0));
  }
  return 36;
}

export function sectionScoreOnActScale(score: number | string | null, source: string | null): number | null {
  if (score === null || score === '' || Number.isNaN(Number(score))) return null;
  const n = Number(score);
  if (source === 'self') return Math.min(36, Math.max(1, Math.round(n)));
  // A real diagnostic needs at least one answer (finish-diagnostic rejects empty ones), and guessing
  // alone scores ~25%; 0% rows are old placeholders, so they carry no estimate.
  return n > 0 ? actFromPercent(n) : null;
}
