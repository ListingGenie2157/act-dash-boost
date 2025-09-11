import { useState, useEffect } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { DayView } from '@/components/DayView';
import { CountdownHeader } from '@/components/CountdownHeader';
import { curriculum } from '@/data/curriculum';
import { useProgress } from '@/hooks/useProgress';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

type View = 'dashboard' | 'day' | 'review';

const Index = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const { progress, updateProgress, addWrongAnswer, updateWeakAreas, completeDay } = useProgress();
  const navigate = useNavigate();

  // On mount, verify the user has an active session. If not, redirect
  // to the login page. This ensures the study dashboard is protected.
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate('/login');
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

  const handleDayComplete = (dayNumber: number) => {
    completeDay(dayNumber);
  };

  const handleUpdateScore = (lessonId: string, practiceScore: number, quizScore: number, wrongAnswers: any[]) => {
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
    wrongAnswers.forEach(wa => {
      addWrongAnswer(wa.questionId, wa.question, wa.userAnswer);
      
      // Determine topic from lesson
      const lesson = curriculum.find(d => 
        d.mathLesson.id === lessonId || d.englishLesson.id === lessonId
      );
      if (lesson) {
        const ismath = lesson.mathLesson.id === lessonId;
        const subject = ismath ? 'math' : 'english';
        const topic = ismath ? lesson.mathLesson.title : lesson.englishLesson.title;
        updateWeakAreas(subject, topic);
      }
    });
  };

  const selectedDayData = curriculum.find(d => d.day === selectedDay);

  return (
    <div className="min-h-screen bg-background">
      <CountdownHeader />
      <div className="container max-w-4xl mx-auto px-4 py-6">
        {currentView === 'dashboard' && (
          <Dashboard 
            onStartDay={handleStartDay}
            onViewReview={handleViewReview}
          />
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
