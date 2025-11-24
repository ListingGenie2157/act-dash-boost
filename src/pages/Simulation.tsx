import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { FormPicker } from '@/components/FormPicker';
import { SectionPicker } from '@/components/SectionPicker';
import { TimerBar } from '@/components/TimerBar';
import { QuestionCard } from '@/components/QuestionCard';
import { PassageLayout } from '@/components/PassageLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Home } from 'lucide-react';

interface Question {
  id: string;
  ord?: number;
  question: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  passage_id?: string;
  image_url?: string | null;
  image_caption?: string | null;
  image_position?: 'above_question' | 'inline' | 'between' | null;
  underlined_text?: string | null;
  reference_number?: number | null;
  position_in_passage?: number | null;
}

interface Passage {
  title: string;
  passage_text: string;
  marked_text?: Record<string, any> | null;
}

interface SessionData {
  session_id: string;
  time_limit_sec: number;
  questions: Question[];
  passages: Record<string, Passage>;
}

type SimulationState = 'form-picker' | 'section-picker' | 'loading' | 'active' | 'finished';

export default function Simulation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authChecking, setAuthChecking] = useState(true);
  const [state, setState] = useState<SimulationState>('form-picker');
  const [selectedForm, setSelectedForm] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  // Explicit auth header helper (temporary until we confirm automatic header attach works reliably on all browsers)
  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {};
  };

  // Authentication check
  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!mounted) return;
      
      if (!session) {
        navigate('/simple-login', { replace: true });
        return;
      }
      setAuthChecking(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        
        if (!session) {
          navigate('/simple-login', { replace: true });
        }
      }
    );

    checkAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Load existing session or responses if user refreshes
  useEffect(() => {
    const loadExistingSession = async () => {
      if (state !== 'active' || !sessionData) return;

      try {
        const { data: responses } = await supabase
          .from('responses')
          .select('question_id, selected')
          .eq('session_id', sessionData.session_id);

        if (responses) {
          const existingAnswers: Record<string, string> = {};
          responses.forEach(r => {
            existingAnswers[r.question_id] = r.selected;
          });
          setAnswers(existingAnswers);

          // Find first unanswered question
          const firstUnansweredIndex = sessionData.questions.findIndex(
            q => !existingAnswers[q.id]
          );
          if (firstUnansweredIndex !== -1) {
            setCurrentQuestionIndex(firstUnansweredIndex);
          }
        }
      } catch (error) {
        console.error('Error loading existing responses:', error);
      }
    };

    loadExistingSession();
  }, [sessionData, state]);

  const startSession = async (formId: string, section: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('session-start', {
        headers: await getAuthHeaders(),
        body: {
          form_id: formId,
          section: section,
          mode: 'simulation'
        }
      });

      if (error) throw error;

      const { session_id, time_limit_sec } = data;

      // Fetch questions and passages
      const { data: fetchData, error: fetchError } = await supabase.functions.invoke('session-fetch', {
        headers: await getAuthHeaders(),
        body: { session_id }
      });

      if (fetchError) throw fetchError;

      const { questions, passages } = fetchData;

      setSessionData({
        session_id,
        time_limit_sec,
        questions,
        passages
      });
      setTimeLeft(time_limit_sec);
      setState('active');

      toast({
        title: "Session Started",
        description: `${section} section loaded with ${questions.length} questions.`,
      });

    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: "Error",
        description: "Failed to start session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = useCallback(async (questionId: string, selectedAnswer: string) => {
    if (!sessionData) return;

    // Track answer locally for UI responsiveness
    setAnswers(prev => ({ ...prev, [questionId]: selectedAnswer }));

    // Calculate time taken for this question
    const timeMs = Date.now() - questionStartTime;

    // Save to database via edge function
    try {
      const { error } = await supabase.functions.invoke('submit-response', {
        headers: await getAuthHeaders(),
        body: {
          session_id: sessionData.session_id,
          question_id: questionId,
          selected: selectedAnswer,
          time_ms: timeMs
        }
      });

      if (error) {
        console.error('Error saving response:', error);
        // Continue anyway - don't block user from proceeding
      }
    } catch (error) {
      console.error('Failed to submit response:', error);
      // Continue anyway - user can still complete test
    }
  }, [sessionData, questionStartTime]);

  const handleAnswerSelect = (questionId: string, answer: string) => {
    submitAnswer(questionId, answer);
  };

  const navigateToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setQuestionStartTime(Date.now()); // Reset timer for new question
  };

  const handleNext = () => {
    if (sessionData && currentQuestionIndex < sessionData.questions.length - 1) {
      navigateToQuestion(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      navigateToQuestion(currentQuestionIndex - 1);
    }
  };

  const finishSession = async () => {
    if (!sessionData) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('session-finish', {
        headers: await getAuthHeaders(),
        body: { session_id: sessionData.session_id }
      });

      if (error) throw error;

      // Navigate to results page with session data
      navigate('/simulation-results', { 
        state: { 
          sessionId: sessionData.session_id,
          summary: data.summary,
          perSkill: data.per_skill
        }
      });

    } catch (error) {
      console.error('Error finishing session:', error);
      toast({
        title: "Error",
        description: "Failed to submit test. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTimeEnd = () => {
    toast({
      title: "Time's Up!",
      description: "The test has been automatically submitted.",
    });
    finishSession();
  };

  const handleFormSelect = (formId: string) => {
    setSelectedForm(formId);
    setState('section-picker');
  };

  const handleSectionSelect = (section: string) => {
    setSelectedSection(section);
    setState('loading');
    startSession(selectedForm, section);
  };

  const handleBackToForms = () => {
    setState('form-picker');
    setSelectedForm('');
  };

  // Show loading while checking authentication
  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading your test session...</p>
        </div>
      </div>
    );
  }

  if (state === 'form-picker') {
    return <FormPicker onFormSelect={handleFormSelect} />;
  }

  if (state === 'section-picker') {
    return (
      <SectionPicker
        formId={selectedForm}
        onSectionSelect={handleSectionSelect}
        onBack={handleBackToForms}
      />
    );
  }

  if (state === 'active' && sessionData) {
    const currentQuestion = sessionData.questions[currentQuestionIndex];
    const isPassageSection = selectedSection === 'RD' || selectedSection === 'SCI';

    return (
      <div className="min-h-screen bg-background">
        {/* Header with Timer */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowExitDialog(true)}
                >
                  <Home className="h-4 w-4 mr-2" />
                  Exit Test
                </Button>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{selectedSection}</Badge>
                  <Badge variant="secondary">{selectedForm}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {sessionData.questions.length}
                </div>
              </div>
            </div>
            <TimerBar
              timeLeftSec={timeLeft}
              totalTimeSec={sessionData.time_limit_sec}
              onTimeEnd={handleTimeEnd}
              isActive={true}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-6">
          {isPassageSection ? (
            <PassageLayout
              questions={sessionData.questions}
              passages={sessionData.passages}
              currentQuestionIndex={currentQuestionIndex}
              answers={answers}
              onAnswerSelect={handleAnswerSelect}
              onQuestionChange={navigateToQuestion}
              onNext={handleNext}
              onPrevious={handlePrevious}
              onSubmit={finishSession}
            />
          ) : (
            <div className="max-w-4xl mx-auto">
              <QuestionCard
                question={currentQuestion}
                currentIndex={currentQuestionIndex}
                totalQuestions={sessionData.questions.length}
                selectedAnswer={answers[currentQuestion.id]}
                onAnswerSelect={handleAnswerSelect}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onSubmit={finishSession}
              />
            </div>
          )}
        </div>

        {/* Question Navigation (for non-passage sections) */}
        {!isPassageSection && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
            <Card className="p-4 bg-background/95 backdrop-blur">
              <div className="flex flex-wrap gap-1 max-w-lg">
                {sessionData.questions.map((q, index) => {
                  const isAnswered = !!answers[q.id];
                  const isCurrent = index === currentQuestionIndex;
                  
                  return (
                    <Button
                      key={q.id}
                      size="sm"
                      variant={isCurrent ? 'default' : isAnswered ? 'secondary' : 'outline'}
                      className="h-8 w-8 p-0 text-xs"
                      onClick={() => navigateToQuestion(index)}
                    >
                      {index + 1}
                    </Button>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Exit Test?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to exit? Your progress will be saved and the test will end.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Continue Test</AlertDialogCancel>
              <AlertDialogAction onClick={async () => {
                await finishSession();
                navigate('/');
              }}>
                Exit & Save
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return null;
}