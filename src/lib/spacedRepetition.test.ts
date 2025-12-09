import { describe, it, expect, beforeEach } from 'vitest';
import { 
  calculateNextReview, 
  ReviewGrade, 
  accuracyToGrade,
  type ReviewCard 
} from './spacedRepetition';

describe('calculateNextReview', () => {
  let baseCard: ReviewCard;

  beforeEach(() => {
    baseCard = {
      question_id: 'test-question-1',
      user_id: 'test-user-1',
      due_at: new Date().toISOString(),
      interval_days: 0,
      ease: 250,
      lapses: 0,
    };
  });

  describe('AGAIN grade (complete failure)', () => {
    it('resets interval to 1 day', () => {
      const card = { ...baseCard, interval_days: 10 };
      const result = calculateNextReview(card, ReviewGrade.AGAIN);
      
      expect(result.interval_days).toBe(1);
    });

    it('increments lapses counter', () => {
      const card = { ...baseCard, lapses: 2 };
      const result = calculateNextReview(card, ReviewGrade.AGAIN);
      
      expect(result.lapses).toBe(3);
    });

    it('reduces ease factor by 20', () => {
      const card = { ...baseCard, ease: 250 };
      const result = calculateNextReview(card, ReviewGrade.AGAIN);
      
      expect(result.ease).toBe(230);
    });

    it('does not reduce ease below 130', () => {
      const card = { ...baseCard, ease: 130 };
      const result = calculateNextReview(card, ReviewGrade.AGAIN);
      
      expect(result.ease).toBe(130);
    });

    it('sets due_at to tomorrow', () => {
      const result = calculateNextReview(baseCard, ReviewGrade.AGAIN);
      const dueDate = new Date(result.due_at!);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      expect(dueDate.getDate()).toBe(tomorrow.getDate());
    });
  });

  describe('HARD grade (difficult but recognized)', () => {
    it('increases interval by 1.2x', () => {
      const card = { ...baseCard, interval_days: 10 };
      const result = calculateNextReview(card, ReviewGrade.HARD);
      
      expect(result.interval_days).toBe(12); // floor(10 * 1.2)
    });

    it('ensures minimum interval of 1 day', () => {
      const card = { ...baseCard, interval_days: 0 };
      const result = calculateNextReview(card, ReviewGrade.HARD);
      
      expect(result.interval_days).toBeGreaterThanOrEqual(1);
    });

    it('reduces ease factor by 15', () => {
      const card = { ...baseCard, ease: 250 };
      const result = calculateNextReview(card, ReviewGrade.HARD);
      
      expect(result.ease).toBe(235);
    });

    it('does not reduce ease below 130', () => {
      const card = { ...baseCard, ease: 140 };
      const result = calculateNextReview(card, ReviewGrade.HARD);
      
      expect(result.ease).toBe(130);
    });

    it('does not increment lapses', () => {
      const card = { ...baseCard, lapses: 2 };
      const result = calculateNextReview(card, ReviewGrade.HARD);
      
      expect(result.lapses).toBe(2);
    });
  });

  describe('GOOD grade (correct with effort)', () => {
    it('sets interval to 1 day for new cards', () => {
      const card = { ...baseCard, interval_days: 0 };
      const result = calculateNextReview(card, ReviewGrade.GOOD);
      
      expect(result.interval_days).toBe(1);
    });

    it('sets interval to 6 days after first success', () => {
      const card = { ...baseCard, interval_days: 1 };
      const result = calculateNextReview(card, ReviewGrade.GOOD);
      
      expect(result.interval_days).toBe(6);
    });

    it('uses ease factor for subsequent reviews', () => {
      const card = { ...baseCard, interval_days: 6, ease: 250 };
      const result = calculateNextReview(card, ReviewGrade.GOOD);
      
      expect(result.interval_days).toBe(15); // floor(6 * 2.5)
    });

    it('maintains ease factor', () => {
      const card = { ...baseCard, ease: 250 };
      const result = calculateNextReview(card, ReviewGrade.GOOD);
      
      expect(result.ease).toBe(250);
    });
  });

  describe('EASY grade (perfect recall)', () => {
    it('sets interval to 4 days for new cards', () => {
      const card = { ...baseCard, interval_days: 0 };
      const result = calculateNextReview(card, ReviewGrade.EASY);
      
      expect(result.interval_days).toBe(4);
    });

    it('sets interval to 10 days after first success', () => {
      const card = { ...baseCard, interval_days: 1 };
      const result = calculateNextReview(card, ReviewGrade.EASY);
      
      expect(result.interval_days).toBe(10);
    });

    it('uses ease factor * 1.3 for subsequent reviews', () => {
      const card = { ...baseCard, interval_days: 10, ease: 250 };
      const result = calculateNextReview(card, ReviewGrade.EASY);
      
      expect(result.interval_days).toBe(32); // floor(10 * 2.5 * 1.3)
    });

    it('increases ease factor by 15', () => {
      const card = { ...baseCard, ease: 250 };
      const result = calculateNextReview(card, ReviewGrade.EASY);
      
      expect(result.ease).toBe(265);
    });

    it('caps ease at 300', () => {
      const card = { ...baseCard, ease: 295 };
      const result = calculateNextReview(card, ReviewGrade.EASY);
      
      expect(result.ease).toBe(300);
    });
  });

  describe('Real-world progression scenarios', () => {
    it('handles typical successful learning path', () => {
      let card = { ...baseCard };
      
      // First review - GOOD
      let result = calculateNextReview(card, ReviewGrade.GOOD);
      expect(result.interval_days).toBe(1);
      card = { ...card, ...result };
      
      // Second review - GOOD
      result = calculateNextReview(card, ReviewGrade.GOOD);
      expect(result.interval_days).toBe(6);
      card = { ...card, ...result };
      
      // Third review - GOOD
      result = calculateNextReview(card, ReviewGrade.GOOD);
      expect(result.interval_days).toBe(15);
      card = { ...card, ...result };
      
      // Fourth review - EASY
      result = calculateNextReview(card, ReviewGrade.EASY);
      expect(result.interval_days).toBeGreaterThan(15);
      expect(result.ease).toBeGreaterThan(250);
    });

    it('handles lapse and recovery', () => {
      let card = { ...baseCard, interval_days: 10, ease: 250 };
      
      // User fails review
      let result = calculateNextReview(card, ReviewGrade.AGAIN);
      expect(result.interval_days).toBe(1);
      expect(result.lapses).toBe(1);
      expect(result.ease).toBe(230);
      card = { ...card, ...result };
      
      // User recovers with HARD
      result = calculateNextReview(card, ReviewGrade.HARD);
      expect(result.interval_days).toBeGreaterThanOrEqual(1);
      expect(result.ease).toBe(215);
    });
  });

  describe('Edge cases', () => {
    it('handles multiple consecutive failures', () => {
      let card = { ...baseCard, interval_days: 21, ease: 250 };
      
      // First failure
      let result = calculateNextReview(card, ReviewGrade.AGAIN);
      expect(result.ease).toBe(230);
      card = { ...card, ...result };
      
      // Second failure
      result = calculateNextReview(card, ReviewGrade.AGAIN);
      expect(result.ease).toBe(210);
      card = { ...card, ...result };
      
      // Third failure
      result = calculateNextReview(card, ReviewGrade.AGAIN);
      expect(result.ease).toBe(190);
    });

    it('handles multiple consecutive easy successes', () => {
      let card = { ...baseCard, interval_days: 10, ease: 250 };
      
      for (let i = 0; i < 5; i++) {
        const result = calculateNextReview(card, ReviewGrade.EASY);
        expect(result.ease).toBeLessThanOrEqual(300);
        card = { ...card, ...result };
      }
      
      expect(card.ease).toBe(300); // Capped at maximum
    });
  });
});

