import { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import type { LegacyQuestion, QuizAnswers } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { batchUpdateMastery } from '@/lib/mastery';
import { supabase } from '@/integrations/supabase/client';
import { seededRandom } from '@/lib/shuffle';

interface QuizComponentProps {
  questions: LegacyQuestion[];
  title: string;
  skillCode: string; // Added skillCode for mastery tracking
  onComplete: (score: number, wrongAnswers: QuizAnswers) => void;
  onBack?: () => void;
}

export const QuizComponent = ({ questions, title, skillCode, onComplete, onBack }: QuizComponentProps) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(questions.length).fill(-1));
  const [showResults, setShowResults] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    void fetchUser();
  }, []);

  // Normalize and shuffle questions
  const shuffledQuestions = useMemo(() => {
    return questions.map((q, idx) => {
      const correctAnswer = q.correctAnswer as string | number;
      let normalizedAnswer: number;
      
      if (typeof correctAnswer === 'string') {
        normalizedAnswer = correctAnswer.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
      } else {
        normalizedAnswer = correctAnswer as number;
      }
      
      // Create shuffle order for choices
      const seed = userId ? `${userId}-${q.id}-${idx}` : `${q.id}-${idx}`;
      const random = seededRandom(seed);
      const choiceOrder = [0, 1, 2, 3];
      
      for (let i = choiceOrder.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [choiceOrder[i], choiceOrder[j]] = [choiceOrder[j], choiceOrder[i]];
      }
      
      // Apply shuffle to options
      const shuffledOptions = choiceOrder.map(index => q.options[index]);
      const newCorrectIndex = choiceOrder.indexOf(normalizedAnswer);
      
      return {
        ...q,
        options: shuffledOptions,
        correctAnswer: newCorrectIndex,
        originalCorrectAnswer: normalizedAnswer,
        choiceOrder
      };
    });
  }, [questions, userId]);

  // Toast API for immediate feedback on answer selection.
  const { toast } = useToast();

  const handleAnswerSelect = (answerIndex: number) => {
    if (submitted) return;
    
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);

    const isCorrect = answerIndex === shuffledQuestions[currentQuestion].correctAnswer;
    toast({
      title: isCorrect ? 'Correct!' : 'Incorrect',
      description: isCorrect ? undefined : 'Keep going!',
    });
  };

  const handleNext = () => {
    if (currentQuestion < shuffledQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    setShowResults(true);
    
    const wrongAnswers = shuffledQuestions
      .map((question, index) => ({
        questionId: question.id,
        question,
        userAnswer: answers[index]
      }))
      .filter((_item, index) => answers[index] !== shuffledQuestions[index].correctAnswer);
    
    const score = Math.round(((shuffledQuestions.length - wrongAnswers.length) / shuffledQuestions.length) * 100);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const masteryResults = shuffledQuestions.map((question, index) => ({
          skillId: skillCode,
          correct: answers[index] === question.correctAnswer,
          timeMs: 30000,
        }));
        
        await batchUpdateMastery(user.id, masteryResults);
        
        toast({
          title: 'Progress saved!',
          description: 'Your mastery for this skill has been updated.',
        });
      }
    } catch (error) {
      console.error('Error updating mastery:', error);
      toast({
        title: 'Error',
        description: 'Failed to save progress. Please try again.',
        variant: 'destructive',
      });
    }
    
    onComplete(score, wrongAnswers);
  };

  const currentQ = shuffledQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / shuffledQuestions.length) * 100;
  const allAnswered = answers.every(answer => answer !== -1);

  if (showResults) {
    const correctCount = answers.filter((answer, index) => answer === shuffledQuestions[index].correctAnswer).length;
    const score = Math.round((correctCount / shuffledQuestions.length) * 100);
    
    return (
      <div className="space-y-6">
        <Card className="p-8 text-center shadow-medium">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-success rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-success-foreground" />
            </div>
            <h2 className="text-2xl font-bold">Quiz Complete!</h2>
            <div className="text-3xl font-bold text-primary">{score}%</div>
            <p className="text-muted-foreground">
              You got {correctCount} out of {shuffledQuestions.length} questions correct
            </p>
          </div>
        </Card>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Answer Review</h3>
          {shuffledQuestions.map((question, index) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer === question.correctAnswer;
            
            return (
              <Card key={question.id} className={`p-4 shadow-soft ${isCorrect ? 'border-success/50' : 'border-destructive/50'}`}>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-success mt-1 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{question.question}</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">Your answer:</span> {question.options[userAnswer]}
                        </p>
                        {!isCorrect && (
                          <p className="text-sm">
                            <span className="font-medium">Correct answer:</span> {question.options[question.correctAnswer]}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground mt-2">
                          <span className="font-medium">Explanation:</span> {question.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {onBack && (
          <Button onClick={onBack} variant="outline" className="w-full">
            Back to Lesson
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <span className="text-sm text-muted-foreground">
            {currentQuestion + 1} of {shuffledQuestions.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question */}
      <Card className="p-6 shadow-medium">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                Question {currentQuestion + 1}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                currentQ.difficulty === 'easy' ? 'bg-success/10 text-success' :
                currentQ.difficulty === 'medium' ? 'bg-warning/10 text-warning' :
                'bg-destructive/10 text-destructive'
              }`}>
                {currentQ.difficulty}
              </span>
            </div>
            <h3 className="text-lg font-semibold">{currentQ.question}</h3>
          </div>

          {/* Answer Options */}
          <div className="space-y-3">
            {currentQ.options.map((option, index) => (
              <Button
                key={index}
                variant="quiz"
                className={`w-full justify-start ${
                  answers[currentQuestion] === index 
                    ? 'border-primary bg-primary/10' 
                    : ''
                }`}
                onClick={() => handleAnswerSelect(index)}
                disabled={submitted}
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

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        <div className="flex gap-2">
          {currentQuestion < shuffledQuestions.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={answers[currentQuestion] === -1}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!allAnswered}
              variant="success"
            >
              Submit Quiz
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};