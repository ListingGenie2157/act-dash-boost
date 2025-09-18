import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dashboard } from '@/components/Dashboard';
import { DayView } from '@/components/DayView';
import { CountdownHeader } from '@/components/CountdownHeader';
import { StudyNow } from '@/components/StudyNow';
import { TestWeekBanner } from '@/components/TestWeekBanner';
import { ParentBanner } from '@/components/ParentBanner';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { curriculum } from '@/data/curriculum';
import { useProgress } from '@/hooks/useProgress';
import { supabase } from '@/integrations/supabase/client';
import { WrongAnswer } from '@/types';

type View = 'dashboard' | 'day' | 'review' | 'study';

const Index = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const { progress, updateProgress, addWrongAnswer, updateWeakAreas, completeDay } = useProgress();
  const navigate = useNavigate();

  // On mount, verify the user has an active session and completed onboarding.
  // Redirect to login if no session, or to onboarding if test_date not set.
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          navigate('/login');
          return;
        }

        // Check if user has completed onboarding (test date set)
        const { data: profile } = await supabase
          .from('profiles')
          .select('test_date')
          .eq('id', data.session.user.id)
          .maybeSingle();

        if (!profile?.test_date) {
          navigate('/onboarding');
          return;
        }

        setHasCompletedOnboarding(true);
      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleStartDay = (dayNumber: number) => {
    setSelectedDay(dayNumber);
    setCurrentView('day');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const handleViewReview = () => {
    setCurrentView('review');
  };

  const handleStudyNow = () => {
    setCurrentView('study');
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
      addWrongAnswer(wa.questionId, wa.question, wa.userAnswer);
      
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!hasCompletedOnboarding) {
    return null; // Will redirect to onboarding
  }

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
