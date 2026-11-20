import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { createQuestionTimer } from '@/lib/questionTimer';
import { sharePassages } from '@/lib/passageGroups';
import { pickDiagnosticQuestions, pickQuickQuestions, currentSitting } from '@/lib/diagnosticPicker';

const SECTION_BY_CODE: Record<string, string> = { EN: 'English', MA: 'Math', RD: 'Reading', SC: 'Science' };
const DIAGNOSTIC_POOL_FORMS = ['D2EN', 'D2MA', 'D2RD', 'D2SC'];
const FORM_LABEL: Record<string, string> = {
  ONB: 'Quick Diagnostic', D2EN: 'English Diagnostic', D2MA: 'Math Diagnostic', D2RD: 'Reading Diagnostic', D2SC: 'Science Diagnostic',
};
import { diagnosticFormIdSchema, validateInput } from '@/lib/validation/edgeFunctionSchemas';
import { reportError } from '@/lib/errorReporter';

interface Question {
  ord: number;
  question_id: string;
  question: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  passage_id?: string | null;
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
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // ALL HOOKS MUST BE CALLED FIRST - BEFORE ANY CONDITIONAL LOGIC
  // ALL HOOKS AT TOP - UNCONDITIONALLY
  const [questions, setQuestions] = useState<(Question & { skill_id?: string | null })[]>([]);
  const [attempts, setAttempts] = useState<Record<string, Attempt>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  // Untimed for the student: time per question is recorded silently (feeds skill buckets)
  const questionTimer = useRef(createQuestionTimer());
  const priorTimeMs = useRef<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [formId, setFormId] = useState<string | null>(null);

