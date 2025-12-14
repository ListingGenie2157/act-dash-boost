import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, TrendingUp } from 'lucide-react';
import { useStreak } from '@/hooks/useStreak';
import { Skeleton } from '@/components/ui/skeleton';

export function StreakCounter() {
  const { data: streak, isLoading } = useStreak();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!streak) return null;

  const isActiveToday = streak.lastActiveDate === new Date().toISOString().split('T')[0];

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className={`h-5 w-5 ${streak.currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
          Study Streak
        </CardTitle>
        <CardDescription>
          {isActiveToday ? 'Keep it going!' : 'Study today to continue your streak'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Current Streak</p>
            <p className="text-4xl font-bold text-primary">{streak.currentStreak}</p>
            <p className="text-xs text-muted-foreground">days</p>
          </div>
          
          <div className="text-right space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
              <TrendingUp className="h-3 w-3" />
              Best Streak
            </p>
            <p className="text-2xl font-semibold text-muted-foreground">{streak.longestStreak}</p>
            <p className="text-xs text-muted-foreground">days</p>
          </div>
        </div>

        {streak.currentStreak > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 text-sm">
              {streak.currentStreak >= 7 && <span className="text-orange-500">🔥 On fire!</span>}
              {streak.currentStreak >= 30 && <span className="text-orange-500">🔥 Unstoppable!</span>}
              {streak.currentStreak < 7 && <span className="text-muted-foreground">Keep going!</span>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
