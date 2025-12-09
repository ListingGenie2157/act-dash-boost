import { describe, it, expect } from 'vitest';
import { 
  calculateMasteryLevel, 
  MASTERY_THRESHOLDS
} from './mastery';

describe('calculateMasteryLevel', () => {
  describe('Edge cases', () => {
    it('returns not-started when total is 0', () => {
      expect(calculateMasteryLevel(0, 0)).toBe('not-started');
    });

    it('returns learning when below minimum attempts', () => {
      expect(calculateMasteryLevel(0, 0)).toBe('not-started');
    });
  });

  describe('Mastered level (90-100%)', () => {
    it('returns mastered at exactly 90%', () => {
      expect(calculateMasteryLevel(9, 10)).toBe('mastered');
    });

    it('returns mastered at 95%', () => {
      expect(calculateMasteryLevel(19, 20)).toBe('mastered');
    });

    it('returns mastered at 100%', () => {
      expect(calculateMasteryLevel(10, 10)).toBe('mastered');
      expect(calculateMasteryLevel(50, 50)).toBe('mastered');
    });
  });

  describe('Proficient level (75-89%)', () => {
    it('returns proficient at exactly 75%', () => {
      expect(calculateMasteryLevel(15, 20)).toBe('proficient');
    });

    it('returns proficient at 80%', () => {
      expect(calculateMasteryLevel(16, 20)).toBe('proficient');
    });

    it('returns proficient at 89%', () => {
      expect(calculateMasteryLevel(89, 100)).toBe('proficient');
    });

    it('returns proficient just below 90%', () => {
      expect(calculateMasteryLevel(8, 9)).toBe('proficient'); // 88.89%
    });
  });

  describe('Learning level (60-74%)', () => {
    it('returns learning at exactly 60%', () => {
      expect(calculateMasteryLevel(6, 10)).toBe('learning');
    });

    it('returns learning at 65%', () => {
      expect(calculateMasteryLevel(13, 20)).toBe('learning');
    });

    it('returns learning at 74%', () => {
      expect(calculateMasteryLevel(74, 100)).toBe('learning');
    });

    it('returns learning just below 75%', () => {
      expect(calculateMasteryLevel(7, 10)).toBe('learning'); // 70%
    });
  });

  describe('Beginner level (0-59%)', () => {
    it('returns beginner at 0%', () => {
      expect(calculateMasteryLevel(0, 10)).toBe('beginner');
    });

    it('returns beginner at 50%', () => {
      expect(calculateMasteryLevel(5, 10)).toBe('beginner');
    });

    it('returns beginner at 59%', () => {
      expect(calculateMasteryLevel(59, 100)).toBe('beginner');
    });

    it('returns beginner just below 60%', () => {
      expect(calculateMasteryLevel(5, 9)).toBe('beginner'); // 55.56%
    });
  });

  describe('Boundary testing', () => {
    it('correctly handles threshold boundaries', () => {
      // Test each threshold
      expect(calculateMasteryLevel(59, 100)).toBe('beginner');
      expect(calculateMasteryLevel(60, 100)).toBe('learning');
      expect(calculateMasteryLevel(74, 100)).toBe('learning');
      expect(calculateMasteryLevel(75, 100)).toBe('proficient');
      expect(calculateMasteryLevel(89, 100)).toBe('proficient');
      expect(calculateMasteryLevel(90, 100)).toBe('mastered');
    });
  });

  describe('Real-world scenarios', () => {
    it('handles typical progress patterns', () => {
      // User starts poorly, improves over time
      expect(calculateMasteryLevel(2, 10)).toBe('beginner');   // 20%
      expect(calculateMasteryLevel(7, 15)).toBe('beginner');   // 46.67%
      expect(calculateMasteryLevel(13, 20)).toBe('learning');  // 65%
      expect(calculateMasteryLevel(23, 30)).toBe('proficient'); // 76.67%
      expect(calculateMasteryLevel(36, 40)).toBe('mastered');  // 90%
    });

    it('handles inconsistent performance', () => {
      // User with high variance
      expect(calculateMasteryLevel(50, 100)).toBe('beginner'); // 50%
      expect(calculateMasteryLevel(75, 100)).toBe('proficient'); // 75%
    });
  });
});

describe('MASTERY_THRESHOLDS constants', () => {
  it('defines correct threshold values', () => {
    expect(MASTERY_THRESHOLDS.BEGINNER).toBe(0);
    expect(MASTERY_THRESHOLDS.LEARNING).toBe(60);
    expect(MASTERY_THRESHOLDS.PROFICIENT).toBe(75);
    expect(MASTERY_THRESHOLDS.MASTERED).toBe(90);
  });

  it('thresholds are in ascending order', () => {
    expect(MASTERY_THRESHOLDS.BEGINNER).toBeLessThan(MASTERY_THRESHOLDS.LEARNING);
    expect(MASTERY_THRESHOLDS.LEARNING).toBeLessThan(MASTERY_THRESHOLDS.PROFICIENT);
    expect(MASTERY_THRESHOLDS.PROFICIENT).toBeLessThan(MASTERY_THRESHOLDS.MASTERED);
  });
});