  // Validate formId parameter - store in state instead of early return
  useEffect(() => {
    if (!params.formId) {
      setValidationError('Invalid test form');
      return;
    }

    try {
      const validated = validateInput(
        diagnosticFormIdSchema,
        { formId: params.formId },
        'Invalid diagnostic form'
      );
      setFormId(validated.formId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid form ID';
      setValidationError(errorMessage);
      toast({
        title: 'Invalid Form',
        description: errorMessage,
        variant: 'destructive',
      });
      // Navigate after a short delay to allow toast to show
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
    }
  }, [params.formId, navigate, toast]);

  const handleSubmit = useCallback(async () => {
    if (submitting || !formId) return;
    setSubmitting(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Map form ID abbreviation to full section name for server validation
      const SECTION_MAP: Record<string, string> = {
        'EN': 'English', 'MA': 'Math', 'RD': 'Reading', 'SC': 'Science',
      };
      const sectionCode = formId.startsWith('D2') ? formId.slice(2) : formId;
      // ONB is a mixed-section diagnostic — send 'Mixed' so server handles per-question sections
      const sectionName = formId === 'ONB' ? 'Mixed' : (SECTION_MAP[sectionCode] || sectionCode);

      // De-shuffle selected_idx back to original letter (A/B/C/D)
      const IDX_TO_LETTER = ['A', 'B', 'C', 'D'];

      // Call finish-diagnostic edge function — server validates correctness
      const { data: responseData, error } = await supabase.functions.invoke('finish-diagnostic', {
        body: {
          section: sectionName,
          blocks: [{
            questions: questions.map(q => ({ 
              id: q.question_id, 
              skill_tags: q.skill_id ? [q.skill_id] : []
            })),
            // Build answers in same order as questions array to maintain index alignment
            answers: questions.map(q => {
              const attempt = attempts[q.question_id];
              const originalIdx = attempt?.selected_idx != null
                ? attempt.choice_order[attempt.selected_idx]
                : undefined;
              return {
                questionId: q.question_id,
                selectedAnswer: originalIdx != null ? IDX_TO_LETTER[originalIdx] : ''
              };
            })
          }]
        }
      });

      if (error) throw error;

      // Mark this section as complete in localStorage with score data
      const completed = JSON.parse(localStorage.getItem('diagnostic_completed_sections') || '[]');
      if (!completed.includes(formId)) {
        completed.push(formId);
        localStorage.setItem('diagnostic_completed_sections', JSON.stringify(completed));
      }

      // Store section result for the orchestrator page to display
      if (responseData) {
        const sectionResults = JSON.parse(localStorage.getItem('diagnostic_section_results') || '{}');
        sectionResults[sectionName] = {
          score: responseData.predicted_section_score,
          weakSkills: responseData.top_5_weak_skills,
          diagnosticId: responseData.diagnostic_id
        };
        localStorage.setItem('diagnostic_section_results', JSON.stringify(sectionResults));
      }

      toast({
        title: "Section Complete!",
        description: `${formId} section saved successfully.`,
      });

      // ONB (quick diagnostic) goes straight to results, thorough goes back to orchestrator
      if (formId === 'ONB') {
        // Mark diagnostic as complete in profile
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .update({ diagnostic_completed: true })
            .eq('id', user.id);
        }
        localStorage.removeItem('diagnostic_completed_sections');
        navigate('/diagnostic-results-complete');
      } else {
        navigate('/diagnostic');
      }

    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), { page: 'DiagnosticTest', source: 'submit' });
      toast({
        title: "Error",
        description: "Failed to submit diagnostic test",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }, [submitting, formId, questions, attempts, toast, navigate]);

  const loadDiagnostic = useCallback(async () => {
    if (!formId) return;
    
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        navigate('/login');
        return;
      }

      // Load questions from v_staging_items_public (answer/explanation excluded for security)
      const { data, error } = await supabase
        .from('v_staging_items_public')
        .select('staging_id, form_id, section, ord, skill_code, question, choice_a, choice_b, choice_c, choice_d, difficulty, passage_id, passage_text, passage_title')
        // The quick diagnostic (ONB) draws from the thorough diagnostic pool
        .in('form_id', formId === 'ONB' ? DIAGNOSTIC_POOL_FORMS : [formId])
        .order('ord', { ascending: true });

      if (error) throw error;

      // Fetch all skills for skill_id lookup
      const skillCodes = Array.from(new Set((data || []).map(q => q.skill_code).filter((c): c is string => !!c)));
      // Question skill codes match skills.id (skills.code holds a different label), so look up both
      const [byId, byCode] = await Promise.all([
        supabase.from('skills').select('id, code').in('id', skillCodes),
        supabase.from('skills').select('id, code').in('code', skillCodes),
      ]);
      const skillsData = [...(byId.data ?? []), ...(byCode.data ?? [])];

      // Create skill lookup map
      const skillMap = new Map<string, string>();
      skillsData?.forEach(skill => {
        const normalized = skill.id.trim().toUpperCase();
        skillMap.set(normalized, skill.id);
        if (skill.code) {
          skillMap.set(skill.code.trim().toUpperCase(), skill.id);
        }
      });

      // Map v_staging_items_public to Question type with skill_id resolution
      // Note: answer/explanation are not available client-side (server-side validation only)
      const mappedQuestions: (Question & { skill_id?: string | null; section?: string | null })[] = (data || []).map(q => {
        let skill_id: string | null = null;
        
        if (q.skill_code) {
          const normalized = q.skill_code.trim().toUpperCase();
          skill_id = skillMap.get(normalized) || null;
        }
        
        return {
          ord: q.ord ?? 0,
          question_id: q.staging_id ? String(q.staging_id) : '',
          question: q.question ?? '',
          choice_a: q.choice_a ?? '',
          choice_b: q.choice_b ?? '',
          choice_c: q.choice_c ?? '',
          choice_d: q.choice_d ?? '',
          passage_id: q.passage_id ?? null,
          passage_text: q.passage_text ?? undefined,
          passage_title: q.passage_title ?? undefined,
          skill_id,
          section: q.section ?? null,
        };
      });

      // A passage is stored on one question of its group; show it on every question in the group
      const allQuestions = sharePassages(mappedQuestions).map(q => ({
        ...q,
        passage_text: q.passage_text ?? undefined,
        passage_title: q.passage_title ?? undefined,
      }));

      // This student's earlier attempt rows for the form, oldest first
      const { data: formAttempts } = await supabase
        .from('attempts')
        .select('question_id, choice_order, correct_idx, selected_idx, question_ord, time_ms, created_at')
        .eq('user_id', user.user.id)
        .eq('form_id', formId)
        .order('created_at', { ascending: true });
      const priorRows = formAttempts ?? [];

      let shown = allQuestions;
      let reuseRows = priorRows;
      const isQuick = formId === 'ONB';
      if (isQuick || formId.startsWith('D2')) {
        // Thorough: 2 questions per skill. Quick: ~36 across sections, 1 per skill.
        // New questions first; an unfinished sitting resumes.
        const section = isQuick ? 'Mixed' : SECTION_BY_CODE[formId.slice(2)];
        const [{ data: lastDiag }, { data: answeredRows }] = await Promise.all([
          supabase
            .from('diagnostics')
            .select('completed_at')
            .eq('user_id', user.user.id)
            .eq('section', section)
            .not('completed_at', 'is', null)
            .order('completed_at', { ascending: false })
            .limit(1),
          // Answered in any diagnostic, quick or thorough
          supabase
            .from('attempts')
            .select('question_id')
            .eq('user_id', user.user.id)
            .in('form_id', ['ONB', ...DIAGNOSTIC_POOL_FORMS])
            .not('selected_idx', 'is', null),
        ]);
        const skillById = new Map(allQuestions.map(q => [q.question_id, q.skill_id ?? null]));
        const sitting = currentSitting(
          priorRows, lastDiag?.[0]?.completed_at ?? null, id => skillById.get(id) ?? null, isQuick ? 1 : 2);

        if (sitting) {
          const ids = new Set(sitting);
          reuseRows = priorRows.filter(r => ids.has(String(r.question_id)));
          const position = new Map(reuseRows.map(r => [String(r.question_id), r.question_ord ?? 0]));
          shown = allQuestions
            .filter(q => ids.has(q.question_id))
            .sort((a, b) => (position.get(a.question_id) ?? 0) - (position.get(b.question_id) ?? 0))
            .map((q, i) => ({ ...q, ord: i + 1 }));
        } else {
          const answered = new Set((answeredRows ?? []).map(r => String(r.question_id)));
          const pool = allQuestions.map(q => ({ ...q, skill_code: q.skill_id ?? null }));
          shown = (isQuick ? pickQuickQuestions(pool, answered) : pickDiagnosticQuestions(pool, answered))
            // Position in this sitting, so a resumed sitting keeps the same order
            .map((q, i) => ({ ...q, ord: i + 1 }));
          reuseRows = [];
        }
      }
      setQuestions(shown);

      // Load or create attempts with choice shuffling
      const existingAttempts: Record<string, Attempt> = {};
      const newAttempts: Attempt[] = [];

      // attempts.question_id is the numeric staging_id; the page keys questions by string id (newest row wins)
      const attemptMap = new Map(reuseRows.map(a => [String(a.question_id), a]));

      for (const question of shown) {
        const existing = attemptMap.get(question.question_id);

        if (existing) {
          priorTimeMs.current[question.question_id] = existing.time_ms ?? 0;
          existingAttempts[question.question_id] = {
            question_id: String(existing.question_id),
            choice_order: existing.choice_order,
            correct_idx: existing.correct_idx,
            selected_idx: existing.selected_idx ?? undefined,
            question_ord: existing.question_ord,
          };
        } else {
          // Create new attempt with shuffled choices using stable seed
          // Note: correct_idx is computed server-side via submit-response edge function
          // We generate shuffle order now and store it; correctness is validated server-side
          const stableSeed = hashCode(`${user.user.id}-${formId}-${question.question_id}`);
          const choiceOrder = shuffle([0, 1, 2, 3], stableSeed);
          // correct_idx will be set by server when answer is submitted
          // For now, we set it to 0 as placeholder (actual validation is server-side)
          const correctIdx = 0;

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
              ...attempt,
              question_id: Number(attempt.question_id),
            }))
          );

