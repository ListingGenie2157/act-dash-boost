import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Flag } from 'lucide-react';

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
  underlined_text?: string | null;
  reference_number?: number | null;
  position_in_passage?: number | null;
}

interface Passage {
  title: string;
  passage_text: string;
  marked_text?: Record<string, any> | null;
}

interface EnglishPassageLayoutProps {
  questions: Question[];
  passages: Record<string, Passage>;
  currentQuestionIndex: number;
  answers: Record<string, string>;
  onAnswerSelect: (questionId: string, answer: string) => void;
  onQuestionChange: (index: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
  flaggedQuestions?: Set<string>;
  onToggleFlag?: (questionId: string) => void;
}

export function EnglishPassageLayout({
  questions,
  passages,
  currentQuestionIndex,
  answers,
  onAnswerSelect,
  onQuestionChange,
  onNext,
  onPrevious,
  onSubmit,
  flaggedQuestions = new Set(),
  onToggleFlag,
}: EnglishPassageLayoutProps) {
  const questionRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const passageRef = useRef<HTMLDivElement | null>(null);
  
  const currentQuestion = questions[currentQuestionIndex];
  const currentPassageId = currentQuestion?.passage_id;
  const currentPassage = currentPassageId ? passages[currentPassageId] : null;

  // Get questions for current passage
  const passageQuestions = questions.filter(q => q.passage_id === currentPassageId);

  // ACT alternates between A/B/C/D and F/G/H/J for consecutive questions
  const getChoiceLetters = (questionIndex: number) => {
    // Odd questions (1, 3, 5...) use A/B/C/D, Even (2, 4, 6...) use F/G/H/J
    const questionNumber = (questions[questionIndex]?.ord || questionIndex + 1);
    return questionNumber % 2 === 1 
      ? ['A', 'B', 'C', 'D'] 
      : ['F', 'G', 'H', 'J'];
  };

  // Scroll to current question
  useEffect(() => {
    const ref = questionRefs.current[currentQuestionIndex];
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentQuestionIndex]);

  // Render passage text with inline underlines and reference numbers
  // The passage has embedded markers like "word[1]" where "word" should be underlined
  const renderPassageWithReferences = (text: string) => {
    if (!text) return null;

    // Split into paragraphs
    const paragraphs = text.split('\n\n').filter(p => p.trim());

    // Build a map of reference numbers to question indices
    const refToQuestionIdx = new Map<number, number>();
    questions.forEach((q, idx) => {
      if (q.reference_number) {
        refToQuestionIdx.set(q.reference_number, idx);
      }
    });

    return paragraphs.map((para, pIdx) => {
      // Parse out [N] markers and the word/phrase before them
      // Pattern: captures text before [N] and the number N
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      
      // Regex to find patterns like "word[1]" or "some phrase[2]"
      // We need to find the underlined text right before [N]
      const markerRegex = /\[(\d+)\]/g;
      let match;
      
      while ((match = markerRegex.exec(para)) !== null) {
        const refNum = parseInt(match[1], 10);
        const markerStart = match.index;
        const markerEnd = markerRegex.lastIndex;
        
        // Find the underlined text for this reference from our questions
        const question = questions.find(q => q.reference_number === refNum);
        const underlinedText = question?.underlined_text || '';
        
        // Check if the text before the marker ends with the underlined text
        const textBefore = para.slice(lastIndex, markerStart);
        
        if (underlinedText && textBefore.endsWith(underlinedText)) {
          // Add text before the underlined portion
          const preUnderlineText = textBefore.slice(0, textBefore.length - underlinedText.length);
          if (preUnderlineText) {
            parts.push(<span key={`text-${pIdx}-${lastIndex}`}>{preUnderlineText}</span>);
          }
          
          // Add the underlined portion with reference number
          const questionIdx = refToQuestionIdx.get(refNum);
          const isCurrentRef = questionIdx === currentQuestionIndex;
          
          parts.push(
            <span
              key={`ref-${pIdx}-${refNum}`}
              className={`cursor-pointer transition-all ${
                isCurrentRef 
                  ? 'bg-primary/20 underline decoration-2 decoration-primary font-medium' 
                  : 'underline decoration-1 decoration-foreground/50 hover:bg-muted hover:decoration-foreground'
              }`}
              onClick={() => questionIdx !== undefined && onQuestionChange(questionIdx)}
            >
              {underlinedText}
              <sup className={`ml-0.5 text-[10px] font-bold ${isCurrentRef ? 'text-primary' : 'text-muted-foreground'}`}>
                {refNum}
              </sup>
            </span>
          );
        } else {
          // No underlined text match, just show the text with the reference number
          if (textBefore) {
            parts.push(<span key={`text-${pIdx}-${lastIndex}`}>{textBefore}</span>);
          }
          
          // Show just the reference number as superscript
          const questionIdx = refToQuestionIdx.get(refNum);
          const isCurrentRef = questionIdx === currentQuestionIndex;
          
          parts.push(
            <sup 
              key={`ref-${pIdx}-${refNum}`}
              className={`ml-0.5 text-[10px] font-bold cursor-pointer ${isCurrentRef ? 'text-primary' : 'text-muted-foreground'}`}
              onClick={() => questionIdx !== undefined && onQuestionChange(questionIdx)}
            >
              [{refNum}]
            </sup>
          );
        }
        
        lastIndex = markerEnd;
      }
      
      // Add remaining text after last marker
      if (lastIndex < para.length) {
        parts.push(<span key={`text-${pIdx}-end`}>{para.slice(lastIndex)}</span>);
      }
      
      // If no markers found, just return the paragraph as-is
      if (parts.length === 0) {
        parts.push(<span key={`text-${pIdx}-full`}>{para}</span>);
      }

      return (
        <p key={pIdx} className="mb-6 text-[15px] leading-loose font-serif indent-8 first:indent-0">
          {parts}
        </p>
      );
    });
  };
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="h-[calc(100vh-140px)] flex">
      {/* Left Panel - Passage */}
      <div className="w-1/2 border-r flex flex-col">
        <div className="p-4 border-b bg-muted/30">
          <h2 className="font-bold text-sm uppercase tracking-wide">
            {currentPassageId ? `PASSAGE ${currentPassageId.replace(/\D/g, '') || 'I'}` : 'PASSAGE'}
          </h2>
          {currentPassage?.title && (
            <h3 className="font-semibold text-lg mt-1">{currentPassage.title}</h3>
          )}
        </div>
        
        <ScrollArea className="flex-1" ref={passageRef}>
          <div className="p-6">
            {currentPassage ? (
              renderPassageWithReferences(currentPassage.passage_text)
            ) : (
              <p className="text-muted-foreground italic">No passage available</p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Questions */}
      <div className="w-1/2 flex flex-col">
        <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
          <h2 className="font-bold text-sm uppercase tracking-wide">Questions</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {currentQuestionIndex + 1} of {questions.length}
            </span>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {/* Show questions for current passage */}
            {passageQuestions.map((q) => {
              const qIndex = questions.findIndex(question => question.id === q.id);
              const isCurrent = qIndex === currentQuestionIndex;
              const isAnswered = !!answers[q.id];
              const isFlagged = flaggedQuestions.has(q.id);
              const choiceLetters = getChoiceLetters(qIndex);
              const questionNumber = q.ord || qIndex + 1;

              const choices = [
                { value: 'A', label: q.choice_a, letter: choiceLetters[0] },
                { value: 'B', label: q.choice_b, letter: choiceLetters[1] },
                { value: 'C', label: q.choice_c, letter: choiceLetters[2] },
                { value: 'D', label: q.choice_d, letter: choiceLetters[3] },
              ];

              return (
                <div
                  key={q.id}
                  ref={(el) => (questionRefs.current[qIndex] = el)}
                  className={`p-4 rounded-lg border transition-all ${
                    isCurrent 
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                      : isAnswered 
                        ? 'border-muted bg-muted/30' 
                        : 'border-border'
                  } ${isFlagged ? 'ring-2 ring-amber-500/50' : ''}`}
                  onClick={() => !isCurrent && onQuestionChange(qIndex)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{questionNumber}.</span>
                      {q.question && q.question !== 'NO CHANGE' && (
                        <span className="text-sm">{q.question}</span>
                      )}
                    </div>
                    {onToggleFlag && (
                      <Button
                        variant={isFlagged ? "default" : "ghost"}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFlag(q.id);
                        }}
                        className={`h-7 w-7 p-0 ${isFlagged ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
                      >
                        <Flag className={`h-3.5 w-3.5 ${isFlagged ? 'fill-current text-white' : ''}`} />
                      </Button>
                    )}
                  </div>

                  <RadioGroup
                    value={answers[q.id] || ''}
                    onValueChange={(value) => onAnswerSelect(q.id, value)}
                    className="space-y-2"
                  >
                    {choices.map((choice) => (
                      <div 
                        key={choice.value} 
                        className={`flex items-start space-x-2 p-2 rounded hover:bg-muted/50 transition-colors ${
                          answers[q.id] === choice.value ? 'bg-primary/10' : ''
                        }`}
                      >
                        <RadioGroupItem
                          value={choice.value}
                          id={`${q.id}-${choice.value}`}
                          className="mt-0.5"
                        />
                        <Label
                          htmlFor={`${q.id}-${choice.value}`}
                          className="flex-1 cursor-pointer text-sm leading-relaxed"
                        >
                          <span className="font-semibold mr-2">{choice.letter}.</span>
                          {choice.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Navigation */}
        <div className="p-4 border-t bg-background">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={onPrevious}
              disabled={isFirstQuestion}
            >
              Previous
            </Button>

            {/* Question navigation dots */}
            <div className="flex flex-wrap gap-1 max-w-xs justify-center">
              {questions.slice(
                Math.max(0, currentQuestionIndex - 3),
                Math.min(questions.length, currentQuestionIndex + 4)
              ).map((q) => {
                const idx = questions.findIndex(question => question.id === q.id);
                const isAnswered = !!answers[q.id];
                const isCurrent = idx === currentQuestionIndex;
                const isFlagged = flaggedQuestions.has(q.id);

                return (
                  <Button
                    key={q.id}
                    size="sm"
                    variant={isCurrent ? 'default' : isAnswered ? 'secondary' : 'outline'}
                    className={`h-7 w-7 p-0 text-xs relative ${isFlagged ? 'ring-1 ring-amber-500' : ''}`}
                    onClick={() => onQuestionChange(idx)}
                  >
                    {idx + 1}
                  </Button>
                );
              })}
            </div>

            {!isLastQuestion ? (
              <Button onClick={onNext}>Next</Button>
            ) : (
              <Button onClick={onSubmit}>Submit</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
