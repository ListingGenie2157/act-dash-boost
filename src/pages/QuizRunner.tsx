import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getQuestionsBySkill } from '@/lib/content';
import type { Question } from '@/types';
import { shuffleQuestionChoices } from '@/lib/shuffle';
import { useAuthState } from '@/hooks/useAuthState';
import { useQuestionHandler } from '@/hooks/useQuestionHandler';
import { logger } from '@/lib/logger';

export default function QuizRunner() {
  const { section } = useParams<{ section?: string }>();
  const [searchParams] = useSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [completed, setCompleted] = useState(false);

  const { user, loading: authLoading, error: authError } = useAuthState();
  const userId = user?.id ?? null;

  const handleComplete = useCallback(() => {
    if (current + 1 < questions.length) {
      setCurrent(current + 1);
    } else {
      setCompleted(true);
    }
  }, [current, questions.length]);

  const { handleAnswer: handleQuestionAnswer, isSubmitting } = useQuestionHandler(userId, {
    formId: 'quiz',
    onComplete: handleComplete,
  });

  useEffect(() => {
    if (authLoading) return;
    
    if (authError || !userId) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const nParam = searchParams.get('n');
        const n = nParam ? parseInt(nParam, 10) : 10;
        const code = section ?? '';
        
        logger.debug('Fetching quiz questions', { skillCode: code, count: n });
        
        const { data, error: qError } = await getQuestionsBySkill(code, n);
        
        if (qError) {
          logger.error('Failed to fetch quiz questions', qError, { skillCode: code });
          setError(qError.message);
          return;
        }

        // Map DB questions to Question type with proper defaults
        const mappedQuestions: Question[] = (data ?? []).map(q => ({
          id: q.id,
          stem: q.stem,
          choice_a: q.choice_a,
          choice_b: q.choice_b,
          choice_c: q.choice_c,
          choice_d: q.choice_d,
          answer: q.answer,
          explanation: q.explanation ?? undefined,
          skill_code: q.skill_id,
        }));
        
        setQuestions(mappedQuestions);
        logger.debug('Quiz questions loaded', { count: mappedQuestions.length });
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        logger.error('Failed to load quiz questions', error, { section });
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [section, searchParams, userId, authLoading]);


  // Shuffle current question's choices
  const shuffled = useMemo(() => {
    if (!questions[current]) return null;
    const seed = userId ? `${userId}-${questions[current].id}` : undefined;
    return shuffleQuestionChoices(questions[current], seed);
  }, [current, questions, userId]);

  if (authLoading || loading) return <div className="p-4">Loading quiz...</div>;
  if (error) return <div className="p-4 text-destructive">{error}</div>;
  if (completed) return <div className="p-4">Quiz complete! Great job.</div>;
  if (questions.length === 0) return <div className="p-4">No quiz questions found.</div>;
  if (!shuffled) return <div className="p-4">Loading question...</div>;

  const handleShuffledAnswer = useCallback(async (shuffledIndex: number) => {
    if (!shuffled || !questions[current]) return;
    
    // Map shuffled index back to original index
    const originalIndex = shuffled.choiceOrder[shuffledIndex];
    await handleQuestionAnswer(questions[current], originalIndex, current);
  }, [shuffled, questions, current, handleQuestionAnswer]);

  return (
    <div className="container mx-auto p-4">
      <h2 className="font-bold mb-4">Quiz Question {current + 1} of {questions.length}</h2>
      <p className="mb-4">{shuffled.original.stem}</p>
      <div className="space-y-2">
        {shuffled.choices.map((choice, i) => (
          <button
            key={i}
            className="w-full border rounded-md p-2 text-left hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => handleShuffledAnswer(i)}
            disabled={isSubmitting}
          >
            <span className="font-semibold mr-2">{['A', 'B', 'C', 'D'][i]})</span>
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}
