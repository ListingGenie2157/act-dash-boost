import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateNextReview,
  accuracyToGrade,
  ReviewGrade,
  type ReviewCard,
} from './spacedRepetition';

describe('ReviewGrade enum', () => {
  it('has correct grade values', () => {
    expect(ReviewGrade.AGAIN).toBe(1);
    expect(ReviewGrade.HARD).toBe(2);
    expect(ReviewGrade.GOOD).toBe(3);
    expect(ReviewGrade.EASY).toBe(4);
  });
});

describe('accuracyToGrade', () => {
  describe('AGAIN grade (<60%)', () => {
    it('returns AGAIN for 0%', () => {
      expect(accuracyToGrade(0)).toBe(ReviewGrade.AGAIN);
    });

    it('returns AGAIN for 50%', () => {
      expect(accuracyToGrade(50)).toBe(ReviewGrade.AGAIN);
    });

    it('returns AGAIN for 59%', () => {
      expect(accuracyToGrade(59)).toBe(ReviewGrade.AGAIN);
    });
  });

  describe('HARD grade (60-79%)', () => {
    it('returns HARD for 60%', () => {
      expect(accuracyToGrade(60)).toBe(ReviewGrade.HARD);
    });

    it('returns HARD for 70%', () => {
      expect(accuracyToGrade(70)).toBe(ReviewGrade.HARD);
    });

    it('returns HARD for 79%', () => {
      expect(accuracyToGrade(79)).toBe(ReviewGrade.HARD);
    });
  });

  describe('GOOD grade (80-89%)', () => {
    it('returns GOOD for 80%', () => {
      expect(accuracyToGrade(80)).toBe(ReviewGrade.GOOD);
    });

    it('returns GOOD for 85%', () => {
      expect(accuracyToGrade(85)).toBe(ReviewGrade.GOOD);
    });

    it('returns GOOD for 89%', () => {
      expect(accuracyToGrade(89)).toBe(ReviewGrade.GOOD);
    });
  });

  describe('EASY grade (≥90%)', () => {
    it('returns EASY for 90%', () => {
      expect(accuracyToGrade(90)).toBe(ReviewGrade.EASY);
    });

    it('returns EASY for 95%', () => {
      expect(accuracyToGrade(95)).toBe(ReviewGrade.EASY);
    });

    it('returns EASY for 100%', () => {
      expect(accuracyToGrade(100)).toBe(ReviewGrade.EASY);
    });
  });
});

