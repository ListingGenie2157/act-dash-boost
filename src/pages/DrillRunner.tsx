import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Question } from '@/types';
import { shuffleQuestionChoices } from '@/lib/shuffle';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function DrillRunner() {
  const navigate = useNavigate();
  const { subject } = useParams<{ subject?: string }>();
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

        if (!subject) {
          setError('No subject specified');
          setLoading(false);
          return;
        }

        const nParam = searchParams.get('n');
        const n = nParam ? parseInt(nParam, 10) : 10;

        // Fetch questions from staging_items instead of questions table
        const { data, error: qError } = await supabase
          .from('staging_items')
          .select('*')
          .eq('section', decodeURIComponent(subject))
          .limit(n);

        if (qError) {
          setError(qError.message);
        } else if (!data || data.length === 0) {
          setError('No questions found for this section');
        } else {
          // Map staging_items to Question type
          const mappedQuestions: Question[] = data.map((q, idx) => ({
            id: `${subject}_${idx}`,
            stem: q.question,
            choice_a: q.choice_a,
            choice_b: q.choice_b,
            choice_c: q.choice_c,
            choice_d: q.choice_d,
            answer: q.answer as 'A' | 'B' | 'C' | 'D',
            explanation: q.explanation ?? undefined,
            skill_code: q.skill_code,
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
  }, [subject, searchParams]);

  const handleAnswer = async (selectedIdx: number) => {
    if (!userId) return;
    const q = questions[current];
    if (!q) return;
    
    const correctIdx = ['A', 'B', 'C', 'D'].indexOf(q.answer);
    try {
      await supabase.from('attempts').insert({
        user_id: userId,
        question_id: q.id,
        form_id: q.form_id ?? 'drill',
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

  if (loading) return (
    <div className="container mx-auto p-4">
      <Button variant="outline" onClick={() => navigate('/drill-runner')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Drills
      </Button>
      <div className="mt-4">Loading questions...</div>
    </div>
  );

  if (error) return (
    <div className="container mx-auto p-4">
      <Button variant="outline" onClick={() => navigate('/drill-runner')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Drills
      </Button>
      <div className="mt-4 text-destructive">{error}</div>
    </div>
  );

  if (completed) return (
    <div className="container mx-auto p-4">
      <Button variant="outline" onClick={() => navigate('/drill-runner')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Drills
      </Button>
      <div className="mt-4">Drill complete! Nice work.</div>
    </div>
  );

  if (questions.length === 0) return (
    <div className="container mx-auto p-4">
      <Button variant="outline" onClick={() => navigate('/drill-runner')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Drills
      </Button>
      <div className="mt-4">No questions found.</div>
    </div>
  );

  if (!shuffled) return <div className="p-4">Loading question...</div>;

  const handleShuffledAnswer = async (shuffledIndex: number) => {
    if (!shuffled) return;
    
    // Map shuffled index back to original index
    const originalIndex = shuffled.choiceOrder[shuffledIndex];
    await handleAnswer(originalIndex);
  };

  return (
    <div className="container mx-auto p-4">
      <Button
        variant="outline"
        onClick={() => navigate('/drill-runner')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Drills
      </Button>
      <h2 className="font-bold mb-4">Drill Question {current + 1} of {questions.length}</h2>
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
