import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Target, GraduationCap, RotateCcw, Zap, Clock, Play, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StudyTask {
  id: string;
  type: 'LEARN' | 'DRILL' | 'REVIEW' | 'SIM' | 'FLASH';
  skill_id: string | null;
  size: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  accuracy: number | null;
  median_time_ms: number | null;
  reward_cents: number;
  the_date: string;
  skills?: {
    name: string;
    subject: string;
  } | null;
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
  const navigate = useNavigate();

  useEffect(() => {
    loadTodaysTasks();
  }, []);

  const loadTodaysTasks = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('study_tasks')
        .select('*, skills(name, subject)')
        .eq('user_id', user.id)
        .eq('the_date', today)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTasks((data || []) as StudyTask[]);
    } catch (error) {
      console.error('Error loading tasks:', error);
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
        description: 'Your personalized plan for today is ready!',
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

  const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
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
            Generate your personalized study plan to get started
          </p>
          <Button 
            onClick={generatePlan} 
            disabled={generating}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            {generating ? 'Generating...' : 'Generate Today\'s Plan'}
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Today's Study Plan</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {completedCount} of {totalCount} tasks completed
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {tasks.map((task, idx) => {
          const config = TASK_CONFIG[task.type];
          if (!config) return null;
          
          const Icon = config.icon;
          const isCompleted = task.status === 'COMPLETED';
          
          return (
            <Link 
              key={task.id} 
              to={`/task/${task.the_date}/${idx}`}
              className="block"
            >
              <div
                className={`
                  relative overflow-hidden rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all
                  ${isCompleted ? 'opacity-60' : ''}
                  bg-gradient-to-br ${config.gradient}
                `}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                    <Icon className="h-6 w-6" />
                  </div>
                  <Badge className="bg-white/20 backdrop-blur-sm text-white border-0">
                    {config.label}
                  </Badge>
                </div>
                
                <h3 className="text-xl font-bold mb-2">
                  {config.description}
                </h3>
                <div className="space-y-1 mb-4">
                  {task.skills && (
                    <p className="text-white/90 text-sm font-medium">
                      {task.skills.subject} • {task.skills.name}
                    </p>
                  )}
                  <p className="text-white/80 text-sm">
                    {task.size} questions {isCompleted ? '• Completed ✓' : ''}
                  </p>
                </div>
                
                {!isCompleted && (
                  <Button 
                    className="w-full bg-white text-gray-900 hover:bg-white/90 font-medium"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/task/${task.the_date}/${idx}`);
                    }}
                  >
                    Start Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="flex gap-3">
        <Link to="/plan" className="flex-1">
          <Button variant="outline" className="w-full">
            View Full Plan
          </Button>
        </Link>
      </div>
    </div>
  );
}
