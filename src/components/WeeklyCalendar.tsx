import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { format, isToday, differenceInDays } from 'date-fns';

interface StudyTask {
  type: string;
  title?: string;
  skillId?: string;
  skill_id?: string; // Database field name
  skill_code?: string; // Legacy field name
  estimatedMins?: number;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

interface WeekDay {
  date: string;
  dateObj: Date;
  tasks: StudyTask[];
  isToday: boolean;
}

interface WeeklyCalendarProps {
  userId: string;
  testDate?: string | null;
}

export function WeeklyCalendar({ userId, testDate }: WeeklyCalendarProps) {
  const [weekData, setWeekData] = useState<WeekDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysUntilTest, setDaysUntilTest] = useState<number | null>(null);

  useEffect(() => {
    const fetchWeeklyPlan = async () => {
      try {
        const today = new Date();
        const dates: string[] = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          dates.push(date.toISOString().split('T')[0]);
        }

        // Fetch study tasks
        const { data: tasks, error: tasksError } = await supabase
          .from('study_tasks')
          .select('the_date, type, skill_id, size, status, skills(name, subject)')
          .eq('user_id', userId)
          .in('the_date', dates)
          .order('the_date, created_at');

        if (tasksError) throw tasksError;

        // Build skill name map
        const skillNameMap = new Map<string, string>();
        tasks?.forEach(task => {
          if (task.skill_id && task.skills) {
            skillNameMap.set(task.skill_id, (task.skills as any).name);
          }
        });

        // Group tasks by date
        const tasksByDate: Record<string, Array<{type: string; skill_id: string | null; status: string | null; skills: any}>> = {};
        tasks?.forEach(task => {
          if (!tasksByDate[task.the_date]) {
            tasksByDate[task.the_date] = [];
          }
          tasksByDate[task.the_date].push(task);
        });

        // Build week data
        const week: WeekDay[] = dates.map(dateStr => {
          const dateTasks = tasksByDate[dateStr] || [];
          const dateObj = new Date(dateStr);
          
          const enhancedTasks: StudyTask[] = dateTasks.map(task => {
            const skillName = task.skill_id ? skillNameMap.get(task.skill_id) : null;
            let title = `${task.type} Task`;
            
            if (skillName) {
              switch(task.type) {
                case 'LEARN': title = `Learn: ${skillName}`; break;
                case 'DRILL': title = `Practice: ${skillName}`; break;
                case 'REVIEW': title = `Review: ${skillName}`; break;
                default: title = skillName;
              }
            }

            return {
              type: task.type,
              title,
              skill_id: task.skill_id || undefined,
              status: (task.status || 'PENDING') as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
            };
          });

          return {
            date: dateStr,
            dateObj,
            tasks: enhancedTasks,
            isToday: isToday(dateObj),
          };
        });

        setWeekData(week);

        // Calculate days until test
        if (testDate) {
          const testDateObj = new Date(testDate);
          const days = differenceInDays(testDateObj, today);
          setDaysUntilTest(days);
        }
      } catch (err) {
        console.error('Error fetching weekly plan:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyPlan();
  }, [userId, testDate]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Weekly Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading your plan...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Your Weekly Plan</span>
          {daysUntilTest !== null && (
            <Badge variant={daysUntilTest < 7 ? 'destructive' : daysUntilTest < 30 ? 'secondary' : 'default'}>
              <Clock className="mr-1 h-3 w-3" />
              {daysUntilTest} days until test
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {weekData.map((day) => (
            <Card
              key={day.date} 
              className={`${day.isToday ? 'border-primary shadow-md' : ''}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      {format(day.dateObj, 'EEE')}
                    </div>
                    <div className="text-2xl font-bold">
                      {format(day.dateObj, 'd')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(day.dateObj, 'MMM')}
                    </div>
                  </div>
                  {day.isToday && (
                    <Badge variant="default" className="text-xs">Today</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {day.tasks.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    No tasks scheduled
                  </div>
                ) : (
                  day.tasks
                    .filter(task => task.type !== 'SIM')
                    .map((task, taskIdx) => (
                      <Link
                        key={taskIdx}
                        to={`/task/${day.date}/${taskIdx}`}
                        className="w-full text-left p-2 rounded-md hover:bg-accent transition-colors flex items-start gap-2 cursor-pointer no-underline"
                      >
                        {task.status === 'COMPLETED' ? (
                          <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                        ) : task.status === 'IN_PROGRESS' ? (
                          <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                        ) : (
                          <BookOpen className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {task.title || `${task.type} Task`}
                          </div>
                          {task.estimatedMins && (
                            <div className="text-xs text-muted-foreground">
                              {task.estimatedMins} min
                            </div>
                          )}
                        </div>
                      </Link>
                    ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {daysUntilTest !== null && daysUntilTest <= 7 && (
          <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <div className="font-semibold">Test Week Alert</div>
            </div>
            <p className="mt-2 text-sm">
              Your test is in {daysUntilTest} day{daysUntilTest !== 1 ? 's' : ''}! Focus on review and full practice sections.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
