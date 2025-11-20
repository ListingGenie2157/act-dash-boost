import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getQuestionsBySkill } from '@/lib/content';
import { supabase } from '@/integrations/supabase/client';
import type { Question } from '@/types';
import { shuffleQuestionChoices } from '@/lib/shuffle';
import { TutorTrigger } from '@/components/tutor/TutorTrigger';
import { mapToTutorSubject } from '@/lib/tutorSubjectMapper';

export default function QuizRunner() {
  const { section } = useParams<{ section?: string }>();
  const [searchParams] = useSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }
        setUserId(user.id);
        const nParam = searchParams.get('n');
        const n = nParam ? parseInt(nParam, 10) : 10;
        const code = section ?? '';
        const { data, error: qError } = await getQuestionsBySkill(code, n);
        if (qError) {
          setError(qError.message);
        } else {
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
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load questions');
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [section, searchParams]);

  const handleAnswer = async (selectedIdx: number) => {
    if (!userId) return;
    const q = questions[current];
    if (!q) return;
    
    const correctIdx = ['A', 'B', 'C', 'D'].indexOf(q.answer);
    try {
      await supabase.from('attempts').insert({
        user_id: userId,
        question_id: q.id,
        form_id: q.form_id ?? 'quiz',
        question_ord: current + 1,
        choice_order: [0, 1, 2, 3],
        correct_idx: correctIdx,
        selected_idx: selectedIdx,
      });
      if (selectedIdx !== correctIdx) {
        const dueDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
        await supabase.from('review_queue').insert({
          user_id: userId,
          question_id: q.id,
          due_at: dueDate.toISOString(),
          interval_days: 2,
        });
      }
    } catch (err) {
      console.error(err);
    }
    if (current + 1 < questions.length) {
      setCurrent(current + 1);
    } else {
      setCompleted(true);
    }
  };

  // Shuffle current question's choices
  const shuffled = useMemo(() => {
    if (!questions[current]) return null;
    const seed = userId ? `${userId}-${questions[current].id}` : undefined;
    return shuffleQuestionChoices(questions[current], seed);
  }, [current, questions, userId]);

  if (loading) return <div className="p-4">Loading quiz...</div>;
  if (error) return <div className="p-4 text-destructive">{error}</div>;
  if (completed) return <div className="p-4">Quiz complete! Great job.</div>;
  if (questions.length === 0) return <div className="p-4">No quiz questions found.</div>;
  if (!shuffled) return <div className="p-4">Loading question...</div>;

  const handleShuffledAnswer = async (shuffledIndex: number) => {
    if (!shuffled) return;
    
    // Map shuffled index back to original index
    const originalIndex = shuffled.choiceOrder[shuffledIndex];
    await handleAnswer(originalIndex);
  };

  return (
    <div className="container mx-auto p-4">
      <TutorTrigger
        subject={mapToTutorSubject(section || 'english')}
        topic={questions[current]?.skill_code || 'general'}
        mode="quiz"
        problem={shuffled ? {
          id: shuffled.original.id,
          text: shuffled.original.stem,
          choices: [shuffled.original.choice_a, shuffled.original.choice_b, shuffled.original.choice_c, shuffled.original.choice_d],
        } : null}
        variant="floating"
      />
      <h2 className="font-bold mb-4">Quiz Question {current + 1} of {questions.length}</h2>
      <p className="mb-4">{shuffled.original.stem}</p>
      <div className="space-y-2">
        {shuffled.choices.map((choice, i) => (
          <button
            key={i}
            className="w-full border rounded-md p-2 text-left hover:bg-muted"
            onClick={() => handleShuffledAnswer(i)}
          >
            <span className="font-semibold mr-2">{['A', 'B', 'C', 'D'][i]})</span>
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}
