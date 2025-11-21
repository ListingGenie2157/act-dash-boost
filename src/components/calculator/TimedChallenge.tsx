import { useState } from 'react';
import { CalculatorLesson } from '@/data/calculatorLessons';
import { GuidedPractice } from './GuidedPractice';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Timer, Zap, Trophy, ArrowRight } from 'lucide-react';
import { useCalculatorProgress } from '@/hooks/useCalculatorProgress';
import confetti from 'canvas-confetti';

type ChallengePhase = 'intro' | 'manual' | 'calculator' | 'results';

interface TimedChallengeProps {
  lesson: CalculatorLesson;
  onComplete?: () => void;
}

export const TimedChallenge = ({ lesson, onComplete }: TimedChallengeProps) => {
  const [phase, setPhase] = useState<ChallengePhase>('intro');
  const [manualTime, setManualTime] = useState(0);
  const [calculatorTime, setCalculatorTime] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const { saveProgress } = useCalculatorProgress();

  const startManualRound = () => {
    setPhase('manual');
    setStartTime(Date.now());
  };

  const finishManualRound = () => {
    const elapsed = Date.now() - startTime;
    setManualTime(elapsed);
    setPhase('calculator');
    setStartTime(Date.now());
  };

  const finishCalculatorRound = () => {
    const elapsed = Date.now() - startTime;
    setCalculatorTime(elapsed);
    const timeSaved = manualTime - elapsed;
    
    setPhase('results');
    
    // Confetti!
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 }
    });

    // Save to database
    saveProgress({
      lessonId: lesson.id,
      mode: 'challenge',
      completionTime: elapsed,
      timeSaved: timeSaved > 0 ? timeSaved : 0,
    });
  };

  const formatTime = (ms: number) => (ms / 1000).toFixed(1);

  if (!lesson.challengeMode) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Challenge Mode Not Available</CardTitle>
          <CardDescription>
            This lesson doesn't have a timed challenge yet. Try the guided practice instead!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onComplete}>Back to Lessons</Button>
        </CardContent>
      </Card>
    );
  }

  // Intro Phase
  if (phase === 'intro') {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Trophy className="w-16 h-16 text-yellow-500" />
          </div>
          <CardTitle className="text-3xl">{lesson.title}</CardTitle>
          <CardDescription className="text-lg">Timed Challenge Mode</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 p-6 rounded-xl">
            <h3 className="font-semibold text-lg mb-3">How it works:</h3>
            <ol className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">1</Badge>
                <span><strong>Manual Round:</strong> Solve the problem by hand. Timer tracks your speed.</span>
              </li>
              <li className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">2</Badge>
                <span><strong>Calculator Round:</strong> Solve using the calculator shortcut with guided practice.</span>
              </li>
              <li className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5">3</Badge>
                <span><strong>Results:</strong> See how much time you saved!</span>
              </li>
            </ol>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Expected Manual Time</div>
              <div className="text-2xl font-bold">{lesson.challengeMode.expectedManualTime}s</div>
            </div>
            <div className="p-4 border rounded-lg bg-primary/5">
              <div className="text-sm text-muted-foreground mb-1">Expected Calculator Time</div>
              <div className="text-2xl font-bold text-primary">{lesson.challengeMode.expectedCalcTime}s</div>
            </div>
          </div>

          <Button onClick={startManualRound} size="lg" className="w-full">
            Start Challenge
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Manual Round Phase
  if (phase === 'manual') {
    const elapsed = startTime ? (Date.now() - startTime) / 1000 : 0;
    
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Timer className="w-5 h-5" />
              Round 1: Manual Solving
            </CardTitle>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {elapsed.toFixed(1)}s
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-6 rounded-lg">
            <div className="text-sm text-muted-foreground mb-3">Problem:</div>
            <div className="text-xl font-mono">
              {lesson.challengeMode.manualProblem}
            </div>
          </div>

          <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/20">
            <p className="text-sm text-muted-foreground">
              💡 Solve this problem by hand. When you're done (or want to give up), click "Done" below.
              The timer is running!
            </p>
          </div>

          <Button onClick={finishManualRound} size="lg" className="w-full">
            I'm Done (or Skip)
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Calculator Round Phase
  if (phase === 'calculator') {
    return (
      <div className="space-y-4">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Round 2: Calculator Shortcut
              </CardTitle>
              <Badge className="text-lg px-4 py-2">
                Manual: {formatTime(manualTime)}s
              </Badge>
            </div>
            <CardDescription>
              Now solve using the calculator shortcut. Follow the guided steps!
            </CardDescription>
          </CardHeader>
        </Card>
        
        <GuidedPractice 
          lesson={lesson} 
          onComplete={finishCalculatorRound}
        />
      </div>
    );
  }

  // Results Phase
  if (phase === 'results') {
    const timeSaved = manualTime - calculatorTime;
    const percentFaster = ((timeSaved / manualTime) * 100).toFixed(0);

    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Trophy className="w-20 h-20 text-yellow-500" />
          </div>
          <CardTitle className="text-4xl">Challenge Complete!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Time Comparison */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="text-center p-6 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Manual</div>
              <div className="text-4xl font-bold">{formatTime(manualTime)}s</div>
            </div>
            <div className="text-center p-6 bg-primary/10 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Calculator</div>
              <div className="text-4xl font-bold text-primary">{formatTime(calculatorTime)}s</div>
            </div>
          </div>

          {/* Time Saved Badge */}
          <div className="text-center p-8 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl">
            <div className="text-6xl mb-4">⚡</div>
            <div className="text-4xl font-bold text-green-600">
              {formatTime(timeSaved)}s faster
            </div>
            <div className="text-xl text-muted-foreground mt-2">
              That's {percentFaster}% faster!
            </div>
          </div>

          {/* Motivational Message */}
          <div className="bg-primary/5 p-4 rounded-lg text-center">
            <p className="text-muted-foreground">
              {timeSaved > 0 
                ? `On test day, this could be the difference between finishing on time or leaving questions blank. Great work! 🎯`
                : `Keep practicing! With more repetition, you'll get even faster. 💪`
              }
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setPhase('intro')} className="flex-1">
              Try Again
            </Button>
            <Button onClick={onComplete} className="flex-1">
              Back to Lessons
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};
