import { useState, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { shuffleQuestionChoices } from '@/lib/shuffle';
import { createLogger } from '@/lib/logger';
import type { Question } from '@/types';

const log = createLogger('useQuizSession');

interface UseQuizSessionOptions {
  questions: Question[];
  userId: string | null;
  formId?: string;
}

interface AttemptResult {
  questionId: string;
  selectedIdx: number;
  correctIdx: number;
  isCorrect: boolean;
}

/**
 * Shared hook for managing quiz/drill sessions.
 * Handles answer tracking, attempt recording, and review queue management.
 */
export function useQuizSession({ questions, userId, formId = 'quiz' }: UseQuizSessionOptions) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, number>>(new Map());
  const [results, setResults] = useState<AttemptResult[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get shuffled choices for current question
  const currentShuffled = useMemo(() => {
    const question = questions[currentIndex];
    if (!question) return null;
    
    const seed = userId ? `${userId}-${question.id}` : undefined;
    return shuffleQuestionChoices(question, seed);
  }, [currentIndex, questions, userId]);

  // Calculate correct answer index for current question
  const correctIdx = useMemo(() => {
    const question = questions[currentIndex];
    if (!question) return -1;
    return ['A', 'B', 'C', 'D'].indexOf(question.answer);
  }, [currentIndex, questions]);

  /**
   * Record an attempt to Supabase
   */
  const recordAttempt = useCallback(async (
    questionId: string,
    questionOrd: number,
    selectedIdx: number,
    correctIdx: number,
    choiceOrder: number[]
  ) => {
    if (!userId) return;

    try {
      log.query('attempts', 'insert', { questionId, selectedIdx, correctIdx });
      
      await supabase.from('attempts').insert({
        user_id: userId,
        question_id: questionId,
        form_id: formId,
        question_ord: questionOrd,
        choice_order: choiceOrder,
        correct_idx: correctIdx,
        selected_idx: selectedIdx,
      });

      // Add to review queue if incorrect (spaced repetition)
      if (selectedIdx !== correctIdx) {
        const dueDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
        
        log.query('review_queue', 'insert', { questionId, dueAt: dueDate.toISOString() });
        
        await supabase.from('review_queue').insert({
          user_id: userId,
          question_id: questionId,
          due_at: dueDate.toISOString(),
          interval_days: 2,
        });
      }
    } catch (error) {
      log.error('Failed to record attempt', error);
    }
  }, [userId, formId]);

  /**
   * Handle answer selection for shuffled choices
   */
  const handleShuffledAnswer = useCallback(async (shuffledIndex: number) => {
    if (!currentShuffled || !questions[currentIndex]) return;

    setIsSubmitting(true);

    try {
      // Map shuffled index back to original index
      const originalIndex = currentShuffled.choiceOrder[shuffledIndex];
      const question = questions[currentIndex];
      const isCorrect = originalIndex === correctIdx;

      // Update local state
      setAnswers(prev => new Map(prev).set(question.id, originalIndex));
      setResults(prev => [...prev, {
        questionId: question.id,
        selectedIdx: originalIndex,
        correctIdx,
        isCorrect,
      }]);

      // Record attempt
      await recordAttempt(
        question.id,
        currentIndex + 1,
        originalIndex,
        correctIdx,
        currentShuffled.choiceOrder
      );

      // Move to next question or complete
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setIsComplete(true);
        log.info('Quiz session completed', {
          totalQuestions: questions.length,
          correct: results.filter(r => r.isCorrect).length + (isCorrect ? 1 : 0),
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [currentShuffled, questions, currentIndex, correctIdx, recordAttempt, results]);

  /**
   * Reset the session
   */
  const reset = useCallback(() => {
    setCurrentIndex(0);
    setAnswers(new Map());
    setResults([]);
    setIsComplete(false);
    setIsSubmitting(false);
    log.debug('Quiz session reset');
  }, []);

  // Calculate score
  const score = useMemo(() => {
    if (results.length === 0) return 0;
    const correct = results.filter(r => r.isCorrect).length;
    return Math.round((correct / results.length) * 100);
  }, [results]);

  return {
    // State
    currentIndex,
    currentQuestion: questions[currentIndex] ?? null,
    currentShuffled,
    isComplete,
    isSubmitting,
    answers,
    results,
    score,
    
    // Computed
    totalQuestions: questions.length,
    correctCount: results.filter(r => r.isCorrect).length,
    progress: questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0,
    
    // Actions
    handleShuffledAnswer,
    reset,
    goToQuestion: setCurrentIndex,
  };
}
