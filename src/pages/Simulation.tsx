import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { FormPicker } from '@/components/FormPicker';
import { SectionPicker } from '@/components/SectionPicker';
import { TimerBar } from '@/components/TimerBar';
import { QuestionCard } from '@/components/QuestionCard';
import { PassageLayout } from '@/components/PassageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
}

interface Passage {
  title: string;
  passage_text: string;
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
  const [state, setState] = useState<SimulationState>('form-picker');
  const [selectedForm, setSelectedForm] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

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
        body: {
          form_id: formId,
          section: section,
          mode: 'simulation'
        }
      });

      if (error) throw error;

      const { session_id, time_limit_sec } = data;

      // Fetch questions and passages using a GET request with query params
      const response = await fetch(`https://hhbkmxrzxcswwokmbtbz.supabase.co/functions/v1/session-fetch?session_id=${session_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch session data');
      }

      const fetchData = await response.json();

      const { questions, passages } = fetchData;

      setSessionData({
        session_id,
        time_limit_sec,
        questions,
        passages
      });
      setTimeLeft(time_limit_sec);
      setState('active');
      setQuestionStartTime(Date.now());

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

    const timeSpent = Date.now() - questionStartTime;

    try {
      const { data, error } = await supabase.functions.invoke('response-submit', {
        body: {
          session_id: sessionData.session_id,
          question_id: questionId,
          selected: selectedAnswer,
          time_ms: timeSpent
        }
      });

      if (error) throw error;

      setAnswers(prev => ({ ...prev, [questionId]: selectedAnswer }));

    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        title: "Error",
        description: "Failed to save answer. Please try again.",
        variant: "destructive",
      });
    }
  }, [sessionData, questionStartTime, toast]);

  const handleAnswerSelect = (questionId: string, answer: string) => {
    submitAnswer(questionId, answer);
  };

  const navigateToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setQuestionStartTime(Date.now());
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
                <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                  <Home className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{selectedSection}</Badge>
                  <Badge variant="secondary">{selectedForm}</Badge>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {sessionData.questions.length}
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
      </div>
    );
  }

  return null;
}