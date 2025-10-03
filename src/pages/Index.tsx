import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DayView } from '@/components/DayView';
import { CountdownHeader } from '@/components/CountdownHeader';
import { StudyNow } from '@/components/StudyNow';
import { TestWeekBanner } from '@/components/TestWeekBanner';
import { ParentBanner } from '@/components/ParentBanner';
import { Button } from '@/components/ui/button';
import { curriculum } from '@/data/curriculum';
import { useProgress } from '@/hooks/useProgress';
import { supabase } from '@/integrations/supabase/client';
import type { WrongAnswer, LegacyQuestion } from '@/types';

type View = 'dashboard' | 'day' | 'review' | 'study';

const Index = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { progress, updateProgress, addWrongAnswer, updateWeakAreas, completeDay } = useProgress();
  const navigate = useNavigate();

  // Enhanced auth state management with proper listeners
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('Initializing auth state...');
        
        // Set up auth state listener FIRST
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', { event, session: !!session });
            
            if (!mounted) return;
            
            if (session) {
              setIsAuthenticated(true);
              
              // Check if user has completed onboarding
              try {
                const { data: profile, error } = await supabase
                  .from('profiles')
                  .select('test_date')
                  .eq('id', session.user.id)
                  .maybeSingle();
                
                console.log('Profile check:', { profile, error });
                
                if (!profile?.test_date && mounted) {
                  navigate('/onboarding');
                  return;
                }
              } catch (profileError) {
                console.error('Profile check failed:', profileError);
              }
            } else {
              setIsAuthenticated(false);
            }
            
            if (mounted) {
              setIsLoading(false);
            }
          }
        );

        // THEN check for existing session
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Initial session check:', { session: !!session, error });
        
        if (error) {
          console.error('Session check error:', error);
        }

        // Clean up subscription on unmount
        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
        
      } catch (error) {
        console.error('Auth initialization failed:', error);
        if (mounted) {
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      }
    };

    const cleanup = initAuth();
    
    return () => {
      mounted = false;
      cleanup?.then?.(cleanupFn => cleanupFn?.());
    };
  }, [navigate]);

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleDayComplete = (dayNumber: number) => {
    completeDay(dayNumber);
  };

  const handleUpdateScore = (lessonId: string, practiceScore: number, quizScore: number, wrongAnswers: WrongAnswer[]) => {
    // Update scores
    updateProgress({
      ...progress,
      scores: {
        ...progress.scores,
        [lessonId]: {
          practiceScore,
          quizScore
        }
      }
    });

    // Add wrong answers and update weak areas
    wrongAnswers.forEach((wa) => {
      addWrongAnswer(wa.questionId, wa.question as LegacyQuestion, wa.userAnswer);
      
      // Determine topic from lesson
      const lesson = curriculum.find(d => 
        d.mathLesson.id === lessonId || d.englishLesson.id === lessonId
      );
      if (lesson) {
        const ismath = lesson.mathLesson.id === lessonId;
        const subject = ismath ? 'Math' : 'English';
        const topic = ismath ? lesson.mathLesson.title : lesson.englishLesson.title;
        updateWeakAreas(subject, topic);
      }
    });
  };

  const selectedDayData = curriculum.find(d => d.day === selectedDay);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your ACT prep dashboard...</p>
        </div>
      </div>
    );
  }

  // Landing page for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight">
                Master the ACT with Personalized Prep
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Get a personalized study plan based on your test date, current skills, and goals.
                Take diagnostic assessments, practice with timed sections, and track your progress.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <div className="p-6 border rounded-lg space-y-3">
                <h3 className="font-semibold">📊 Diagnostic Assessment</h3>
                <p className="text-sm text-muted-foreground">
                  Take a quick assessment to identify your strengths and weaknesses across all ACT sections.
                </p>
              </div>
              <div className="p-6 border rounded-lg space-y-3">
                <h3 className="font-semibold">📚 Personalized Study Plan</h3>
                <p className="text-sm text-muted-foreground">
                  Get a custom roadmap based on your test date, available study time, and skill gaps.
                </p>
              </div>
              <div className="p-6 border rounded-lg space-y-3">
                <h3 className="font-semibold">⏱️ Timed Practice</h3>
                <p className="text-sm text-muted-foreground">
                  Practice with realistic ACT sections, complete with accommodations and detailed explanations.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Button size="lg" onClick={() => navigate('/login')} className="bg-primary">
                Get Started - Sign Up Free
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
                Already have an account? Sign In
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-6">
              Join thousands of students improving their ACT scores with adaptive learning.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated user dashboard
  return (
    <div className="min-h-screen bg-background">
      <CountdownHeader />
      <div className="container mx-auto px-4">
        <ParentBanner />
      </div>
      
      {/* Navigation Header */}
      <div className="border-b bg-card/50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex gap-4">
            <Link to="/sim-english">
              <Button variant="outline" size="sm">
                Start English SIM
              </Button>
            </Link>
            <Link to="/cheatsheets/english">
              <Button variant="outline" size="sm">
                Cheatsheets
              </Button>
            </Link>
            <Link to="/analytics">
              <Button variant="outline" size="sm">
                Analytics
              </Button>
            </Link>
            <Link to="/parent-portal">
              <Button variant="outline" size="sm">
                Parent Portal
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="container max-w-4xl mx-auto px-4 py-6">
        {currentView === 'dashboard' && (
          <div className="space-y-8">
            <TestWeekBanner />
            <StudyNow />
            {/* Today's tasks list already shown in StudyNow component */}
          </div>
        )}
        
        {currentView === 'study' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleBackToDashboard}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                ←
              </button>
              <h1 className="text-2xl font-bold">Study Session</h1>
            </div>
            <StudyNow />
          </div>
        )}

        {currentView === 'day' && selectedDayData && (
          <DayView
            day={selectedDayData}
            onBack={handleBackToDashboard}
            onDayComplete={handleDayComplete}
            onUpdateScore={handleUpdateScore}
          />
        )}

        {currentView === 'review' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleBackToDashboard}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                ←
              </button>
              <h1 className="text-2xl font-bold">Wrong Answer Review</h1>
            </div>
            
            {progress.wrongAnswers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No wrong answers yet. Keep studying!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {progress.wrongAnswers.map((wa, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-2">
                    <p className="font-medium">{wa.question.question}</p>
                    <p className="text-sm text-muted-foreground">
                      Your answer: {wa.question.options[wa.userAnswer]}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Correct answer: {wa.question.options[wa.question.correctAnswer]}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {wa.question.explanation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
