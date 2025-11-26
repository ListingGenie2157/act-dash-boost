import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';

/**
 * Mastery thresholds and levels
 */
export const MASTERY_THRESHOLDS = {
  BEGINNER: 0,      // 0-59% accuracy
  LEARNING: 60,     // 60-74% accuracy
  PROFICIENT: 75,   // 75-89% accuracy
  MASTERED: 90,     // 90-100% accuracy
} as const;

export const MASTERY_MIN_ATTEMPTS = 1; // Minimum attempts before calculating mastery

export type MasteryLevel = 'beginner' | 'learning' | 'proficient' | 'mastered' | 'not-started';

export interface MasteryData {
  skill_id: string;
  user_id: string;
  correct: number;
  total: number;
  accuracy: number;
  level: MasteryLevel;
  avg_time_ms: number;
  last_updated: string;
}

/**
 * Calculate mastery level based on accuracy and attempts
 */
export function calculateMasteryLevel(correct: number, total: number): MasteryLevel {
  if (total === 0) return 'not-started';
  if (total < MASTERY_MIN_ATTEMPTS) return 'learning';
  
  const accuracy = (correct / total) * 100;
  
  if (accuracy >= MASTERY_THRESHOLDS.MASTERED) return 'mastered';
  if (accuracy >= MASTERY_THRESHOLDS.PROFICIENT) return 'proficient';
  if (accuracy >= MASTERY_THRESHOLDS.LEARNING) return 'learning';
  return 'beginner';
}

/**
 * Get mastery color scheme for UI
 */
export function getMasteryColor(level: MasteryLevel): {
  bg: string;
  text: string;
  border: string;
  icon: string;
} {
  switch (level) {
    case 'mastered':
      return {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-400',
        border: 'border-green-300 dark:border-green-700',
        icon: '🏆',
      };
    case 'proficient':
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-300 dark:border-blue-700',
        icon: '⭐',
      };
    case 'learning':
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-700 dark:text-yellow-400',
        border: 'border-yellow-300 dark:border-yellow-700',
        icon: '📚',
      };
    case 'beginner':
      return {
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        text: 'text-orange-700 dark:text-orange-400',
        border: 'border-orange-300 dark:border-orange-700',
        icon: '🌱',
      };
    case 'not-started':
      return {
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-600 dark:text-gray-400',
        border: 'border-gray-300 dark:border-gray-700',
        icon: '⚪',
      };
  }
}

/**
 * Get mastery display label
 */
export function getMasteryLabel(level: MasteryLevel): string {
  switch (level) {
    case 'mastered': return 'Mastered';
    case 'proficient': return 'Proficient';
    case 'learning': return 'Learning';
    case 'beginner': return 'Beginner';
    case 'not-started': return 'Not Started';
  }
}

/**
 * Fetch mastery data for a specific skill
 */
export async function getSkillMastery(skillId: string, userId: string): Promise<MasteryData | null> {
  const { data, error } = await supabase
    .from('mastery')
    .select('skill_id, user_id, correct, total, avg_time_ms, last_updated')
    .eq('skill_id', skillId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;

  const accuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0;
  const level = calculateMasteryLevel(data.correct, data.total);

  return {
    ...data,
    accuracy,
    level,
  };
}

/**
 * Fetch all mastery data for a user
 */
export async function getAllUserMastery(userId: string): Promise<Map<string, MasteryData>> {
  const { data, error } = await supabase
    .from('mastery')
    .select('skill_id, user_id, correct, total, avg_time_ms, last_updated')
    .eq('user_id', userId);

  const masteryMap = new Map<string, MasteryData>();

  if (error || !data) return masteryMap;

  data.forEach((record) => {
    const accuracy = record.total > 0 ? (record.correct / record.total) * 100 : 0;
    const level = calculateMasteryLevel(record.correct, record.total);

    masteryMap.set(record.skill_id, {
      ...record,
      accuracy,
      level,
    });
  });

  return masteryMap;
}

/**
 * Update mastery after completing a quiz/drill
 */
export async function updateMastery(
  userId: string,
  skillId: string,
  correct: boolean,
  timeMs: number
): Promise<void> {
  // Fetch current mastery record
  const { data: current } = await supabase
    .from('mastery')
    .select('correct, total, avg_time_ms')
    .eq('user_id', userId)
    .eq('skill_id', skillId)
    .maybeSingle();

  const newCorrect = (current?.correct || 0) + (correct ? 1 : 0);
  const newTotal = (current?.total || 0) + 1;
  
  // Calculate new average time (weighted)
  const oldAvgTime = current?.avg_time_ms || 0;
  const oldTotal = current?.total || 0;
  const newAvgTime = oldTotal > 0
    ? Math.round((oldAvgTime * oldTotal + timeMs) / newTotal)
    : timeMs;

  // Upsert the mastery record
  const { error } = await supabase
    .from('mastery')
    .upsert({
      user_id: userId,
      skill_id: skillId,
      correct: newCorrect,
      total: newTotal,
      avg_time_ms: newAvgTime,
      last_updated: new Date().toISOString(),
    }, {
      onConflict: 'user_id,skill_id'
    });

  if (error) {
    logger.error('Error updating mastery', error, { userId, skillId });
  } else {
    logger.debug('Mastery updated', { userId, skillId, correct: newCorrect, total: newTotal });
  }
}

/**
 * Batch update mastery for multiple questions (quiz completion)
 */
export async function batchUpdateMastery(
  userId: string,
  results: Array<{ skillId: string; correct: boolean; timeMs: number }>
): Promise<void> {
  // Treat each question as one attempt
  for (const { skillId, correct, timeMs } of results) {
    await updateMastery(userId, skillId, correct, timeMs);
  }
}

