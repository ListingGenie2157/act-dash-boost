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
  placeholder?:
