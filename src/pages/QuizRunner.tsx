import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { QuizComponent } from '@/components/QuizComponent';
import { Button } from '@/components/ui/button';
import { getRandomBankQuestions, gradeBankAnswer, recordBankAttempt, toLegacyQuestions, type BankQuestion } from '@/lib/bank';
import { reportError } from '@/lib/errorReporter';

/**
 * Skill quiz (/quiz/:skillCode?n=10). Draws a fresh random set from the question bank
 * each time and grades each answer server-side.
 */
export default function QuizRunner() {
  const { section } = useParams<{ section?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [bankQuestions, setBankQuestions] = useState<BankQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const skillCode = (section ?? '').trim().toUpperCase();
  const count = Math.min(Math.max(parseInt(searchParams.get('n') ?? '10', 10) || 10, 1), 30);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }
        setUserId(user.id);
        const questions = await getRandomBankQuestions(skillCode, count);
        setBankQuestions(questions);
        if (questions.length === 0) setError(`No practice questions found for skill "${skillCode}".`);
      } catch (err) {
        reportError(err instanceof Error ? err : new Error(String(err)), { page: 'QuizRunner' });
        setError('Failed to load quiz questions.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [skillCode, count, navigate]);

  const questions = useMemo(() => toLegacyQuestions(bankQuestions), [bankQuestions]);
  const formIdById = useMemo(
    () => new Map(bankQuestions.map(q => [String(q.staging_id), q.form_id])),
    [bankQuestions]
  );

  const persistAnswer = async (questionId: string, selectedIdx: number, correctIdx: number, choiceOrder: number[], timeMs: number) => {
    if (!userId) return;
    try {
      await recordBankAttempt({
        userId,
        questionId,
        skillCode,
        formId: formIdById.get(questionId),
        questionOrd: questions.findIndex(q => q.id === questionId) + 1,
        choiceOrder,
        selectedIdx,
        correctIdx,
        timeMs,
      });
    } catch (err) {
      reportError(err instanceof Error ? err : new Error(String(err)), { page: 'QuizRunner', source: 'persist' });
    }
  };

  if (loading) return <div className="p-4">Loading quiz...</div>;

  if (error || questions.length === 0) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <p className="text-muted-foreground">{error ?? 'No quiz questions found.'}</p>
        <Button variant="outline" onClick={() => navigate('/lessons')}>Back to Lessons</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <QuizComponent
        questions={questions}
        title={`Skill Quiz – ${skillCode}`}
        skillCode={skillCode}
        gradeAnswer={(id) => gradeBankAnswer(id)}
        onAnswerGraded={(id, selected, correct, order, timeMs) => void persistAnswer(id, selected, correct, order, timeMs)}
        onComplete={() => { /* results are shown by QuizComponent */ }}
        onBack={() => navigate(-1)}
      />
    </div>
  );
}
