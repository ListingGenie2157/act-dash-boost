import { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Timer, Play, Pause, RotateCcw, ArrowLeft, CheckCircle, XCircle, BookOpen } from 'lucide-react';
import type { DrillSession } from '@/types';
import { useTimer } from '@/hooks/useTimer';
import { useToast } from '@/hooks/use-toast';

export interface DrillResult {
  score: number;
  /** selected option index per question, -1 = unanswered */
  answers: number[];
  /** correct option index per question (-1 if unknown) */
  correctIdxs: number[];
  elapsedSeconds: number;
}

interface DrillComponentProps {
  drill: DrillSession;
  onComplete: (result: DrillResult) => void;
  onBack: () => void;
  /**
   * Server-side grading. When provided, the answer key is not on the client:
   * each answer is graded after selection and correctAnswer on the questions is ignored.
   */
  gradeAnswer?: (questionId: string, selectedIdx: number) => Promise<{ correctIdx: number; explanation?: string | null }>;
}

export const DrillComponent = ({ drill, onComplete, onBack, gradeAnswer }: DrillComponentProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(drill.questions.length).fill(-1));
  const [correctIdxs, setCorrectIdxs] = useState<number[]>(
    drill.questions.map(q => (gradeAnswer ? -1 : q.correctAnswer))
  );
  const [explanations, setExplanations] = useState<(string | null)[]>(new Array(drill.questions.length).fill(null));
  const [showResults, setShowResults] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const pendingGrades = useRef<Map<number, Promise<number>>>(new Map());
  const finishedRef = useRef(false);

  const { timeLeft, isActive, isCompleted, startTimer, pauseTimer, resetTimer, formatTime } = useTimer(drill.timeLimit);

  // Toast API for immediate feedback during drills.
  const { toast } = useToast();

  const handleFinish = useCallback(async (finalAnswers: number[]) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    pauseTimer();
    const elapsedSeconds = drill.timeLimit - timeLeft;

    // Wait for any in-flight grading so the score is final
    const resolved = [...correctIdxs];
    for (const [index, promise] of pendingGrades.current) {
      resolved[index] = await promise;
    }
    setCorrectIdxs(resolved);
    setShowResults(true);

    const correctCount = finalAnswers.filter((answer, index) => answer !== -1 && answer === resolved[index]).length;
    const score = Math.round((correctCount / drill.questions.length) * 100);
    onComplete({ score, answers: finalAnswers, correctIdxs: resolved, elapsedSeconds });
  }, [pauseTimer, drill.questions, drill.timeLimit, timeLeft, correctIdxs, onComplete]);

  useEffect(() => {
    if (isCompleted && hasStarted) {
      handleFinish(answers);
    }
  }, [isCompleted, hasStarted, answers, handleFinish]);

  const handleStart = () => {
    setHasStarted(true);
    startTimer();
  };

  const showFeedback = (isCorrect: boolean) => {
    toast({
      title: isCorrect ? 'Correct!' : 'Incorrect',
      description: isCorrect ? undefined : 'Keep going!',
    });
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (!isActive || showResults) return;

    const questionIndex = currentQuestion;
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);

    if (gradeAnswer) {
      const question = drill.questions[questionIndex];
      const grade = gradeAnswer(question.id, answerIndex)
        .then(({ correctIdx, explanation }) => {
          setCorrectIdxs(prev => {
            const next = [...prev];
            next[questionIndex] = correctIdx;
            return next;
          });
          setExplanations(prev => {
            const next = [...prev];
            next[questionIndex] = explanation ?? null;
            return next;
          });
          showFeedback(correctIdx === answerIndex);
          return correctIdx;
        })
        .catch(() => {
          toast({ title: 'Could not check that answer', description: 'It will be marked as not graded.' });
          return -1;
        });
      pendingGrades.current.set(questionIndex, grade);
    } else {
      showFeedback(answerIndex === drill.questions[questionIndex].correctAnswer);
    }

    // Auto-advance to next question
    if (questionIndex < drill.questions.length - 1) {
      setCurrentQuestion(questionIndex + 1);
    } else {
      // All questions answered, finish drill
      void handleFinish(newAnswers);
    }
  };

  const currentQ = drill.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / drill.questions.length) * 100;
  const timeProgress = ((drill.timeLimit - timeLeft) / drill.timeLimit) * 100;

  if (showResults) {
    const correctCount = answers.filter((answer, index) =>
      answer !== -1 && answer === correctIdxs[index]
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
              const correctIdx = correctIdxs[index];
              const isCorrect = userAnswer === correctIdx;
              const wasAnswered = userAnswer !== -1;
              const explanation = explanations[index];
              
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
                      <p className="font-medium text-sm break-words">{question.question}</p>
                      {wasAnswered && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Your answer: {question.options[userAnswer]}
                          {!isCorrect && correctIdx >= 0 && ` • Correct: ${question.options[correctIdx]}`}
                        </p>
                      )}
                      {wasAnswered && explanation && (
                        <p className="text-xs text-muted-foreground mt-1">{explanation}</p>
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
            Back to Drill Setup
          </Button>
          <Button 
            onClick={() => {
              setCurrentQuestion(0);
              setAnswers(new Array(drill.questions.length).fill(-1));
              setCorrectIdxs(drill.questions.map(q => (gradeAnswer ? -1 : q.correctAnswer)));
              setExplanations(new Array(drill.questions.length).fill(null));
              pendingGrades.current = new Map();
              finishedRef.current = false;
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

  // Check if current question has a passage
  const hasPassage = Boolean(currentQ.passageText);

  return (
    <div className="space-y-4">
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

      {/* Main Content - Split layout if passage exists */}
      <div className={hasPassage ? "grid grid-cols-1 lg:grid-cols-2 gap-4" : ""}>
        {/* Passage Panel - Only show if passage exists */}
        {hasPassage && (
          <Card className="p-4 shadow-medium lg:max-h-[70vh] flex flex-col">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">
                {currentQ.passageTitle || 'Passage'}
              </span>
            </div>
            <ScrollArea className="flex-1 pr-3">
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {currentQ.passageText}
              </div>
              {currentQ.underlinedText && (
                <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-md">
                  <div className="text-xs font-medium text-warning mb-1">Underlined Portion:</div>
                  <div className="text-sm italic">{currentQ.underlinedText}</div>
                </div>
              )}
            </ScrollArea>
          </Card>
        )}

        {/* Question Panel */}
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
                {currentQ.referenceNumber && (
                  <span className="px-2 py-1 bg-accent/20 text-accent-foreground text-xs font-medium rounded">
                    Ref: [{currentQ.referenceNumber}]
                  </span>
                )}
              </div>
              {/* Show underlined text inline if no full passage */}
              {!hasPassage && currentQ.underlinedText && (
                <div className="p-3 bg-muted/50 border border-border rounded-md mb-2">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Underlined Portion:</div>
                  <div className="text-sm italic">{currentQ.underlinedText}</div>
                </div>
              )}
              <h3 className="text-lg font-semibold break-words">{currentQ.question}</h3>
            </div>

            {/* Answer Options */}
            <div className="grid gap-3">
              {currentQ.options.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start border-white/10 hover:border-primary hover:bg-primary/10 transition-all duration-200 text-left h-auto p-4"
                    onClick={() => handleAnswerSelect(index)}
                  >
                    <span className="mr-3 flex-shrink-0 w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="break-words whitespace-normal">{option}</span>
                  </Button>
              ))}
            </div>
          </div>
        </Card>
      </div>

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