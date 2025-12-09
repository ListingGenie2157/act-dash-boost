import { describe, it, expect } from 'vitest';
import {
  calculateNextReview,
  accuracyToGrade,
  ReviewGrade,
  type ReviewCard,
} from './spacedRepetition';

describe('calculateNextReview', () => {
  const baseCard: ReviewCard = {
    question_id: 'test-1',
    user_id: 'user-1',
    due_at: new Date().toISOString(),
    interval_days: 1,
    ease: 250,
    lapses: 0,
  };

  describe('AGAIN (grade 1) - failure', () => {
    it('resets interval to 1 day and increases lapses', () => {
      const result = calculateNextReview(baseCard, ReviewGrade.AGAIN);
      expect(result.interval_days).toBe(1);
      expect(result.lapses).toBe(1);
      expect(result.ease).toBeLessThan(baseCard.ease);
      expect(result.ease).toBeGreaterThanOrEqual(130); // Minimum ease
    });

    it('reduces ease factor by 20', () => {
      const result = calculateNextReview(baseCard, ReviewGrade.AGAIN);
      expect(result.ease).toBe(230); // 250 - 20
    });

    it('maintains minimum ease of 130', () => {
      const lowEaseCard = { ...baseCard, ease: 140 };
      const result = calculateNextReview(lowEaseCard, ReviewGrade.AGAIN);
      expect(result.ease).toBe(130); // Should not go below 130
    });
  });

  describe('HARD (grade 2)', () => {
    it('increases interval slightly and reduces ease', () => {
      const result = calculateNextReview(baseCard, ReviewGrade.HARD);
      expect(result.interval_days).toBeGreaterThanOrEqual(1);
      expect(result.ease).toBeLessThan(baseCard.ease);
    });

    it('calculates interval as 1.2x previous', () => {
      const card = { ...baseCard, interval_days: 5 };
      const result = calculateNextReview(card, ReviewGrade.HARD);
      expect(result.interval_days).toBe(6); // Math.floor(5 * 1.2)
    });
  });

  describe('GOOD (grade 3) - success', () => {
    it('sets interval to 1 for new cards (interval 0)', () => {
      const newCard = { ...baseCard, interval_days: 0 };
      const result = calculateNextReview(newCard, ReviewGrade.GOOD);
      expect(result.interval_days).toBe(1);
    });

    it('sets interval to 6 for cards with interval 1', () => {
      const card = { ...baseCard, interval_days: 1 };
      const result = calculateNextReview(card, ReviewGrade.GOOD);
      expect(result.interval_days).toBe(6);
    });

    it('calculates interval using ease factor for established cards', () => {
      const card = { ...baseCard, interval_days: 6, ease: 250 };
      const result = calculateNextReview(card, ReviewGrade.GOOD);
      // interval = floor(6 * 250/100) = floor(15) = 15
      expect(result.interval_days).toBe(15);
    });
  });

  describe('EASY (grade 4) - perfect recall', () => {
    it('sets interval to 4 for new cards (interval 0)', () => {
      const newCard = { ...baseCard, interval_days: 0 };
      const result = calculateNextReview(newCard, ReviewGrade.EASY);
      expect(result.interval_days).toBe(4);
    });

    it('sets interval to 10 for cards with interval 1', () => {
      const card = { ...baseCard, interval_days: 1 };
      const result = calculateNextReview(card, ReviewGrade.EASY);
      expect(result.interval_days).toBe(10);
    });

    it('increases ease factor for easy cards', () => {
      const result = calculateNextReview(baseCard, ReviewGrade.EASY);
      expect(result.ease).toBe(265); // 250 + 15
    });

    it('caps ease at 300', () => {
      const highEaseCard = { ...baseCard, ease: 290 };
      const result = calculateNextReview(highEaseCard, ReviewGrade.EASY);
      expect(result.ease).toBe(300); // Capped at 300
    });

    it('calculates interval with 1.3x multiplier for established cards', () => {
      const card = { ...baseCard, interval_days: 10, ease: 250 };
      const result = calculateNextReview(card, ReviewGrade.EASY);
      // interval = floor(10 * 250/100 * 1.3) = floor(32.5) = 32
      expect(result.interval_days).toBe(32);
    });
  });

  describe('due_at date calculation', () => {
    it('sets due_at to future date based on interval', () => {
      const result = calculateNextReview(baseCard, ReviewGrade.GOOD);
      expect(result.due_at).toBeDefined();
      
      const dueDate = new Date(result.due_at!);
      const now = new Date();
      const expectedDate = new Date();
      expectedDate.setDate(now.getDate() + result.interval_days!);
      
      // Allow 1 second tolerance for test execution time
      const diff = Math.abs(dueDate.getTime() - expectedDate.getTime());
      expect(diff).toBeLessThan(1000);
    });
  });
});

describe('accuracyToGrade', () => {
  it('returns AGAIN for accuracy < 60%', () => {
    expect(accuracyToGrade(0)).toBe(ReviewGrade.AGAIN);
    expect(accuracyToGrade(30)).toBe(ReviewGrade.AGAIN);
    expect(accuracyToGrade(59)).toBe(ReviewGrade.AGAIN);
  });

  it('returns HARD for accuracy 60-79%', () => {
    expect(accuracyToGrade(60)).toBe(ReviewGrade.HARD);
    expect(accuracyToGrade(70)).toBe(ReviewGrade.HARD);
    expect(accuracyToGrade(79)).toBe(ReviewGrade.HARD);
  });

  it('returns GOOD for accuracy 80-89%', () => {
    expect(accuracyToGrade(80)).toBe(ReviewGrade.GOOD);
    expect(accuracyToGrade(85)).toBe(ReviewGrade.GOOD);
    expect(accuracyToGrade(89)).toBe(ReviewGrade.GOOD);
  });

  it('returns EASY for accuracy >= 90%', () => {
    expect(accuracyToGrade(90)).toBe(ReviewGrade.EASY);
    expect(accuracyToGrade(95)).toBe(ReviewGrade.EASY);
    expect(accuracyToGrade(100)).toBe(ReviewGrade.EASY);
  });
});
