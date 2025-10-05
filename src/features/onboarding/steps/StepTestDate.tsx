import { useState } from 'react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Calendar, Popover, PopoverContent, PopoverTrigger, Label } from '@/components/ui';
import { CalendarIcon } from 'lucide-react';
import { addYears, format, startOfToday } from 'date-fns';
import { cn } from '@/lib/utils';

interface StepTestDateProps {
  onNext: (values: any) => Promise<void>;
  onBack: () => void;
  onSkip?: () => void;
}

export default function StepTestDate({ onNext, onBack }: StepTestDateProps) {
  const [testDate, setTestDate] = useState<Date | null>(null);
  const today = startOfToday();
  const [calendarMonth, setCalendarMonth] = useState<Date>(today);

  const canProceed = testDate !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>When is your ACT test?</CardTitle>
        <CardDescription>
          Select your upcoming ACT test date to help us create your personalized study plan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Test Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !testDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {testDate ? format(testDate, 'PPP') : 'Select test date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={testDate || undefined}
                onSelect={(d) => {
                  if (!d) return;
                  setTestDate(d);
                  setCalendarMonth(d);
                }}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                captionLayout="dropdown-buttons"
                fromDate={today}
                toDate={addYears(today, 2)}
                showOutsideDays
                fixedWeeks
                disabled={{ before: today }}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button
            onClick={() => onNext({ testDate })}
            disabled={!canProceed}
            className="flex-1"
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
