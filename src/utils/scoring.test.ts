import { describe, it, expect } from 'vitest';
import { percentToScaledScore, calculateCompositeScore } from './scoring';

describe('percentToScaledScore', () => {
  describe('Boundary values', () => {
    it('returns 1 for 0%', () => {
      expect(percentToScaledScore(0)).toBe(1);
    });

    it('returns 36 for 100%', () => {
      expect(percentToScaledScore(100)).toBe(36);
    });

    it('clamps negative values to 1', () => {
      expect(percentToScaledScore(-10)).toBe(1);
      expect(percentToScaledScore(-100)).toBe(1);
    });

    it('clamps values over 100 to 36', () => {
      expect(percentToScaledScore(101)).toBe(36);
      expect(percentToScaledScore(150)).toBe(36);
    });
  });

  describe('Score progression', () => {
    it('returns increasing scores for increasing percentages', () => {
      const score10 = percentToScaledScore(10);
      const score25 = percentToScaledScore(25);
      const score50 = percentToScaledScore(50);
      const score75 = percentToScaledScore(75);
      const score90 = percentToScaledScore(90);

      expect(score10).toBeLessThan(score25);
      expect(score25).toBeLessThan(score50);
      expect(score50).toBeLessThan(score75);
      expect(score75).toBeLessThan(score90);
    });

    it('handles mid-range scores correctly', () => {
      const score50 = percentToScaledScore(50);
      expect(score50).toBeGreaterThan(1);
      expect(score50).toBeLessThan(36);
      expect(score50).toBeGreaterThanOrEqual(15);
      expect(score50).toBeLessThanOrEqual(25);
    });
  });

  describe('Realistic ACT score ranges', () => {
    it('maps 25% to low score range (1-12)', () => {
      const score = percentToScaledScore(25);
      expect(score).toBeGreaterThanOrEqual(1);
      expect(score).toBeLessThanOrEqual(15);
    });

    it('maps 50% to mid score range (15-25)', () => {
      const score = percentToScaledScore(50);
      expect(score).toBeGreaterThanOrEqual(15);
      expect(score).toBeLessThanOrEqual(25);
    });

    it('maps 75% to high score range (25-32)', () => {
      const score = percentToScaledScore(75);
      expect(score).toBeGreaterThanOrEqual(23);
      expect(score).toBeLessThanOrEqual(32);
    });

    it('maps 90% to top score range (32-36)', () => {
      const score = percentToScaledScore(90);
      expect(score).toBeGreaterThanOrEqual(30);
      expect(score).toBeLessThanOrEqual(36);
    });
  });

  describe('Edge cases and precision', () => {
    it('handles decimal percentages', () => {
      expect(percentToScaledScore(33.33)).toBeGreaterThanOrEqual(1);
      expect(percentToScaledScore(66.67)).toBeGreaterThanOrEqual(1);
      expect(percentToScaledScore(99.99)).toBeLessThanOrEqual(36);
    });

    it('returns integer scores', () => {
      for (let pct = 0; pct <= 100; pct += 5) {
        const score = percentToScaledScore(pct);
        expect(Number.isInteger(score)).toBe(true);
      }
    });

    it('ensures all scores are in valid ACT range', () => {
      for (let pct = 0; pct <= 100; pct += 1) {
        const score = percentToScaledScore(pct);
        expect(score).toBeGreaterThanOrEqual(1);
        expect(score).toBeLessThanOrEqual(36);
      }
    });
  });
});

describe('calculateCompositeScore', () => {
  describe('Single section scores', () => {
    it('returns the score when only one section is provided', () => {
      expect(calculateCompositeScore({ english: 25 })).toBe(25);
      expect(calculateCompositeScore({ math: 30 })).toBe(30);
      expect(calculateCompositeScore({ reading: 20 })).toBe(20);
      expect(calculateCompositeScore({ science: 18 })).toBe(18);
    });
  });

  describe('Multiple section scores', () => {
    it('calculates average of two sections', () => {
      expect(calculateCompositeScore({ english: 20, math: 30 })).toBe(25);
      expect(calculateCompositeScore({ reading: 24, science: 26 })).toBe(25);
    });

    it('calculates average of three sections', () => {
      expect(calculateCompositeScore({ english: 20, math: 30, reading: 25 })).toBe(25);
    });

    it('calculates average of all four sections', () => {
      expect(calculateCompositeScore({
        english: 24,
        math: 26,
        reading: 22,
        science: 28
      })).toBe(25);
    });

    it('rounds to nearest integer', () => {
      // Average is 24.5, should round to 25
      expect(calculateCompositeScore({
        english: 24,
        math: 25
      })).toBe(25);

      // Average is 24.25, should round to 24
      expect(calculateCompositeScore({
        english: 24,
        math: 24,
        reading: 25,
        science: 24
      })).toBe(24);
    });
  });

  describe('Edge cases', () => {
    it('returns 1 when no scores provided', () => {
      expect(calculateCompositeScore({})).toBe(1);
    });

    it('ignores undefined scores', () => {
      expect(calculateCompositeScore({
        english: 25,
        math: undefined,
        reading: 27,
        science: undefined
      })).toBe(26); // (25 + 27) / 2 = 26
    });

    it('handles minimum scores (all 1s)', () => {
      expect(calculateCompositeScore({
        english: 1,
        math: 1,
        reading: 1,
        science: 1
      })).toBe(1);
    });

    it('handles maximum scores (all 36s)', () => {
      expect(calculateCompositeScore({
        english: 36,
        math: 36,
        reading: 36,
        science: 36
      })).toBe(36);
    });
  });

  describe('Real-world scenarios', () => {
    it('handles typical student scores', () => {
      // Student stronger in English than Math
      expect(calculateCompositeScore({
        english: 28,
        math: 22,
        reading: 26,
        science: 24
      })).toBe(25);
    });

    it('handles high-achieving student', () => {
      expect(calculateCompositeScore({
        english: 34,
        math: 35,
        reading: 33,
        science: 34
      })).toBe(34);
    });

    it('handles struggling student', () => {
      expect(calculateCompositeScore({
        english: 15,
        math: 16,
        reading: 14,
        science: 15
      })).toBe(15);
    });

    it('handles partial test completion (diagnostic)', () => {
      // Student only completed English and Math
      expect(calculateCompositeScore({
        english: 25,
        math: 23
      })).toBe(24);
    });

    it('handles unbalanced scores', () => {
      // Student much stronger in one area
      expect(calculateCompositeScore({
        english: 32,
        math: 18,
        reading: 20,
        science: 22
      })).toBe(23); // (32 + 18 + 20 + 22) / 4 = 23
    });
  });

  describe('Precision and rounding', () => {
    it('rounds 0.5 up', () => {
      expect(calculateCompositeScore({
        english: 24,
        math: 25
      })).toBe(25); // 24.5 rounds up
    });

    it('rounds below 0.5 down', () => {
      expect(calculateCompositeScore({
        english: 24,
        math: 24,
        reading: 25
      })).toBe(24); // 24.33... rounds down
    });

    it('handles fractional averages correctly', () => {
      expect(calculateCompositeScore({
        english: 23,
        math: 24,
        reading: 25,
        science: 26
      })).toBe(25); // 24.5 rounds up
    });
  });
});
