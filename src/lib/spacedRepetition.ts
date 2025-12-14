/**
 * Spaced Repetition System using the SM-2 Algorithm
 * Based on SuperMemo 2 algorithm for optimal review scheduling
 */

export interface ReviewCard {
  question_id: string;
  user_id: string;
  due_at: string;
  interval_days: number;
  ease: number;
  lapses: number;
}

export enum ReviewGrade {
  AGAIN = 1,    // Complete blackout, < 60%
  HARD = 2,     // Incorrect response but recognized answer, 60-80%
  GOOD = 3,     // Correct response with effort, 80-90%
  EASY = 4      // Perfect recall with no hesitation, > 90%
}

/**
 * Calculate the next review interval and ease factor based on user performance
 * @param card Current review card state
 * @param grade User's performance grade (1-4)
 * @returns Updated card properties
 */
export function calculateNextReview(
  card: ReviewCard,
  grade: ReviewGrade
): Partial<ReviewCard> {
  let newInterval: number;
  let newEase = card.ease;
  let newLapses = card.lapses;

  // Handle failure (Again)
  if (grade === ReviewGrade.AGAIN) {
    newInterval = 1; // Review again tomorrow
    newLapses += 1;
    newEase = Math.max(130, card.ease - 20); // Reduce ease, minimum 130%
  }
  // Handle difficulty (Hard)
  else if (grade === ReviewGrade.HARD) {
    newInterval = Math.max(1, Math.floor(card.interval_days * 1.2));
    newEase = Math.max(130, card.ease - 15);
  }
  // Handle success (Good)
  else if (grade === ReviewGrade.GOOD) {
    if (card.interval_days === 0) {
      newInterval = 1;
    } else if (card.interval_days === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.floor(card.interval_days * (newEase / 100));
    }
  }
  // Handle easy success (Easy)
  else {
    if (card.interval_days === 0) {
      newInterval = 4;
    } else if (card.interval_days === 1) {
      newInterval = 10;
    } else {
      newInterval = Math.floor(card.interval_days * (newEase / 100) * 1.3);
    }
    newEase = card.ease + 15; // Increase ease for easy cards
  }

  // Calculate new due date
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + newInterval);

  return {
    interval_days: newInterval,
    ease: Math.min(300, newEase), // Cap ease at 300%
    lapses: newLapses,
    due_at: dueDate.toISOString()
  };
}

/**
 * Convert accuracy percentage to review grade
 */
export function accuracyToGrade(accuracy: number): ReviewGrade {
  if (accuracy < 60) return ReviewGrade.AGAIN;
  if (accuracy < 80) return ReviewGrade.HARD;
  if (accuracy < 90) return ReviewGrade.GOOD;
  return ReviewGrade.EASY;
}
