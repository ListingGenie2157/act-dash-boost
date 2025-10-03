import { useMemo } from 'react';
import { shuffleQuestionChoices, type ShuffledQuestion } from '@/lib/shuffle';

/**
 * Hook to get a question with shuffled choices
 * Uses userId as seed for consistent shuffling per user
 */
export function useShuffledQuestion<T extends {
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  answer: string;
  id?: string;
}>(question: T | null | undefined, userId?: string): ShuffledQuestion<T> | null {
  return useMemo(() => {
    if (!question) return null;
    
    // Use userId + questionId as seed for consistent shuffling
    const seed = userId && question.id ? `${userId}-${question.id}` : undefined;
    
    return shuffleQuestionChoices(question, seed);
  }, [question, userId, question?.id]);
}

/**
 * Hook to shuffle multiple questions at once
 */
export function useShuffledQuestions<T extends {
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  answer: string;
  id?: string;
}>(questions: T[], userId?: string): ShuffledQuestion<T>[] {
  return useMemo(() => {
    return questions.map(question => {
      const seed = userId && question.id ? `${userId}-${question.id}` : undefined;
      return shuffleQuestionChoices(question, seed);
    });
  }, [questions, userId]);
}
