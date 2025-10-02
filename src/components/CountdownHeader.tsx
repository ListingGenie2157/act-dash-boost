import { useState, useEffect } from 'react';
import { Calendar, CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchDaysLeft = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('days-left', {
        method: 'GET'
      });

      if (error) {
        console.error('Error fetching days left:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch test countdown. Please try again.',
          variant: 'destructive'
        });
        return;
      }

      setDaysLeft(data);
    } catch (error) {
      console.error('Error fetching days left:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch test countdown. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDaysLeft();
  }, []);

  const handleSetTestDate = async (date: Date) => {
    if (!date) return;

    try {
      setSaving(true);
      const testDate = format(date, 'yyyy-MM-dd');

      const { error } = await supabase.functions.invoke('set-test-date', {
        body: { testDate }
      });

      if (error) {
        console.error('Error setting test date:', error);
        toast({
          title: 'Error',
          description: 'Failed to set test date. Please try again.',
          variant: 'destructive'
        });
        return;
      }

      // Optimistic update
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
      console.error('Error setting test date:', error);
      toast({
        title: 'Error',
        description: 'Failed to set test date. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const renderCountdown = () => {
    if (loading) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4 animate-pulse" />
          <span>Loading...</span>
        </div>
      );
    }

    if (!daysLeft?.test_date) {
      return (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="h-4 w-4" />
              Set Test Date
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
    }

    const daysLeftNum = daysLeft.days_left;
    const testDate = new Date(daysLeft.test_date);
    
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-primary" />
          <span className="font-medium">
            {daysLeftNum !== null ? (
              daysLeftNum > 0 ? (
                <span className="text-primary">T-{daysLeftNum}</span>
              ) : daysLeftNum === 0 ? (
                <span className="text-orange-500 font-semibold">Test Day!</span>
              ) : (
                <span className="text-muted-foreground">Test Passed</span>
              )
            ) : (
              <span className="text-muted-foreground">No test date</span>
            )}
          </span>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
              {format(testDate, 'MMM d, yyyy')}
            </Button>
          </DialogTrigger>
          <SetTestDateDialog
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onConfirm={handleSetTestDate}
            saving={saving}
          />
        </Dialog>
      </div>
    );
  };

  return (
    <div className={cn("flex items-center justify-center p-4 border-b bg-card", className)}>
      {renderCountdown()}
    </div>
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
            <PopoverContent className="w-auto p-0" align="start">
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