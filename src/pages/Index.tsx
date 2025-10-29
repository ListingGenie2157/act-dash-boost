import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CountdownHeader } from '@/components/CountdownHeader';
import { StudyPlanWidget } from '@/components/StudyPlanWidget';
import { StudyPlanWizard } from '@/components/StudyPlanWizard';
import { TestWeekBanner } from '@/components/TestWeekBanner';
import { ParentBanner } from '@/components/ParentBanner';
import { MasteryDashboard } from '@/components/MasteryDashboard';
import { WeakAreasCard } from '@/components/WeakAreasCard';
import { WeeklyCalendar } from '@/components/WeeklyCalendar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [hasStudyPlan, setHasStudyPlan] = useState<boolean | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const navigate = useNavigate();

  // Enhanced auth state management with proper listeners
  useEffect(() => {
    let mounted = true;

    const syncAuthAndProfile = async (session: any) => {
      if (!mounted) return;

      console.log('[Index] syncAuthAndProfile called', { hasSession: !!session });

      if (session) {
        setSession(session);
        setIsAuthenticated(true);
        
        try {
          console.log('[Index] Fetching profile for user:', session.user.id);

          // Add timeout but handle it gracefully
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Query timeout')), 5000)
          );

          const profilePromise = supabase
            .from('profiles')
            .select('test_date, onboarding_complete, has_study_plan')
            .eq('id', session.user.id)
            .maybeSingle();

          const { data: profile, error: profileError } = await Promise.race([
            profilePromise,
            timeoutPromise
          ]) as any;

          console.log('[Index] Profile result:', { profile, profileError });

          if (profileError && mounted) {
            console.error('[Index] Profile query error:', profileError);
            // On error, assume they need onboarding
            setIsLoading(false);
            navigate('/onboarding', { replace: true });
            return;
          }

          // If user has completed onboarding OR has test_date, stay on dashboard
          if ((profile?.onboarding_complete || profile?.test_date) && mounted) {
            console.log('[Index] User has completed onboarding, showing dashboard');
            setProfile(profile);

            // Verify study plan exists in database (override profile flag if needed)
            try {
              const planCheckPromise = supabase
                .from('study_plan_days')
                .select('the_date')
                .eq('user_id', session.user.id)
                .limit(1);

              const planCheckTimeout = new Promise((resolve) =>
                setTimeout(() => resolve({ data: null }), 3000)
              );

              const { data: planCheck } = await Promise.race([
                planCheckPromise,
                planCheckTimeout
              ]) as any;

              const actuallyHasPlan = profile.has_study_plan || (planCheck && planCheck.length > 0);
              setHasStudyPlan(actuallyHasPlan);
            } catch {
              // If plan check fails, just use profile flag
              setHasStudyPlan(profile.has_study_plan ?? false);
            }

            setIsLoading(false);
            return;
          }

          // Otherwise, redirect to onboarding
          if (mounted) {
            console.log('[Index] Redirecting to onboarding - no onboarding_complete or test_date');
            setIsLoading(false);
            navigate('/onboarding', { replace: true });
            return;
          }
        } catch (error) {
          console.error('[Index] Profile check failed:', error);
          // On timeout or error, show dashboard anyway (user is authenticated)
          if (mounted) {
            setProfile({ onboarding_complete: true, has_study_plan: false, test_date: null });
            setHasStudyPlan(false);
            setIsLoading(false);
          }
        }
      } else {
        console.log('[Index] No session, showing landing page');
        setSession(null);
        setIsAuthenticated(false);
        setProfile(null);
        setHasStudyPlan(null);
      }
      
      if (mounted) {
        setIsLoading(false);
      }
    };

    // Set up single auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', { event, session: !!session });
        await syncAuthAndProfile(session);
      }
    );

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      syncAuthAndProfile(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

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


  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <CountdownHeader />
      <div className="container mx-auto px-4">
        <ParentBanner />
        <TestWeekBanner />
      </div>
      
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="mb-2 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back! 👋</h1>
              <p className="text-muted-foreground">
                {hasStudyPlan ? 'Your personalized study plan for today' : 'Continue your ACT preparation'}
              </p>
            </div>
            {hasStudyPlan && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  if (confirm('Switch to self-directed learning mode? Your study plan will remain saved.')) {
                    const { error } = await supabase
                      .from('profiles')
                      .update({ has_study_plan: false })
                      .eq('id', session?.user?.id);

                    if (!error) {
                      setHasStudyPlan(false);
                      setProfile((prev: any) => ({ ...prev, has_study_plan: false }));
                    }
                  }
                }}
              >
                Switch to Self-Directed
              </Button>
            )}
          </div>

          {/* Conditional Dashboard Content Based on has_study_plan Flag */}
          {hasStudyPlan ? (
            // Structured Study Plan Dashboard
            <>
              <StudyPlanWidget hasStudyPlan={true} />
              <WeeklyCalendar userId={session?.user?.id || ''} testDate={profile?.test_date} />
              <MasteryDashboard />
              <WeakAreasCard />
            </>
          ) : (
            // Self-Directed Learning Dashboard
            <div className="space-y-8">
              {/* Choose Your Path Section */}
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-xl p-8">
                <div className="max-w-3xl mx-auto text-center space-y-4">
                  <h2 className="text-2xl font-bold">Choose Your Study Path</h2>
                  <p className="text-muted-foreground">
                    Browse lessons and drills at your own pace, or let us create a personalized study plan based on your test date and goals.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                    <Button
                      size="lg"
                      variant="outline"
                      className="gap-2"
                    >
                      📚 Continue Self-Guided Learning
                    </Button>
                    <Button
                      size="lg"
                      className="gap-2 bg-primary"
                      onClick={() => setWizardOpen(true)}
                    >
                      🎯 Create Personalized Study Plan
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <Link to="/lessons">
                  <div className="p-6 border rounded-xl hover:shadow-lg transition-shadow bg-card h-full">
                    <div className="text-4xl mb-3">📚</div>
                    <h3 className="text-xl font-bold mb-2">Lessons Library</h3>
                    <p className="text-sm text-muted-foreground">
                      Browse and learn concepts at your own pace
                    </p>
                  </div>
                </Link>
                
                <Link to="/drill-runner">
                  <div className="p-6 border rounded-xl hover:shadow-lg transition-shadow bg-card h-full">
                    <div className="text-4xl mb-3">🎯</div>
                    <h3 className="text-xl font-bold mb-2">Timed Drills</h3>
                    <p className="text-sm text-muted-foreground">
                      Practice specific skills with timed questions
                    </p>
                  </div>
                </Link>
                
                <Link to="/simulation">
                  <div className="p-6 border rounded-xl hover:shadow-lg transition-shadow bg-card h-full">
                    <div className="text-4xl mb-3">⏱️</div>
                    <h3 className="text-xl font-bold mb-2">Practice Simulations</h3>
                    <p className="text-sm text-muted-foreground">
                      Take full-length section tests with real timing
                    </p>
                  </div>
                </Link>
              </div>
              
              <MasteryDashboard />
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
          setHasStudyPlan(true);
          setProfile((prev: any) => ({ ...prev, has_study_plan: true }));
        }}
      />
    </div>
  );
};

export default Index;
