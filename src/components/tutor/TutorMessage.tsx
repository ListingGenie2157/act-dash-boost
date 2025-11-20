import { cn } from '@/lib/utils';
import type { TutorMessage as TutorMessageType } from '@/types/tutor';

interface TutorMessageProps {
  message: TutorMessageType;
}

export function TutorMessage({ message }: TutorMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex mb-4', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'rounded-lg p-3 max-w-[85%]',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        <div className="text-sm whitespace-pre-wrap break-words">{message.content}</div>
        <div className={cn('text-xs mt-1 opacity-70')}>
          {message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
