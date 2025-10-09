import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Target, BookOpen, Brain, Zap, CheckCircle, Play } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StudyTask {
  id: string;
  type: 'LEARN' | 'DRILL' | 'REVIEW' | 'SIM';
  skill_id: string | null;
  size: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  accuracy: number | null;
  median_time_ms: number | null;
  reward_cents: number;
  the_date: string;
}

const TASK_CONFIG = {
  LEARN: {
    icon: BookOpen,
    label: 'Learn',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: 'Study new concepts'
  },
  DRILL: {
    icon: Target,
    label: 'Practice',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    description: 'Timed practice'
  },
  REVIEW: {
    icon: Brain,
    label: 'Review',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    description: 'Spaced repetition'
  },
  SIM: {
    icon: Zap,
    label: 'Simulation',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    description: 'Full section test'
  }
};

export function StudyPlanWidget() {
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
        .select('*')
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
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Study Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Study Plan
          </CardTitle>
          <CardDescription>
            Generate your personalized plan based on your goals and progress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-6">
            <Play className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground mb-4">
              No study plan for today yet. Generate one to get started!
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
          <div className="border-t pt-4">
            <Link to="/plan">
              <Button variant="outline" className="w-full">
                View Full Study Plan
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Today's Study Plan
        </CardTitle>
        <CardDescription>
          {completedCount} of {totalCount} tasks completed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {Math.round(progress)}% complete
          </p>
        </div>

        {/* Task List */}
        <div className="space-y-2">
          {tasks.map((task, idx) => {
            const config = TASK_CONFIG[task.type];
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
                    p-3 rounded-lg border transition-all cursor-pointer
                    ${isCompleted ? 'opacity-60 bg-muted' : 'hover:border-primary hover:shadow-sm'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded ${config.bgColor}`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {config.label}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {task.size} questions
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {config.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {task.reward_cents > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {task.reward_cents}¢
                        </span>
                      )}
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-muted" />
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Link to="/plan" className="flex-1">
            <Button variant="outline" className="w-full" size="sm">
              View Full Plan
            </Button>
          </Link>
          {completedCount < totalCount && (
            <Button 
              size="sm"
              onClick={() => {
                const nextTask = tasks.findIndex(t => t.status === 'PENDING');
                if (nextTask !== -1) {
                  navigate(`/task/${tasks[nextTask].the_date}/${nextTask}`);
                }
              }}
              className="flex-1 gap-2"
            >
              <Play className="h-4 w-4" />
              Continue Studying
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
