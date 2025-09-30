import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getQuestionsBySkill } from '@/lib/content';
import { supabase } from '@/integrations/supabase/client';

interface Question {
  id: string;
  stem: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  answer: string;
  form_id?: string;
}

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
        const n = nParam ? parseInt(nParam) : 10;
        const code = section ?? '';
        const { data, error: qError } = await getQuestionsBySkill(code, n);
        if (qError) {
          setError(qError.message);
        } else {
          setQuestions(Array.isArray(data) ? (data as Question[]) : []);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load questions');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [section, searchParams]);

  const handleAnswer = async (selectedIdx: number) => {
    if (!userId) return;
    const q = questions[current];
    const correctIdx = ['A','B','C','D'].indexOf((q as any).answer);
    try {
      await supabase.from('attempts').insert({
        user_id: userId,
        question_id: q.id,
        form_id: q.form_id ?? 'quiz',
        question_ord: current + 1,
        choice_order: [0,1,2,3],
        correct_idx: correctIdx,
        selected_idx: selectedIdx
      });
      if (selectedIdx !== correctIdx) {
        const dueDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
        await supabase.from('review_queue').insert({
          user_id: userId,
          question_id: q.id,
          due_at: dueDate.toISOString(),
          interval_days: 2
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

  if (loading) return <div className="p-4">Loading quiz...</div>;
  if (error) return <div className="p-4 text-destructive">{error}</div>;
  if (completed) return <div className="p-4">Quiz complete! Great job.</div>;
  if (questions.length === 0) return <div className="p-4">No quiz questions found.</div>;

  const q = questions[current];
  const choices = [q.choice_a, q.choice_b, q.choice_c, q.choice_d];

  return (
    <div className="container mx-auto p-4">
      <h2 className="font-bold mb-4">Quiz Question {current + 1} of {questions.length}</h2>
      <p className="mb-4">{q.stem}</p>
      <div className="space-y-2">
        {choices.map((choice, i) => (
          <button
            key={i}
            className="w-full border rounded-md p-2 text-left hover:bg-muted"
            onClick={() => handleAnswer(i)}
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}