        if (insertError) throw insertError;
      }

      setAttempts(existingAttempts);
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), { page: 'DiagnosticTest', source: 'load' });
      toast({
        title: "Error",
        description: "Failed to load diagnostic test",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [formId, navigate, toast]);

  useEffect(() => {
    if (formId && !validationError) {
      loadDiagnostic();
    }
  }, [formId, validationError, loadDiagnostic]);

  // Count time only while a question is on screen
  useEffect(() => {
    const timer = questionTimer.current;
    const question = questions[currentIndex];
    if (!loading && question) timer.show(question.question_id);
    return () => timer.pause();
  }, [currentIndex, questions, loading]);

  const handleAnswerSelect = async (choiceIndex: number) => {
    const question = questions[currentIndex];
    const attempt = attempts[question.question_id];
    
    if (!attempt || !formId) return;

    const updatedAttempt = { ...attempt, selected_idx: choiceIndex };
    setAttempts(prev => ({ ...prev, [question.question_id]: updatedAttempt }));

    // Save to database
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;
      
      const timeMs = (priorTimeMs.current[question.question_id] ?? 0)
        + questionTimer.current.elapsed(question.question_id);
      await supabase
        .from('attempts')
        .update({ selected_idx: choiceIndex, time_ms: Math.round(timeMs) })
        .eq('user_id', user.user.id)
        .eq('form_id', formId)
        .eq('question_id', Number(question.question_id));
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), { page: 'DiagnosticTest', source: 'saveAnswer' });
    }
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

  // Show validation error UI
  if (validationError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {validationError}
            </p>
            <Button onClick={() => navigate('/')} className="w-full mt-4">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  if (!formId) {
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
            <div className="text-center space-y-3">
              <p className="font-medium">No questions found for this diagnostic.</p>
              <p className="text-sm text-muted-foreground">
                This diagnostic form may not have questions loaded yet. Try selecting "Skip for Now" in the study plan wizard to generate a plan based on estimated scores, or contact support.
              </p>
            </div>
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
            {FORM_LABEL[formId ?? ''] ?? formId ?? 'Diagnostic'} - Question {currentIndex + 1} of {questions.length}
          </h1>
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