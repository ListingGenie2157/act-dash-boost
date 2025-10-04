import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getMasteryColor, getMasteryLabel, type MasteryLevel } from '@/lib/mastery';
import { cn } from '@/lib/utils';

interface MasteryBadgeProps {
  level: MasteryLevel;
  accuracy?: number;
  total?: number;
  className?: string;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function MasteryBadge({ 
  level, 
  accuracy, 
  total, 
  className,
  showTooltip = true,
  size = 'md'
}: MasteryBadgeProps) {
  const colors = getMasteryColor(level);
  const label = getMasteryLabel(level);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const badge = (
    <Badge
      variant="outline"
      className={cn(
        'font-medium transition-colors',
        colors.bg,
        colors.text,
        colors.border,
        sizeClasses[size],
        className
      )}
    >
      <span className="mr-1">{colors.icon}</span>
      {label}
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badge}
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-sm">
          <p className="font-semibold">{label}</p>
          {accuracy !== undefined && (
            <p className="text-muted-foreground">
              Accuracy: {accuracy.toFixed(1)}%
            </p>
          )}
          {total !== undefined && (
            <p className="text-muted-foreground">
              Attempts: {total}
            </p>
          )}
          {level === 'not-started' && (
            <p className="text-muted-foreground italic">
              Complete lessons to track progress
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
