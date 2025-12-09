import { describe, it, expect } from 'vitest';
import { calculateMasteryLevel, getMasteryLabel } from '@/lib/mastery';
import { percentToScaledScore, calculateCompositeScore } from '@/utils/scoring';
import { accuracyToGrade, calculateNextReview, ReviewGrade, type ReviewCard } from '@/lib/spacedRepetition';
import { chooseWeakSkills, type BaselineDiagnostic, type ProgressData, type Skill } from '@/lib/chooseWeakSkills';

/**
 * Edge Case Tests
 * Tests application behavior in boundary conditions and unusual states
 */

describe('Edge Cases: No Diagnostic Yet', () => {
  describe('chooseWeakSkills with missing data', () => {
    const mockSkills: Skill[] = [
      { id: 's1', subject: 'math', cluster: 'algebra', name: 'Linear Equations' },
      { id: 's2', subject: 'math', cluster: 'geometry', name: 'Triangles' },
      { id: 's3', subject: 'english', cluster: 'grammar', name: 'Punctuation' },
    ];

    it('returns empty array when no diagnostic baseline exists', () => {
      const baseline: BaselineDiagnostic[] = [];
      const progress: ProgressData[] = [
        { skill_id: 's1', seen: 5, mastery_level: 1, correct: 3 }
      ];
      
      const result = chooseWeakSkills(baseline, progress, mockSkills);
      expect(result).toEqual([]);
    });

    it('returns empty array when progress data is empty', () => {
      const baseline: BaselineDiagnostic[] = [
        { section: 'math', score: 0.5, source: 'diagnostic' }
      ];
      const progress: ProgressData[] = [];
      
      const result = chooseWeakSkills(baseline, progress, mockSkills);
      expect(result).toEqual([]);
    });

    it('returns empty array when all progress has sufficient data', () => {
      const baseline: BaselineDiagnostic[] = [
        { section: 'math', score: 0.5, source: 'diagnostic' }
      ];
      const progress: ProgressData[] = [
        { skill_id: 's1', seen: 25, mastery_level: 2, correct: 20 }, // seen >= 20
        { skill_id: 's2', seen: 30, mastery_level: 3, correct: 28 },
      ];
      
      const result = chooseWeakSkills(baseline, progress, mockSkills);
      expect(result).toEqual([]);
    });

    it('handles user with high baseline scores (no weak areas)', () => {
      const baseline: BaselineDiagnostic[] = [
        { section: 'math', score: 0.9, source: 'diagnostic' },
        { section: 'english', score: 0.85, source: 'diagnostic' },
      ];
      const progress: ProgressData[] = [
        { skill_id: 's1', seen: 10, mastery_level: 3, correct: 9 }
      ];
      
      const result = chooseWeakSkills(baseline, progress, mockSkills);
      expect(result).toEqual([]);
    });
  });

  describe('mastery calculation with zero data', () => {
    it('returns not-started for brand new users', () => {
      expect(calculateMasteryLevel(0, 0)).toBe('not-started');
    });

    it('handles first attempt correctly', () => {
      expect(calculateMasteryLevel(1, 1)).toBe('mastered'); // 100%
      expect(calculateMasteryLevel(0, 1)).toBe('beginner'); // 0%
    });
  });
});

describe('Edge Cases: No Study Plan Yet', () => {
  describe('scoring with no sections', () => {
    it('returns minimum score for empty scores', () => {
      expect(calculateCompositeScore({})).toBe(1);
    });

    it('handles undefined sections', () => {
      expect(calculateCompositeScore({
        english: undefined,
        math: undefined,
        reading: undefined,
        science: undefined,
      })).toBe(1);
    });

    it('calculates correctly with partial sections', () => {
      expect(calculateCompositeScore({ math: 30 })).toBe(30);
    });
  });

  describe('score conversion edge cases', () => {
    it('handles exactly 0%', () => {
      expect(percentToScaledScore(0)).toBe(1);
    });

    it('handles exactly 100%', () => {
      expect(percentToScaledScore(100)).toBe(36);
    });

    it('handles boundary at 50%', () => {
      const score = percentToScaledScore(50);
      expect(score).toBeGreaterThanOrEqual(1);
      expect(score).toBeLessThanOrEqual(36);
    });
  });
});

