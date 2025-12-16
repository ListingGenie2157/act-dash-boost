import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Timer, Zap, Target, Clock, ArrowRight, TrendingUp, Brain, RotateCcw } from 'lucide-react';

const PacingLab = () => {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);

  const pacingModes = [
    {
      id: 'quick-drill',
      title: 'Quick Drill Pacing',
      description: 'Short 5-question bursts with real-time pace feedback. Perfect for building speed on individual skills.',
      icon: Zap,
      badge: 'SPEED',
      duration: '3-5 min',
      gradient: 'from-primary/10 via-accent/10 to-primary/10',
      link: '/drill-runner?mode=quick-pace',
      features: ['5 questions per drill', 'Real-time pace indicator', 'Target time per question', 'Instant feedback']
    },
    {
      id: 'section-sim',
      title: 'Section Simulation Pacing',
      description: 'Full section practice with live pacing cues. Learn to manage your time across an entire section.',
      icon: Clock,
      badge: 'ENDURANCE',
      duration: '35-60 min',
      gradient: 'from-accent/10 via-secondary/10 to-accent/10',
      link: '/simulation?coached=true',
      features: ['Full section timing', 'Pace-ahead/behind alerts', 'Chunk timer support', 'Section-specific strategies']
    },
    {
      id: 'two-pass',
      title: 'Two-Pass Trainer',
      description: 'Master the two-pass strategy: quick first pass, then deep dive on flagged questions.',
      icon: RotateCcw,
      badge: 'STRATEGY',
      duration: '20-40 min',
      gradient: 'from-secondary/10 via-primary/10 to-secondary/10',
      link: '/simulation?coached=true&twopass=true',
      features: ['Pass 1: Quick scan', 'Pass 2: Deep dive', 'Flag management', 'Time allocation coaching']
    },
    {
      id: 'chunk-timer',
      title: 'Chunk Timer Practice',
      description: 'Break sections into manageable 5-10 question chunks. Build stamina without overwhelm.',
      icon: Target,
      badge: 'FOCUS',
      duration: '15-30 min',
      gradient: 'from-primary/10 via-secondary/10 to-primary/10',
      link: '/simulation?coached=true&chunks=true',
      features: ['5-10 questions per chunk', 'Chunk completion celebrations', 'Pace tracking per chunk', 'Break prompts between chunks']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative container max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
            <Timer className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Pacing Lab</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold">
            <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              Master Your Pace
            </span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Time management is worth 3-5 points on the ACT. Train your pacing instincts with targeted practice modes designed to build speed and stamina.
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">3-5</div>
              <div className="text-xs text-muted-foreground">Points gained</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">10-15</div>
              <div className="text-xs text-muted-foreground">Minutes saved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent-foreground">4</div>
              <div className="text-xs text-muted-foreground">Training modes</div>
            </div>
          </div>
        </div>

        {/* Pacing Modes Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {pacingModes.map((mode, index) => (
            <Card 
              key={mode.id}
              className={`group relative overflow-hidden bg-gradient-to-br ${mode.gradient} backdrop-blur-sm border-primary/20 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-2 animate-fade-in cursor-pointer`}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => setSelectedMode(selectedMode === mode.id ? null : mode.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 group-hover:scale-110 transition-transform">
                    <mode.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      {mode.badge}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{mode.duration}</span>
                  </div>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {mode.title}
                </CardTitle>
                <CardDescription className="text-sm">
                  {mode.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <ul className="grid grid-cols-2 gap-2">
                    {mode.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    asChild
                    className="w-full group/btn bg-gradient-to-r from-primary to-accent hover:shadow-lg transition-all"
                  >
                    <Link to={mode.link} className="flex items-center gap-2">
                      Start Training
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Why Pacing Matters Section */}
        <Card className="bg-gradient-to-br from-accent/10 via-primary/5 to-secondary/10 backdrop-blur-sm border-primary/20 animate-fade-in">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20">
                <Brain className="w-10 h-10 text-primary" />
              </div>
              <div className="flex-1 space-y-4">
                <h3 className="text-2xl font-bold">Why Pacing Training Works</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                    <TrendingUp className="w-5 h-5 text-primary mb-2" />
                    <h4 className="font-semibold mb-1">Build Instincts</h4>
                    <p className="text-sm text-muted-foreground">
                      Train your internal clock so you naturally know when to move on.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                    <Zap className="w-5 h-5 text-secondary mb-2" />
                    <h4 className="font-semibold mb-1">Reduce Anxiety</h4>
                    <p className="text-sm text-muted-foreground">
                      Confident pacers don't panic. Practice builds calm under pressure.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                    <Target className="w-5 h-5 text-accent-foreground mb-2" />
                    <h4 className="font-semibold mb-1">Maximize Points</h4>
                    <p className="text-sm text-muted-foreground">
                      Never leave easy points on the table by running out of time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PacingLab;
