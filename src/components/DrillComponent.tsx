import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Timer, Play, Pause, RotateCcw, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import type { DrillSession } from '@/types';
import { useTimer } from '@/hooks/useTimer';
import { useToast } from '@/hooks/use-toast';
import { createLogger } from '@/lib/logger';

const log = createLogger('DrillComponent');

interface DrillComponentProps {
  drill: DrillSession;
  onComplete: (score: number) => void;
  onBack: () => void;
}

export const DrillComponent = ({ drill, onComplete, onBack }: DrillComponentProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(drill.questions.length).fill(-1));
  const [showResults, setShowResults] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  const { timeLeft, isActive, isCompleted, startTimer, pauseTimer, resetTimer, formatTime } = useTimer(drill.timeLimit);

  // Toast API for immediate feedback during drills.
  const { toast } = useToast();

  // Memoize handleFinish to avoid dependency issues
  const handleFinish = useCallback((finalAnswers: number[]) => {
    pauseTimer();
    setShowResults(true);
    
    const correctCount = finalAnswers.filter((answer, index) => 
      answer === drill.questions[index].correctAnswer
    ).length;
    
    const score = Math.round((correctCount / drill.questions.length) * 100);
    log.info('Drill completed', { score, correctCount, total: drill.questions.length });
    onComplete(score);
  }, [pauseTimer, drill.questions, onComplete]);

  // Handle timer completion
  useEffect(() => {
    if (isCompleted && hasStarted && !showResults) {
      log.debug('Timer completed, finishing drill');
      handleFinish(answers);
    }
  }, [isCompleted, hasStarted, showResults, answers, handleFinish]);

  const handleStart = () => {
    setHasStarted(true);
    startTimer();
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (!isActive || showResults) return;
    
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);

    // Provide immediate feedback on the selected answer.
    const isCorrect = answerIndex === drill.questions[currentQuestion].correctAnswer;
    toast({
      title: isCorrect ? 'Correct!' : 'Incorrect',
      description: isCorrect ? undefined : 'Keep going!',
    });
    
    // Auto-advance to next question
    if (currentQuestion < drill.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // All questions answered, finish drill
      handleFinish(newAnswers);
    }
  };

  const currentQ = drill.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / drill.questions.length) * 100;
  const timeProgress = ((drill.timeLimit - timeLeft) / drill.timeLimit) * 100;

  if (showResults) {
    const correctCount = answers.filter((answer, index) => 
      answer === drill.questions[index].correctAnswer
    ).length;
    const score = Math.round((correctCount / drill.questions.length) * 100);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Drill Results</h1>
        </div>

        <Card className="p-8 text-center shadow-medium">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
              <Timer className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold">Drill Complete!</h2>
            <div className="text-3xl font-bold text-primary">{score}%</div>
            <p className="text-muted-foreground">
              You got {correctCount} out of {drill.questions.length} questions correct
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span>Time: {drill.timeLimit - timeLeft}s</span>
              <span>•</span>
              <span>Speed: {Math.round((drill.questions.length / (drill.timeLimit - timeLeft)) * 60)} Q/min</span>
            </div>
          </div>
        </Card>

        {/* Quick Review */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Quick Review</h3>
          <div className="grid gap-3">
            {drill.questions.map((question, index) => {
              const userAnswer = answers[index];
              const isCorrect = userAnswer === question.correctAnswer;
              const wasAnswered = userAnswer !== -1;
              
              return (
                <Card key={question.id} className={`p-4 shadow-soft ${
                  !wasAnswered ? 'border-muted' :
                  isCorrect ? 'border-success/50' : 'border-destructive/50'
                }`}>
                  <div className="flex items-start gap-3">
                    {!wasAnswered ? (
                      <div className="w-5 h-5 rounded-full border-2 border-muted mt-1" />
                    ) : isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-success mt-1 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{question.question}</p>
                      {wasAnswered && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Your answer: {question.options[userAnswer]}
                          {!isCorrect && ` • Correct: ${question.options[question.correctAnswer]}`}
                        </p>
                      )}
                      {!wasAnswered && (
                        <p className="text-xs text-muted-foreground mt-1">Not answered</p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={onBack} variant="outline" className="flex-1">
            Back to Day
          </Button>
          <Button 
            onClick={() => {
              setCurrentQuestion(0);
              setAnswers(new Array(drill.questions.length).fill(-1));
              setShowResults(false);
              setHasStarted(false);
              resetTimer();
            }}
            variant="secondary"
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{drill.title}</h1>
            <p className="text-muted-foreground capitalize">
              {drill.subject} Rapid Fire Drill
            </p>
          </div>
        </div>

        <Card className="p-8 text-center shadow-medium">
          <div className="space-y-6">
            <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
              <Timer className="w-8 h-8 text-primary-foreground" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Ready for Speed Round?</h2>
              <p className="text-muted-foreground">
                Answer {drill.questions.length} questions as quickly as possible
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">{drill.questions.length}</div>
                <div className="text-sm text-muted-foreground">Questions</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">{drill.timeLimit}s</div>
                <div className="text-sm text-muted-foreground">Time Limit</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {Math.round((drill.questions.length / drill.timeLimit) * 60)}
                </div>
                <div className="text-sm text-muted-foreground">Target Q/min</div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Tip: Read quickly and trust your instincts. You can review answers at the end.
              </p>
              <Button 
                onClick={handleStart}
                size="lg"
                variant="hero"
                className="px-8"
              >
                <Play className="w-5 h-5 mr-2" />
                Start Drill
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Timer */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{drill.title}</h1>
          <p className="text-muted-foreground">
            Question {currentQuestion + 1} of {drill.questions.length}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-primary">{formatTime}</div>
          <Progress value={timeProgress} className="w-32 h-2" />
        </div>
      </div>

      {/* Question Progress */}
      <Progress value={progress} className="h-2" />

      {/* Question */}
      <Card className="p-6 shadow-medium">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                Q{currentQuestion + 1}
              </span>
              <span className="px-2 py-1 bg-warning/10 text-warning text-xs font-medium rounded">
                RAPID FIRE
              </span>
            </div>
            <h3 className="text-lg font-semibold">{currentQ.question}</h3>
          </div>

          {/* Answer Options */}
          <div className="grid gap-3">
            {currentQ.options.map((option, index) => (
              <Button
                key={index}
                variant="quiz"
                className="w-full justify-start hover:border-primary hover:bg-primary/5 transition-fast"
                onClick={() => handleAnswerSelect(index)}
              >
                <span className="mr-3 flex-shrink-0 w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold">
                  {String.fromCharCode(65 + index)}
                </span>
                {option}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={pauseTimer} disabled={!isActive}>
          <Pause className="w-4 h-4 mr-2" />
          Pause
        </Button>
        
        <Button 
          onClick={() => handleFinish(answers)}
          variant="warning"
        >
          Finish Early
        </Button>
      </div>
    </div>
  );
};