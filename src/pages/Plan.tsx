import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { StudyPlanDay, StudyPlanTask } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Target, GraduationCap, RotateCcw, Zap, Clock, Calendar, TrendingUp, type LucideIcon } from 'lucide-react';
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { createLogger } from '@/lib/logger';

const log = createLogger('Plan');

const TASK_CONFIG: Record<string, { icon: LucideIcon; gradient: string; label: string }> = {
  LEARN: { icon: GraduationCap, gradient: 'from-primary to-primary/80', label: 'Lesson' },
  DRILL: { icon: Target, gradient: 'from-secondary to-cyan-500', label: 'Drill' },
  REVIEW: { icon: RotateCcw, gradient: 'from-success to-emerald-500', label: 'Review' },
  FLASH: { icon: Zap, gradient: 'from-warning to-amber-500', label: 'Flash' },
  SIM: { icon: Clock, gradient: 'from-destructive to-rose-500', label: 'Test' }
};

const SUBJECT_COLORS: Record<string, string> = {
  Math: 'bg-blue-500',
  English: 'bg-green-500',
  Reading: 'bg-orange-500',
  Science: 'bg-purple-500'
};

/**
 * Fetch study plans for a user within the next 7 days
 */
async function fetchStudyPlans(userId: string): Promise<StudyPlanDay[]> {
  const today = new Date().toISOString().split('T')[0];
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  log.query('study_plan_days', 'select', { userId, today, sevenDaysFromNow });

  const { data: planDays, error } = await supabase
    .from('study_plan_days')
    .select('the_date, tasks_json, generated_at, user_id')
    .eq('user_id', userId)
    .gte('the_date', today)
    .lte('the_date', sevenDaysFromNow)
    .order('the_date');

  if (error) {
    log.error('Failed to fetch study plans', error);
    throw error;
  }

  // Type cast and validate tasks_json
  return (planDays ?? []).map(day => ({
    ...day,
    tasks_json: Array.isArray(day.tasks_json) ? day.tasks_json as unknown as StudyPlanTask[] : []
  }));
}

export default function Plan() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<StudyPlanDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Extracted refetch function to avoid duplication
  const refetchPlans = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const fetchedPlans = await fetchStudyPlans(user.id);
    setPlans(fetchedPlans);
    log.info('Plans refetched', { count: fetchedPlans.length });
  }, []);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setPlans([]);
          setLoading(false);
          return;
        }
        
        const fetchedPlans = await fetchStudyPlans(user.id);
        setPlans(fetchedPlans);
        log.info('Plans loaded', { count: fetchedPlans.length });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load plan';
        log.error('Failed to load plans', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    void loadPlans();
  }, []);

  const handleGeneratePlan = useCallback(async () => {
    setGenerating(true);
    try {
      log.info('Generating study plan');
      const { error: planError } = await supabase.functions.invoke('generate-study-plan', {
        body: { force: true }
      });

      if (planError) {
        log.error('Failed to generate plan', planError);
        toast.error(planError.message || 'Failed to generate study plan');
      } else {
        toast.success('Your study plan is ready!');
        await refetchPlans();
      }
    } catch (err) {
      log.error('Error generating plan', err);
      toast.error('Failed to generate study plan');
    } finally {
      setGenerating(false);
    }
  }, [refetchPlans]);

  // Memoized subject distribution calculation
  const subjectDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      Math: 0,
      English: 0,
      Reading: 0,
      Science: 0
    };

    plans.forEach(plan => {
      (plan.tasks_json ?? []).forEach((task) => {
        if (task.type === 'LEARN' || task.type === 'DRILL') {
          const subject = task.title?.split(':')[0]?.trim() ?? 'Other';
          if (counts[subject] !== undefined) {
            counts[subject]++;
          }
        }
      });
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return { counts, total };
  }, [plans]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="animate-pulse space-y-3">
            <div className="h-32 bg-muted rounded-xl" />
            <div className="h-32 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-5xl mx-auto">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <Card className="p-8 text-center">
            <p className="text-destructive">Error: {error}</p>
          </Card>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-b">
        <div className="max-w-5xl mx-auto p-6">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Your 7-Day Study Plan</h1>
          </div>
          <p className="text-muted-foreground">
            {plans.length} days planned • Follow your personalized schedule
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        {/* Subject Balance Overview - now using memoized calculation */}
        {plans.length > 0 && subjectDistribution.total > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Subject Balance Overview
              </CardTitle>
              <CardDescription>
                Distribution of learning tasks across all 4 ACT subjects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(subjectDistribution.counts).map(([subject, count]) => {
                  const percentage = subjectDistribution.total > 0 
                    ? (count / subjectDistribution.total) * 100 
                    : 0;
                  
                  return (
                    <div key={subject}>
                      <div className="flex items-center justify-between mb-1 text-sm">
                        <span className="font-medium">{subject}</span>
                        <span className="text-muted-foreground">
                          {count} task{count !== 1 ? 's' : ''} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${SUBJECT_COLORS[subject]} transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
        {plans.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Study Plan Yet</h3>
            <p className="text-muted-foreground mb-6">
              Generate your personalized 7-day plan to get started
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleGeneratePlan} disabled={generating}>
                {generating ? 'Generating...' : 'Generate Study Plan'}
              </Button>
              <Button variant="outline" onClick={() => navigate('/')}>
                Return to Dashboard
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {plans.map((plan, idx) => {
              const allTasks: StudyPlanTask[] = plan.tasks_json ?? [];
              const tasks = allTasks.filter(t => t.type !== 'SIM');
              
              if (tasks.length === 0) return null;

              const isToday = plan.the_date === today;
              const dayDate = new Date(plan.the_date + 'T00:00:00');
              const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'long' });
              const dateFormatted = dayDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              });
              
              return (
                <Card 
                  key={idx} 
                  className={`overflow-hidden transition-all ${
                    isToday ? 'ring-2 ring-primary shadow-lg' : ''
                  }`}
                >
                  <div className={`p-4 border-b ${
                    isToday 
                      ? 'bg-gradient-to-r from-primary/10 to-secondary/10' 
                      : 'bg-muted/30'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold">{dayName}</h2>
                          {isToday && (
                            <Badge className="bg-primary">Today</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{dateFormatted}</p>
                      </div>
                      <Badge variant="outline" className="text-sm">
                        {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {tasks.sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0)).map((task: StudyPlanTask, taskIdx: number) => {
                        const config = TASK_CONFIG[task.type] || TASK_CONFIG.DRILL;
                        const Icon = config.icon;
                        
                        return (
                          <Link
                            key={taskIdx}
                            to={`/task/${plan.the_date}/${taskIdx}`}
                            className="block group"
                          >
                            <Card
                              className={`
                                relative overflow-hidden p-4 text-white transition-all duration-300
                                bg-gradient-to-br ${config.gradient}
                                hover:scale-105 hover:shadow-lg border-0
                              `}
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                                  <Icon className="h-4 w-4" />
                                </div>
                                <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 text-xs">
                                  {config.label}
                                </Badge>
                              </div>
                              
                              <h3 className="text-sm font-semibold mb-1 line-clamp-2">
                                {task.title || `${config.label} ${taskIdx + 1}`}
                              </h3>
                              
                              <p className="text-white/80 text-xs">
                                {task.size || 5} questions
                              </p>
                            </Card>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
