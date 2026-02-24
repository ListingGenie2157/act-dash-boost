import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { FeatureCard } from '@/components/landing/FeatureCard';
import { Calculator, Target, Bot, TrendingUp, Timer, ArrowRight, RotateCcw, MessageCircle, ClipboardCheck, Gift } from 'lucide-react';
import preppitLogo from '@/assets/preppit-logo-new.png';

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
        <div className="max-w-md mx-auto text-center space-y-5 mb-12 pp-halo">
          <div className="flex justify-center mb-2 animate-fade-in">
            <img
              src={preppitLogo}
              alt="Preppit Pacing"
              className="w-auto"
              style={{ height: '100px', mixBlendMode: 'screen' }}
            />
          </div>

          <div className="space-y-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-[hsl(170,78%,39%)] to-[hsl(195,81%,31%)] bg-clip-text text-transparent">
                Train Your Brain.
              </span>
              <br />
              <span className="text-foreground">Crush The ACT.</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Full Simulations. AI Coaching.<br />Parent Accountability.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3 items-center mt-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <button
              onClick={() => navigate('/login')}
              className="pp-btn-primary text-sm px-6 py-3 flex items-center justify-center gap-2 group"
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
        </div>

        {/* Features Section */}
        <div className="max-w-md mx-auto space-y-5 pp-halo">
          <div className="text-center animate-fade-in">
            <h2 className="text-lg md:text-xl font-bold">
              More Than a <span className="text-primary">Question Bank</span>
            </h2>
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

          {/* Bottom CTA */}
          <div className="text-center space-y-3 pt-4 animate-fade-in">
            <button
              onClick={() => navigate('/login')}
              className="pp-btn-primary text-sm px-6 py-3 inline-flex items-center gap-2 group"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-xs text-muted-foreground">
              Start with our diagnostic to see exactly where you stand
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t pt-8 pb-4 mt-12" style={{ borderColor: 'var(--pp-border)' }}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm" style={{ color: 'var(--pp-muted)' }}>
              © {new Date().getFullYear()} Preppit Pacing. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="/terms" className="text-sm hover:text-foreground transition-colors" style={{ color: 'var(--pp-muted)' }}>Terms of Service</a>
              <a href="/privacy" className="text-sm hover:text-foreground transition-colors" style={{ color: 'var(--pp-muted)' }}>Privacy Policy</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
