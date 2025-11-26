import { useState, useEffect } from 'react';
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
import { AnimatedCounter } from '@/components/landing/AnimatedCounter';
import { FeatureCard } from '@/components/landing/FeatureCard';
import { Calculator, Target, Bot, TrendingUp, Shuffle, Calendar, Sparkles, ArrowRight, BookOpen, Clock, Zap, User } from 'lucide-react';

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [session, setSession] = useState<any>(null);
  
  interface Profile {
    test_date?: string | null;
    onboarding_complete?: boolean | null;
    has_study_plan?: boolean | null;
    first_name?: string | null;
  }
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hasStudyPlan, setHasStudyPlan] = useState<boolean | null>(null);
  const [hasDiagnostic, setHasDiagnostic] = useState<boolean>(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const navigate = useNavigate();

  // Enhanced auth state management with proper listeners
  useEffect(() => {
    let mounted = true;

    const syncAuthAndProfile = async (session: any) => {
      if (!mounted) return;

      if (import.meta.env.DEV) console.log('[Index] syncAuthAndProfile called', { hasSession: !!session });

      if (session) {
        setSession(session);
        setIsAuthenticated(true);
        
        try {
          if (import.meta.env.DEV) console.log('[Index] Fetching profile for user:', session.user.id);

          // Add timeout but handle it gracefully
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Query timeout')), 10000)
          );

          const profilePromise = supabase
            .from('profiles')
            .select('test_date, onboarding_complete, has_study_plan, first_name')
            .eq('id', session.user.id)
            .maybeSingle();

          const result = await Promise.race([
            profilePromise,
            timeoutPromise
          ]);
          
          const { data: profile, error: profileError } = result as { 
            data: any; 
            error: any; 
          };

          if (import.meta.env.DEV) console.log('[Index] Profile result:', { profile, profileError });

          if (profileError && mounted) {
            console.error('[Index] Profile query error:', profileError);
            // On error, assume they need onboarding
            setIsLoading(false);
            navigate('/onboarding', { replace: true });
            return;
          }

          // If user has completed onboarding OR has test_date, stay on dashboard
          if ((profile?.onboarding_complete || profile?.test_date) && mounted) {
            if (import.meta.env.DEV) console.log('[Index] User has completed onboarding, showing dashboard');
            setProfile(profile);

            // Verify study plan exists in database (override profile flag if needed)
            try {
              const planCheckPromise = supabase
                .from('study_tasks')
                .select('id')
                .eq('user_id', session.user.id)
                .limit(1);

              const planCheckTimeout = new Promise((resolve) =>
                setTimeout(() => resolve({ data: null }), 3000)
              );

              const planResult = await Promise.race([
                planCheckPromise,
                planCheckTimeout
              ]);
              
              const { data: planCheck } = planResult as { data: any[] | null };

              const actuallyHasPlan = profile.has_study_plan || (planCheck && planCheck.length > 0);
              setHasStudyPlan(actuallyHasPlan);
            } catch {
              // If plan check fails, just use profile flag
              setHasStudyPlan(profile.has_study_plan ?? false);
            }

            // Check if user has completed a diagnostic (exclude test/self-generated records)
            try {
              const { data: diagnosticData } = await supabase
                .from('diagnostics')
                .select('id')
                .eq('user_id', session.user.id)
                .eq('source', 'diagnostic')  // Only count actual diagnostic assessments
                .not('completed_at', 'is', null)
                .limit(1);
              
              setHasDiagnostic((diagnosticData?.length ?? 0) > 0);
            } catch {
              setHasDiagnostic(false);
            }

            setIsLoading(false);
            return;
          }

          // Otherwise, redirect to onboarding
          if (mounted) {
            if (import.meta.env.DEV) console.log('[Index] Redirecting to onboarding - no onboarding_complete or test_date');
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
        if (import.meta.env.DEV) console.log('[Index] No session, showing landing page');
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
        if (import.meta.env.DEV) console.log('Auth state changed:', { event, session: !!session });
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
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="max-w-5xl mx-auto text-center space-y-8 mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm animate-fade-in">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">The Smart Way to Prep for ACT</span>
            </div>

            <div className="space-y-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                  Ace Your ACT
                </span>
                <br />
                <span className="text-foreground">Like Never Before</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Master every skill with AI-powered prep that adapts to <span className="font-semibold text-foreground">your</span> needs. 
                No more guessing what to study.
              </p>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg">
                <div className="text-center space-y-1">
                  <AnimatedCounter end={129} suffix="+" />
                  <p className="text-sm text-muted-foreground">Skills Tracked</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg">
                <div className="text-center space-y-1">
                  <AnimatedCounter end={15} suffix=" min" />
                  <p className="text-sm text-muted-foreground">Time Saved</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg">
                <div className="text-center space-y-1">
                  <span className="font-bold text-3xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">AI</span>
                  <p className="text-sm text-muted-foreground">Tutor Included</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg">
                <div className="text-center space-y-1">
                  <span className="font-bold text-3xl text-success">100%</span>
                  <p className="text-sm text-muted-foreground">Free to Start</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12 animate-fade-in" style={{ animationDelay: '300ms' }}>
              <Button 
                size="lg" 
                onClick={() => navigate('/login')}
                className="group relative overflow-hidden bg-gradient-to-r from-primary to-secondary hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300 text-lg px-8 py-6 h-auto"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Free Today
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-secondary to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => navigate('/login')}
                className="border-2 hover:bg-muted/50 text-lg px-8 py-6 h-auto"
              >
                Sign In
              </Button>
            </div>

            <p className="text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '400ms' }}>
              No credit card required • Start immediately • Join thousands of students
            </p>
          </div>

          {/* Features Section */}
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4 animate-fade-in">
              <h2 className="text-3xl md:text-4xl font-bold">
                Features Other Prep Apps <span className="text-primary">Don't Have</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                We built features that actually make a difference in your score
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <FeatureCard
                icon={Calculator}
                title="Calculator Lab"
                description="Master TI-84 shortcuts that save 10-15 minutes on test day. Interactive practice modes teach you efficiency tricks other students don't know."
                badge="UNIQUE"
                gradient="from-purple-500/10 via-pink-500/10 to-purple-500/10"
                delay={0}
              />
              
              <FeatureCard
                icon={Target}
                title="129-Skill Mastery"
                description="Not just 'math' or 'reading' - track 129 specific skills with granular progress. Most competitors track only 20-40 skills."
                badge="5x MORE"
                gradient="from-blue-500/10 via-indigo-500/10 to-blue-500/10"
                delay={100}
              />
              
              <FeatureCard
                icon={Bot}
                title="AI Tutor"
                description="Get instant, context-aware help without interrupting your practice. Explains concepts in your language, adapts to your learning style."
                badge="AI POWERED"
                gradient="from-green-500/10 via-teal-500/10 to-green-500/10"
                delay={200}
              />
              
              <FeatureCard
                icon={TrendingUp}
                title="Smart Weak Areas"
                description="Automatically detects and focuses on what YOU need most. Adaptive difficulty ensures you're always challenged at the right level."
                gradient="from-orange-500/10 via-red-500/10 to-orange-500/10"
                delay={300}
              />
              
              <FeatureCard
                icon={Shuffle}
                title="Answer Shuffling"
                description="Can't memorize answer patterns - you actually learn. Every practice session shuffles choices so you understand concepts, not positions."
                gradient="from-cyan-500/10 via-blue-500/10 to-cyan-500/10"
                delay={400}
              />
              
              <FeatureCard
                icon={Calendar}
                title="Test-Date Driven"
                description="Custom roadmap based on YOUR timeline. Daily tasks auto-generate to ensure you cover everything before test day."
                gradient="from-violet-500/10 via-purple-500/10 to-violet-500/10"
                delay={500}
              />
            </div>
          </div>

          {/* Social Proof Section */}
          <div className="max-w-4xl mx-auto mt-20 text-center space-y-8 animate-fade-in">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-success/10 to-primary/10 border border-success/20 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <div className="flex -space-x-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary border-2 border-background" />
                    ))}
                  </div>
                  <span className="text-sm font-medium ml-2">+1,000s of students</span>
                </div>
                <p className="text-lg text-muted-foreground">
                  "The Calculator Lab alone saved me 12 minutes on test day. That's like getting extra questions right just from efficiency!"
                </p>
                <p className="text-sm font-semibold">— Sarah K., scored 34 on ACT Math</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-2xl font-bold">Ready to boost your score?</h3>
              <Button 
                size="lg"
                onClick={() => navigate('/login')}
                className="group bg-gradient-to-r from-primary to-secondary hover:shadow-2xl hover:shadow-primary/50 transition-all text-lg px-8 py-6 h-auto"
              >
                <span className="flex items-center gap-2">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
              <p className="text-sm text-muted-foreground">
                Start with our diagnostic to see exactly where you stand
              </p>
            </div>
          </div>
        </div>
      </div>
    );
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
                  onClick={async () => {
                    if (confirm('Switch to self-directed learning mode? Your study plan will remain saved.')) {
                      const { error } = await supabase
                        .from('profiles')
                        .update({ has_study_plan: false })
                        .eq('id', session?.user?.id);

                      if (!error) {
                        setHasStudyPlan(false);
                        setProfile((prev) => prev ? { ...prev, has_study_plan: false } : prev);
                      }
                    }
                  }}
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
              <WeeklyCalendar userId={session?.user?.id || ''} testDate={profile?.test_date} />
              
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
          setHasStudyPlan(true);
          setProfile((prev) => prev ? { ...prev, has_study_plan: true } : prev);
        }}
      />
    </div>
  );
};

export default Index;
