import { useState, useEffect } from 'react';
import { CalculatorLesson } from '@/data/calculatorLessons';
import { VirtualCalculator } from './VirtualCalculator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Lightbulb, X } from 'lucide-react';
import { toast } from 'sonner';
import { useCalculatorProgress } from '@/hooks/useCalculatorProgress';
import confetti from 'canvas-confetti';

interface GuidedPracticeProps {
  lesson: CalculatorLesson;
  onComplete?: () => void;
}

export const GuidedPractice = ({ lesson, onComplete }: GuidedPracticeProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [startTime] = useState(Date.now());
  const [showHint, setShowHint] = useState(false);
  const [calculatorDisplay, setCalculatorDisplay] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const { saveProgress } = useCalculatorProgress();

  const steps = lesson.interactiveSteps || [];
  const totalSteps = steps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  useEffect(() => {
    if (currentStep >= totalSteps) return;
    
    const timer = setTimeout(() => setShowHint(true), 10000);
    return () => clearTimeout(timer);
  }, [currentStep, totalSteps]);

  const handleButtonPress = (buttonId: string) => {
    if (currentStep >= totalSteps || isComplete) return;

    const expectedButton = steps[currentStep].buttonId;

    if (buttonId === expectedButton || buttonId.includes(expectedButton)) {
      // Correct button!
      setCalculatorDisplay(steps[currentStep].screenDisplay);
      toast.success('Correct!');

      if (currentStep < totalSteps - 1) {
        setCurrentStep(prev => prev + 1);
        setShowHint(false);
      } else {
        // Lesson complete!
        const completionTime = Date.now() - startTime;
        handleCompletion(completionTime);
      }
    } else {
      // Wrong button
      toast.error("Not quite! Look for the highlighted button.");
    }
  };

  const handleCompletion = async (completionTime: number) => {
    setIsComplete(true);
    
    // Confetti!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Save progress
    saveProgress({
      lessonId: lesson.id,
      mode: 'guided',
      completionTime,
    });

    toast.success(`Completed in ${(completionTime / 1000).toFixed(1)}s!`);
  };

  if (!steps.length) {
    return (
      <Alert>
        <AlertDescription>
          This lesson doesn't have interactive steps yet. Check back soon!
        </AlertDescription>
      </Alert>
    );
  }

  if (isComplete) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="text-3xl">🎉 Lesson Complete!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl">
            <div className="text-2xl font-bold text-green-600">
              You've mastered: {lesson.title}
            </div>
            <div className="text-lg text-muted-foreground mt-2">
              Time saved per problem: {lesson.timeSaved}
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" onClick={onComplete} className="flex-1">
              Back to Lessons
            </Button>
            <Button onClick={() => window.location.reload()} className="flex-1">
              Practice Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-7xl mx-auto">
      {/* Left: Instructions Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Step {currentStep + 1} of {totalSteps}</CardTitle>
            <Badge variant="secondary">{lesson.timeSaved}</Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current problem */}
          {lesson.practiceProblems?.[0] && (
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground mb-2">Problem:</div>
              <p className="font-mono text-lg">{lesson.practiceProblems[0].problem}</p>
            </div>
          )}

          {/* Current instruction */}
          <Alert className="border-primary">
            <AlertDescription className="text-lg font-medium">
              {steps[currentStep].instruction}
            </AlertDescription>
          </Alert>

          {/* Hint (appears after 10s) */}
          {showHint && steps[currentStep].hint && (
            <Alert variant="default" className="bg-yellow-500/10 border-yellow-500/20">
              <Lightbulb className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                <strong>Hint:</strong> {steps[currentStep].hint}
              </AlertDescription>
            </Alert>
          )}

          {/* Progress indicators */}
          <div className="flex gap-2 flex-wrap">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  idx < currentStep
                    ? 'bg-green-500 text-white'
                    : idx === currentStep
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {idx < currentStep ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
              </div>
            ))}
          </div>

          <Button variant="ghost" size="sm" onClick={onComplete}>
            <X className="w-4 h-4 mr-2" />
            Exit Practice
          </Button>
        </CardContent>
      </Card>

      {/* Right: Virtual Calculator */}
      <div className="flex justify-center items-start sticky top-4">
        <VirtualCalculator
          mode="guided"
          highlightButtonId={steps[currentStep].buttonId}
          display={calculatorDisplay}
          onButtonPress={handleButtonPress}
        />
      </div>
    </div>
  );
};
