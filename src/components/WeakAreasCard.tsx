import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingDown, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getWeakAreas, getPriorityColor, getPriorityLabel, type WeakArea } from '@/lib/weakAreas';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

interface WeakAreasCardProps {
  limit?: number;
  showActions?: boolean;
}

export function WeakAreasCard({ limit = 5, showActions = true }: WeakAreasCardProps) {
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeakAreas() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const areas = await getWeakAreas(user.id, limit);
        setWeakAreas(areas);
      } catch (error) {
        console.error('Error fetching weak areas:', error);
      } finally {
        setLoading(false);
      }
    }

    void fetchWeakAreas();
  }, [limit]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (weakAreas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-500" />
            Weak Areas
          </CardTitle>
          <CardDescription>Skills that need more practice</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
            <p className="font-medium">No weak areas identified yet!</p>
            <p className="text-sm mt-1">Complete quizzes to identify areas for improvement</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const criticalCount = weakAreas.filter(a => a.priority === 'critical').length;
  const highCount = weakAreas.filter(a => a.priority === 'high').length;

  return (
    <Card className="border-orange-200 dark:border-orange-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Areas Needing Focus
        </CardTitle>
        <CardDescription>
          {criticalCount > 0 && (
            <span className="text-red-600 dark:text-red-400 font-medium">
              {criticalCount} critical
            </span>
          )}
          {criticalCount > 0 && highCount > 0 && ' • '}
          {highCount > 0 && (
            <span className="text-orange-600 dark:text-orange-400 font-medium">
              {highCount} high priority
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {weakAreas.map((area) => {
          const colors = getPriorityColor(area.priority);
          const label = getPriorityLabel(area.priority);

          return (
            <div
              key={area.skill_id}
              className={`p-4 rounded-lg border transition-colors ${colors.bg} ${colors.border}`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-semibold ${colors.text}`}>
                      {area.skill_name}
                    </h4>
                    <Badge variant="outline" className={colors.badge}>
                      {label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {area.subject} • {area.total_attempts} attempt{area.total_attempts !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${colors.text}`}>
                    {area.accuracy.toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">accuracy</div>
                </div>
              </div>

              <Progress 
                value={area.accuracy} 
                className="h-1.5 mb-3"
              />

              {showActions && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    asChild
                  >
                    <Link to={`/lesson/${area.skill_id}`}>
                      Review Lesson
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    asChild
                  >
                    <Link to={`/drill/${area.skill_id}`}>
                      Practice Drill
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          );
        })}

        {weakAreas.length >= limit && (
          <div className="pt-2 text-center">
            <Button variant="link" size="sm" asChild>
              <Link to="/weak-areas">
                View All Weak Areas →
              </Link>
            </Button>
          </div>
        )}

        {/* Summary Message */}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <div className="flex items-start gap-2">
            <TrendingDown className="h-4 w-4 text-orange-600 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              {criticalCount > 0 ? (
                <>Focus on <strong>{criticalCount} critical skill{criticalCount > 1 ? 's' : ''}</strong> first for maximum impact</>
              ) : (
                <>Keep practicing these skills to improve your overall score</>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
