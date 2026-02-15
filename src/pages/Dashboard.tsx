import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
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
import type { Session } from '@supabase/supabase-js';
import { Calculator, Target, ArrowRight, BookOpen, PlayCircle, Zap, User } from 'lucide-react';
import { logger } from '@/lib/logger';

interface Profile {
  test_date?: string | null;
  onboarding_complete?: boolean | null;
  has_study_plan?: boolean | null;
  first_name?: string | null;
}

const Dashboard = () => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hasStudyPlan, setHasStudyPlan] = useState<boolean | null>(null);
  const [hasDiagnostic, setHasDiagnostic] = useState<boolean>(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadDashboardData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !mounted) {
        setIsLoading(false);
        return;
      }

      setSession(session);

      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('test_date, onboarding_complete, has_study_plan, first_name')
          .eq('id', session.user.id)
          .maybeSingle();

        if (mounted && profileData) {
          setProfile(profileData);

          const today = new Date().toISOString().split('T')[0];
          const { data: planCheck } = await supabase
            .from('study_plan_days')
            .select('the_date')
            .eq('user_id', session.user.id)
            .gte('the_date', today)
            .limit(1);

          const actuallyHasPlan = profileData.has_study_plan || (planCheck && planCheck.length > 0);
          setHasStudyPlan(actuallyHasPlan);

          const { data: diagnosticData } = await supabase
            .from('diagnostics')
            .select('id')
            .eq('user_id', session.user.id)
            .eq('source', 'diagnostic')
            .not('completed_at', 'is', null)
            .limit(1);

          setHasDiagnostic((diagnosticData?.length ?? 0) > 0);
        }
      } catch (error) {
        logger.error('[Dashboard] Error loading data:', error);
      }

      if (mounted) {
        setIsLoading(false);
      }
    };

    loadDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pt-4">
        <ParentBanner />
        <TestWeekBanner />
      </div>
      
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="p-6 rounded-2xl bg-card border border-white/[0.06] shadow-card animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-secondary flex-shrink-0">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold break-words">
                    {profile?.first_name ? `${profile.first_name}.` : 'Welcome back.'}
                  </h1>
                </div>
                <p className="text-muted-foreground sm:ml-14 break-words">
                  {hasStudyPlan ? 'Your plan for today.' : 'Continue your ACT preparation.'}
                </p>
              </div>
              {hasStudyPlan && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0 w-full sm:w-auto"
                  onClick={async () => {
                    if (!session?.user?.id) return;
                    
                    if (confirm('Switch to self-directed mode? Your study plan stays saved.')) {
                      const { error } = await supabase
                        .from('profiles')
                        .update({ has_study_plan: false })
                        .eq('id', session.user.id);

                      if (!error) {
                        setHasStudyPlan(false);
                        setProfile((prev) => prev ? { ...prev, has_study_plan: false } : prev);
                        queryClient.invalidateQueries({ queryKey: ['profile'] });
                      }
                    }
                  }}
                >
                  Switch to Self-Directed
                </Button>
              )}
            </div>
          </div>

          {hasStudyPlan ? (
            <>
              <StudyPlanWidget hasStudyPlan={hasStudyPlan ?? false} />
              <WeeklyCalendar userId={session?.user?.id || ''} testDate={profile?.test_date} />
              
              <div className="grid gap-6 md:grid-cols-2">
                <StreakCounter />
                <AchievementBadges />
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold">Quick Access</h3>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Link to="/lessons">
                      <Button variant="outline" className="w-full justify-start gap-3 group">
                        <BookOpen className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                        <span>Browse All Lessons</span>
                      </Button>
                    </Link>
                    <Link to="/calculator-lab">
                      <Button variant="outline" className="w-full justify-start gap-3 group">
                        <Calculator className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                        <span>Calculator Lab</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
              
              <MasteryDashboard />
              
              {!hasDiagnostic && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="p-6 rounded-2xl bg-secondary">
                        <Target className="w-12 h-12 text-primary" />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="text-xl font-bold mb-2">Run Diagnostic. Know Your Baseline.</h3>
                        <p className="text-muted-foreground mb-4">
                          Identify strengths and weaknesses across all ACT sections. Get a personalized plan.
                        </p>
                        <Button size="lg" asChild className="w-full md:w-auto group">
                          <Link to="/diagnostic" className="flex items-center gap-2">
                            Take Diagnostic
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
            <div className="space-y-6">
              {/* Choose Your Path */}
              <Card className="p-8 animate-fade-in">
                <div className="max-w-3xl mx-auto text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-white/[0.06] mb-4">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Choose Your Path</span>
                  </div>
                  <h2 className="text-3xl font-bold">Start Training.</h2>
                  <p className="text-muted-foreground">
                    Self-directed or AI-planned. Your call.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                    <Link to="/lessons">
                      <Button size="lg" variant="outline" className="gap-3 w-full sm:w-auto group">
                        <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        Browse Lessons
                      </Button>
                    </Link>
                    <Button
                      size="lg"
                      className="gap-3 group"
                      onClick={() => setWizardOpen(true)}
                    >
                      <Target className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      Create Study Plan
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </Card>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
                <Link to="/lessons">
                  <Card className="group p-6 h-full card-hover">
                    <CardContent className="p-0 space-y-4">
                      <div className="p-3 rounded-xl bg-secondary w-fit group-hover:scale-110 transition-transform">
                        <BookOpen className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">Lessons Library</h3>
                        <p className="text-sm text-muted-foreground">Browse and learn at your own pace.</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                
                <Link to="/calculator-lab">
                  <Card className="group p-6 h-full card-hover">
                    <CardContent className="p-0 space-y-4">
                      <div className="p-3 rounded-xl bg-secondary w-fit group-hover:scale-110 transition-transform">
                        <Calculator className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">Calculator Lab</h3>
                        <p className="text-sm text-muted-foreground">Master shortcuts. Save 10-15 minutes.</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                
                <Link to="/drill-runner">
                  <Card className="group p-6 h-full card-hover">
                    <CardContent className="p-0 space-y-4">
                      <div className="p-3 rounded-xl bg-secondary w-fit group-hover:scale-110 transition-transform">
                        <Target className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">Timed Drills</h3>
                        <p className="text-sm text-muted-foreground">Practice specific skills under pressure.</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                
                <Link to="/simulation">
                  <Card className="group p-6 h-full card-hover">
                    <CardContent className="p-0 space-y-4">
                      <div className="p-3 rounded-xl bg-secondary w-fit group-hover:scale-110 transition-transform">
                        <PlayCircle className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">Full Simulations</h3>
                        <p className="text-sm text-muted-foreground">Full-length section tests. Real timing.</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2">
                <StreakCounter />
                <AchievementBadges />
              </div>
              
              <MasteryDashboard />
              
              {!hasDiagnostic && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="p-6 rounded-2xl bg-secondary">
                        <Target className="w-12 h-12 text-primary" />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="text-xl font-bold mb-2">Run Diagnostic. Know Your Baseline.</h3>
                        <p className="text-muted-foreground mb-4">
                          Identify strengths and weaknesses across all ACT sections. Get a personalized plan.
                        </p>
                        <Button size="lg" asChild className="w-full md:w-auto group">
                          <Link to="/diagnostic" className="flex items-center gap-2">
                            Take Diagnostic
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

      <StudyPlanWizard 
        open={wizardOpen} 
        onOpenChange={setWizardOpen}
        onPlanGenerated={() => {
          setHasStudyPlan(true);
          setProfile((prev) => prev ? { ...prev, has_study_plan: true } : prev);
          queryClient.invalidateQueries({ queryKey: ['profile'] });
        }}
      />
    </div>
  );
};

export default Dashboard;
