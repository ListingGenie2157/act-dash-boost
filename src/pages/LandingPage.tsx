import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { AnimatedCounter } from '@/components/landing/AnimatedCounter';
import { FeatureCard } from '@/components/landing/FeatureCard';
import { Calculator, Target, Bot, TrendingUp, Users, Timer, Sparkles, ArrowRight, RotateCcw, MessageCircle, ClipboardCheck, Gift } from 'lucide-react';
import preppitLogo from '@/assets/preppit-logo.png';

const LandingPage = () => {
  const navigate = useNavigate();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard', { replace: true });
      }
    });
  }, [navigate]);

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
          {/* Logo */}
          <div className="flex justify-center mb-8 animate-fade-in">
            <img src={preppitLogo} alt="Preppit Pacing" className="h-24 w-auto" />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">The Smart Way to Prep for ACT</span>
          </div>

          <div className="space-y-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
                Train Your Brain.
              </span>
              <br />
              <span className="text-foreground">Crush The ACT.</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Full-length simulations. Coached practice tests. AI tutoring. Parent rewards. 
              <span className="font-semibold text-foreground"> This isn't just a question bank</span> — it's a complete ACT training system.
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
                <ClipboardCheck className="w-8 h-8 mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">Full Simulations</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg">
              <div className="text-center space-y-1">
                <span className="font-bold text-3xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">AI</span>
                <p className="text-sm text-muted-foreground">Tutor Included</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all hover:shadow-lg">
              <div className="text-center space-y-1">
                <Users className="w-8 h-8 mx-auto text-accent" />
                <p className="text-sm text-muted-foreground">Parent Portal</p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <Button 
              size="lg" 
              onClick={() => navigate('/login')}
              className="group relative overflow-hidden bg-gradient-to-r from-primary to-accent hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300 text-lg px-8 py-6 h-auto"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Free Today
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
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
            7-day free trial • Cancel anytime • Join thousands of students
          </p>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold">
              More Than a <span className="text-primary">Question Bank</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Full simulations, real-time coaching, parent accountability, and science-backed review — all in one platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <FeatureCard
              icon={MessageCircle}
              title="Coached Test Mode"
              description="Get real-time strategy tips like 'flag and move on' or 'eliminate two choices first' during practice tests. Learn how to think on test day."
              badge="NEW"
              gradient="from-primary/10 via-accent/10 to-primary/10"
              delay={0}
            />
            
            <FeatureCard
              icon={Timer}
              title="Pacing Lab"
              description="Master time management with targeted pacing drills, chunk timers, and two-pass strategy training. Worth 3-5 extra points."
              badge="UNIQUE"
              gradient="from-accent/10 via-primary/10 to-accent/10"
              delay={100}
            />
            
            <FeatureCard
              icon={ClipboardCheck}
              title="Full ACT Simulations"
              description="Not just a question bank. Take full-length timed section tests with authentic ACT-style questions, answer bubbling, and detailed results."
              badge="AUTHENTIC"
              gradient="from-secondary/10 via-accent/10 to-secondary/10"
              delay={200}
            />
            
            <FeatureCard
              icon={Gift}
              title="Parent Portal"
              description="Parents can set rewards for streaks, drill scores, and simulation completions. Students earn, parents approve — motivation meets accountability."
              badge="FAMILY"
              gradient="from-success/10 via-primary/10 to-success/10"
              delay={300}
            />
            
            <FeatureCard
              icon={RotateCcw}
              title="Error Bank & Spaced Review"
              description="Missed a question? It goes into your Error Bank for targeted review. Our spaced repetition algorithm brings questions back at the perfect time."
              badge="SMART"
              gradient="from-primary/10 via-secondary/10 to-primary/10"
              delay={400}
            />

            <FeatureCard
              icon={Calculator}
              title="Calculator Lab"
              description="Master TI-84 shortcuts that save 10-15 minutes on test day. Interactive practice modes teach you efficiency tricks other students don't know."
              badge="HACKS"
              gradient="from-accent/10 via-secondary/10 to-accent/10"
              delay={500}
            />
            
            <FeatureCard
              icon={Target}
              title="129-Skill Mastery"
              description="Not just 'math' or 'reading' — track 129 specific skills with granular progress. Most competitors track only 20-40 skills."
              badge="5x MORE"
              gradient="from-secondary/10 via-primary/10 to-secondary/10"
              delay={600}
            />
            
            <FeatureCard
              icon={Bot}
              title="AI Tutor"
              description="Get instant, context-aware help without interrupting your practice. Explains concepts in your language, adapts to your learning style."
              badge="AI POWERED"
              gradient="from-success/10 via-accent/10 to-success/10"
              delay={700}
            />
            
            <FeatureCard
              icon={TrendingUp}
              title="Smart Weak Areas"
              description="Automatically detects and focuses on what YOU need most. Adaptive difficulty ensures you're always challenged at the right level."
              gradient="from-primary/10 via-accent/10 to-primary/10"
              delay={800}
            />
          </div>
        </div>

        {/* Social Proof Section */}
        <div className="max-w-5xl mx-auto mt-20 text-center space-y-8 animate-fade-in">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-success/10 to-primary/10 border border-success/20 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <div className="flex -space-x-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent border-2 border-background" />
                    ))}
                  </div>
                  <span className="text-sm font-medium ml-2">+1,000s of students</span>
                </div>
                <p className="text-lg text-muted-foreground italic">
                  "The Calculator Lab alone saved me 12 minutes on test day. That's like getting extra questions right just from efficiency!"
                </p>
                <p className="text-sm font-semibold">— Sarah K., scored 34 on ACT Math</p>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-accent/10 to-secondary/10 border border-accent/20 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <Users className="w-8 h-8 text-accent" />
                </div>
                <p className="text-lg text-muted-foreground italic">
                  "The Coached Mode taught my son how to approach questions, not just what the answers are. He went from running out of time to finishing with 5 minutes to spare."
                </p>
                <p className="text-sm font-semibold">— Maria T., parent of 33-scorer</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Ready to boost your score?</h3>
            <Button 
              size="lg"
              onClick={() => navigate('/login')}
              className="group bg-gradient-to-r from-primary to-accent hover:shadow-2xl hover:shadow-primary/50 transition-all text-lg px-8 py-6 h-auto"
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
};

export default LandingPage;
