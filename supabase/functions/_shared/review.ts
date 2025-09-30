// Shared review system utilities for spaced repetition learning
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

export type StudyMode = 'MASTERY' | 'CRASH' | 'ACCEL';

export type Choice = 'A' | 'B' | 'C' | 'D';

export interface WrongAnswer {
  questionId: string;
  chosen: Choice;
  elapsedMs: number;
}

export type ReviewMode = StudyMode;

interface ReviewQueueEntry {
  user_id: string;
  question_id: string;
  due_at: string;
  interval_days: number;
  ease: number;
  lapses: number;
  created_at?: string;
}

interface UpdateReviewResponse {
  success: boolean;
  data?: ReviewQueueEntry;
  interval_days?: number;
  due_at?: string;
  ease?: number;
  lapses?: number;
  error?: string;
}

/**
 * Calculate the next review interval based on study mode and previous performance
 * @param mode - Study mode (MASTERY or CRASH)
 * @param prevInterval - Previous interval in days
 * @param lapse - Whether the user got the question wrong (true = wrong, false = correct)
 * @returns Next interval in days
 */
export function nextInterval(mode: StudyMode, prevInterval: number, lapse: boolean): number {
  if (mode === 'MASTERY') {
    // MASTERY mode: 1, 4, 10, 21 day intervals
    const masteryIntervals = [1, 4, 10, 21];
    
    if (lapse) {
      // If lapse, reset to beginning of sequence
      return 1;
    }
    
    // Find current position in sequence and advance
    const currentIndex = masteryIntervals.indexOf(prevInterval);
    if (currentIndex === -1) {
      // Not in sequence, start from beginning
      return 1;
    }
    
    if (currentIndex >= masteryIntervals.length - 1) {
      // At end of sequence, maintain maximum interval
      return masteryIntervals[masteryIntervals.length - 1];
    }
    
    return masteryIntervals[currentIndex + 1];
  } else {
    // CRASH mode: 0, 1, 3 day intervals (faster review cycle)
    const crashIntervals = [0, 1, 3];
    
    if (lapse) {
      // If lapse, reset to beginning
      return 0;
    }
    
    // Find current position and advance
    const currentIndex = crashIntervals.indexOf(prevInterval);
    if (currentIndex === -1) {
      // Not in sequence, start from beginning
      return 0;
    }
    
    if (currentIndex >= crashIntervals.length - 1) {
      // At end of sequence, maintain maximum interval
      return crashIntervals[crashIntervals.length - 1];
    }
    
    return crashIntervals[currentIndex + 1];
  }
}

/**
 * Update the review queue based on user's answer
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param questionId - Question ID
 * @param correct - Whether the answer was correct
 * @param mode - Current study mode
 * @returns Promise with the updated review queue entry
 */
export async function updateReviewQueueOnAnswer(
  supabase: SupabaseClient,
  userId: string,
  questionId: string,
  correct: boolean,
  mode: ReviewMode
): Promise<UpdateReviewResponse> {
  try {
    // Get current review queue entry
    const { data: currentEntry, error: fetchError } = await supabase
      .from('review_queue')
      .select('*')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found" - that's ok, we'll create a new entry
      throw fetchError;
    }

    const now = new Date();
    const currentInterval = currentEntry?.interval_days || 0;
    const currentLapses = currentEntry?.lapses || 0;
    const currentEase = currentEntry?.ease || 250; // Default ease factor (2.5)

    // Calculate next interval
    const nextIntervalDays = nextInterval(mode, currentInterval, !correct);
    
    // Calculate new due date
    const dueAt = new Date(now);
    dueAt.setDate(dueAt.getDate() + nextIntervalDays);

    // Update ease factor (simplified SM-2 algorithm)
    let newEase = currentEase;
    if (correct) {
      // Increase ease slightly for correct answers
      newEase = Math.min(300, currentEase + 10);
    } else {
      // Decrease ease for incorrect answers
      newEase = Math.max(130, currentEase - 20);
    }

    // Update lapses count
    const newLapses = correct ? currentLapses : currentLapses + 1;

    // Upsert the review queue entry
    const { data, error } = await supabase
      .from('review_queue')
      .upsert({
        user_id: userId,
        question_id: questionId,
        due_at: dueAt.toISOString(),
        interval_days: nextIntervalDays,
        ease: newEase,
        lapses: newLapses
      }, {
        onConflict: 'user_id,question_id'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      data,
      interval_days: nextIntervalDays,
      due_at: dueAt.toISOString(),
      ease: newEase,
      lapses: newLapses
    };

  } catch (error) {
    console.error('Error updating review queue:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update review queue'
    };
  }
}

/**
 * Get today's date in Chicago timezone as ISO string (YYYY-MM-DD)
 */
export function getTodayInChicago(): string {
  const now = new Date();
  const chicagoTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now);
  
  const year = chicagoTime.find(part => part.type === 'year')?.value;
  const month = chicagoTime.find(part => part.type === 'month')?.value;
  const day = chicagoTime.find(part => part.type === 'day')?.value;
  
  return `${year}-${month}-${day}`;
}