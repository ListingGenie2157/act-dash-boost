import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as DayPicker } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { addYears, format, startOfToday } from 'date-fns';
import { cn } from '@/lib/utils';

type Props = {
  value: Date | null;
  onChange: (d: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
};

export function CalendarField({
  value,
  onChange,
  minDate = startOfToday(),
  maxDate = addYears(startOfToday(), 2),
  placeholder = 'Select date'
}: Props) {
  const [calendarMonth, setCalendarMonth] = React.useState<Date>(value || startOfToday());

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, 'PPP') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <DayPicker
          mode="single"
          selected={value || undefined}
          onSelect={(d) => {
            if (!d) return;
            onChange(d);
            setCalendarMonth(d);
          }}
          month={calendarMonth}
          onMonthChange={setCalendarMonth}
          captionLayout="dropdown-buttons"
          fromDate={minDate}
          toDate={maxDate}
          showOutsideDays
          fixedWeeks
          disabled={{ before: minDate }}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}