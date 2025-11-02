import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, GraduationCap, RotateCcw, Zap, Clock, Play, ArrowRight, BookOpen, Timer, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StudyTask {
  type: 'LEARN' | 'DRILL' | 'REVIEW' | 'SIM' | 'FLASH';
  skill_id: string | null;
  size: number;
  skill_name?: string;
  subject?: string;
}

const TASK_CONFIG = {
  LEARN: {
    icon: GraduationCap,
    label: 'Lesson',
    gradient: 'from-primary to-primary/80',
    description: 'Learn New Concepts'
  },
  DRILL: {
    icon: Target,
    label: 'Timed Drill',
    gradient: 'from-secondary to-cyan-500',
    description: 'Timed Practice'
  },
  REVIEW: {
    icon: RotateCcw,
    label: 'Review',
    gradient: 'from-success to-emerald-500',
    description: 'Spaced Repetition'
  },
  FLASH: {
    icon: Zap,
    label: 'Flash Cards',
    gradient: 'from-warning to-amber-500',
    description: 'Quick Practice'
  },
  SIM: {
    icon: Clock,
    label: 'Full Test',
    gradient: 'from-destructive to-rose-500',
    description: 'Full Section Simulation'
  }
};

interface StudyPlanWidgetProps {
  hasStudyPlan?: boolean;
}

export function StudyPlanWidget({ hasStudyPlan = true }: StudyPlanWidgetProps) {
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTodaysTasks();
  }, []);

  const loadTodaysTasks = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      // Load directly from study_tasks table (fixes desync issue)
      const { data: tasksData, error: tasksError } = await supabase
        .from('study_tasks')
        .select('*, skills(id, name, subject)')
        .eq('user_id', user.id)
        .eq('the_date', today)
        .order('created_at');

      if (tasksError) {
        if (tasksError.code !== 'PGRST116') { // Not a "no rows" error
          throw tasksError;
        }
        setTasks([]);
        return;
      }

      if (!tasksData || tasksData.length === 0) {
        setTasks([]);
        return;
      }

      // Map to StudyTask format
      const mappedTasks = tasksData.map((task: any) => ({
        type: task.type,
        skill_id: task.skill_id,
        size: task.size,
        skill_name: task.skills?.name,
        subject: task.skills?.subject,
      }));

      setTasks(mappedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    try {
      setGenerating(true);
      const { error } = await supabase.functions.invoke('generate-study-plan', {
        method: 'POST'
      });

      if (error) throw error;

      toast({
        title: 'Study Plan Generated',
        description: 'Your personalized 7-day plan is ready!',
      });

      await loadTodaysTasks();
    } catch (error) {
      console.error('Error generating plan:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate study plan. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  const totalCount = tasks.length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-3">
          <div className="h-32 bg-muted rounded-xl" />
          <div className="h-32 bg-muted rounded-xl" />
          <div className="h-32 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (tasks.length === 0 && hasStudyPlan) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12 bg-card border rounded-xl">
          <Play className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <h3 className="font-semibold mb-2">No Study Plan Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Generate your personalized 7-day study plan
          </p>
          <Button 
            onClick={generatePlan} 
            disabled={generating}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            {generating ? 'Generating...' : 'Generate 7-Day Plan'}
          </Button>
        </div>
      </div>
    );
  }
  
  // Don't render anything if user doesn't have study plan mode
  if (!hasStudyPlan) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Today's Study Plan</h2>
            <p className="text-muted-foreground text-sm mt-1">
              {totalCount} tasks scheduled for today
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task, idx) => {
            const config = TASK_CONFIG[task.type];
            if (!config) return null;
            
            const Icon = config.icon;
            const today = new Date().toISOString().split('T')[0];
            
            return (
              <Link 
                key={idx} 
                to={`/task/${today}/${idx}`}
                className="block group"
              >
                <Card
                  className={`
                    relative overflow-hidden p-5 text-white transition-all duration-300
                    bg-gradient-to-br ${config.gradient}
                    hover:scale-105 hover:shadow-xl border-0
                  `}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2.5">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 text-xs">
                      {config.label}
                    </Badge>
                  </div>
                  
                  <h3 className="text-base font-bold mb-2 line-clamp-1">
                    {config.description}
                  </h3>
                  <div className="space-y-0.5 mb-3">
                    {task.skill_name && task.subject && (
                      <p className="text-white/90 text-xs font-medium line-clamp-1">
                        {task.subject} • {task.skill_name}
                      </p>
                    )}
                    <p className="text-white/80 text-xs">
                      {task.size} questions
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-white/90 text-xs font-medium group-hover:text-white transition-colors">
                    <span>Start Now</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Link to="/plan" className="flex-1">
            <Button variant="outline" className="w-full">
              View 7-Day Plan
            </Button>
          </Link>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={generatePlan}
            disabled={generating}
          >
            {generating ? 'Regenerating...' : 'Regenerate Plan'}
          </Button>
        </div>
      </div>

      {/* Quick Access Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Quick Access</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/lessons" className="block group">
            <Card className="p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 hover:border-primary">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-base mb-1">Lessons Library</p>
                  <p className="text-sm text-muted-foreground">Browse all topics</p>
                </div>
              </div>
            </Card>
          </Link>
          
          <Link to="/drills" className="block group">
            <Card className="p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 hover:border-primary">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="p-3 rounded-xl bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                  <Timer className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="font-semibold text-base mb-1">Timed Drills</p>
                  <p className="text-sm text-muted-foreground">Practice under pressure</p>
                </div>
              </div>
            </Card>
          </Link>
          
          <Link to="/simulation" className="block group">
            <Card className="p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 hover:border-primary">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="p-3 rounded-xl bg-destructive/10 group-hover:bg-destructive/20 transition-colors">
                  <TestTube className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="font-semibold text-base mb-1">Full Simulations</p>
                  <p className="text-sm text-muted-foreground">Take practice tests</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
