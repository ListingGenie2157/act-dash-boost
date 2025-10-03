import { Progress } from '@/components/ui/progress';
import { getMasteryColor, getMasteryLabel, MASTERY_THRESHOLDS, type MasteryLevel } from '@/lib/mastery';
import { cn } from '@/lib/utils';

interface MasteryProgressBarProps {
  accuracy: number;
  level: MasteryLevel;
  total: number;
  showLabel?: boolean;
  className?: string;
}

export function MasteryProgressBar({ 
  accuracy, 
  level, 
  total,
  showLabel = true,
  className 
}: MasteryProgressBarProps) {
  const colors = getMasteryColor(level);
  const label = getMasteryLabel(level);

  // Determine the next milestone
  let nextMilestone = 100;
  let milestoneLabel = 'Mastered';

  if (accuracy < MASTERY_THRESHOLDS.LEARNING) {
    nextMilestone = MASTERY_THRESHOLDS.LEARNING;
    milestoneLabel = 'Learning';
  } else if (accuracy < MASTERY_THRESHOLDS.PROFICIENT) {
    nextMilestone = MASTERY_THRESHOLDS.PROFICIENT;
    milestoneLabel = 'Proficient';
  } else if (accuracy < MASTERY_THRESHOLDS.MASTERED) {
    nextMilestone = MASTERY_THRESHOLDS.MASTERED;
    milestoneLabel = 'Mastered';
  }

  const progressToNext = level === 'mastered' ? 100 : (accuracy / nextMilestone) * 100;

  return (
    <div className={cn('space-y-2', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className={cn('font-medium', colors.text)}>
            {colors.icon} {label}
          </span>
          <span className="text-muted-foreground">
            {accuracy.toFixed(0)}% ({total} attempts)
          </span>
        </div>
      )}
      
      <div className="relative">
        <Progress 
          value={accuracy} 
          className="h-2"
        />
        
        {level !== 'mastered' && level !== 'not-started' && (
          <div className="mt-1 text-xs text-muted-foreground text-right">
            {Math.max(0, nextMilestone - accuracy).toFixed(0)}% to {milestoneLabel}
          </div>
        )}
      </div>

      {/* Milestone markers */}
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span className={accuracy >= MASTERY_THRESHOLDS.LEARNING ? 'text-yellow-600 font-medium' : ''}>
          60%
        </span>
        <span className={accuracy >= MASTERY_THRESHOLDS.PROFICIENT ? 'text-blue-600 font-medium' : ''}>
          75%
        </span>
        <span className={accuracy >= MASTERY_THRESHOLDS.MASTERED ? 'text-green-600 font-medium' : ''}>
          90%
        </span>
      </div>
    </div>
  );
}
