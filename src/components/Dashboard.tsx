import { Target, TrendingUp, Clock, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWeakAreasDb, transformToLegacyFormat } from '@/hooks/useWeakAreasDb';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StudyTask } from '@/types';
import { MasteryDashboard } from './MasteryDashboard';
import { WeakAreasCard } from './WeakAreasCard';

interface DashboardProps {
  onViewReview: () => void;
}

export const Dashboard = ({ onViewReview }: DashboardProps) => {
  const { data: weakAreasDb = [] } = useWeakAreasDb(3);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [todaysTasks, setTodaysTasks] = useState<StudyTask[]>([]);

  useEffect(() => {
    const fetchDaysLeft = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('days-left');
        if (error) {
          console.error('Error fetching days left:', error);
          setDaysLeft(null);
          return;
        }
        if (data && typeof (data as { days_left?: number }).days_left === 'number') {
          setDaysLeft((data as { days_left: number }).days_left);
        } else {
          setDaysLeft(null);
        }
      } catch (error) {
        console.error('Error fetching days left:', error);
        setDaysLeft(null);
      }
    };

    const fetchTodaysTasks = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // 1) Try study_tasks first (primary source)
        const { data: tasks, error: tasksError } = await supabase
          .from('study_tasks')
          .select(
            'id, user_id, type, skill_id, the_date, status, size, accuracy, median_time_ms, reward_cents, created_at, skills(name, subject)'
          )
          .eq('the_date', today)
          .eq('user_id', user.id)
          .eq('status', 'PENDING')
          .order('created_at', { ascending: true });

        if (!tasksError && tasks && tasks.length > 0) {
          setTodaysTasks(tasks as StudyTask[]);
          return;
        }

        // 2) Fallback to study_plan_days JSON (for newly generated plans)
        const { data: plan, error: planError } = await supabase
          .from('study_plan_days')
          .select('tasks_json')
          .eq('user_id', user.id)
          .eq('the_date', today)
          .single();

        if (!planError && plan?.tasks_json) {
          const arr = Array.isArray(plan.tasks_json) ? plan.tasks_json : [];
          const normalized = arr.map((t: any, idx: number) => ({
            id: `json-${idx}`,
            type: t.type,
            skill_id: t.skill_id ?? null,
            the_date: today,
            status: 'PENDING',
            size: t.size ?? 5,
            reward_cents: t.estimated_mins ? t.estimated_mins * 1 : 0,
            skills: null,
            user_id: user.id,
            accuracy: null,
            median_time_ms: null,
            created_at: null,
          }));
          setTodaysTasks(normalized);
          return;
        }

        setTodaysTasks([]);
      } catch (error) {
        console.error("Error fetching today's tasks:", error);
        setTodaysTasks([]);
      }
    };

    void fetchDaysLeft();
    void fetchTodaysTasks();
  }, []);

  const topWeakAreas = transformToLegacyFormat(weakAreasDb);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          ACT Prep Dashboard
        </h1>
        <p className="text-muted-foreground">
          {daysLeft === null 
            ? 'Set your test date to see countdown' 
            : daysLeft > 0 
              ? `${daysLeft} days until test` 
              : daysLeft === 0 
                ? 'Test Day!' 
                : 'Test date passed'} • {(daysLeft ?? 0) > 30 ? 'Regular prep mode' : 'Intensive prep mode'}
        </p>
      </div>

      {/* Today's Tasks */}
      {todaysTasks.length > 0 && (
        <Card className="p-6 shadow-medium border-primary/20">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Play className="w-5 h-5 text-primary" />
                Today's Study Plan
              </h3>
              <Badge variant="outline">
                {todaysTasks.length} task{todaysTasks.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="space-y-2">
              {todaysTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      task.type === 'REVIEW' ? 'bg-primary' :
                      task.type === 'DRILL' ? 'bg-secondary' : 'bg-accent'
                    }`} />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{task.type.toLowerCase()}</span>
                        {task.skills && (
                          <Badge variant="secondary" className="text-xs">
                            {task.skills.subject}
                          </Badge>
                        )}
                      </div>
                      {task.skills && (
                        <span className="text-xs text-muted-foreground">
                          {task.skills.name}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {task.size} question{task.size !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {task.reward_cents || 0}¢
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Weak Areas */}
      {topWeakAreas.length > 0 && (
        <Card className="p-6 shadow-soft">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Areas to Focus On
              </h3>
              <Button variant="outline" size="sm" onClick={onViewReview}>
                Review Wrong Answers
              </Button>
            </div>
            <div className="space-y-3">
              {topWeakAreas.map((area) => (
                <div key={`${area.subject}-${area.topic}`} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                      area.subject === 'Math' ? 'bg-secondary text-secondary-foreground' : 'bg-accent text-accent-foreground'
                    }`}>
                      {area.subject === 'Math' ? 'M' : 'E'}
                    </div>
                    <span className="font-medium capitalize">{area.topic}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {area.errorCount} error{area.errorCount !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Mastery & Weak Areas Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MasteryDashboard />
        <WeakAreasCard limit={3} />
      </div>

      {/* Hidden 5-Day Template - Only show after test_date exists */}
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 shadow-soft">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-secondary" />
              <h3 className="font-semibold">Quick Drills</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Practice with timed rapid-fire questions
            </p>
            <Link to="/drills">
              <Button variant="drill" className="w-full">
                🔢 Start Math Drill (60s)
              </Button>
            </Link>
          </div>
        </Card>

        <Card className="p-6 shadow-soft">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" />
              <h3 className="font-semibold">Grammar Drill</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Quick grammar rules practice
            </p>
            <div className="space-y-2">
              <Link to="/drills">
                <Button variant="success" className="w-full">
                  ✏️ Start Grammar Drill (90s)
                </Button>
              </Link>
              <Link to="/sim-english">
                <Button variant="outline" size="sm" className="w-full">
                  Start English SIM
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};