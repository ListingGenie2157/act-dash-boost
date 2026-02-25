import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { FeatureCard } from '@/components/landing/FeatureCard';
import { AnimatedCounter } from '@/components/landing/AnimatedCounter';
import { Calculator, Target, Bot, TrendingUp, Timer, ArrowRight, RotateCcw, MessageCircle, ClipboardCheck, Gift, CheckCircle } from 'lucide-react';
import preppitLogo from '@/assets/preppit-logo-transparent.png';

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
    <div className="min-h-screen pp-page-bg relative overflow-hidden">
      <div className="relative container mx-auto px-4 py-12" style={{ zIndex: 1 }}>
        {/* Hero Section */}
        <div className="max-w-2xl mx-auto text-center space-y-5 mb-14 pp-halo">
          <div className="flex justify-center mb-2 animate-fade-in">
            <img
              src={preppitLogo}
              alt="Preppit Pacing"
              className="w-auto h-28"
            />
          </div>

          <div className="space-y-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-[hsl(170,78%,39%)] to-[hsl(195,81%,31%)] bg-clip-text text-transparent">
                Train Your Brain.
              </span>
              <br />
              <span className="text-foreground">Crush The ACT.</span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">
              Full Simulations. AI Coaching. Parent Accountability.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center mt-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <button
              onClick={() => navigate('/login')}
              className="pp-btn-primary text-sm px-8 py-3.5 flex items-center justify-center gap-2 group"
            >
              Start Free Today
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="pp-btn-ghost text-sm px-6 py-3"
            >
              Sign In
            </button>
          </div>

          {/* Trial info */}
          <p className="text-xs text-muted-foreground animate-fade-in" style={{ animationDelay: '300ms' }}>
            No credit card required · 7-day free trial
          </p>
        </div>

        {/* Stats Section */}
        <div className="max-w-2xl mx-auto mb-14 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="grid grid-cols-3 gap-4">
            <div className="pp-stat-card p-5 text-center">
              <div className="relative z-10">
                <AnimatedCounter end={466} suffix="+" />
                <p className="text-xs text-muted-foreground mt-1">Practice Questions</p>
              </div>
            </div>
            <div className="pp-stat-card p-5 text-center">
              <div className="relative z-10">
                <AnimatedCounter end={129} />
                <p className="text-xs text-muted-foreground mt-1">Skills Tracked</p>
              </div>
            </div>
            <div className="pp-stat-card p-5 text-center">
              <div className="relative z-10">
                <AnimatedCounter end={4} />
                <p className="text-xs text-muted-foreground mt-1">ACT Sections</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-2xl mx-auto space-y-5 pp-halo">
          <div className="text-center animate-fade-in">
            <h2 className="text-xl md:text-2xl font-bold">
              More Than a <span className="text-primary">Question Bank</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-2">Everything you need to hit your target score</p>
          </div>

          <div className="pp-feature-grid animate-fade-in" style={{ animationDelay: '100ms' }}>
            <FeatureCard icon={MessageCircle} title="Coached Test Mode" description="Real-time strategy tips during practice tests. Learn how to think on test day." delay={0} />
            <FeatureCard icon={Timer} title="Pacing Lab" description="Master time management with chunk timers and two-pass strategy training. Worth 3-5 extra points." badge="466 questions" delay={100} />
            <FeatureCard icon={ClipboardCheck} title="Full ACT Simulations" description="Full-length timed section tests with authentic ACT-style questions and detailed results." delay={200} />
            <FeatureCard icon={RotateCcw} title="Error Bank & Spaced Review" description="Missed questions go to your Error Bank. Spaced repetition brings them back at the perfect time." delay={300} />
            <FeatureCard icon={Calculator} title="Calculator Lab" description="Master TI-84 shortcuts that save 10-15 minutes on test day." delay={400} />
            <FeatureCard icon={Target} title="129-Skill Mastery" description="Track 129 specific skills with granular progress." delay={500} />
            <FeatureCard icon={Bot} title="AI Tutor" description="Instant, context-aware help. Explains concepts in your language." delay={600} />
            <FeatureCard icon={Gift} title="Parent Portal" description="Parents set rewards for streaks and scores. Students earn, parents approve." delay={700} />
            <FeatureCard icon={TrendingUp} title="Smart Weak Areas" description="Automatically detects and focuses on what you need most." delay={800} />
          </div>
        </div>

        {/* Social Proof */}
        <div className="max-w-2xl mx-auto mt-14 pp-halo animate-fade-in">
          <div className="pp-card p-6 md:p-8 text-center space-y-4">
            <div className="relative z-10 space-y-4">
              <h3 className="text-lg font-bold">Why Students Choose Preppit</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 justify-center text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Pacing strategies worth 3-5 pts</span>
                </div>
                <div className="flex items-center gap-2 justify-center text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>AI tutor available 24/7</span>
                </div>
                <div className="flex items-center gap-2 justify-center text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Built-in parent accountability</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center space-y-3 pt-10 pb-4 animate-fade-in">
          <button
            onClick={() => navigate('/login')}
            className="pp-btn-primary text-sm px-8 py-3.5 inline-flex items-center gap-2 group"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-xs text-muted-foreground">
            Start with our diagnostic to see exactly where you stand
          </p>
        </div>

        {/* Footer */}
        <footer className="border-t border-border/30 pt-8 pb-4 mt-12">
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
