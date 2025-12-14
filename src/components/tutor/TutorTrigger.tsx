import { MessageCircle, HelpCircle } from 'lucide-react';
import { useTutor } from '@/hooks/useTutor';
import { Button } from '@/components/ui/button';
import type { TutorContextData } from '@/types/tutor';

interface TutorTriggerProps {
  subject: TutorContextData['subject'];
  topic: string;
  mode?: TutorContextData['mode'];
  problem?: TutorContextData['problem'];
  variant?: 'floating' | 'inline';
  className?: string;
}

export function TutorTrigger({
  subject,
  topic,
  mode = 'practice',
  problem = null,
  variant = 'inline',
  className,
}: TutorTriggerProps) {
  const { openTutor } = useTutor();

  const handleClick = () => {
    openTutor({
      subject,
      topic,
      mode,
      problem,
    });
  };

  if (variant === 'floating') {
    return (
      <Button
        onClick={handleClick}
        className="fixed bottom-6 right-6 rounded-full shadow-lg z-50 h-14 px-6"
        size="lg"
      >
        <MessageCircle className="mr-2 h-5 w-5" />
        Ask Tutor
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} className={className}>
      <HelpCircle className="mr-1 h-4 w-4" />
      Get Help
    </Button>
  );
}
