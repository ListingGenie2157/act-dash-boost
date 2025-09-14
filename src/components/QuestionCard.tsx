import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface Question {
  id: string;
  ord?: number;
  question: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  passage_id?: string;
}

interface QuestionCardProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  selectedAnswer?: string;
  onAnswerSelect: (questionId: string, answer: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  lockAnswers?: boolean;
}

export function QuestionCard({
  question,
  currentIndex,
  totalQuestions,
  selectedAnswer,
  onAnswerSelect,
  onNext,
  onPrevious,
  onSubmit,
  lockAnswers = false,
}: QuestionCardProps) {
  const [localAnswer, setLocalAnswer] = useState(selectedAnswer || '');

  useEffect(() => {
    setLocalAnswer(selectedAnswer || '');
  }, [selectedAnswer, question.id]);

  const handleAnswerChange = (value: string) => {
    if (lockAnswers) return;
    setLocalAnswer(value);
    onAnswerSelect(question.id, value);
  };

  const choices = [
    { value: 'A', label: question.choice_a },
    { value: 'B', label: question.choice_b },
    { value: 'C', label: question.choice_c },
    { value: 'D', label: question.choice_d },
  ];

  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Question {currentIndex + 1} of {totalQuestions}
          </CardTitle>
          <div className="flex items-center space-x-2">
            {question.passage_id && (
              <Badge variant="outline" className="text-xs">
                Passage {question.passage_id}
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs">
              {Math.round(((currentIndex + 1) / totalQuestions) * 100)}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Question Text */}
        <div className="prose prose-sm max-w-none">
          <p className="text-base leading-relaxed whitespace-pre-wrap">
            {question.question}
          </p>
        </div>

        {/* Answer Choices */}
        <RadioGroup 
          value={localAnswer} 
          onValueChange={handleAnswerChange}
          disabled={lockAnswers}
          className="space-y-3"
        >
          {choices.map((choice) => (
            <div key={choice.value} className="flex items-start space-x-3">
              <RadioGroupItem 
                value={choice.value} 
                id={`${question.id}-${choice.value}`}
                className="mt-1"
              />
              <Label 
                htmlFor={`${question.id}-${choice.value}`}
                className="flex-1 text-base leading-relaxed cursor-pointer"
              >
                <span className="font-medium mr-2">{choice.value}.</span>
                {choice.label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={isFirstQuestion}
          >
            Previous
          </Button>

          <div className="flex space-x-2">
            {!isLastQuestion ? (
              <Button onClick={onNext}>
                Next
              </Button>
            ) : (
              <Button onClick={onSubmit} variant="default">
                Submit Test
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}