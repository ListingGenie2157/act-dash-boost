import { describe, it, expect } from 'vitest';
import { percentToScaledScore, getScaledScoreLabel, calculateCompositeScore } from './scoring';

describe('percentToScaledScore', () => {
  it('returns 1 for 0%', () => {
    expect(percentToScaledScore(0)).toBe(1);
  });

  it('returns 36 for 100%', () => {
    expect(percentToScaledScore(100)).toBe(36);
  });

  it('returns scores within valid ACT range (1-36)', () => {
    for (let percent = 0; percent <= 100; percent += 5) {
      const score = percentToScaledScore(percent);
      expect(score).toBeGreaterThanOrEqual(1);
      expect(score).toBeLessThanOrEqual(36);
    }
  });

  it('clamps negative percentages to 1', () => {
    expect(percentToScaledScore(-10)).toBe(1);
    expect(percentToScaledScore(-100)).toBe(1);
  });

  it('clamps percentages over 100 to 36', () => {
    expect(percentToScaledScore(110)).toBe(36);
    expect(percentToScaledScore(200)).toBe(36);
  });

  it('returns reasonable mid-range scores', () => {
    const midScore = percentToScaledScore(50);
    expect(midScore).toBeGreaterThan(10);
    expect(midScore).toBeLessThan(30);
  });

  it('returns higher scores for higher percentages', () => {
    const low = percentToScaledScore(25);
    const mid = percentToScaledScore(50);
    const high = percentToScaledScore(75);
    
    expect(mid).toBeGreaterThan(low);
    expect(high).toBeGreaterThan(mid);
  });

  it('handles decimal percentages', () => {
    const score1 = percentToScaledScore(67.5);
    const score2 = percentToScaledScore(67.8);
    
    expect(score1).toBeGreaterThanOrEqual(1);
    expect(score1).toBeLessThanOrEqual(36);
    expect(score2).toBeGreaterThanOrEqual(1);
    expect(score2).toBeLessThanOrEqual(36);
  });
});

describe('getScaledScoreLabel', () => {
  it('returns score with estimate label', () => {
    expect(getScaledScoreLabel(25)).toBe('25 (estimate)');
    expect(getScaledScoreLabel(36)).toBe('36 (estimate)');
    expect(getScaledScoreLabel(1)).toBe('1 (estimate)');
  });
});

describe('calculateCompositeScore', () => {
  it('returns 1 for empty scores object', () => {
    expect(calculateCompositeScore({})).toBe(1);
  });

  it('calculates average of all four sections', () => {
    const result = calculateCompositeScore({
      english: 24,
      math: 26,
      reading: 22,
      science: 28
    });
    // (24 + 26 + 22 + 28) / 4 = 25
    expect(result).toBe(25);
  });

  it('calculates average with some sections missing', () => {
    const result = calculateCompositeScore({
      english: 20,
      math: 30
    });
    // (20 + 30) / 2 = 25
    expect(result).toBe(25);
  });

  it('handles single section score', () => {
    expect(calculateCompositeScore({ english: 28 })).toBe(28);
    expect(calculateCompositeScore({ math: 32 })).toBe(32);
    expect(calculateCompositeScore({ reading: 24 })).toBe(24);
    expect(calculateCompositeScore({ science: 30 })).toBe(30);
  });

  it('rounds to nearest integer', () => {
    const result = calculateCompositeScore({
      english: 25,
      math: 26,
      reading: 24
    });
    // (25 + 26 + 24) / 3 = 25
    expect(result).toBe(25);
  });

  it('handles rounding edge cases', () => {
    const result = calculateCompositeScore({
      english: 20,
      math: 21,
      reading: 21
    });
    // (20 + 21 + 21) / 3 = 20.67 -> rounds to 21
    expect(result).toBe(21);
  });

  it('handles perfect scores', () => {
    const result = calculateCompositeScore({
      english: 36,
      math: 36,
      reading: 36,
      science: 36
    });
    expect(result).toBe(36);
  });

  it('handles minimum scores', () => {
    const result = calculateCompositeScore({
      english: 1,
      math: 1,
      reading: 1,
      science: 1
    });
    expect(result).toBe(1);
  });

  it('ignores undefined values in calculation', () => {
    const result = calculateCompositeScore({
      english: 20,
      math: undefined,
      reading: 30,
      science: undefined
    });
    // (20 + 30) / 2 = 25
    expect(result).toBe(25);
  });
});
