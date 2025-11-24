import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ZoomIn, Calculator, Ban } from 'lucide-react';

interface Question {
  id: string;
  ord?: number;
  question: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  choice_e?: string | null;
  passage_id?: string;
  image_url?: string | null;
  image_caption?: string | null;
  image_position?: 'above_question' | 'inline' | 'between' | null;
  underlined_text?: string | null;
  reference_number?: number | null;
  position_in_passage?: number | null;
  calculator_allowed?: boolean | null;
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
  const [imageZoomed, setImageZoomed] = useState(false);

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
    ...(question.choice_e ? [{ value: 'E', label: question.choice_e }] : []),
  ];

  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  const renderImage = (position: string) => {
    if (!question.image_url) return null;

    return (
      <div className={`relative ${position === 'above_question' ? 'mb-4' : position === 'inline' ? 'my-4' : 'my-6'}`}>
        <div className="relative group cursor-pointer" onClick={() => setImageZoomed(true)}>
          <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg overflow-hidden">
            <img
              src={question.image_url}
              alt={question.image_caption || 'Question image'}
              className="object-contain w-full h-full"
            />
          </AspectRatio>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 rounded-full p-2">
              <ZoomIn className="h-5 w-5" />
            </div>
          </div>
        </div>
        {question.image_caption && (
          <p className="text-sm text-muted-foreground mt-2 italic text-center">
            {question.image_caption}
          </p>
        )}
      </div>
    );
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Question {currentIndex + 1} of {totalQuestions}
            </CardTitle>
            <div className="flex items-center space-x-2">
              {question.calculator_allowed !== null && question.calculator_allowed !== undefined && (
                <Badge 
                  variant={question.calculator_allowed ? "default" : "secondary"}
                  className="text-xs flex items-center gap-1"
                >
                  {question.calculator_allowed ? (
                    <>
                      <Calculator className="h-3 w-3" />
                      Calculator OK
                    </>
                  ) : (
                    <>
                      <Ban className="h-3 w-3" />
                      No Calculator
                    </>
                  )}
                </Badge>
              )}
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
          {question.image_position === 'above_question' && renderImage('above_question')}

          <div className="prose prose-sm max-w-none">
            {question.reference_number && (
              <div className="mb-2 text-sm font-semibold text-muted-foreground">
                Question {question.reference_number}
              </div>
            )}
            
            {question.underlined_text ? (
              <div className="text-base leading-relaxed">
                <p className="mb-2">{question.question}</p>
                <p className="border-l-4 border-primary pl-4 py-2 bg-muted/30 rounded">
                  <span className="underline decoration-2 decoration-primary/60">
                    {question.underlined_text}
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-base leading-relaxed whitespace-pre-wrap">
                {question.question}
              </p>
            )}
          </div>

          {question.image_position === 'inline' && renderImage('inline')}
          {question.image_position === 'between' && renderImage('between')}

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

      {question.image_url && (
        <Dialog open={imageZoomed} onOpenChange={setImageZoomed}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>
                {question.image_caption || 'Question Image'}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <img
                src={question.image_url}
                alt={question.image_caption || 'Question image'}
                className="w-full h-auto"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
