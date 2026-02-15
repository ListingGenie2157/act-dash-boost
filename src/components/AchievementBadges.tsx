import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, BookOpen, Flame, Star, CheckCircle, LucideProps } from 'lucide-react';
import { useAchievements } from '@/hooks/useAchievements';
import { Skeleton } from '@/components/ui/skeleton';

const iconMap: Record<string, React.ComponentType<Omit<LucideProps, 'ref'>>> = {
  'target': Target,
  'book-open': BookOpen,
  'flame': Flame,
  'trophy': Trophy,
  'star': Star,
  'check-circle': CheckCircle,
};

const Icon = ({ name, ...props }: { name: string } & Omit<LucideProps, 'ref'>) => {
  const LucideIcon = iconMap[name];
  if (!LucideIcon) return <div className="h-8 w-8" />;
  return <LucideIcon {...props} />;
};

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
          <Trophy className="h-5 w-5 text-amber-500" />
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
              className={`group relative p-4 rounded-lg border transition-all duration-200 ${
                achievement.unlocked
                  ? 'border-l-4 border-l-primary border-white/[0.06] bg-card'
                  : 'border-white/[0.06] bg-card opacity-50'
              }`}
            >
              <div className="text-center space-y-3">
                <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-200 ${
                  achievement.unlocked 
                    ? 'bg-secondary group-hover:scale-110' 
                    : 'bg-muted'
                }`}>
                  <Icon 
                    name={achievement.icon} 
                    className={`h-7 w-7 ${achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm tracking-tight truncate">{achievement.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{achievement.description}</p>
                </div>
                
                {!achievement.unlocked && achievement.progress !== undefined && achievement.target && (
                  <div className="space-y-1.5">
                    <Progress value={(achievement.progress / achievement.target) * 100} className="h-1.5" />
                    <p className="text-xs text-muted-foreground font-medium">
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
