import { Target, TrendingUp, AlertCircle, Clock, CheckCircle, Brain, Play } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useProgress } from '@/hooks/useProgress';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DiagnosticResults, StudyTask } from '@/types';

interface DashboardProps {
  onStartDay: (day: number) => void;
  onViewReview: () => void;
  onStudyNow?: () => void;
}

export const Dashboard = ({ onStartDay, onViewReview, onStudyNow }: DashboardProps) => {
  const { progress } = useProgress();
  const navigate = useNavigate();
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResults | null>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [todaysTasks, setTodaysTasks] = useState<StudyTask[]>([]);

  useEffect(() => {
    const results = localStorage.getItem('diagnostic-results');
    if (results) {
      setDiagnosticResults(JSON.parse(results));
    }
    fetchDaysLeft();
    fetchTodaysTasks();
  }, []);
  
  const fetchDaysLeft = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('days-left');
      if (error) {
        console.error('Error fetching days left:', error);
        setDaysLeft(5); // fallback
        return;
      }
      if (data && typeof data.days_left === 'number') {
        setDaysLeft(data.days_left);
      } else {
        setDaysLeft(null);
      }
    } catch (error) {
      console.error('Error fetching days left:', error);
      setDaysLeft(5); // fallback
    }
  };

  const fetchTodaysTasks = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('study_tasks')
        .select('*')
        .eq('the_date', today)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: true });
      
      if (!error && data) {
        setTodaysTasks(data);
      }
    } catch (error) {
      console.error('Error fetching today\'s tasks:', error);
    }
  };

  const daysUntilTest = daysLeft ?? 5;
  const topWeakAreas = progress.weakAreas
    .sort((a, b) => b.errorCount - a.errorCount)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          ACT Prep Dashboard
        </h1>
        <p className="text-muted-foreground">
          {daysUntilTest > 0 ? `${daysUntilTest} days until test` : daysUntilTest === 0 ? 'Test Day!' : 'Test date passed'} • Intensive prep mode
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
              {todaysTasks.slice(0, 3).map((task, index) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      task.type === 'REVIEW' ? 'bg-primary' : 
                      task.type === 'DRILL' ? 'bg-secondary' : 'bg-accent'
                    }`} />
                    <span className="font-medium capitalize">{task.type.toLowerCase()}</span>
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
              {topWeakAreas.map((area, index) => (
                <div key={`${area.subject}-${area.topic}`} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                      area.subject === 'math' ? 'bg-secondary text-secondary-foreground' : 'bg-accent text-accent-foreground'
                    }`}>
                      {area.subject === 'math' ? 'M' : 'E'}
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
            <Button 
              variant="drill" 
              className="w-full"
              onClick={() => {
                console.log("Math drill button clicked from Dashboard");
                // Direct to Day 9 where new drills are available
                onStartDay(9);
              }}
            >
              🔢 Start Math Drill (60s)
            </Button>
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
              <Button 
                variant="success" 
                className="w-full"
                onClick={() => {
                  console.log("Grammar drill button clicked from Dashboard");
                  // Direct to Day 9 where new drills are available
                  onStartDay(9);
                }}
              >
                ✏️ Start Grammar Drill (90s)
              </Button>
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