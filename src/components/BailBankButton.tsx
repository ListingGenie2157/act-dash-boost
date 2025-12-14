import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';

interface BailBankButtonProps {
  questionId: string;
  currentAnswer: string | undefined;
  choices: string[];
  isLastQuestion: boolean;
  onAutoGuess: (questionId: string, answer: string) => void;
  onFlag: (questionId: string) => void;
  onNext: () => void;
  onSubmit: () => void;
}

export function BailBankButton({
  questionId,
  currentAnswer,
  choices,
  isLastQuestion,
  onAutoGuess,
  onFlag,
  onNext,
  onSubmit,
}: BailBankButtonProps) {
  const handleBailBank = () => {
    // 1. Auto-guess if no answer selected
    if (!currentAnswer && choices.length > 0) {
      const randomIndex = Math.floor(Math.random() * choices.length);
      const randomAnswer = choices[randomIndex];
      onAutoGuess(questionId, randomAnswer);
    }

    // 2. Flag the question for review
    onFlag(questionId);

    // 3. Move to next question (or submit if last)
    if (isLastQuestion) {
      onSubmit();
    } else {
      onNext();
    }
  };

  return (
    <Button
      onClick={handleBailBank}
      variant="destructive"
      size="lg"
      className="gap-2 font-semibold shadow-lg animate-pulse hover:animate-none"
    >
      <Zap className="h-5 w-5" />
      Bail + Bank
    </Button>
  );
}
