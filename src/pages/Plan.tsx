import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { StudyPlanDay, StudyPlanTask } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Target, GraduationCap, RotateCcw, Zap, Clock, Calendar, TrendingUp, CheckCircle2, type LucideIcon } from 'lucide-react';
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { reportError } from '@/lib/errorReporter';
import { StudyPlanWizard } from '@/components/StudyPlanWizard';
import { planSummaryText, type PlanSummaryRow } from '@/lib/planSummary';

const TASK_CONFIG: Record<string, { icon: LucideIcon; gradient: string; label: string }> = {
  LEARN: { icon: GraduationCap, gradient: 'from-primary to-primary/80', label: 'Lesson' },
  DRILL: { icon: Target, gradient: 'from-secondary to-cyan-500', label: 'Drill' },
  REVIEW: { icon: RotateCcw, gradient: 'from-success to-emerald-500', label: 'Review' },
  FLASH: { icon: Zap, gradient: 'from-warning to-amber-500', label: 'Flash' },
  SIM: { icon: Clock, gradient: 'from-destructive to-rose-500', label: 'Test' },
  WARMUP: { icon: Zap, gradient: 'from-warning to-amber-500', label: 'Warm-up' }
};

/** Card subtitle: question count for practice, time for lessons and tests */
function taskDetail(task: StudyPlanTask): string {
  if (task.type === 'LEARN' || task.type === 'SIM') return `~${task.estimated_mins ?? 12} min`;
  return `${task.size || 5} questions`;
}

/** Key for matching a study_task to a plan task */
function taskKey(date: string, type: string, skillId: string | null | undefined): string {
  return `${date}|${type}|${skillId ?? ''}`;
}

