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
            <Trophy className="h-5 w-5 text-yellow-500" />
            Mastery Progress
          </CardTitle>
          <CardDescription>Complete quizzes to track your progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No progress yet. Start learning to see your mastery levels!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const masteredPercent = summary.totalSkills > 0 
    ? (summary.mastered / summary.totalSkills) * 100 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Mastery Progress
        </CardTitle>
        <CardDescription>
          {summary.totalSkills} skills tracked • {summary.overallAccuracy.toFixed(0)}% overall accuracy
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Skills Mastered</span>
            <span className="text-muted-foreground">
              {summary.mastered} / {summary.totalSkills}
            </span>
          </div>
          <Progress value={masteredPercent} className="h-2" />
        </div>

        {/* Mastery Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          {/* Mastered */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="text-2xl">🏆</div>
            <div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                {summary.mastered}
              </div>
              <div className="text-xs text-green-600 dark:text-green-500">Mastered</div>
            </div>
          </div>

          {/* Proficient */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="text-2xl">⭐</div>
            <div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                {summary.proficient}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-500">Proficient</div>
            </div>
          </div>

          {/* Learning */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <div className="text-2xl">📚</div>
            <div>
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                {summary.learning}
              </div>
              <div className="text-xs text-yellow-600 dark:text-yellow-500">Learning</div>
            </div>
          </div>

          {/* Beginner */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
            <div className="text-2xl">🌱</div>
            <div>
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                {summary.beginner}
              </div>
              <div className="text-xs text-orange-600 dark:text-orange-500">Beginner</div>
            </div>
          </div>
        </div>

        {/* Motivational Message */}
        {summary.mastered > 0 && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <p className="text-sm text-muted-foreground">
              {summary.mastered === 1 
                ? "You've mastered your first skill! Keep it up!" 
                : `Great work! ${summary.mastered} skills mastered!`}
            </p>
          </div>
        )}

        {summary.beginner > 0 && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Target className="h-4 w-4 text-orange-600" />
            <p className="text-sm text-muted-foreground">
              Focus on {summary.beginner} skill{summary.beginner > 1 ? 's' : ''} that need more practice
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