describe('Edge Cases: Plan Completed', () => {
  describe('mastery after completing all skills', () => {
    it('correctly identifies mastered state', () => {
      // User with 95% accuracy
      expect(calculateMasteryLevel(95, 100)).toBe('mastered');
    });

    it('handles perfect completion', () => {
      expect(calculateMasteryLevel(100, 100)).toBe('mastered');
      expect(getMasteryLabel('mastered')).toBe('Mastered');
    });
  });

  describe('spaced repetition for mastered cards', () => {
    it('extends interval significantly for easy recall', () => {
      const masteredCard: ReviewCard = {
        question_id: 'q1',
        user_id: 'u1',
        due_at: new Date().toISOString(),
        interval_days: 30, // Long interval
        ease: 300, // Maximum ease
        lapses: 0,
      };

      const result = calculateNextReview(masteredCard, ReviewGrade.EASY);
      expect(result.interval_days).toBeGreaterThan(30);
    });

    it('handles very long intervals correctly', () => {
      const longTermCard: ReviewCard = {
        question_id: 'q1',
        user_id: 'u1',
        due_at: new Date().toISOString(),
        interval_days: 365,
        ease: 250,
        lapses: 0,
      };

      const result = calculateNextReview(longTermCard, ReviewGrade.GOOD);
      expect(result.interval_days).toBeGreaterThan(365);
    });
  });
});

describe('Edge Cases: User Changes Test Date / Target Score', () => {
  describe('handling date changes', () => {
    it('score calculation is independent of date', () => {
      // Score calculation should work regardless of when called
      const score1 = percentToScaledScore(75);
      const score2 = percentToScaledScore(75);
      expect(score1).toBe(score2);
    });

    it('composite score handles rapid updates', () => {
      // Simulating user rapidly changing scores
      const scores = [
        { english: 20 },
        { english: 25 },
        { english: 30, math: 28 },
        { english: 30, math: 28, reading: 26, science: 24 },
      ];

      scores.forEach(score => {
        const composite = calculateCompositeScore(score);
        expect(composite).toBeGreaterThanOrEqual(1);
        expect(composite).toBeLessThanOrEqual(36);
      });
    });
  });

  describe('mastery recalculation after reset', () => {
    it('handles mastery data being reset', () => {
      // After plan reset, user starts fresh
      expect(calculateMasteryLevel(0, 0)).toBe('not-started');
    });

    it('correctly tracks new progress after reset', () => {
      // First few attempts after reset
      expect(calculateMasteryLevel(1, 1)).toBe('mastered');
      expect(calculateMasteryLevel(1, 2)).toBe('beginner');
      expect(calculateMasteryLevel(2, 3)).toBe('learning');
    });
  });

  describe('spaced repetition queue resets', () => {
    it('handles card with reset interval', () => {
      const resetCard: ReviewCard = {
        question_id: 'q1',
        user_id: 'u1',
        due_at: new Date().toISOString(),
        interval_days: 0, // Reset to new card
        ease: 250,
        lapses: 0,
      };

      const result = calculateNextReview(resetCard, ReviewGrade.GOOD);
      expect(result.interval_days).toBe(1);
    });

    it('preserves lapse history even after interval reset', () => {
      const resetWithHistory: ReviewCard = {
        question_id: 'q1',
        user_id: 'u1',
        due_at: new Date().toISOString(),
        interval_days: 0,
        ease: 200, // Lower due to previous failures
        lapses: 3, // Has failed before
      };

      const result = calculateNextReview(resetWithHistory, ReviewGrade.AGAIN);
      expect(result.lapses).toBe(4);
    });
  });
});

