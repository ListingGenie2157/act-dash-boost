import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, Clock, Target, CheckCircle, Zap } from 'lucide-react';

interface AnalyticsData {
  studyStreak: number;
  totalQuestions: number;
  accuracyByCluster: { cluster: string; accuracy: number; count: number }[];
  medianTime: number;
  carelessRate: number;
  baselineVsLatest: {
    section: string;
    baseline: number;
    latest: number;
    delta: number;
    baselineSource: string;
    latestSource: string;
  }[];
}

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate('/login');
        return;
      }
      await fetchAnalyticsData(data.session.user.id);
    };
    checkAuth();
  }, [navigate]);

  const fetchAnalyticsData = async (userId: string) => {
    try {
      // Fetch study tasks data
      const { data: studyTasks } = await supabase
        .from('study_tasks')
        .select('*, skill_id')
        .eq('user_id', userId)
        .eq('status', 'DONE');

      // Fetch sim results
      const { data: simResults } = await supabase
        .from('sim_results')
        .select('*')
        .eq('user_id', userId);

      // Fetch diagnostics for baseline vs latest comparison
      const { data: diagnostics } = await supabase
        .from('diagnostics')
        .select('section, score, source, completed_at')
        .eq('user_id', userId)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: true });

      // Fetch skill data for cluster mapping
      const { data: skills } = await supabase
        .from('skills')
        .select('id, cluster, subject');

      if (!studyTasks || !skills) return;

      // Calculate study streak (consecutive days with completed tasks)
      const taskDates = studyTasks
        .map(task => task.the_date)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      
      let streak = 0;
      const today = new Date().toISOString().split('T')[0];
      let currentDate = today;
      
      for (const date of taskDates) {
        if (date === currentDate) {
          streak++;
          const prev = new Date(currentDate);
          prev.setDate(prev.getDate() - 1);
          currentDate = prev.toISOString().split('T')[0];
        } else {
          break;
        }
      }

      // Total questions from study tasks and sim results
      const studyQuestions = studyTasks.reduce((sum, task) => sum + (task.size || 0), 0);
      const simQuestions = (simResults || []).reduce((sum) => sum + 75, 0); // 75 questions per sim
      const totalQuestions = studyQuestions + simQuestions;

      // Accuracy by cluster
      const clusterMap = new Map<string, { correct: number; total: number }>();
      
      studyTasks.forEach(task => {
        const skill = skills.find(s => s.id === task.skill_id);
        if (skill && task.accuracy !== null && task.size) {
          const cluster = skill.cluster;
          const existing = clusterMap.get(cluster) || { correct: 0, total: 0 };
          existing.correct += Math.round((task.accuracy / 100) * task.size);
          existing.total += task.size;
          clusterMap.set(cluster, existing);
        }
      });

      const accuracyByCluster = Array.from(clusterMap.entries()).map(([cluster, data]) => ({
        cluster,
        accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
        count: data.total
      }));

      // Median time across all tasks
      const allTimes = studyTasks
        .filter(task => task.median_time_ms)
        .map(task => task.median_time_ms!)
        .sort((a, b) => a - b);
      
      const medianTime = allTimes.length > 0 
        ? allTimes[Math.floor(allTimes.length / 2)] 
        : 0;

      // Careless rate (tasks completed in <20 seconds with low accuracy)
      const carelessTasks = studyTasks.filter(task => 
        task.median_time_ms && 
        task.median_time_ms < 20000 && 
        task.accuracy && 
        task.accuracy < 70
      );
      const carelessRate = studyTasks.length > 0 
        ? (carelessTasks.length / studyTasks.length) * 100 
        : 0;

      // Calculate baseline vs latest scores
      const baselineVsLatest: AnalyticsData['baselineVsLatest'] = [];
      if (diagnostics && diagnostics.length > 0) {
        const sections = ['math', 'english', 'reading', 'science'];
        
        sections.forEach(section => {
          const sectionDiagnostics = diagnostics.filter(d => d.section === section);
          if (sectionDiagnostics.length > 0) {
            const first = sectionDiagnostics[0];
            const last = sectionDiagnostics[sectionDiagnostics.length - 1];
            
            if (first && last) {
              const baseline = (first.score || 0) * 100;
              const latest = (last.score || 0) * 100;
              const delta = latest - baseline;
              
              baselineVsLatest.push({
                section: section.charAt(0).toUpperCase() + section.slice(1),
                baseline,
                latest,
                delta,
                baselineSource: first.source || 'diagnostic',
                latestSource: last.source || 'diagnostic'
              });
            }
          }
        });
      }

      setAnalyticsData({
        studyStreak: streak,
        totalQuestions,
        accuracyByCluster,
        medianTime: Math.round(medianTime / 1000), // Convert to seconds
        carelessRate,
        baselineVsLatest
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            ←
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Study Analytics
            </h1>
            <p className="text-muted-foreground">Track your progress and performance</p>
          </div>
        </div>

        {analyticsData && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="p-6 shadow-soft">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <Zap className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Study Streak</p>
                    <p className="text-2xl font-bold">{analyticsData.studyStreak}</p>
                    <p className="text-xs text-muted-foreground">days</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 shadow-soft">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Questions</p>
                    <p className="text-2xl font-bold">{analyticsData.totalQuestions.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">answered</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 shadow-soft">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <Clock className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Median Time</p>
                    <p className="text-2xl font-bold">{analyticsData.medianTime}s</p>
                    <p className="text-xs text-muted-foreground">per question</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 shadow-soft">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Careless Rate</p>
                    <p className="text-2xl font-bold">{analyticsData.carelessRate.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">&lt;20s misses</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 shadow-soft">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Accuracy</p>
                    <p className="text-2xl font-bold">
                      {analyticsData.accuracyByCluster.length > 0 
                        ? (analyticsData.accuracyByCluster.reduce((sum, item) => sum + item.accuracy, 0) / analyticsData.accuracyByCluster.length).toFixed(1)
                        : '0'}%
                    </p>
                    <p className="text-xs text-muted-foreground">overall</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Accuracy by Cluster */}
            <Card className="p-6 shadow-soft">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Accuracy by Skill Cluster
              </h3>
              {analyticsData.accuracyByCluster.length > 0 ? (
                <div className="space-y-4">
                  {analyticsData.accuracyByCluster
                    .sort((a, b) => b.accuracy - a.accuracy)
                    .map((item, index) => (
                      <div key={item.cluster} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                              {index + 1}
                            </Badge>
                            <span className="font-medium capitalize">{item.cluster.replace('-', ' ')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {item.count} questions
                            </span>
                            <span className="font-semibold min-w-[50px] text-right">
                              {item.accuracy.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <Progress value={item.accuracy} className="h-2" />
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No cluster data available yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Complete some study tasks to see your performance by skill area</p>
                </div>
              )}
            </Card>

            {/* Baseline vs Latest Scores */}
            {analyticsData.baselineVsLatest.length > 0 && (
              <Card className="p-6 shadow-soft">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Baseline vs Latest Scores
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analyticsData.baselineVsLatest.map((item) => (
                    <div key={item.section} className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{item.section}</h4>
                        <Badge 
                          variant={item.delta >= 0 ? "default" : "destructive"}
                          className={item.delta >= 0 ? "bg-success/10 text-success border-success/20" : ""}
                        >
                          {item.delta >= 0 ? "+" : ""}{item.delta.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Baseline ({item.baselineSource}):</span>
                          <span className="font-medium">{item.baseline.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Latest ({item.latestSource}):</span>
                          <span className="font-medium">{item.latest.toFixed(1)}%</span>
                        </div>
                        <Progress 
                          value={item.latest} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Performance Insights */}
            <Card className="p-6 shadow-soft">
              <h3 className="text-xl font-semibold mb-4">Performance Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-success">Strengths</h4>
                  <div className="space-y-2">
                    {analyticsData.carelessRate < 10 && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span>Low careless error rate ({analyticsData.carelessRate.toFixed(1)}%)</span>
                      </div>
                    )}
                    {analyticsData.studyStreak >= 3 && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span>Consistent study streak ({analyticsData.studyStreak} days)</span>
                      </div>
                    )}
                    {analyticsData.medianTime > 0 && analyticsData.medianTime <= 60 && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span>Good pacing ({analyticsData.medianTime}s avg per question)</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-warning">Areas to Improve</h4>
                  <div className="space-y-2">
                    {analyticsData.carelessRate >= 15 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="w-4 h-4 text-warning" />
                        <span>Reduce careless errors (slow down a bit)</span>
                      </div>
                    )}
                    {analyticsData.studyStreak < 2 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="w-4 h-4 text-warning" />
                        <span>Build a consistent study routine</span>
                      </div>
                    )}
                    {analyticsData.totalQuestions < 100 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="w-4 h-4 text-warning" />
                        <span>Practice more questions for better data</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;