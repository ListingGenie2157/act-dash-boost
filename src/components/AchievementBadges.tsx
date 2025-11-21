import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy } from 'lucide-react';
import { useAchievements } from '@/hooks/useAchievements';
import { Skeleton } from '@/components/ui/skeleton';

export function AchievementBadges() {
  const { data: achievements, isLoading } = useAchievements();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!achievements || achievements.length === 0) return null;

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Achievements
        </CardTitle>
        <CardDescription>
          {unlockedCount} of {achievements.length} unlocked
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {achievements.map(achievement => (
            <div
              key={achievement.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                achievement.unlocked
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-muted/20 opacity-60'
              }`}
            >
              <div className="text-center space-y-2">
                <div className="text-4xl">{achievement.icon}</div>
                <div>
                  <p className="font-semibold text-sm">{achievement.title}</p>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                </div>
                
                {!achievement.unlocked && achievement.progress !== undefined && achievement.target && (
                  <div className="space-y-1">
                    <Progress value={(achievement.progress / achievement.target) * 100} className="h-1" />
                    <p className="text-xs text-muted-foreground">
                      {achievement.progress} / {achievement.target}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
