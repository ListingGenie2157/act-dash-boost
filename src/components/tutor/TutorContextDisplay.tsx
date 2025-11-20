import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TutorContextData } from '@/types/tutor';

interface TutorContextDisplayProps {
  context: TutorContextData;
}

export function TutorContextDisplay({ context }: TutorContextDisplayProps) {
  const [expanded, setExpanded] = useState(false);

  if (!context.problem) return null;

  const truncatedText = context.problem.text.slice(0, 80) + (context.problem.text.length > 80 ? '...' : '');

  return (
    <div className="border-b border-border pb-3 mb-3">
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-between text-left h-auto p-2"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-sm font-medium">
          Current Problem: {expanded ? '' : truncatedText}
        </span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {expanded && (
        <div className="text-sm space-y-2 pt-2 px-2">
          <div>
            <strong className="text-muted-foreground">Question:</strong>
            <p className="mt-1">{context.problem.text}</p>
          </div>

          {context.problem.choices && context.problem.choices.length > 0 && (
            <div>
              <strong className="text-muted-foreground">Choices:</strong>
              <ul className="mt-1 space-y-1">
                {context.problem.choices.map((choice, i) => (
                  <li key={i}>
                    <span className="font-medium">{String.fromCharCode(65 + i)}.</span> {choice}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {context.problem.user_answer && (
            <div>
              <strong className="text-muted-foreground">Your Answer:</strong>
              <p className="mt-1">{context.problem.user_answer}</p>
            </div>
          )}

          {context.problem.user_work && (
            <div>
              <strong className="text-muted-foreground">Your Work:</strong>
              <p className="mt-1 whitespace-pre-wrap">{context.problem.user_work}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
