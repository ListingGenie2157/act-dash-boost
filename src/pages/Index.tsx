import { useState, memo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { StudyPlanWidget } from '@/components/StudyPlanWidget';
import { StudyPlanWizard } from '@/components/StudyPlanWizard';
import { TestWeekBanner } from '@/components/TestWeekBanner';
import { ParentBanner } from '@/components/ParentBanner';
import { MasteryDashboard } from '@/components/MasteryDashboard';
import { WeakAreasCard } from '@/components/WeakAreasCard';
import { StreakCounter } from '@/components/StreakCounter';
import { AchievementBadges } from '@/components/AchievementBadges';
import { WeeklyCalendar } from '@/components/WeeklyCalendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Calculator, Target, ArrowRight, BookOpen, Clock, Zap, User } from 'lucide-react';
import { useAuthState } from '@/hooks/useAuthState';
import { useProfile } from '@/hooks/useProfile';
import { logger } from '@/lib/logger';
import { LandingPage } from '@/components/memoized/LandingPage';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthState();
  const { profile, hasStudyPlan, hasDiagnostic, loading: profileLoading } = useProfile();
  const [wizardOpen, setWizardOpen] = useState(false);

  const isLoading = authLoading || profileLoading;
  const isAuthenticated = !!user;

  const handleSwitchToSelfDirected = useCallback(async () => {
    if (confirm('Switch to self-directed learning mode? Your study plan will remain saved.')) {
      if (!user) return;
      
      const { error } = await supabase
        .from('profiles')
        .update({ has_study_plan: false })
        .eq('id', user.id);

      if (error) {
        logger.error('Failed to update profile', error, { userId: user.id });
      } else {
        logger.info('Profile updated: switched to self-directed mode', { userId: user.id });
        // Profile will be refetched by useProfile hook
      }
    }
  }, [user]);

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
    return <LandingPage />;
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative container mx-auto px-4 pt-4">
        <ParentBanner />
        <TestWeekBanner />
      </div>
      
      <div className="relative container max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 backdrop-blur-sm border border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <h1 className="text-3xl font-bold">
                    Welcome back{profile?.first_name ? `, ${profile.first_name}` : ''}!
                  </h1>
                </div>
                <p className="text-muted-foreground ml-14">
                  {hasStudyPlan ? 'Your personalized study plan for today' : 'Continue your ACT preparation'}
                </p>
              </div>
              {hasStudyPlan && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-background/50 backdrop-blur-sm hover:bg-background/80"
                  onClick={handleSwitchToSelfDirected}
                >
                  Switch to Self-Directed
                </Button>
              )}
            </div>
          </div>

          {/* Conditional Dashboard Content Based on has_study_plan Flag */}
          {hasStudyPlan ? (
            // Structured Study Plan Dashboard
            <>
              <StudyPlanWidget hasStudyPlan={hasStudyPlan ?? false} />
              <WeeklyCalendar userId={user?.id || ''} testDate={profile?.test_date} />
              
              {/* Gamification */}
              <div className="grid gap-6 md:grid-cols-2">
                <StreakCounter />
                <AchievementBadges />
              </div>
              
              {/* Quick Access Resources */}
              <Card className="bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 backdrop-blur-sm border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Quick Access</h3>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Link to="/lessons">
                      <Button variant="outline" className="w-full justify-start gap-3 group bg-background/50 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/50 transition-all duration-300">
                        <BookOpen className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                        <span>Browse All Lessons</span>
                      </Button>
                    </Link>
                    <Link to="/calculator-lab">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start gap-3 group bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20 hover:from-purple-500/20 hover:to-pink-500/20 transition-all duration-300"
                      >
                        <Calculator className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
                        <span>Calculator Lab</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
              
              <MasteryDashboard />
              
              {/* Diagnostic CTA - Only show if not completed */}
              {!hasDiagnostic && (
                <Card className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 backdrop-blur-sm border-primary/20 shadow-lg hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 animate-fade-in">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 group-hover:scale-110 transition-transform">
                        <Target className="w-12 h-12 text-primary" />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="text-xl font-bold mb-2">Haven't taken the diagnostic yet?</h3>
                        <p className="text-muted-foreground mb-4">
                          Take a quick diagnostic to identify your strengths and weaknesses across all ACT sections. 
                          This helps us personalize your study plan and focus on areas that need the most attention.
                        </p>
                        <Button size="lg" asChild className="w-full md:w-auto group bg-gradient-to-r from-primary to-secondary hover:shadow-xl hover:shadow-primary/50 transition-all">
                          <Link to="/diagnostic" className="flex items-center gap-2">
                            Take Diagnostic Exam
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <WeakAreasCard />
            </>
          ) : (
            // Self-Directed Learning Dashboard
            <div className="space-y-8">
              {/* Choose Your Path Section */}
              <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 backdrop-blur-sm border border-primary/20 rounded-2xl p-8 shadow-lg hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 animate-fade-in">
                <div className="max-w-3xl mx-auto text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-4">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Choose Your Path</span>
                  </div>
                  <h2 className="text-3xl font-bold">Ready to Start Learning?</h2>
                  <p className="text-muted-foreground text-lg">
                    Browse lessons and drills at your own pace, or let us create a personalized study plan based on your test date and goals.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                    <Link to="/lessons">
                      <Button
                        size="lg"
                        variant="outline"
                        className="gap-3 w-full sm:w-auto bg-background/50 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/50 transition-all group"
                      >
                        <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        Browse All Lessons
                      </Button>
                    </Link>
                    <Button
                      size="lg"
                      className="gap-3 bg-gradient-to-r from-primary to-secondary hover:shadow-xl hover:shadow-primary/50 transition-all group"
                      onClick={() => setWizardOpen(true)}
                    >
                      <Target className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      Create Study Plan
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
                <Link to="/lessons">
                  <Card className="group p-6 h-full bg-gradient-to-br from-background to-primary/5 backdrop-blur-sm border-primary/20 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-2">
                    <CardContent className="p-0 space-y-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 w-fit group-hover:scale-110 transition-transform">
                        <BookOpen className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">Lessons Library</h3>
                        <p className="text-sm text-muted-foreground">
                          Browse and learn concepts at your own pace
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                
                <Link to="/calculator-lab">
                  <Card className="group p-6 h-full bg-gradient-to-br from-purple-500/5 to-pink-500/5 backdrop-blur-sm border-purple-500/20 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:-translate-y-2">
                    <CardContent className="p-0 space-y-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 w-fit group-hover:scale-110 transition-transform">
                        <Calculator className="w-6 h-6 text-purple-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2 group-hover:text-purple-500 transition-colors">Calculator Lab</h3>
                        <p className="text-sm text-muted-foreground">
                          Master calculator shortcuts to save 10-15 minutes
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                
                <Link to="/drill-runner">
                  <Card className="group p-6 h-full bg-gradient-to-br from-background to-secondary/5 backdrop-blur-sm border-secondary/20 hover:border-secondary/50 hover:shadow-2xl hover:shadow-secondary/20 transition-all duration-300 hover:-translate-y-2">
                    <CardContent className="p-0 space-y-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-secondary/20 to-accent/20 w-fit group-hover:scale-110 transition-transform">
                        <Target className="w-6 h-6 text-secondary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2 group-hover:text-secondary transition-colors">Timed Drills</h3>
                        <p className="text-sm text-muted-foreground">
                          Practice specific skills with timed questions
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                
                <Link to="/simulation">
                  <Card className="group p-6 h-full bg-gradient-to-br from-background to-accent/5 backdrop-blur-sm border-accent/20 hover:border-accent/50 hover:shadow-2xl hover:shadow-accent/20 transition-all duration-300 hover:-translate-y-2">
                    <CardContent className="p-0 space-y-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-accent/20 to-primary/20 w-fit group-hover:scale-110 transition-transform">
                        <Clock className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2 group-hover:text-accent transition-colors">Practice Simulations</h3>
                        <p className="text-sm text-muted-foreground">
                          Take full-length section tests with real timing
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
              
              {/* Gamification */}
              <div className="grid gap-6 md:grid-cols-2">
                <StreakCounter />
                <AchievementBadges />
              </div>
              
              <MasteryDashboard />
              
              {/* Diagnostic CTA - Only show if not completed */}
              {!hasDiagnostic && (
                <Card className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 backdrop-blur-sm border-primary/20 shadow-lg hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 animate-fade-in">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 group-hover:scale-110 transition-transform">
                        <Target className="w-12 h-12 text-primary" />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="text-xl font-bold mb-2">Haven't taken the diagnostic yet?</h3>
                        <p className="text-muted-foreground mb-4">
                          Take a quick diagnostic to identify your strengths and weaknesses across all ACT sections. 
                          This helps us personalize your study plan and focus on areas that need the most attention.
                        </p>
                        <Button size="lg" asChild className="w-full md:w-auto group bg-gradient-to-r from-primary to-secondary hover:shadow-xl hover:shadow-primary/50 transition-all">
                          <Link to="/diagnostic" className="flex items-center gap-2">
                            Take Diagnostic Exam
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <WeakAreasCard />
            </div>
          )}
        </div>
      </div>

      {/* Study Plan Wizard Modal */}
      <StudyPlanWizard 
        open={wizardOpen} 
        onOpenChange={setWizardOpen}
        onPlanGenerated={() => {
          logger.info('Study plan generated', { userId: user?.id });
          // Profile will be refetched by useProfile hook
        }}
      />
    </div>
  );
};

export default Index;
