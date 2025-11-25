import { useState, useEffect } from 'react';
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

// Stable hash function for deterministic shuffling
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

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
  const params = useParams<{ formId?: string }>();
  const formId = params.formId!; // Assert non-null - we validate in render
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [questions, setQuestions] = useState<(Question & { skill_id?: string | null })[]>([]);
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
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && questions.length > 0) {
      handleSubmit();
    }
  }, [timeLeft]);

  const loadDiagnostic = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        navigate('/login');
        return;
      }

      // Load questions from staging_items (like DrillRunner)
      const { data, error } = await supabase
        .from('staging_items')
        .select('*')
        .eq('form_id', formId)
        .order('ord', { ascending: true });

      if (error) throw error;

      // Fetch all skills for skill_id lookup
      const skillCodes = Array.from(new Set((data || []).map(q => q.skill_code).filter(Boolean)));
      const { data: skillsData } = await supabase
        .from('skills')
        .select('id, code')
        .or(skillCodes.map(code => `id.eq.${code},code.eq.${code}`).join(','));

      // Create skill lookup map
      const skillMap = new Map<string, string>();
      skillsData?.forEach(skill => {
        const normalized = skill.id.trim().toUpperCase();
        skillMap.set(normalized, skill.id);
        if (skill.code) {
          skillMap.set(skill.code.trim().toUpperCase(), skill.id);
        }
      });

      // Map staging_items to Question type with skill_id resolution
      const mappedQuestions: (Question & { skill_id?: string | null })[] = (data || []).map(q => {
        let skill_id: string | null = null;
        
        if (q.skill_code) {
          const normalized = q.skill_code.trim().toUpperCase();
          skill_id = skillMap.get(normalized) || null;
        }
        
        return {
          ord: q.ord ?? 0,
          question_id: String(q.staging_id || ''),
          question: q.question ?? '',
          choice_a: q.choice_a ?? '',
          choice_b: q.choice_b ?? '',
          choice_c: q.choice_c ?? '',
          choice_d: q.choice_d ?? '',
          answer: q.answer ?? 'A',
          explanation: q.explanation ?? '',
          passage_text: q.passage_text ?? undefined,
          passage_title: q.passage_title ?? undefined,
          skill_id
        };
      });

      setQuestions(mappedQuestions);
      const baseTime = TIMERS[formId as keyof typeof TIMERS] || 1200;
      const accommodatedTime = await getAccommodatedTime(baseTime);
      setTimeLeft(accommodatedTime);

      // Load or create attempts with choice shuffling
      const existingAttempts: Record<string, Attempt> = {};
      const newAttempts: Attempt[] = [];

      for (const question of mappedQuestions) {
        const { data: existing } = await supabase
          .from('attempts')
          .select('*')
          .eq('user_id', user.user.id)
          .eq('form_id', formId)
          .eq('question_id', question.question_id)
          .maybeSingle();

        if (existing) {
          existingAttempts[question.question_id] = {
            question_id: existing.question_id,
            choice_order: existing.choice_order,
            correct_idx: existing.correct_idx,
            selected_idx: existing.selected_idx ?? undefined,
            question_ord: existing.question_ord,
          };
        } else {
          // Create new attempt with shuffled choices using stable seed
          const answerMap = { A: 0, B: 1, C: 2, D: 3 };
          const baseIdx = answerMap[question.answer as keyof typeof answerMap] ?? 0;
          const stableSeed = hashCode(`${user.user.id}-${formId}-${question.question_id}`);
          const choiceOrder = shuffle([0, 1, 2, 3], stableSeed);
          const correctIdx = choiceOrder.indexOf(baseIdx);

          const attempt: Attempt = {
            question_id: question.question_id,
            choice_order: choiceOrder,
            correct_idx: correctIdx,
            question_ord: question.ord
          };

          existingAttempts[question.question_id] = attempt;
          newAttempts.push(attempt);
        }
      }

      // Save new attempts to database
      if (newAttempts.length > 0) {
        const { error: insertError } = await supabase
          .from('attempts')
          .insert(
            newAttempts.map(attempt => ({
              user_id: user.user.id,
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
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      await supabase
        .from('attempts')
        .update({ selected_idx: choiceIndex })
        .eq('user_id', user.user.id)
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
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      
      // Call finish-diagnostic edge function with real skill IDs
      const { error } = await supabase.functions.invoke('finish-diagnostic', {
        body: {
          section: formId.startsWith('D2') ? formId.slice(2) : formId,
          blocks: [{
            questions: questions.map(q => ({ 
              id: q.question_id, 
              skill_tags: q.skill_id ? [q.skill_id] : []
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

      // Mark this section as complete in localStorage
      const completed = JSON.parse(localStorage.getItem('diagnostic_completed_sections') || '[]');
      if (!completed.includes(formId)) {
        completed.push(formId);
        localStorage.setItem('diagnostic_completed_sections', JSON.stringify(completed));
      }

      // Navigate back to diagnostic orchestrator
      toast({
        title: "Section Complete!",
        description: `${formId} section saved successfully.`,
      });

      navigate('/diagnostic');

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

  if (!params.formId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Invalid test form</p>
            <Button onClick={() => navigate('/diagnostic')} className="mt-4">
              Back to Diagnostic
            </Button>
          </CardContent>
        </Card>
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