import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Target, GraduationCap, RotateCcw, Zap, Clock, Calendar, TrendingUp, type LucideIcon } from 'lucide-react';
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuthUser } from '@/hooks/queries/useAuth';
import { useRegenerateStudyPlan, useStudyPlanRange, type NormalizedStudyPlanTask } from '@/features/study-plan/hooks';

const TASK_CONFIG: Record<string, { icon: LucideIcon; gradient: string; label: string }> = {
  LEARN: { icon: GraduationCap, gradient: 'from-primary to-primary/80', label: 'Lesson' },
  DRILL: { icon: Target, gradient: 'from-secondary to-cyan-500', label: 'Drill' },
  REVIEW: { icon: RotateCcw, gradient: 'from-success to-emerald-500', label: 'Review' },
  FLASH: { icon: Zap, gradient: 'from-warning to-amber-500', label: 'Flash' },
  SIM: { icon: Clock, gradient: 'from-destructive to-rose-500', label: 'Test' }
};

export default function Plan() {
  const navigate = useNavigate();
  const { data: user, isLoading: userLoading } = useAuthUser();

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const sevenDaysFromNow = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  }, []);

  const {
    data: plans = [],
    isLoading: planLoading,
    isError,
    error,
  } = useStudyPlanRange({
    userId: user?.id,
    startDate: today,
    endDate: sevenDaysFromNow,
  });

  const { mutateAsync: regeneratePlan, isPending: generating } = useRegenerateStudyPlan();

  const loading = userLoading || planLoading;

  const handleGeneratePlan = async () => {
    try {
      await regeneratePlan({ force: true });
      toast.success('Your study plan is ready!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate study plan';
      console.error('Error generating plan:', err);
      toast.error(message);
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
  
  if (isError) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load plan';
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-5xl mx-auto">
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <Card className="p-8 text-center">
            <p className="text-destructive">Error: {errorMessage}</p>
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
        {/* Subject Balance Overview */}
        {plans.length > 0 && (() => {
          // Calculate subject distribution
          const subjectCounts: Record<string, number> = {
            Math: 0,
            English: 0,
            Reading: 0,
            Science: 0
          };
          
          plans.forEach(plan => {
            plan.tasks.forEach((task: NormalizedStudyPlanTask) => {
              if (task.type === 'LEARN' || task.type === 'DRILL') {
                // Extract subject from title or use type
                const subject = task.subject ?? task.title?.split(':')[0]?.trim() ?? 'Other';
                if (subjectCounts[subject] !== undefined) {
                  subjectCounts[subject]++;
                }
              }
            });
          });
          
          const total = Object.values(subjectCounts).reduce((a, b) => a + b, 0);
          
          if (total > 0) {
            return (
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
                    {Object.entries(subjectCounts).map(([subject, count]) => {
                      const percentage = total > 0 ? (count / total) * 100 : 0;
                      const colors: Record<string, string> = {
                        Math: 'bg-blue-500',
                        English: 'bg-green-500',
                        Reading: 'bg-orange-500',
                        Science: 'bg-purple-500'
                      };
                      
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
                              className={`h-full ${colors[subject]} transition-all`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          }
          return null;
        })()}
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
              const allTasks = plan.tasks ?? [];
              const tasks = allTasks.filter(t => t.type !== 'SIM');
              
              if (tasks.length === 0) return null;

              const isToday = plan.date === today;
              const dayDate = new Date(`${plan.date}T00:00:00`);
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
                      {tasks.sort((a, b) => a.sequence - b.sequence).map((task: NormalizedStudyPlanTask, taskIdx: number) => {
                        const config = TASK_CONFIG[task.type] || TASK_CONFIG.DRILL;
                        const Icon = config.icon;
                        
                        return (
                          <Link
                            key={taskIdx}
                            to={`/task/${plan.date}/${taskIdx}`}
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
