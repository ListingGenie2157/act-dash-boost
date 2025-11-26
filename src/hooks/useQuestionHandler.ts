/**
 * Shared hook for handling question answers
 * Extracts repetitive logic from DrillRunner, QuizRunner, etc.
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { Question } from '@/types';

interface UseQuestionHandlerOptions {
  formId?: string;
  onComplete?: () => void;
}

interface QuestionHandlerResult {
  handleAnswer: (question: Question, selectedIdx: number, currentIndex: number) => Promise<void>;
  isSubmitting: boolean;
  error: Error | null;
}

export function useQuestionHandler(
  userId: string | null,
  options: UseQuestionHandlerOptions = {}
): QuestionHandlerResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { formId = 'quiz', onComplete } = options;

  const handleAnswer = useCallback(
    async (question: Question, selectedIdx: number, currentIndex: number) => {
      if (!userId) {
        const err = new Error('User not authenticated');
        logger.error('Question handler: user not authenticated', err);
        setError(err);
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const correctIdx = ['A', 'B', 'C', 'D'].indexOf(question.answer);
        const isCorrect = selectedIdx === correctIdx;

        // Track attempt in database
        const { error: attemptError } = await supabase.from('attempts').insert({
          user_id: userId,
          question_id: question.id,
          form_id: question.form_id ?? formId,
          question_ord: currentIndex + 1,
          choice_order: [0, 1, 2, 3],
          correct_idx: correctIdx,
          selected_idx: selectedIdx,
        });

        if (attemptError) {
          throw attemptError;
        }

        logger.debug('Question attempt recorded', {
          questionId: question.id,
          isCorrect,
          userId,
        });

        // Add to review queue if incorrect (spaced repetition)
        if (!isCorrect) {
          const dueDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
          const { error: reviewError } = await supabase.from('review_queue').insert({
            user_id: userId,
            question_id: question.id,
            due_at: dueDate.toISOString(),
            interval_days: 2,
          });

          if (reviewError) {
            logger.warn('Failed to add question to review queue', { 
              questionId: question.id,
              error: reviewError,
            });
            // Don't throw - this is non-critical
          } else {
            logger.debug('Question added to review queue', { questionId: question.id });
          }
        }

        onComplete?.();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error('Error handling question answer', error, {
          questionId: question.id,
          userId,
        });
        setError(error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [userId, formId, onComplete]
  );

  return { handleAnswer, isSubmitting, error };
}