export default function Plan() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<StudyPlanDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [completedKeys, setCompletedKeys] = useState<Set<string>>(new Set());
  const [summary, setSummary] = useState<PlanSummaryRow | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const sixDaysFromNow = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const fetchPlans = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setPlans([]); setLoading(false); return; }

      const [plansRes, tasksRes, profileRes] = await Promise.all([
        supabase
          .from('study_plan_days')
          .select('the_date, tasks_json, generated_at, user_id')
          .eq('user_id', user.id)
          .gte('the_date', today)
          .lte('the_date', sixDaysFromNow)
          .order('the_date'),
        supabase
          .from('study_tasks')
          .select('the_date, type, skill_id, status')
          .eq('user_id', user.id)
          .gte('the_date', today)
          .lte('the_date', sixDaysFromNow)
          .in('status', ['DONE', 'COMPLETED']),
        supabase.from('profiles').select('plan_summary').eq('id', user.id).maybeSingle(),
      ]);
      setSummary((profileRes.data?.plan_summary as unknown as PlanSummaryRow | null) ?? null);

      if (plansRes.error) throw plansRes.error;

      const typedPlans: StudyPlanDay[] = (plansRes.data || []).map(day => ({
        ...day,
        tasks_json: Array.isArray(day.tasks_json) ? day.tasks_json as unknown as StudyPlanTask[] : []
      }));
      setPlans(typedPlans);

      // Build completion lookup
      const keys = new Set<string>();
      (tasksRes.data || []).forEach(t => {
        keys.add(taskKey(t.the_date, t.type, t.skill_id));
      });
      setCompletedKeys(keys);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load plan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleGeneratePlan = async () => {
    setGenerating(true);
    try {
      const { error: planError } = await supabase.functions.invoke('generate-study-plan', {
        body: { force: true }
      });
      if (planError) {
        reportError(planError instanceof Error ? planError : new Error(String(planError)), { page: 'Plan' });
        toast.error(planError.message || 'Failed to generate study plan');
      } else {
        toast.success('Your study plan is ready!');
        await fetchPlans();
      }
    } catch (err) {
      reportError(err instanceof Error ? err : new Error(String(err)), { page: 'Plan' });
      toast.error('Failed to generate study plan');
    } finally {
      setGenerating(false);
    }
  };

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
        {summary && <PlanSummaryCard summary={summary} onChangeTime={() => setWizardOpen(true)} />}
        <StudyPlanWizard open={wizardOpen} onOpenChange={setWizardOpen} onPlanGenerated={() => void fetchPlans()} />

        {/* Subject Balance Overview */}
        <SubjectBalanceCard plans={plans} />

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
              // Map tasks with their ORIGINAL index, then filter
              const tasksWithIdx = allTasks
                .map((t, originalIdx) => ({ task: t, originalIdx }))
                .filter(({ task }) => task.type !== 'SIM');
              
              if (tasksWithIdx.length === 0) return null;

              const isToday = plan.the_date === today;
              const dayDate = new Date(plan.the_date + 'T00:00:00');
              const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'long' });
              const dateFormatted = dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              
              return (
                <Card 
                  key={idx} 
                  className={`overflow-hidden transition-all ${isToday ? 'ring-2 ring-primary shadow-lg' : ''}`}
                >
                  <div className={`p-4 border-b ${isToday ? 'bg-gradient-to-r from-primary/10 to-secondary/10' : 'bg-muted/30'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold">{dayName}</h2>
                          {isToday && <Badge className="bg-primary">Today</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{dateFormatted}</p>
                      </div>
                      <Badge variant="outline" className="text-sm">
                        {tasksWithIdx.length} task{tasksWithIdx.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {tasksWithIdx
                        .sort((a, b) => (a.task.sequence ?? 0) - (b.task.sequence ?? 0))
                        .map(({ task, originalIdx }) => {
                          const config = TASK_CONFIG[task.type] || TASK_CONFIG.DRILL;
                          const Icon = config.icon;
                          const isDone = completedKeys.has(taskKey(plan.the_date, task.type, task.skill_id));
                          
                          return (
                            <Link
                              key={originalIdx}
                              to={`/task/${plan.the_date}/${originalIdx}`}
                              className="block group"
                            >
                              <Card
                                className={`
                                  relative overflow-hidden p-4 text-white transition-all duration-300
                                  bg-gradient-to-br ${config.gradient}
                                  hover:scale-105 hover:shadow-lg border-0
                                  ${isDone ? 'opacity-70' : ''}
                                `}
                              >
                                {isDone && (
                                  <div className="absolute top-2 right-2">
                                    <CheckCircle2 className="h-5 w-5 text-white drop-shadow" />
                                  </div>
                                )}
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 text-xs">
                                    {isDone ? '✓ Done' : config.label}
                                  </Badge>
                                </div>
                                
                                <h3 className="text-sm font-semibold mb-1 line-clamp-2">
                                  {task.title || `${config.label} ${originalIdx + 1}`}
                                </h3>
                                
                                <p className="text-white/80 text-xs">
                                  {taskDetail(task)}
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

/** Subject balance overview extracted as a component */
function SubjectBalanceCard({ plans }: { plans: StudyPlanDay[] }) {
  if (plans.length === 0) return null;

  const subjectCounts: Record<string, number> = { Math: 0, English: 0, Reading: 0, Science: 0 };
  plans.forEach(plan => {
    (plan.tasks_json || []).forEach((task: StudyPlanTask) => {
      if (task.type === 'LEARN' || task.type === 'DRILL') {
        const subject = task.title?.split(':')[0]?.trim() || 'Other';
        if (subjectCounts[subject] !== undefined) subjectCounts[subject]++;
      }
    });
  });
  const total = Object.values(subjectCounts).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const colors: Record<string, string> = {
    Math: 'bg-primary', English: 'bg-success', Reading: 'bg-secondary', Science: 'bg-accent'
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Subject Balance Overview
        </CardTitle>
        <CardDescription>Distribution of learning tasks across all 4 ACT subjects</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.entries(subjectCounts).map(([subject, count]) => {
            const percentage = (count / total) * 100;
            return (
              <div key={subject}>
                <div className="flex items-center justify-between mb-1 text-sm">
                  <span className="font-medium">{subject}</span>
                  <span className="text-muted-foreground">
                    {count} task{count !== 1 ? 's' : ''} ({percentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${colors[subject]} transition-all`} style={{ width: `${percentage}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function PlanSummaryCard({ summary, onChangeTime }: { summary: PlanSummaryRow; onChangeTime: () => void }) {
  const text = planSummaryText(summary);
  return (
    <Card className={`mb-6 ${text.kind === 'short' ? 'border-warning' : ''}`}>
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <p className="font-medium">{text.headline}</p>
          {text.detail && <p className="text-sm text-muted-foreground mt-1">{text.detail}</p>}
        </div>
        {text.kind !== 'fits' && (
          <Button variant="outline" size="sm" onClick={onChangeTime} className="shrink-0">
            {text.kind === 'no-date' ? 'Set test date' : 'Change daily time'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
