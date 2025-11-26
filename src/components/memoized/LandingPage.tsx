/**
 * Memoized landing page component
 * Extracted from Index.tsx for better performance
 */

import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AnimatedCounter } from '@/components/landing/AnimatedCounter';
import { FeatureCard } from '@/components/landing/FeatureCard';
import { Calculator, Target, Bot, TrendingUp, Shuffle, Calendar, Sparkles, ArrowRight } from 'lucide-react';

export const LandingPage = memo(() => {
  const navigate = useNavigate();

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
});

LandingPage.displayName = 'LandingPage';