describe('calculateNextReview', () => {
  let baseCard: ReviewCard;

  beforeEach(() => {
    baseCard = {
      question_id: 'q1',
      user_id: 'u1',
      due_at: new Date().toISOString(),
      interval_days: 1,
      ease: 250, // Default SM-2 ease factor (250%)
      lapses: 0,
    };
  });

  describe('AGAIN grade (failure)', () => {
    it('resets interval to 1 day', () => {
      const result = calculateNextReview(baseCard, ReviewGrade.AGAIN);
      expect(result.interval_days).toBe(1);
    });

    it('increments lapses', () => {
      const result = calculateNextReview(baseCard, ReviewGrade.AGAIN);
      expect(result.lapses).toBe(1);
    });

    it('decreases ease by 20', () => {
      const result = calculateNextReview(baseCard, ReviewGrade.AGAIN);
      expect(result.ease).toBe(230); // 250 - 20
    });

    it('does not decrease ease below 130', () => {
      const lowEaseCard = { ...baseCard, ease: 140 };
      const result = calculateNextReview(lowEaseCard, ReviewGrade.AGAIN);
      expect(result.ease).toBe(130);
    });

    it('accumulates lapses on repeated failures', () => {
      const cardWithLapses = { ...baseCard, lapses: 3 };
      const result = calculateNextReview(cardWithLapses, ReviewGrade.AGAIN);
      expect(result.lapses).toBe(4);
    });
  });

  describe('HARD grade (difficult)', () => {
    it('increases interval by 1.2x', () => {
      const cardWith5Days = { ...baseCard, interval_days: 5 };
      const result = calculateNextReview(cardWith5Days, ReviewGrade.HARD);
      expect(result.interval_days).toBe(6); // floor(5 * 1.2) = 6
    });

    it('ensures minimum interval of 1', () => {
      const result = calculateNextReview(baseCard, ReviewGrade.HARD);
      expect(result.interval_days).toBeGreaterThanOrEqual(1);
    });

    it('decreases ease by 15', () => {
      const result = calculateNextReview(baseCard, ReviewGrade.HARD);
      expect(result.ease).toBe(235); // 250 - 15
    });

    it('does not decrease ease below 130', () => {
      const lowEaseCard = { ...baseCard, ease: 135 };
      const result = calculateNextReview(lowEaseCard, ReviewGrade.HARD);
      expect(result.ease).toBe(130);
    });

    it('does not increment lapses', () => {
      const result = calculateNextReview(baseCard, ReviewGrade.HARD);
      expect(result.lapses).toBe(0);
    });
  });

  describe('GOOD grade (correct with effort)', () => {
    it('sets interval to 1 for new card (interval=0)', () => {
      const newCard = { ...baseCard, interval_days: 0 };
      const result = calculateNextReview(newCard, ReviewGrade.GOOD);
      expect(result.interval_days).toBe(1);
    });

    it('sets interval to 6 when current interval is 1', () => {
      const result = calculateNextReview(baseCard, ReviewGrade.GOOD);
      expect(result.interval_days).toBe(6);
    });

    it('multiplies interval by ease factor for established cards', () => {
      const establishedCard = { ...baseCard, interval_days: 6, ease: 250 };
      const result = calculateNextReview(establishedCard, ReviewGrade.GOOD);
      // floor(6 * 2.5) = 15
      expect(result.interval_days).toBe(15);
    });

    it('does not modify ease', () => {
      const result = calculateNextReview(baseCard, ReviewGrade.GOOD);
      expect(result.ease).toBe(250);
    });

    it('does not increment lapses', () => {
      const result = calculateNextReview(baseCard, ReviewGrade.GOOD);
      expect(result.lapses).toBe(0);
    });
  });

  describe('EASY grade (perfect recall)', () => {
    it('sets interval to 4 for new card (interval=0)', () => {
      const newCard = { ...baseCard, interval_days: 0 };
      const result = calculateNextReview(newCard, ReviewGrade.EASY);
      expect(result.interval_days).toBe(4);
    });

    it('sets interval to 10 when current interval is 1', () => {
      const result = calculateNextReview(baseCard, ReviewGrade.EASY);
      expect(result.interval_days).toBe(10);
    });

    it('multiplies interval by ease factor * 1.3 for established cards', () => {
      const establishedCard = { ...baseCard, interval_days: 6, ease: 250 };
      const result = calculateNextReview(establishedCard, ReviewGrade.EASY);
      // floor(6 * 2.5 * 1.3) = floor(19.5) = 19
      expect(result.interval_days).toBe(19);
    });

    it('increases ease by 15', () => {
      const result = calculateNextReview(baseCard, ReviewGrade.EASY);
      expect(result.ease).toBe(265); // 250 + 15
    });

    it('caps ease at 300', () => {
      const highEaseCard = { ...baseCard, ease: 290 };
      const result = calculateNextReview(highEaseCard, ReviewGrade.EASY);
      expect(result.ease).toBe(300);
    });

    it('does not increment lapses', () => {
      const result = calculateNextReview(baseCard, ReviewGrade.EASY);
      expect(result.lapses).toBe(0);
    });
  });

  describe('due_at calculation', () => {
    it('sets due_at to a future date', () => {
      const result = calculateNextReview(baseCard, ReviewGrade.GOOD);
      const dueDate = new Date(result.due_at!);
      const now = new Date();
      expect(dueDate.getTime()).toBeGreaterThan(now.getTime());
    });

    it('sets correct due date based on interval', () => {
      const result = calculateNextReview(baseCard, ReviewGrade.GOOD);
      const dueDate = new Date(result.due_at!);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + result.interval_days!);
      
      // Check dates match (ignoring time component for flexibility)
      expect(dueDate.toDateString()).toBe(expectedDate.toDateString());
    });
  });

  describe('edge cases', () => {
    it('handles card with minimum ease', () => {
      const minEaseCard = { ...baseCard, ease: 130 };
      const result = calculateNextReview(minEaseCard, ReviewGrade.GOOD);
      expect(result.interval_days).toBeGreaterThan(0);
    });

    it('handles card with maximum ease', () => {
      const maxEaseCard = { ...baseCard, ease: 300 };
      const result = calculateNextReview(maxEaseCard, ReviewGrade.EASY);
      expect(result.ease).toBe(300); // Should not exceed 300
    });

    it('handles card with high interval', () => {
      const longTermCard = { ...baseCard, interval_days: 365, ease: 250 };
      const result = calculateNextReview(longTermCard, ReviewGrade.GOOD);
      // floor(365 * 2.5) = 912
      expect(result.interval_days).toBe(912);
    });

    it('handles card with many lapses', () => {
      const troubleCard = { ...baseCard, lapses: 10 };
      const result = calculateNextReview(troubleCard, ReviewGrade.AGAIN);
      expect(result.lapses).toBe(11);
    });
  });

  describe('learning progression simulation', () => {
    it('correctly models learning progression with GOOD grades', () => {
      let card = { ...baseCard, interval_days: 0 };
      
      // First review: interval 0 -> 1
      let result = calculateNextReview(card, ReviewGrade.GOOD);
      expect(result.interval_days).toBe(1);
      
      // Second review: interval 1 -> 6
      card = { ...card, interval_days: 1, ease: result.ease! };
      result = calculateNextReview(card, ReviewGrade.GOOD);
      expect(result.interval_days).toBe(6);
      
      // Third review: interval 6 -> 15 (with default 250% ease)
      card = { ...card, interval_days: 6, ease: result.ease! };
      result = calculateNextReview(card, ReviewGrade.GOOD);
      expect(result.interval_days).toBe(15);
    });
  });
});
