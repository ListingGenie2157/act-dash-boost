import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { format, isToday, differenceInDays } from 'date-fns';
import { useStudyPlanRange } from '@/features/study-plan/hooks';

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
  const baseDate = useMemo(() => new Date(), []);
  const dateStrings = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() + i);
      return date.toISOString().split('T')[0];
    });
  }, [baseDate]);

  const {
    data: planDays = [],
    isLoading: loading,
  } = useStudyPlanRange({
    userId,
    startDate: dateStrings[0],
    endDate: dateStrings[dateStrings.length - 1],
    enabled: Boolean(userId),
  });

  const weekData: WeekDay[] = useMemo(() => {
    const tasksByDate = new Map<string, StudyTask[]>();

    planDays.forEach((day) => {
      tasksByDate.set(
        day.date,
        day.tasks.map((task) => ({
          type: task.type,
          title: task.title,
          skillId: task.skillId,
          status: 'PENDING' as const,
        }))
      );
    });

    return dateStrings.map((dateStr) => {
      const dateObj = new Date(`${dateStr}T00:00:00`);
      return {
        date: dateStr,
        dateObj,
        tasks: tasksByDate.get(dateStr) ?? [],
        isToday: isToday(dateObj),
      };
    });
  }, [dateStrings, planDays]);

  const daysUntilTest = useMemo(() => {
    if (!testDate) return null;
    const diff = differenceInDays(new Date(testDate), new Date());
    return Number.isNaN(diff) ? null : diff;
  }, [testDate]);

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
