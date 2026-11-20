import { describe, it, expect } from 'vitest';
import { actFromPercent, sectionScoreOnActScale } from './actScore';

describe('actFromPercent', () => {
  it('maps percent correct onto a 1-36 ACT estimate', () => {
    expect(actFromPercent(0)).toBe(1);
    expect(actFromPercent(50)).toBe(19);
    expect(actFromPercent(75)).toBe(26);
    expect(actFromPercent(100)).toBe(36);
  });
  it('rises with percent correct and stays in range', () => {
    const scores = [0, 10, 33, 60, 85, 95, 100, 140].map(actFromPercent);
    expect([...scores].sort((a, b) => a - b)).toEqual(scores);
    expect(Math.min(...scores)).toBe(1);
    expect(Math.max(...scores)).toBe(36);
  });
});

describe('sectionScoreOnActScale', () => {
  it('converts diagnostic percentages and keeps self-reported ACT scores', () => {
    expect(sectionScoreOnActScale(50, 'diagnostic')).toBe(19);
    expect(sectionScoreOnActScale(25, 'self')).toBe(25);
    expect(sectionScoreOnActScale(null, 'diagnostic')).toBeNull();
  });
  it('ignores 0% diagnostic rows (old placeholders, not real attempts)', () => {
    expect(sectionScoreOnActScale(0, 'diagnostic')).toBeNull();
    expect(sectionScoreOnActScale(0, null)).toBeNull();
  });
});
