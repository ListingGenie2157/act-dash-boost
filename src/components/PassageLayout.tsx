import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { QuestionCard } from './QuestionCard';

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

interface Passage {
  title: string;
  passage_text: string;
}

interface PassageLayoutProps {
  questions: Question[];
  passages: Record<string, Passage>;
  currentQuestionIndex: number;
  answers: Record<string, string>;
  onAnswerSelect: (questionId: string, answer: string) => void;
  onQuestionChange: (index: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  lockAnswers?: boolean;
}

export function PassageLayout({
  questions,
  passages,
  currentQuestionIndex,
  answers,
  onAnswerSelect,
  onQuestionChange,
  onNext,
  onPrevious,
  onSubmit,
  lockAnswers = false,
}: PassageLayoutProps) {
  const [selectedPassage, setSelectedPassage] = useState<string>('');
  const passageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const currentQuestion = questions[currentQuestionIndex];

  // Auto-select passage when question changes
  useEffect(() => {
    if (currentQuestion?.passage_id && currentQuestion.passage_id !== selectedPassage) {
      setSelectedPassage(currentQuestion.passage_id);
      scrollToPassage(currentQuestion.passage_id);
    }
  }, [currentQuestion?.passage_id, selectedPassage]);

  const scrollToPassage = (passageId: string) => {
    const element = passageRefs.current[passageId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePassageClick = (passageId: string) => {
    setSelectedPassage(passageId);
    scrollToPassage(passageId);
  };

  const getQuestionsForPassage = (passageId: string) => {
    return questions.filter(q => q.passage_id === passageId);
  };

  const allPassageIds = Object.keys(passages);

  return (
    <div className="h-screen flex">
      {/* Left Panel - Passages */}
      <div className="w-1/2 border-r bg-background">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Reading Passages</h2>
          <p className="text-sm text-muted-foreground">
            Click on passage tags to navigate
          </p>
        </div>
        
        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-4 space-y-6">
            {allPassageIds.map((passageId) => {
              const passage = passages[passageId];
              const questionsForPassage = getQuestionsForPassage(passageId);
              const isActive = selectedPassage === passageId;
              
              return (
                <div
                  key={passageId}
                  ref={(el) => (passageRefs.current[passageId] = el)}
                  className={`transition-all duration-200 ${
                    isActive ? 'ring-2 ring-primary rounded-lg' : ''
                  }`}
                >
                  <Card className={`cursor-pointer ${isActive ? 'border-primary' : ''}`}>
                    <CardHeader 
                      className="pb-3"
                      onClick={() => handlePassageClick(passageId)}
                    >
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {passage.title || `Passage ${passageId}`}
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {questionsForPassage.length} questions
                          </Badge>
                          <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs">
                            {passageId}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="prose prose-sm max-w-none">
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">
                          {passage.passage_text}
                        </div>
                      </div>
                      
                      {questionsForPassage.length > 0 && (
                        <div className="mt-4 pt-3 border-t">
                          <div className="flex flex-wrap gap-1">
                            {questionsForPassage.map((q) => {
                              const questionIndex = questions.findIndex(question => question.id === q.id);
                              const isAnswered = !!answers[q.id];
                              const isCurrent = questionIndex === currentQuestionIndex;
                              
                              return (
                                <Button
                                  key={q.id}
                                  size="sm"
                                  variant={isCurrent ? 'default' : isAnswered ? 'secondary' : 'outline'}
                                  className="h-8 w-8 p-0 text-xs"
                                  onClick={() => onQuestionChange(questionIndex)}
                                >
                                  {questionIndex + 1}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Current Question */}
      <div className="w-1/2 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Question</h2>
            {currentQuestion?.passage_id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePassageClick(currentQuestion.passage_id!)}
              >
                View Passage {currentQuestion.passage_id}
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto">
          {currentQuestion && (
            <QuestionCard
              question={currentQuestion}
              currentIndex={currentQuestionIndex}
              totalQuestions={questions.length}
              selectedAnswer={answers[currentQuestion.id]}
              onAnswerSelect={onAnswerSelect}
              onNext={onNext}
              onPrevious={onPrevious}
              onSubmit={onSubmit}
              lockAnswers={lockAnswers}
            />
          )}
        </div>
      </div>
    </div>
  );
}