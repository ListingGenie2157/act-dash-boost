import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { QuestionCard } from './QuestionCard';
import { ReadingPreferences } from './ReadingPreferences';

interface Question {
  id: string;
  ord?: number;
  question: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  passage_id?: string;
  underlined_text?: string | null;
  reference_number?: number | null;
  position_in_passage?: number | null;
}

interface Passage {
  title: string;
  passage_text: string;
  marked_text?: Record<string, any> | null;
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

  // Parse passage text into paragraphs
  const parsePassageText = (text: string) => {
    return text.split('\n\n').filter(p => p.trim().length > 0);
  };

  // Render paragraph with inline references
  const renderParagraphWithReferences = (text: string, paragraphIndex: number, markedText: Record<string, any> | null) => {
    if (!markedText) {
      return text;
    }

    // Check if this paragraph has any marked references
    const references = Object.entries(markedText).filter(([key]) => {
      const match = key.match(/^p(\d+)_ref(\d+)$/);
      return match && parseInt(match[1]) === paragraphIndex + 1;
    });

    if (references.length === 0) {
      return text;
    }

    // Highlight inline references with underline and reference number badges
    let result = text;
    references.forEach(([key, value]) => {
      const refNumber = key.match(/ref(\d+)$/)?.[1];
      const markedPhrase = value.text || '';
      if (markedPhrase && result.includes(markedPhrase)) {
        result = result.replace(
          markedPhrase,
          `<span class="relative inline">
            <span class="underline decoration-2 decoration-primary/60">${markedPhrase}</span>
            <sup class="ml-0.5 text-xs font-bold text-primary">[${refNumber}]</sup>
          </span>`
        );
      }
    });

    return result;
  };

  const allPassageIds = Object.keys(passages);

  return (
    <div className="h-screen flex flex-col">
      {/* Reading Preferences Bar */}
      <ReadingPreferences />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Passages */}
        <div className="w-1/2 border-r bg-background">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Reading Passages</h2>
            <p className="text-sm text-muted-foreground">
              Click on passage tags to navigate
            </p>
          </div>
          
          <ScrollArea className="h-[calc(100vh-140px)]">
            <div className="p-4 space-y-6">
              {allPassageIds.map((passageId) => {
                const passage = passages[passageId];
                const questionsForPassage = getQuestionsForPassage(passageId);
                const isActive = selectedPassage === passageId;
                const paragraphs = parsePassageText(passage.passage_text);
                
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
                          <div className="space-y-4 text-base leading-loose font-serif">
                            {paragraphs.map((para, idx) => {
                              const enhancedText = renderParagraphWithReferences(para, idx, passage.marked_text ?? null);
                              return (
                                <p key={idx} className="mb-4">
                                  <span className="text-xs text-muted-foreground mr-2 font-sans select-none">
                                    [{idx + 1}]
                                  </span>
                                  <span dangerouslySetInnerHTML={{ __html: enhancedText }} />
                                </p>
                              );
                            })}
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
    </div>
  );
}
