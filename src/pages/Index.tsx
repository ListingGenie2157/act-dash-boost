import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CountdownHeader } from '@/components/CountdownHeader';
import { StudyPlanWidget } from '@/components/StudyPlanWidget';
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
  const navigate = useNavigate();

  // Enhanced auth state management with proper listeners
  useEffect(() => {
    let mounted = true;

    const checkAuthAndProfile = async () => {
      try {
        // Check for existing session first
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // Set up auth state listener FIRST
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', { event, session: !!session });
            
            if (!mounted) return;
            
            if (session) {
              setIsAuthenticated(true);
              
              // Check if user has completed onboarding
              // Query profiles table for test_date, onboarding_complete, and has_study_plan
              try {
                const { data: profile, error: profileError } = await supabase
                  .from('profiles')
                  .select('test_date, onboarding_complete, has_study_plan')
                  .eq('id', session.user.id)
                  .maybeSingle();
                
                console.log('Profile check:', { profile, error: profileError });

                // Also check user_profiles for onboarding flags
                const { data: userProfile } = await supabase
                  .from('user_profiles')
                  .select('age_verified, tos_accepted')
                  .eq('user_id', session.user.id)
                  .maybeSingle();

                console.log('User profile check:', { userProfile });
                
                // If user has test_date AND user_profile exists, stay on dashboard
                if (profile?.test_date && userProfile && mounted) {
                  console.log('User has test date and profile, staying on dashboard');
                  setIsLoading(false);
                  return;
                }
                
                // Otherwise, redirect to onboarding
                if (mounted) {
                  console.log('Redirecting to onboarding - missing test_date or user_profile');
                  navigate('/onboarding', { replace: true });
                  return;
                }
              } catch (profileError) {
                console.error('Profile check failed:', profileError);
                // On error, safer to send to onboarding
                if (mounted) {
                  navigate('/onboarding', { replace: true });
                  return;
                }
              }
            } else {
              setIsAuthenticated(false);
            }
            
            if (mounted) {
              setIsLoading(false);
            }
          }
        );

        // Initial check with current session
        if (sessionError) {
          console.error('Session check error:', sessionError);
          if (mounted) {
            setIsAuthenticated(false);
            setIsLoading(false);
          }
          return () => {
            mounted = false;
            subscription.unsubscribe();
          };
        }

        if (!session && mounted) {
          setIsAuthenticated(false);
          setIsLoading(false);
        }

        return () => {
          mounted = false;
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Auth check failed:', error);
        if (mounted) {
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, _session) => {
        if (!mounted) return;
        
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          checkAuthAndProfile();
        }
      }
    );

    // Initial check
    checkAuthAndProfile();

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

  // Authenticated user dashboard
  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession?.user) {
        setSession(currentSession);
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('has_study_plan, test_date')
          .eq('id', currentSession.user.id)
          .maybeSingle();
        
        setProfile(profileData);
        setHasStudyPlan(profileData?.has_study_plan ?? false);
      }
    };
    
    if (isAuthenticated) {
      fetchUserProfile();
    }
  }, [isAuthenticated]);

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
          <div className="mb-2">
            <h1 className="text-3xl font-bold mb-2">Welcome back! 👋</h1>
            <p className="text-muted-foreground">
              {hasStudyPlan ? 'Your personalized study plan for today' : 'Continue your ACT preparation'}
            </p>
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
              <div className="grid md:grid-cols-3 gap-6">
                <Link to="/lessons-library">
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
    </div>
  );
};

export default Index;
