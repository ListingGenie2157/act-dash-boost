import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getAccommodatedTime } from '@/utils/accommodations';

interface Question {
  ord: number;
  question_id: string;
  question: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  answer: string;
  explanation: string;
  passage_text?: string;
  passage_title?: string;
}

interface Attempt {
  question_id: string;
  choice_order: number[];
  correct_idx: number;
  selected_idx?: number;
  question_ord: number;
}

const TIMERS = {
  ONB: 20 * 60, // 20 minutes
  D2EN: 20 * 60, // 20 minutes  
  D2MA: 25 * 60, // 25 minutes
  D2RD: 18 * 60, // 18 minutes
  D2SCI: 18 * 60, // 18 minutes
  // Official ACT section timers
  EN_A: 45 * 60, EN_B: 45 * 60, EN_C: 45 * 60, // 45 minutes
  MATH_A: 60 * 60, MATH_B: 60 * 60, MATH_C: 60 * 60, // 60 minutes
  RD_A: 35 * 60, RD_B: 35 * 60, RD_C: 35 * 60, // 35 minutes
  SCI_A: 35 * 60, SCI_B: 35 * 60, SCI_C: 35 * 60, // 35 minutes
};

// Seeded shuffle function
function shuffle<T>(array: T[], seed: number): T[] {
  const arr = [...array];
  let m = arr.length;
 const random = () => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

  
  while (m) {
    const i = Math.floor(random() * m--);
    [arr[m], arr[i]] = [arr[i], arr[m]];
  }
  return arr;
}

export default function DiagnosticTest() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempts, setAttempts] = useState<Record<string, Attempt>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (formId) {
      loadDiagnostic();
    }
  }, [formId]);

useEffect(() => {
  if (!formId) return;
  let cancelled = false;

  (async () => {
    if (cancelled) return;
    await loadDiagnostic();
  })();

  return () => {
    cancelled = true;
  };
}, [formId]);

// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => {
  if (timeLeft > 0) {
    const timer = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }
  if (timeLeft === 0 && questions.length > 0 && !submitting) {
    handleSubmit();
  }
}, [timeLeft, questions.length, submitting]);

  const loadDiagnostic = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
if (!user) {

        navigate('/login');
        return;
      }

      // Load questions
      const { data, error } = await supabase
        .from('v_form_section')
        .select('*')
        .eq('form_id', formId)
        .order('section', { ascending: true })
        .order('ord', { ascending: true });

      if (error) throw error;

      setQuestions(data || []);
      const baseTime = TIMERS[formId as keyof typeof TIMERS] || 1200;
      const accommodatedTime = await getAccommodatedTime(baseTime);
      setTimeLeft(accommodatedTime);

      // Load or create attempts with choice shuffling
      const existingAttempts: Record<string, Attempt> = {};
      const newAttempts: Attempt[] = [];

     const questionIds = (data || []).map(q => q.question_id);
const { data: existingRows, error: attemptsErr } = questionIds.length
  ? await supabase.from('attempts')
      .select('*')
      .eq('user_id', user.id)
      .eq('form_id', formId)
      .in('question_id', questionIds)
  : { data: [], error: null };
if (attemptsErr) throw attemptsErr;

const existingMap: Record<string, Attempt> = {};
(existingRows || []).forEach(row => {
  existingMap[row.question_id] = row as unknown as Attempt;
});

