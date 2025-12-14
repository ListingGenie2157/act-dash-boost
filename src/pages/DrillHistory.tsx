import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Target, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { format } from 'date-fns';

interface DrillHistory {
  id: string;
  the_date: string;
  size: number;
  accuracy: number;
  median_time_ms: number;
  skill_id: string | null;
  skills: { name: string; subject: string } | null;
}

export default function DrillHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<DrillHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDrills: 0,
    avgAccuracy: 0,
    avgTimePerQ: 0,
    recentImprovement: 0,
  });

  useEffect(() => {
    async function fetchHistory() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        const { data, error } = await supabase
          .from('study_tasks')
          .select('id, the_date, size, accuracy, median_time_ms, skill_id, skills(name, subject)')
          .eq('user_id', user.id)
          .eq('type', 'DRILL')
          .eq('status', 'DONE')
          .order('the_date', { ascending: false })
          .limit(50);

        if (error) throw error;

        const drillHistory = (data || []) as DrillHistory[];
        setHistory(drillHistory);

        // Calculate stats
        if (drillHistory.length > 0) {
          const totalDrills = drillHistory.length;
          const avgAccuracy = drillHistory.reduce((sum, d) => sum + (d.accuracy || 0), 0) / totalDrills;
          const avgTimePerQ = drillHistory.reduce((sum, d) => sum + (d.median_time_ms || 0), 0) / totalDrills;

          // Calculate improvement (recent 10 vs previous 10)
          const recent = drillHistory.slice(0, 10);
          const previous = drillHistory.slice(10, 20);
          const recentAvg = recent.length > 0 ? recent.reduce((sum, d) => sum + (d.accuracy || 0), 0) / recent.length : 0;
          const prevAvg = previous.length > 0 ? previous.reduce((sum, d) => sum + (d.accuracy || 0), 0) / previous.length : 0;
          const improvement = prevAvg > 0 ? ((recentAvg - prevAvg) / prevAvg) * 100 : 0;

          setStats({
            totalDrills,
            avgAccuracy: avgAccuracy * 100,
            avgTimePerQ: avgTimePerQ / 1000, // convert to seconds
            recentImprovement: improvement,
          });
        }
      } catch (error) {
        console.error('Error fetching drill history:', error);
      } finally {
        setLoading(false);
      }
    }

    void fetchHistory();
  }, [navigate]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Button
        variant="outline"
        onClick={() => navigate('/drill-runner')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Drills
      </Button>

      <div className="flex items-center gap-3 mb-6">
        <Target className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Drill History</h1>
          <p className="text-muted-foreground">Track your progress over time</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Drills</p>
                <p className="text-2xl font-bold">{stats.totalDrills}</p>
              </div>
              <Target className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Accuracy</p>
                <p className="text-2xl font-bold">{stats.avgAccuracy.toFixed(0)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Time/Q</p>
                <p className="text-2xl font-bold">{stats.avgTimePerQ.toFixed(1)}s</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recent Progress</p>
                <p className="text-2xl font-bold">
                  {stats.recentImprovement >= 0 ? '+' : ''}
                  {stats.recentImprovement.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className={`h-8 w-8 opacity-50 ${stats.recentImprovement >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Drills</CardTitle>
          <CardDescription>Your drill performance history</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No drills completed yet</p>
              <p className="text-sm mt-1">Start practicing to see your history here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(drill => (
                <div
                  key={drill.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(drill.the_date), 'MMM d, yyyy')}
                    </div>
                    {drill.skills && (
                      <div>
                        <p className="font-medium">{drill.skills.name}</p>
                        <p className="text-xs text-muted-foreground">{drill.skills.subject}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant={drill.accuracy >= 0.7 ? 'default' : 'destructive'}>
                      {(drill.accuracy * 100).toFixed(0)}% accuracy
                    </Badge>
                    <Badge variant="outline">
                      {drill.size} questions
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {(drill.median_time_ms / 1000).toFixed(1)}s/q
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
