import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { AnimatedCounter } from '@/components/landing/AnimatedCounter';
import { FeatureCard } from '@/components/landing/FeatureCard';
import { Card } from '@/components/ui/card';
import { Calculator, Target, Bot, TrendingUp, Users, Timer, ArrowRight, RotateCcw, MessageCircle, ClipboardCheck, Gift } from 'lucide-react';
import preppitLogo from '@/assets/preppit-logo.png';

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard', { replace: true });
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="relative container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="max-w-5xl mx-auto text-center space-y-8 mb-16">
          <div className="flex justify-center mb-8 animate-fade-in">
            <img src={preppitLogo} alt="Preppit Pacing" className="h-24 w-auto" />
          </div>


          <div className="space-y-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-[#14B8A6] to-[#0E7490] bg-clip-text text-transparent">
                Train Your Brain.
              </span>
              <br />
              <span className="text-foreground">Crush The ACT.</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Full Simulations. AI Coaching. Parent Accountability.
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="p-4 rounded-xl bg-card border border-white/[0.06] shadow-card card-hover">
              <div className="text-center space-y-1">
                <AnimatedCounter end={129} suffix="+" />
                <p className="text-sm text-muted-foreground">Skills Tracked</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-card border border-white/[0.06] shadow-card card-hover">
              <div className="text-center space-y-1">
                <ClipboardCheck className="w-8 h-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Full Simulations</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-card border border-white/[0.06] shadow-card card-hover">
              <div className="text-center space-y-1">
                <span className="font-bold text-3xl text-foreground">AI</span>
                <p className="text-sm text-muted-foreground">Tutor Included</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-card border border-white/[0.06] shadow-card card-hover">
              <div className="text-center space-y-1">
                <Users className="w-8 h-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Parent Portal</p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <Button 
              size="lg" 
              onClick={() => navigate('/login')}
              className="group text-lg px-8 py-6 h-auto"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Free Today
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate('/login')}
              className="text-lg px-8 py-6 h-auto"
            >
              Sign In
            </Button>
          </div>

          <p className="text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '400ms' }}>
            7-day free trial • Cancel anytime
          </p>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center animate-fade-in">
            <h2 className="text-2xl md:text-3xl font-bold">
              More Than a <span className="text-primary">Question Bank</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <FeatureCard icon={MessageCircle} title="Coached Test Mode" description="Real-time strategy tips during practice tests. Learn how to think on test day." badge="NEW" delay={0} />
            <FeatureCard icon={Timer} title="Pacing Lab" description="Master time management with chunk timers and two-pass strategy training. Worth 3-5 extra points." badge="UNIQUE" delay={100} />
            <FeatureCard icon={ClipboardCheck} title="Full ACT Simulations" description="Full-length timed section tests with authentic ACT-style questions and detailed results." badge="AUTHENTIC" delay={200} />
            <FeatureCard icon={Gift} title="Parent Portal" description="Parents set rewards for streaks and scores. Students earn, parents approve." badge="FAMILY" delay={300} />
            <FeatureCard icon={RotateCcw} title="Error Bank & Spaced Review" description="Missed questions go to your Error Bank. Spaced repetition brings them back at the perfect time." badge="SMART" delay={400} />
            <FeatureCard icon={Calculator} title="Calculator Lab" description="Master TI-84 shortcuts that save 10-15 minutes on test day." badge="HACKS" delay={500} />
            <FeatureCard icon={Target} title="129-Skill Mastery" description="Track 129 specific skills with granular progress. Most competitors track only 20-40." badge="5x MORE" delay={600} />
            <FeatureCard icon={Bot} title="AI Tutor" description="Instant, context-aware help. Explains concepts in your language." badge="AI POWERED" delay={700} />
            <FeatureCard icon={TrendingUp} title="Smart Weak Areas" description="Automatically detects and focuses on what you need most. Adaptive difficulty." delay={800} />
          </div>
        </div>

        {/* Social Proof */}
        <div className="max-w-5xl mx-auto mt-16 text-center space-y-8 animate-fade-in">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-8 bg-secondary border-0">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <div className="flex -space-x-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-10 h-10 rounded-full bg-gradient-primary border-2 border-background" />
                    ))}
                  </div>
                  <span className="text-sm font-medium ml-2">+1,000s of students</span>
                </div>
                <p className="text-lg text-muted-foreground italic">
                  "The Calculator Lab alone saved me 12 minutes on test day."
                </p>
                <p className="text-sm font-semibold">— Sarah K., scored 34 on ACT Math</p>
              </div>
            </Card>

            <Card className="p-8 bg-secondary border-0">
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <p className="text-lg text-muted-foreground italic">
                  "Coached Mode taught my son how to approach questions. He went from running out of time to finishing with 5 minutes to spare."
                </p>
                <p className="text-sm font-semibold">— Maria T., parent of 33-scorer</p>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Ready to boost your score?</h3>
            <Button 
              size="lg"
              onClick={() => navigate('/login')}
              className="group text-lg px-8 py-6 h-auto"
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

        {/* Footer */}
        <footer className="border-t border-white/[0.06] pt-8 pb-4 mt-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Preppit Pacing. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
              <a href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