describe('Edge Cases: Boundary Conditions', () => {
  describe('accuracy thresholds', () => {
    const thresholdTests = [
      { accuracy: 0, expected: ReviewGrade.AGAIN },
      { accuracy: 59, expected: ReviewGrade.AGAIN },
      { accuracy: 60, expected: ReviewGrade.HARD },
      { accuracy: 79, expected: ReviewGrade.HARD },
      { accuracy: 80, expected: ReviewGrade.GOOD },
      { accuracy: 89, expected: ReviewGrade.GOOD },
      { accuracy: 90, expected: ReviewGrade.EASY },
      { accuracy: 100, expected: ReviewGrade.EASY },
    ];

    thresholdTests.forEach(({ accuracy, expected }) => {
      it(`returns ${ReviewGrade[expected]} for ${accuracy}% accuracy`, () => {
        expect(accuracyToGrade(accuracy)).toBe(expected);
      });
    });
  });

  describe('mastery thresholds', () => {
    const masteryTests = [
      { correct: 0, total: 10, expected: 'beginner' },
      { correct: 5, total: 10, expected: 'beginner' }, // 50%
      { correct: 59, total: 100, expected: 'beginner' }, // 59%
      { correct: 60, total: 100, expected: 'learning' }, // 60%
      { correct: 74, total: 100, expected: 'learning' }, // 74%
      { correct: 75, total: 100, expected: 'proficient' }, // 75%
      { correct: 89, total: 100, expected: 'proficient' }, // 89%
      { correct: 90, total: 100, expected: 'mastered' }, // 90%
      { correct: 100, total: 100, expected: 'mastered' }, // 100%
    ];

    masteryTests.forEach(({ correct, total, expected }) => {
      it(`returns ${expected} for ${correct}/${total} (${(correct/total*100)}%)`, () => {
        expect(calculateMasteryLevel(correct, total)).toBe(expected);
      });
    });
  });

  describe('score scaling edge cases', () => {
    it('handles negative percentages', () => {
      expect(percentToScaledScore(-5)).toBe(1);
      expect(percentToScaledScore(-100)).toBe(1);
    });

    it('handles percentages over 100', () => {
      expect(percentToScaledScore(105)).toBe(36);
      expect(percentToScaledScore(200)).toBe(36);
    });

    it('handles fractional percentages', () => {
      const scores = [0.5, 33.33, 66.67, 99.9];
      scores.forEach(pct => {
        const score = percentToScaledScore(pct);
        expect(score).toBeGreaterThanOrEqual(1);
        expect(score).toBeLessThanOrEqual(36);
      });
    });
  });
});

describe('Edge Cases: Concurrent Operations', () => {
  it('mastery calculations are deterministic', () => {
    // Same inputs should always produce same outputs
    const results = Array(10).fill(null).map(() => 
      calculateMasteryLevel(75, 100)
    );
    
    expect(new Set(results).size).toBe(1);
    expect(results[0]).toBe('proficient');
  });

  it('score calculations are deterministic', () => {
    const results = Array(10).fill(null).map(() => 
      percentToScaledScore(75)
    );
    
    expect(new Set(results).size).toBe(1);
  });

  it('composite score is stable', () => {
    const scores = { english: 25, math: 30, reading: 28, science: 27 };
    const results = Array(10).fill(null).map(() => 
      calculateCompositeScore(scores)
    );
    
    expect(new Set(results).size).toBe(1);
    expect(results[0]).toBe(28); // (25+30+28+27)/4 = 27.5 -> rounds to 28
  });
});

describe('Edge Cases: Large Numbers', () => {
  it('handles very large attempt counts', () => {
    const result = calculateMasteryLevel(9000, 10000);
    expect(result).toBe('mastered'); // 90%
  });

  it('handles maximum possible interval', () => {
    const longCard: ReviewCard = {
      question_id: 'q1',
      user_id: 'u1',
      due_at: new Date().toISOString(),
      interval_days: 10000,
      ease: 250,
      lapses: 0,
    };

    const result = calculateNextReview(longCard, ReviewGrade.GOOD);
    expect(result.interval_days).toBeGreaterThan(10000);
  });

  it('handles many lapses', () => {
    const troubleCard: ReviewCard = {
      question_id: 'q1',
      user_id: 'u1',
      due_at: new Date().toISOString(),
      interval_days: 1,
      ease: 130,
      lapses: 100,
    };

    const result = calculateNextReview(troubleCard, ReviewGrade.AGAIN);
    expect(result.lapses).toBe(101);
    expect(result.ease).toBe(130); // Should not go below minimum
  });
});
