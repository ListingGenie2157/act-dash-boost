import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dashboard } from '@/components/Dashboard';
import { DayView } from '@/components/DayView';
import { CountdownHeader } from '@/components/CountdownHeader';
import { StudyNow } from '@/components/StudyNow';
import { TestWeekBanner } from '@/components/TestWeekBanner';
import { ParentBanner } from '@/components/ParentBanner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Brain, Timer, BookOpen, BarChart3, Users } from 'lucide-react';
import { curriculum } from '@/data/curriculum';
import { useProgress } from '@/hooks/useProgress';
import { supabase } from '@/integrations/supabase/client';
import { WrongAnswer } from '@/types';

type View = 'dashboard' | 'day' | 'review' | 'study';

const Index = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { progress, updateProgress, addWrongAnswer, updateWeakAreas, completeDay } = useProgress();
  const navigate = useNavigate();

  // On mount, verify the user has an active session and completed onboarding.
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        setIsAuthenticated(true);

        // Check if user has completed onboarding
        const { data: profile } = await supabase
          .from('profiles')
          .select('test_date')
          .eq('id', data.session.user.id)
          .maybeSingle();

        if (!profile?.test_date) {
          navigate('/onboarding');
          return;
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        setIsLoading(false);
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
      
      
      <div className="container max-w-6xl mx-auto px-4 py-6">
        {currentView === 'dashboard' && (
          <div className="space-y-6">
            <TestWeekBanner />

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Primary Study Section */}
              <div className="lg:col-span-2 space-y-6">
                <StudyNow />

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/diagnostic')}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Brain className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Take Diagnostic</h3>
                        <p className="text-sm text-muted-foreground">Assess your skills</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/simulation')}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Timer className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Practice Test</h3>
                        <p className="text-sm text-muted-foreground">Timed simulation</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Progress Overview */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Your Progress</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Weekly Goal</span>
                      <span className="text-sm font-medium">3/5 days</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                </Card>

                {/* Quick Links */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Quick Access</h3>
                  <div className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start h-8" onClick={() => navigate('/cheatsheets/english')}>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Cheatsheets
                    </Button>
                    <Button variant="ghost" className="w-full justify-start h-8" onClick={() => navigate('/analytics')}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analytics
                    </Button>
                    <Button variant="ghost" className="w-full justify-start h-8" onClick={() => navigate('/parent-portal')}>
                      <Users className="h-4 w-4 mr-2" />
                      Parent Portal
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
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