describe('accuracyToGrade', () => {
  it('converts very low accuracy to AGAIN', () => {
    expect(accuracyToGrade(0)).toBe(ReviewGrade.AGAIN);
    expect(accuracyToGrade(30)).toBe(ReviewGrade.AGAIN);
    expect(accuracyToGrade(59)).toBe(ReviewGrade.AGAIN);
  });

  it('converts moderate accuracy to HARD', () => {
    expect(accuracyToGrade(60)).toBe(ReviewGrade.HARD);
    expect(accuracyToGrade(70)).toBe(ReviewGrade.HARD);
    expect(accuracyToGrade(79)).toBe(ReviewGrade.HARD);
  });

  it('converts good accuracy to GOOD', () => {
    expect(accuracyToGrade(80)).toBe(ReviewGrade.GOOD);
    expect(accuracyToGrade(85)).toBe(ReviewGrade.GOOD);
    expect(accuracyToGrade(89)).toBe(ReviewGrade.GOOD);
  });

  it('converts excellent accuracy to EASY', () => {
    expect(accuracyToGrade(90)).toBe(ReviewGrade.EASY);
    expect(accuracyToGrade(95)).toBe(ReviewGrade.EASY);
    expect(accuracyToGrade(100)).toBe(ReviewGrade.EASY);
  });

  it('handles boundary values correctly', () => {
    expect(accuracyToGrade(59.9)).toBe(ReviewGrade.AGAIN);
    expect(accuracyToGrade(60)).toBe(ReviewGrade.HARD);
    expect(accuracyToGrade(79.9)).toBe(ReviewGrade.HARD);
    expect(accuracyToGrade(80)).toBe(ReviewGrade.GOOD);
    expect(accuracyToGrade(89.9)).toBe(ReviewGrade.GOOD);
    expect(accuracyToGrade(90)).toBe(ReviewGrade.EASY);
  });
});
