import { useState, useEffect } from 'react';
import { Calendar, Clock, Target, Brain } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface TestWeekSchedule {
  daysLeft: number;
  testDate: string;
  schedule: Array<{
    day: number;
    label: string;
    activity: string;
    icon: React.ReactNode;
    isToday?: boolean;
  }>;
}

export const TestWeekBanner = () => {
  const [schedule, setSchedule] = useState<TestWeekSchedule | null>(null);

  useEffect(() => {
    const fetchTestWeekSchedule = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('test_date')
        .eq('id', user.id)
        .single();

      if (!profile?.test_date) return;

      const testDate = new Date(profile.test_date + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const timeDiff = testDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (daysLeft > 7 || daysLeft < 0) return;

      const scheduleItems = [
        {
          day: 7,
          label: 'T-7',
          activity: 'English SIM (75 questions)',
          icon: <Target className="w-4 h-4" />,
          isToday: daysLeft === 7
        },
        {
          day: 5,
          label: 'T-5',
          activity: 'English SIM (75 questions)',
          icon: <Target className="w-4 h-4" />,
          isToday: daysLeft === 5
        },
        {
          day: 3,
          label: 'T-3',
          activity: 'English SIM (75 questions)',
          icon: <Target className="w-4 h-4" />,
          isToday: daysLeft === 3
        },
        {
          day: 2,
          label: 'T-2',
          activity: 'Review Only (20 mins)',
          icon: <Clock className="w-4 h-4" />,
          isToday: daysLeft === 2
        },
        {
          day: 1,
          label: 'T-1',
          activity: 'Warmup (15 mins)',
          icon: <Brain className="w-4 h-4" />,
          isToday: daysLeft === 1
        }
      ];

      setSchedule({
        daysLeft,
        testDate: testDate.toLocaleDateString(),
        schedule: scheduleItems
      });
    };

    fetchTestWeekSchedule();
  }, []);

  if (!schedule) return null;

  return (
    <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-primary">
            Test Week Schedule
          </h2>
          <Badge variant="outline">
            {schedule.daysLeft} {schedule.daysLeft === 1 ? 'day' : 'days'} until test
          </Badge>
        </div>
        
        <div className="text-sm text-muted-foreground mb-4">
          Test Date: {schedule.testDate}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {schedule.schedule.map((item) => (
            <div
              key={item.day}
              className={`p-3 rounded-lg border transition-all ${
                item.isToday
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border bg-card/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {item.icon}
                <span className={`font-medium text-sm ${
                  item.isToday ? 'text-primary' : 'text-foreground'
                }`}>
                  {item.label}
                </span>
                {item.isToday && (
                  <Badge variant="default" className="text-xs">
                    Today
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {item.activity}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};