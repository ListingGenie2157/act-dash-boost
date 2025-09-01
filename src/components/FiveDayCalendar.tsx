import { Calendar, CheckCircle, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UserProgress } from '@/types';

interface FiveDayCalendarProps {
  progress: UserProgress;
  onSelectDay: (day: number) => void;
}

export const FiveDayCalendar = ({ progress, onSelectDay }: FiveDayCalendarProps) => {
  // Get next 5 days starting from tomorrow
  const getNext5Days = () => {
    const today = new Date();
    const days = [];
    
    for (let i = 1; i <= 5; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        date,
        dayNumber: i + 8, // Days 9-13 for the 5-day intensive
        dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayOfMonth: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' })
      });
    }
    
    return days;
  };

  const days = getNext5Days();

  const getDayStatus = (dayNumber: number) => {
    if (progress.completedDays.includes(dayNumber)) {
      return 'completed';
    }
    return 'available';
  };

  const getDayTitle = (dayNumber: number) => {
    const titles = {
      9: 'Percentages & Grammar',
      10: 'Algebra & Punctuation', 
      11: 'Geometry & Functions',
      12: 'Word Problems & Reading',
      13: 'Comprehensive Review'
    };
    return titles[dayNumber as keyof typeof titles] || `Day ${dayNumber}`;
  };

  return (
    <Card className="p-6 shadow-medium">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">5-Day ACT Intensive Plan</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {days.map((day) => {
            const status = getDayStatus(day.dayNumber);
            const isCompleted = status === 'completed';
            
            return (
              <Card
                key={day.dayNumber}
                className={cn(
                  "relative overflow-hidden transition-all duration-200 hover:shadow-medium cursor-pointer",
                  isCompleted 
                    ? "bg-success/5 border-success/20" 
                    : "hover:border-primary/30"
                )}
                onClick={() => onSelectDay(day.dayNumber)}
              >
                <div className="p-4 space-y-3">
                  {/* Date */}
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground font-medium">
                      {day.dayOfWeek}
                    </div>
                    <div className="text-2xl font-bold">
                      {day.dayOfMonth}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {day.month}
                    </div>
                  </div>

                  {/* Day Number */}
                  <div className="flex items-center justify-center">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      isCompleted 
                        ? "bg-success text-success-foreground" 
                        : "bg-primary text-primary-foreground"
                    )}>
                      {day.dayNumber}
                    </div>
                  </div>

                  {/* Title */}
                  <div className="text-center">
                    <h3 className="font-semibold text-sm leading-tight">
                      {getDayTitle(day.dayNumber)}
                    </h3>
                  </div>

                  {/* Status Icon */}
                  <div className="flex justify-center">
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-success" />
                    ) : (
                      <BookOpen className="w-5 h-5 text-primary" />
                    )}
                  </div>

                  {/* Action Button */}
                  <Button
                    variant={isCompleted ? "success" : "default"}
                    size="sm"
                    className="w-full text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDay(day.dayNumber);
                    }}
                  >
                    {isCompleted ? "Review" : "Start"}
                  </Button>
                </div>

                {/* Completion Badge */}
                {isCompleted && (
                  <div className="absolute top-2 right-2">
                    <div className="w-3 h-3 bg-success rounded-full border-2 border-background"></div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Test Day Reminder */}
        <div className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">ACT Test Day</h3>
              <p className="text-sm text-muted-foreground">September 6th - You've got this! 🎯</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">5</div>
              <div className="text-xs text-muted-foreground">days to go</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};