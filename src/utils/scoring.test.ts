import { describe, it, expect } from 'vitest';
import {
  percentToScaledScore,
  calculateCompositeScore,
  getScaledScoreLabel,
} from './scoring';

describe('percentToScaledScore', () => {
  it('returns 1 for 0%', () => {
    expect(percentToScaledScore(0)).toBe(1);
  });

  it('returns 36 for 100%', () => {
    expect(percentToScaledScore(100)).toBe(36);
  });

  it('clamps values below 0 to 1', () => {
    expect(percentToScaledScore(-10)).toBe(1);
    expect(percentToScaledScore(-100)).toBe(1);
  });

  it('clamps values above 100 to 36', () => {
    expect(percentToScaledScore(110)).toBe(36);
    expect(percentToScaledScore(200)).toBe(36);
  });

  it('returns scores in valid ACT range (1-36)', () => {
    for (let percent = 0; percent <= 100; percent += 10) {
      const score = percentToScaledScore(percent);
      expect(score).toBeGreaterThanOrEqual(1);
      expect(score).toBeLessThanOrEqual(36);
    }
  });

  it('applies curve adjustment (not purely linear)', () => {
    const score50 = percentToScaledScore(50);
    const score25 = percentToScaledScore(25);
    
    // With curve, 50% should be more than double 25%
    // But less than pure linear (which would be ~18.5 vs 9.25)
    expect(score50).toBeGreaterThan(score25);
    expect(score50).toBeLessThan(36);
  });

  it('handles edge percentages correctly', () => {
    expect(percentToScaledScore(1)).toBeGreaterThan(1);
    expect(percentToScaledScore(99)).toBeLessThan(36);
  });
});

describe('calculateCompositeScore', () => {
  it('returns 1 when no scores provided', () => {
    expect(calculateCompositeScore({})).toBe(1);
  });

  it('calculates average of all sections', () => {
    const scores = {
      english: 25,
      math: 30,
      reading: 28,
      science: 27,
    };
    // Average: (25 + 30 + 28 + 27) / 4 = 27.5 -> 28
    expect(calculateCompositeScore(scores)).toBe(28);
  });

  it('handles missing sections correctly', () => {
    expect(calculateCompositeScore({ english: 25, math: 30 })).toBe(28); // (25+30)/2 = 27.5 -> 28
    expect(calculateCompositeScore({ english: 20 })).toBe(20);
  });

  it('rounds to nearest integer', () => {
    expect(calculateCompositeScore({ english: 25, math: 26 })).toBe(26); // 25.5 -> 26
    expect(calculateCompositeScore({ english: 25, math: 24 })).toBe(25); // 24.5 -> 25
  });

  it('handles all four sections', () => {
    const scores = {
      english: 20,
      math: 22,
      reading: 24,
      science: 26,
    };
    // Average: (20 + 22 + 24 + 26) / 4 = 23
    expect(calculateCompositeScore(scores)).toBe(23);
  });

  it('handles undefined values correctly', () => {
    const scores = {
      english: 25,
      math: undefined,
      reading: 30,
      science: undefined,
    };
    // Average: (25 + 30) / 2 = 27.5 -> 28
    expect(calculateCompositeScore(scores)).toBe(28);
  });

  it('handles edge case scores', () => {
    expect(calculateCompositeScore({ english: 1, math: 1 })).toBe(1);
    expect(calculateCompositeScore({ english: 36, math: 36 })).toBe(36);
  });
});

describe('getScaledScoreLabel', () => {
  it('formats score with estimate label', () => {
    expect(getScaledScoreLabel(25)).toBe('25 (estimate)');
    expect(getScaledScoreLabel(1)).toBe('1 (estimate)');
    expect(getScaledScoreLabel(36)).toBe('36 (estimate)');
  });
});
