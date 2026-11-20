import { useState, useEffect, useCallback } from 'react';
import { CalendarIcon, Clock, Calendar as CalendarCmp } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { reportError } from '@/lib/errorReporter';
import { localDateString } from '@/lib/localDate';

interface DaysLeftResponse {
  today: string;
  test_date: string | null;
  days_left: number | null;
}

interface CountdownHeaderProps {
  className?: string;
}

export function CountdownHeader({ className }: CountdownHeaderProps) {
  const [daysLeft, setDaysLeft] = useState<DaysLeftResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const isMobile = useIsMobile();
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchDaysLeft = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('days-left', {
        method: 'GET'
      });

      if (error) {
        reportError(error as Error, { component: 'CountdownHeader', action: 'fetchDaysLeft' });
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('test_date')
            .eq('id', user.id)
            .maybeSingle();
          
          if (profile?.test_date) {
            const today = new Date();
            const testDate = new Date(profile.test_date);
            const timeDiff = testDate.getTime() - today.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
            
            setDaysLeft({
              today: localDateString(today),
              test_date: profile.test_date,
              days_left: daysDiff
            });
            setLoading(false);
            return;
          }
        }
        
        toast({
          title: 'Error',
          description: 'Failed to fetch test countdown. Please try again.',
          variant: 'destructive'
        });
        return;
      }

      setDaysLeft(data);
    } catch (error) {
      reportError(error as Error, { component: 'CountdownHeader', action: 'fetchDaysLeft-catch' });
      toast({
        title: 'Error',
        description: 'Failed to fetch test countdown. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDaysLeft();
  }, [fetchDaysLeft]);

  const handleSetTestDate = async (date: Date) => {
    if (!date) return;

    try {
      setSaving(true);
      const testDate = format(date, 'yyyy-MM-dd');

      const { error } = await supabase.functions.invoke('set-test-date', {
        body: { testDate }
      });

      if (error) {
        reportError(error as Error, { component: 'CountdownHeader', action: 'setTestDate' });
        toast({
          title: 'Error',
          description: 'Failed to set test date. Please try again.',
          variant: 'destructive'
        });
        return;
      }

      if (daysLeft) {
        const today = new Date(daysLeft.today);
        const timeDiff = date.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        setDaysLeft({
          ...daysLeft,
          test_date: testDate,
          days_left: daysDiff
        });
      }

      setDialogOpen(false);
      setSelectedDate(undefined);
      
      toast({
        title: 'Success',
        description: `Test date set to ${format(date, 'PPP')}`,
      });

    } catch (error) {
      reportError(error as Error, { component: 'CountdownHeader', action: 'setTestDate-catch' });
      toast({
        title: 'Error',
        description: 'Failed to set test date. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)}>
        <Clock className="h-4 w-4 animate-pulse text-muted-foreground" />
      </div>
    );
  }

  if (!daysLeft?.test_date) {
    return null;
  }

  const daysLeftNum = daysLeft.days_left;
  // Parse the date-only string as a local date (new Date('yyyy-mm-dd') is UTC and shows the day before in the US)
  const testDate = new Date(`${daysLeft.test_date}T00:00:00`);
  const testPassed = daysLeftNum !== null && daysLeftNum < 0;
  
  const maxPrepDays = 90;
  const totalDays = maxPrepDays;
  const percentage = daysLeftNum !== null
    ? Math.min(100, Math.max(0, ((totalDays - daysLeftNum) / totalDays) * 100))
    : 0;
  
  const getMotivationalMessage = () => {
    if (daysLeftNum === null) return '';
    if (daysLeftNum === 0) return 'Execute.';
    if (daysLeftNum < 0) return 'Taking it again? Set your next test date.';
    if (daysLeftNum <= 7) return 'Final Week.';
    if (daysLeftNum <= 30) return 'Stay on pace.';
    return 'Time is on your side.';
  };

  const isUrgent = daysLeftNum !== null && daysLeftNum <= 7 && daysLeftNum >= 0;

  const dateDialog = (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex-shrink-0">
          <CalendarCmp className="h-4 w-4 mr-2" />
          {testPassed ? 'Set date' : format(testDate, 'MMM d')}
        </Button>
      </DialogTrigger>
      <SetTestDateDialog
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        onConfirm={handleSetTestDate}
        saving={saving}
      />
    </Dialog>
  );

  // Phones: one line, so the countdown doesn't take over the screen
  if (isMobile) {
    return (
      <div className={cn("flex items-center justify-between gap-3 min-w-0", className)}>
        <p className="text-sm font-medium truncate">
          {daysLeftNum !== null && daysLeftNum > 0 ? (
            <>
              <span className={cn("font-bold tabular-nums", isUrgent ? "text-coral" : "text-primary")}>{daysLeftNum}</span>
              <span className="text-foreground"> day{daysLeftNum === 1 ? '' : 's'} until test</span>
            </>
          ) : daysLeftNum === 0 ? (
            <span className="text-coral font-bold">Test day</span>
          ) : (
            <span className="text-muted-foreground">Test date passed</span>
          )}
        </p>
        {dateDialog}
      </div>
    );
  }

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Card className={cn(
      "border-white/[0.06]",
      isUrgent && "border-l-4 border-l-coral",
      className
    )}>
      <CardContent className="flex items-center gap-6 p-6">
        {/* Circular Progress Ring */}
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-white/5"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="url(#gradient)"
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out animate-progress-ring"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14B8A6" />
                <stop offset="100%" stopColor="#0E7490" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold text-foreground">
              {testPassed ? 0 : daysLeftNum}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">days</span>
          </div>
        </div>
        
        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold mb-1">
            {daysLeftNum !== null && daysLeftNum > 0 ? (
              <span className="text-foreground">
                <span className="text-primary">{daysLeftNum}</span> Days Until Test
              </span>
            ) : daysLeftNum === 0 ? (
              <span className="text-coral">Test Day.</span>
            ) : (
              <span className="text-muted-foreground">Test Passed</span>
            )}
          </h3>
          <p className="text-sm text-muted-foreground mb-3 font-medium">
            {getMotivationalMessage()}
          </p>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(percentage)}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#14B8A6] to-[#0E7490] transition-all duration-1000 ease-out rounded-full"
                style={{ width: `${Math.min(100, percentage)}%` }}
              />
            </div>
          </div>
        </div>

        {dateDialog}
      </CardContent>
    </Card>
  );
}

interface SetTestDateDialogProps {
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  onConfirm: (date: Date) => void;
  saving: boolean;
}

function SetTestDateDialog({ selectedDate, onDateSelect, onConfirm, saving }: SetTestDateDialogProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isMobile = useIsMobile();

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Set Your ACT Test Date</DialogTitle>
      </DialogHeader>
      
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Choose your official ACT test date to get a personalized study countdown and schedule.
        </p>
        
        <div className="flex flex-col space-y-3">
          {isMobile ? (
            <>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
                disabled
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : "Pick a test date"}
              </Button>
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={onDateSelect}
                disabled={(date) => date < today}
                className="p-3 pointer-events-auto rounded-md border"
              />
            </>
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a test date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent side="bottom" avoidCollisions={false} sideOffset={8} className="w-auto p-0 z-[60]" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={onDateSelect}
                  disabled={(date) => date < today}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          )}
          
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onDateSelect(undefined)}
              disabled={saving}
            >
              Clear
            </Button>
            <Button
              onClick={() => selectedDate && onConfirm(selectedDate)}
              disabled={!selectedDate || saving}
            >
              {saving ? 'Setting...' : 'Set Date'}
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}
