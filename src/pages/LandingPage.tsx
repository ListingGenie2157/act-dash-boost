import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AnimatedCounter } from '@/components/landing/AnimatedCounter';
import { FeatureCard } from '@/components/landing/FeatureCard';
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
    <div className="min-h-screen pp-page-bg relative overflow-hidden">
      <div className="relative container mx-auto px-4 py-16" style={{ zIndex: 1 }}>
        {/* Hero Section */}
        <div className="max-w-5xl mx-auto text-center space-y-8 mb-16 pp-halo">
          <div className="flex justify-center mb-4 animate-fade-in">
            <img src={preppitLogo} alt="Preppit Pacing" className="h-24 w-auto" />
          </div>

          <div className="space-y-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-[hsl(170,78%,39%)] to-[hsl(195,81%,31%)] bg-clip-text text-transparent">
                Train Your Brain.
              </span>
              <br />
              <span className="text-foreground">Crush The ACT.</span>
            </h1>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="pp-stat-card p-4 card-hover">
              <div className="text-center space-y-1 relative z-10">
                <AnimatedCounter end={129} suffix="+" />
                <p className="text-sm" style={{ color: 'var(--pp-muted)' }}>Skills Tracked</p>
              </div>
            </div>
            <div className="pp-stat-card p-4 card-hover">
              <div className="text-center space-y-1 relative z-10">
                <ClipboardCheck className="w-8 h-8 mx-auto" style={{ color: 'var(--pp-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--pp-muted)' }}>Full Simulations</p>
              </div>
            </div>
            <div className="pp-stat-card p-4 card-hover">
              <div className="text-center space-y-1 relative z-10">
                <span className="font-bold text-3xl" style={{ color: 'var(--pp-text)' }}>AI</span>
                <p className="text-sm" style={{ color: 'var(--pp-muted)' }}>Tutor Included</p>
              </div>
            </div>
            <div className="pp-stat-card p-4 card-hover">
              <div className="text-center space-y-1 relative z-10">
                <Users className="w-8 h-8 mx-auto" style={{ color: 'var(--pp-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--pp-muted)' }}>Parent Portal</p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <button
              onClick={() => navigate('/login')}
              className="pp-btn-primary text-lg px-8 py-4 flex items-center justify-center gap-2 group"
            >
              Start Free Today
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="pp-btn-ghost text-lg px-8 py-4"
            >
              Sign In
            </button>
          </div>

          <p className="text-sm animate-fade-in" style={{ animationDelay: '400ms', color: 'var(--pp-muted)' }}>
            7-day free trial • Cancel anytime
          </p>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto space-y-8 pp-halo">
          <div className="text-center animate-fade-in">
            <h2 className="text-2xl md:text-3xl font-bold">
              More Than a <span className="text-primary">Question Bank</span>
            </h2>
          </div>

          <div className="pp-feature-grid animate-fade-in" style={{ animationDelay: '100ms' }}>
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
            <div className="pp-card p-8">
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-center gap-2">
                  <div className="flex -space-x-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-10 h-10 rounded-full bg-gradient-primary border-2" style={{ borderColor: 'var(--pp-bg0)' }} />
                    ))}
                  </div>
                  <span className="text-sm font-medium ml-2">+1,000s of students</span>
                </div>
                <p className="text-lg italic" style={{ color: 'var(--pp-muted)' }}>
                  "The Calculator Lab alone saved me 12 minutes on test day."
                </p>
                <p className="text-sm font-semibold">— Sarah K., scored 34 on ACT Math</p>
              </div>
            </div>

            <div className="pp-card p-8">
              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <p className="text-lg italic" style={{ color: 'var(--pp-muted)' }}>
                  "Coached Mode taught my son how to approach questions. He went from running out of time to finishing with 5 minutes to spare."
                </p>
                <p className="text-sm font-semibold">— Maria T., parent of 33-scorer</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Ready to boost your score?</h3>
            <button
              onClick={() => navigate('/login')}
              className="pp-btn-primary text-lg px-8 py-4 inline-flex items-center gap-2 group"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-sm" style={{ color: 'var(--pp-muted)' }}>
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