for (const question of data || []) {
  const existing = existingMap[question.question_id];
  if (existing) {
    existingAttempts[question.question_id] = existing;
    continue;
  }
  const answerMap = { A: 0, B: 1, C: 2, D: 3 } as const;
  const baseIdx = answerMap[question.answer as keyof typeof answerMap];
  const choiceOrder = shuffle([0, 1, 2, 3], Date.now() + question.ord);
  const correctIdx = choiceOrder.indexOf(baseIdx);

  const attempt: Attempt = {
    question_id: question.question_id,
    choice_order: choiceOrder,
    correct_idx: correctIdx,
    question_ord: question.ord,
  };
  existingAttempts[question.question_id] = attempt;
  newAttempts.push(attempt);
}
  
      // Save new attempts to database
      if (newAttempts.length > 0) {
        const { error: insertError } = await supabase
          .from('attempts')
          .insert(
            newAttempts.map(attempt => ({
              user_id: user.id,
              form_id: formId,
              ...attempt
            }))
          );

        if (insertError) throw insertError;
      }

      setAttempts(existingAttempts);
    } catch (error) {
      console.error('Error loading diagnostic:', error);
      toast({
        title: "Error",
        description: "Failed to load diagnostic test",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = async (choiceIndex: number) => {
    const question = questions[currentIndex];
    const attempt = attempts[question.question_id];
    
    if (!attempt) return;

    const updatedAttempt = { ...attempt, selected_idx: choiceIndex };
    setAttempts(prev => ({ ...prev, [question.question_id]: updatedAttempt }));

    // Save to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
if (!user) return;

await supabase
  .from('attempts')
  .update({ selected_idx: choiceIndex })
  .eq('user_id', user.id)
  .eq('form_id', formId)
  .eq('question_id', question.question_id);

    } catch (error) {
      console.error('Error saving answer:', error);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
if (!user) return;

// Calculate results
const results = calculateResults();
      
      // Call finish-diagnostic edge function
      const { data, error } = await supabase.functions.invoke('finish-diagnostic', {
        body: {
          section: formId?.startsWith('D2') ? formId.slice(2) : formId,
          blocks: [{
            questions: questions.map(q => ({ 
              id: q.question_id, 
              skill_tags: [q.passage_title || 'general'] 
            })),
            answers: Object.entries(attempts).map(([questionId, attempt]) => ({
              questionId,
              selectedAnswer: attempt.selected_idx?.toString() || '',
              isCorrect: attempt.selected_idx === attempt.correct_idx
            }))
          }]
        }
      });

      if (error) throw error;

      // Navigate to results
      navigate(`/diagnostic-results/${formId}`, { 
        state: { results: data, formId } 
      });

    } catch (error) {
      console.error('Error submitting diagnostic:', error);
      toast({
        title: "Error",
        description: "Failed to submit diagnostic test",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const calculateResults = () => {
    let correct = 0;
    let total = 0;

    questions.forEach(question => {
      const attempt = attempts[question.question_id];
      if (attempt && attempt.selected_idx !== undefined) {
        total++;
        if (attempt.selected_idx === attempt.correct_idx) {
          correct++;
        }
      }
    });

    return { correct, total, percentage: total > 0 ? (correct / total) * 100 : 0 };
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getShuffledChoices = (question: Question) => {
    const attempt = attempts[question.question_id];
    if (!attempt) return [];

    const choices = [question.choice_a, question.choice_b, question.choice_c, question.choice_d];
    return attempt.choice_order.map(i => choices[i]);
  };

  const isAnswered = (questionId: string) => {
    return attempts[questionId]?.selected_idx !== undefined;
  };

  const allQuestionsAnswered = () => {
    return questions.every(q => isAnswered(q.question_id));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading diagnostic test...</p>
        </div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center">No questions found for this diagnostic.</p>
            <Button 
              onClick={() => navigate('/')} 
              className="w-full mt-4"
            >
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const shuffledChoices = getShuffledChoices(currentQuestion);
  const currentAttempt = attempts[currentQuestion.question_id];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            {formId} Diagnostic - Question {currentIndex + 1} of {questions.length}
          </h1>
          <div className="text-lg font-mono">
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Progress */}
        <Progress value={progress} className="w-full" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Passage (if exists) */}
          {currentQuestion.passage_text && (
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>{currentQuestion.passage_title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  {currentQuestion.passage_text}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Question */}
          <Card className={currentQuestion.passage_text ? "lg:col-span-2" : "lg:col-span-3"}>
            <CardHeader>
              <CardTitle>Question {currentQuestion.ord}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg">{currentQuestion.question}</p>
              
              <div className="space-y-2">
                {shuffledChoices.map((choice, index) => (
                  <Button
                    key={index}
                    variant={currentAttempt?.selected_idx === index ? "default" : "outline"}
                    className="w-full text-left justify-start h-auto p-4"
                    onClick={() => handleAnswerSelect(index)}
                  >
                    <span className="font-medium mr-2">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    {choice}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
          >
            Previous
          </Button>

          <div className="flex gap-2">
            {questions.map((_, index) => (
              <Button
                key={index}
                variant={index === currentIndex ? "default" : "outline"}
                size="sm"
                className={`w-8 h-8 p-0 ${isAnswered(questions[index].question_id) ? 'bg-green-100' : ''}`}
                onClick={() => setCurrentIndex(index)}
              >
                {index + 1}
              </Button>
            ))}
          </div>

          {currentIndex === questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={!allQuestionsAnswered() || submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? 'Submitting...' : 'Submit Test'}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
              disabled={currentIndex === questions.length - 1}
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
