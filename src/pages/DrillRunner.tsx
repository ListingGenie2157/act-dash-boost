import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Timer, Target, Zap } from 'lucide-react';
import { mathDrills, englishDrills } from '@/data/curriculum';
import { DrillSession, Question } from '@/types';

const DrillRunner = () => {
  const { subject } = useParams<{ subject: string }>();
  const navigate = useNavigate();

  const [selectedDrill, setSelectedDrill] = useState<DrillSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [drillComplete, setDrillComplete] = useState(false);

  const availableDrills = subject?.toLowerCase() === 'math' ? mathDrills :
                         subject?.toLowerCase() === 'english' ? englishDrills : [];

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            setIsActive(false);
            setDrillComplete(true);
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const startDrill = (drill: DrillSession) => {
    setSelectedDrill(drill);
    setTimeLeft(drill.timeLimit);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setCorrectAnswers(0);
    setDrillComplete(false);
    setIsActive(true);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (!selectedDrill || showExplanation) return;

    setSelectedAnswer(answerIndex);
    setShowExplanation(true);

    const currentQuestion = selectedDrill.questions[currentQuestionIndex];
    if (answerIndex === currentQuestion.correctAnswer) {
      setCorrectAnswers(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (!selectedDrill) return;

    if (currentQuestionIndex < selectedDrill.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // Drill completed
      setIsActive(false);
      setDrillComplete(true);
    }
  };

  const resetDrill = () => {
    setSelectedDrill(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setTimeLeft(0);
    setIsActive(false);
    setScore(0);
    setCorrectAnswers(0);
    setDrillComplete(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!subject) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" onClick={() => navigate('/')}>
              ← Back
            </Button>
            <h1 className="text-2xl font-bold">Invalid Subject</h1>
          </div>
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">
                Please specify a valid subject (math or english) in the URL.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (availableDrills.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" onClick={() => navigate('/')}>
              ← Back
            </Button>
            <h1 className="text-2xl font-bold">
              {subject.charAt(0).toUpperCase() + subject.slice(1)} Drills
            </h1>
          </div>
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">
                No drills available for {subject}. Please check back later.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show drill selection
  if (!selectedDrill) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" onClick={() => navigate('/')}>
              ← Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {subject.charAt(0).toUpperCase() + subject.slice(1)} Drills
              </h1>
              <p className="text-muted-foreground">
                Choose a drill for rapid-fire practice
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableDrills.map((drill) => (
              <Card key={drill.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    {drill.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Timer className="h-4 w-4" />
                      {formatTime(drill.timeLimit)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      {drill.questions.length} questions
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => startDrill(drill)}
                  >
                    Start Drill
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show completion screen
  if (drillComplete) {
    const percentage = Math.round((correctAnswers / selectedDrill.questions.length) * 100);

    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" onClick={resetDrill}>
              ← Back to Drills
            </Button>
            <h1 className="text-2xl font-bold">Drill Complete!</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">{selectedDrill.title} Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="text-6xl font-bold text-primary">
                  {percentage}%
                </div>
                <p className="text-xl text-muted-foreground">
                  {correctAnswers} out of {selectedDrill.questions.length} correct
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{correctAnswers}</div>
                  <div className="text-sm text-muted-foreground">Correct</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{selectedDrill.questions.length - correctAnswers}</div>
                  <div className="text-sm text-muted-foreground">Incorrect</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{formatTime(selectedDrill.timeLimit - timeLeft)}</div>
                  <div className="text-sm text-muted-foreground">Time Used</div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button onClick={() => startDrill(selectedDrill)}>
                  Try Again
                </Button>
                <Button variant="outline" onClick={resetDrill}>
                  Choose Different Drill
                </Button>
                <Button variant="outline" onClick={() => navigate('/')}>
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show active drill
  const currentQuestion = selectedDrill.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / selectedDrill.questions.length) * 100;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with timer */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={resetDrill}>
              ← Exit Drill
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{selectedDrill.title}</h1>
              <p className="text-muted-foreground">
                Question {currentQuestionIndex + 1} of {selectedDrill.questions.length}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className={`text-3xl font-mono font-bold ${timeLeft < 30 ? 'text-red-600' : 'text-primary'}`}>
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-muted-foreground">Time Remaining</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-1">
            {correctAnswers} correct so far
          </p>
        </div>

        {/* Question */}
        <Card>
          <CardContent className="space-y-6 p-6">
            <div className="prose max-w-none">
              <p className="text-xl leading-relaxed">{currentQuestion.question}</p>
            </div>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <Button
                  key={index}
                  variant={
                    showExplanation
                      ? index === currentQuestion.correctAnswer
                        ? "default"
                        : selectedAnswer === index
                          ? "destructive"
                          : "outline"
                      : selectedAnswer === index
                        ? "default"
                        : "outline"
                  }
                  className="w-full text-left justify-start p-4 h-auto"
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showExplanation}
                >
                  <span className="font-semibold mr-3">{String.fromCharCode(65 + index)}.</span>
                  <span>{option}</span>
                </Button>
              ))}
            </div>

            {showExplanation && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Explanation:</h4>
                  <p>{currentQuestion.explanation}</p>
                </div>

                <div className="flex justify-center">
                  <Button onClick={handleNextQuestion}>
                    {currentQuestionIndex === selectedDrill.questions.length - 1 ? 'Finish Drill' : 'Next Question'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DrillRunner;