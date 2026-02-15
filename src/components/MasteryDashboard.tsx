import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useMasterySummary } from '@/hooks/useMastery';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Target, BookOpen, TrendingUp } from 'lucide-react';

export function MasteryDashboard() {
  const { data: summary, isLoading } = useMasterySummary();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!summary || summary.totalSkills === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Mastery Progress
          </CardTitle>
          <CardDescription>Complete quizzes to track your progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No progress yet. Start training to see mastery levels.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const masteredPercent = summary.totalSkills > 0 
    ? (summary.mastered / summary.totalSkills) * 100 
    : 0;

  return (
    <Card className="radial-glow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Mastery Progress
        </CardTitle>
        <CardDescription>
          {summary.totalSkills} skills tracked • {summary.overallAccuracy.toFixed(0)}% accuracy
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Skills Mastered</span>
            <span className="text-muted-foreground">{summary.mastered} / {summary.totalSkills}</span>
          </div>
          <Progress value={masteredPercent} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary border border-primary/20">
            <div className="text-2xl">🏆</div>
            <div>
              <div className="text-2xl font-bold text-primary">{summary.mastered}</div>
              <div className="text-xs text-muted-foreground">Mastered</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary border border-accent/20">
            <div className="text-2xl">⭐</div>
            <div>
              <div className="text-2xl font-bold text-accent">{summary.proficient}</div>
              <div className="text-xs text-muted-foreground">Proficient</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary border border-warning/20">
            <div className="text-2xl">📚</div>
            <div>
              <div className="text-2xl font-bold text-warning">{summary.learning}</div>
              <div className="text-xs text-muted-foreground">Learning</div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary border border-white/[0.06]">
            <div className="text-2xl">🌱</div>
            <div>
              <div className="text-2xl font-bold text-muted-foreground">{summary.beginner}</div>
              <div className="text-xs text-muted-foreground">Beginner</div>
            </div>
          </div>
        </div>

        {summary.mastered > 0 && (
          <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg border border-white/[0.06]">
            <TrendingUp className="h-4 w-4 text-primary" />
            <p className="text-sm text-muted-foreground">
              {summary.mastered === 1 ? "First skill mastered." : `${summary.mastered} skills mastered.`}
            </p>
          </div>
        )}

        {summary.beginner > 0 && (
          <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg border border-white/[0.06]">
            <Target className="h-4 w-4 text-primary" />
            <p className="text-sm text-muted-foreground">
              {summary.beginner} skill{summary.beginner > 1 ? 's' : ''} need more reps.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
