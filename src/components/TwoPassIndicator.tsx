import { Badge } from '@/components/ui/badge';
import { Zap, Search, Flag } from 'lucide-react';

export type PassMode = 'quick' | 'deep';

interface TwoPassIndicatorProps {
  currentPass: PassMode;
  flaggedCount: number;
  totalQuestions: number;
  answeredCount: number;
}

export function TwoPassIndicator({
  currentPass,
  flaggedCount,
  totalQuestions,
  answeredCount,
}: TwoPassIndicatorProps) {
  const isQuickPass = currentPass === 'quick';
  const unanswered = totalQuestions - answeredCount;

  return (
    <div className="flex items-center gap-2">
      {/* Pass Mode Badge */}
      <Badge 
        variant={isQuickPass ? 'default' : 'secondary'}
        className={`flex items-center gap-1.5 px-3 py-1 ${
          isQuickPass 
            ? 'bg-primary/90 hover:bg-primary' 
            : 'bg-purple-500/90 hover:bg-purple-500 text-white'
        }`}
      >
        {isQuickPass ? (
          <>
            <Zap className="h-3.5 w-3.5" />
            <span className="font-medium">Quick Pass</span>
          </>
        ) : (
          <>
            <Search className="h-3.5 w-3.5" />
            <span className="font-medium">Deep Dive</span>
          </>
        )}
      </Badge>

      {/* Flagged/Remaining Counter */}
      {isQuickPass ? (
        flaggedCount > 0 && (
          <Badge variant="outline" className="flex items-center gap-1 text-amber-600 border-amber-300">
            <Flag className="h-3 w-3 fill-amber-500" />
            <span>{flaggedCount} flagged</span>
          </Badge>
        )
      ) : (
        <Badge variant="outline" className="text-muted-foreground">
          {unanswered > 0 ? `${unanswered} to review` : 'All answered'}
        </Badge>
      )}
    </div>
  );
}

// Helper to determine if we should transition to deep dive
export function shouldTransitionToDeepDive(
  currentPass: PassMode,
  currentQuestionIndex: number,
  totalQuestions: number,
  flaggedCount: number,
  timeLeftSec: number,
  totalTimeSec: number
): boolean {
  if (currentPass !== 'quick') return false;

  // Transition when:
  // 1. User has seen all questions (reached the last one)
  const hasSeenAll = currentQuestionIndex >= totalQuestions - 1;
  
  // 2. OR: 65% time used and more than 5 flagged
  const percentTimeUsed = ((totalTimeSec - timeLeftSec) / totalTimeSec) * 100;
  const shouldAutoTransition = percentTimeUsed >= 65 && flaggedCount >= 5;

  return hasSeenAll || shouldAutoTransition;
}
