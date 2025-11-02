import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { StudyPlanDay, StudyPlanTask } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Target, GraduationCap, RotateCcw, Zap, Clock, Calendar } from 'lucide-react';

const TASK_CONFIG: Record<string, { icon: any; gradient: string; label: string }> = {
  LEARN: { icon: GraduationCap, gradient: 'from-primary to-primary/80', label: 'Lesson' },
  DRILL: { icon: Target, gradient: 'from-secondary to-cyan-500', label: 'Drill' },
  REVIEW: { icon: RotateCcw, gradient: 'from-success to-emerald-500', label: 'Review' },
  FLASH: { icon: Zap, gradient: 'from-warning to-amber-500', label: 'Flash' },
  SIM: { icon: Clock, gradient: 'from-destructive to-rose-500', label: 'Test' }
};

export default function Plan() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<StudyPlanDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setPlans([]);
          setLoading(false);
          return;
        }
        const today = new Date().toISOString().split('T')[0];
        const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];
        const { data: rawTasks, error: fetchError } = await supabase
          .from('study_tasks')
          .select('id, user_id, type, skill_id, the_date, size, status, skills(name, subject)')
          .eq('user_id', user.id)
          .gte('the_date', today)
          .lte('the_date', sevenDaysFromNow)
          .order('the_date, created_at');
        
        if (fetchError) {
          throw fetchError;
        }

        // Group tasks by date to match StudyPlanDay structure
        const groupedByDate = (rawTasks || []).reduce((acc, task) => {
          const dateKey = task.the_date;
          if (!acc[dateKey]) {
            acc[dateKey] = {
              the_date: dateKey,
              user_id: task.user_id,
              tasks_json: [],
              generated_at: new Date().toISOString()
            };
          }
          const dayPlan = acc[dateKey];
          if (dayPlan?.tasks_json) {
            dayPlan.tasks_json.push({
              type: task.type,
              skill_id: task.skill_id || undefined,
              size: task.size,
              title: task.skills ? `${task.type}: ${task.skills.name}` : `${task.type} Task`
            });
          }
          return acc;
        }, {} as Record<string, StudyPlanDay>);

        setPlans(Object.values(groupedByDate));
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load plan';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

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
        {plans.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Study Plan Yet</h3>
            <p className="text-muted-foreground mb-6">
              Generate your personalized 7-day plan to get started
            </p>
            <Button onClick={() => navigate('/')}>
              Return to Dashboard
            </Button>
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
                      {tasks.map((task: StudyPlanTask, taskIdx: number) => {
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
