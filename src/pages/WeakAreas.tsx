import { useEffect, useState } from 'react';
import { skillDrillPath } from '@/lib/bank';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Target, TrendingUp, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { getWeakAreas, getPriorityColor, getPriorityLabel, type WeakArea } from '@/lib/weakAreas';
import { reportError } from '@/lib/errorReporter';
import { Skeleton } from '@/components/ui/skeleton';

export default function WeakAreas() {
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium'>('all');

  useEffect(() => {
    async function fetchWeakAreas() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const areas = await getWeakAreas(user.id, 50); // Get more for dedicated page
        setWeakAreas(areas);
      } catch (error) {
        reportError(error instanceof Error ? error : new Error(String(error)), { page: 'WeakAreas' });
      } finally {
        setLoading(false);
      }
    }

    void fetchWeakAreas();
  }, []);

  const filteredAreas = filter === 'all' 
    ? weakAreas 
    : weakAreas.filter(a => a.priority === filter);

  const criticalCount = weakAreas.filter(a => a.priority === 'critical').length;
  const highCount = weakAreas.filter(a => a.priority === 'high').length;
  const mediumCount = weakAreas.filter(a => a.priority === 'medium').length;

  // Group by subject
  const bySubject = filteredAreas.reduce((acc, area) => {
    if (!acc[area.subject]) acc[area.subject] = [];
    acc[area.subject].push(area);
    return acc;
  }, {} as Record<string, WeakArea[]>);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="h-8 w-8 text-secondary" />
          <h1 className="text-3xl font-bold">Areas Needing Focus</h1>
        </div>
        <p className="text-muted-foreground">
          Skills identified based on your quiz performance that need more practice
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : weakAreas.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="h-16 w-16 mx-auto mb-4 text-green-500 opacity-50" />
            <h2 className="text-xl font-semibold mb-2">No Weak Areas Identified!</h2>
            <p className="text-muted-foreground mb-4">
              Complete more quizzes to identify areas for improvement
            </p>
            <Button asChild>
              <Link to="/lessons">Browse Lessons</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="border-secondary/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Critical Priority
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary">
                  {criticalCount}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {'< 60% accuracy'}
                </p>
              </CardContent>
            </Card>

            <Card className="border-secondary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  High Priority
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary/80">
                  {highCount}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  60-74% accuracy
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Medium Priority
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-muted-foreground">
                  {mediumCount}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  75-89% accuracy
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filter Tabs */}
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-6">
            <TabsList className="max-w-full justify-start overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <TabsTrigger value="all">
                All ({weakAreas.length})
              </TabsTrigger>
              <TabsTrigger value="critical">
                Critical ({criticalCount})
              </TabsTrigger>
              <TabsTrigger value="high">
                High ({highCount})
              </TabsTrigger>
              <TabsTrigger value="medium">
                Medium ({mediumCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="mt-6">
              {/* Group by Subject */}
              {Object.entries(bySubject).map(([subject, areas]) => (
                <div key={subject} className="mb-8">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {subject}
                    <Badge variant="secondary">{areas.length}</Badge>
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {areas.map((area) => {
                      const colors = getPriorityColor(area.priority);
                      const label = getPriorityLabel(area.priority);

                      return (
                        <Card key={area.skill_id} className={`border-2 ${colors.border}`}>
                          <CardHeader>
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-lg">
                                {area.skill_name}
                              </CardTitle>
                              <Badge className={colors.badge}>
                                {label}
                              </Badge>
                            </div>
                            <CardDescription>
                              {area.total_attempts} attempt{area.total_attempts !== 1 ? 's' : ''} • {area.mastery_level}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Current Accuracy</span>
                                <span className={`text-2xl font-bold ${colors.text}`}>
                                  {area.accuracy.toFixed(0)}%
                                </span>
                              </div>
                              <Progress value={area.accuracy} className="h-2" />
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                asChild
                              >
                                <Link to={`/lesson/${area.skill_id}`}>
                                  📖 Review
                                </Link>
                              </Button>
                              <Button
                                size="sm"
                                variant="default"
                                className="flex-1"
                                asChild
                              >
                                <Link to={skillDrillPath(area.skill_id)}>
                                  🎯 Practice
                                </Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>

          {/* Study Plan Recommendation */}
          {criticalCount > 0 && (
            <Card className="border-secondary/30 bg-secondary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">
                  Focus on your <strong>{criticalCount} critical skill{criticalCount > 1 ? 's' : ''}</strong> first. 
                  We recommend spending at least <strong>20-30 minutes</strong> on each before moving to other areas.
                </p>
                <Button asChild>
                  <Link to="/plan">View Study Plan</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
