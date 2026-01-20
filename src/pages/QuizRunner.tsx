import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getQuestionsBySkill } from '@/lib/content';
import { supabase } from '@/integrations/supabase/client';
import type { Question } from '@/types';
import { shuffleQuestionChoices } from '@/lib/shuffle';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function QuizRunner() {
  const { section } = useParams<{ section?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

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
    const isCorrect = selectedIdx === correctIdx;
    if (isCorrect) setCorrectCount(c => c + 1);

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

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">{error}</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="container mx-auto p-4 max-w-md">
        <Card>
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Quiz Complete!</h2>
              <p className="text-muted-foreground">Great job finishing the quiz.</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-3xl font-bold text-primary">
                {correctCount}/{questions.length}
              </div>
              <div className="text-sm text-muted-foreground">Correct Answers</div>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate('/')}>
                Return to Dashboard
              </Button>
              <Button variant="outline" onClick={() => navigate(-1)}>
                Back to Lesson
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No quiz questions found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!shuffled) {
    return <LoadingSpinner />;
  }

  const handleShuffledAnswer = async (shuffledIndex: number) => {
    if (!shuffled) return;
    
    // Map shuffled index back to original index
    const originalIndex = shuffled.choiceOrder[shuffledIndex];
    await handleAnswer(originalIndex);
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Exit Quiz
        </Button>
        <Badge variant="secondary">
          {current + 1} / {questions.length}
        </Badge>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <h2 className="font-bold mb-4">Question {current + 1}</h2>
          <p className="mb-6 text-lg">{shuffled.original.stem}</p>
          <div className="space-y-3" role="radiogroup" aria-label="Answer choices">
            {shuffled.choices.map((choice, i) => (
              <button
                key={i}
                className="w-full border rounded-lg p-4 text-left hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                onClick={() => handleShuffledAnswer(i)}
                aria-label={`Answer ${['A', 'B', 'C', 'D'][i]}: ${choice}`}
              >
                <span className="font-semibold mr-2">{['A', 'B', 'C', 'D'][i]}.</span>
                {choice}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
