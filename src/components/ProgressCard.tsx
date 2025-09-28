// Zero business logic component - just renders props
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ProgressAggregate } from '@/types/curriculum';

interface ProgressCardProps {
  progress: ProgressAggregate;
  previousMastery?: number; // For trend calculation
}

export const ProgressCard = ({ progress, previousMastery }: ProgressCardProps) => {
  const getTrendIcon = () => {
    if (previousMastery === undefined) return <Minus className="h-4 w-4" />;

    if (progress.mastery_pct > previousMastery) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (progress.mastery_pct < previousMastery) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    } else {
      return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getMasteryColor = () => {
    if (progress.mastery_pct >= 80) return 'text-green-600';
    if (progress.mastery_pct >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMasteryBadge = () => {
    if (progress.mastery_pct >= 80) return <Badge variant="default">Mastered</Badge>;
    if (progress.mastery_pct >= 60) return <Badge variant="outline">Practicing</Badge>;
    return <Badge variant="secondary">Learning</Badge>;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{progress.domain}</CardTitle>
            <CardDescription>
              Last updated: {new Date(progress.last_updated).toLocaleDateString()}
            </CardDescription>
          </div>
          {getMasteryBadge()}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Mastery Level</span>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${getMasteryColor()}`}>
                  {Math.round(progress.mastery_pct)}%
                </span>
                {getTrendIcon()}
              </div>
            </div>
            <Progress
              value={progress.mastery_pct}
              className="h-2"
            />
          </div>

          {/* Trend Information */}
          {previousMastery !== undefined && (
            <div className="text-xs text-muted-foreground">
              {progress.mastery_pct > previousMastery && (
                <span className="text-green-600">
                  +{Math.round(progress.mastery_pct - previousMastery)}% improvement
                </span>
              )}
              {progress.mastery_pct < previousMastery && (
                <span className="text-red-600">
                  {Math.round(progress.mastery_pct - previousMastery)}% change
                </span>
              )}
              {progress.mastery_pct === previousMastery && (
                <span className="text-gray-400">No change</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};