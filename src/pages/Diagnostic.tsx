import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Button, Label, Input, Calendar, Popover, PopoverContent, PopoverTrigger,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui';
import { Target, CalendarIcon, ClipboardList, ArrowRight } from 'lucide-react';
import { format, addYears, startOfToday } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { reportError } from '@/lib/errorReporter';

const SECTIONS = ['English', 'Math', 'Reading', 'Science'] as const;
const DEFAULT_SECTION_SCORE = 18;

export default function Diagnostic() {
  const navigate = useNavigate();
  const today = startOfToday();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    currentScore: '',
    targetScore: '',
    testDate: null as Date | null,
    dailyMinutes: '30',
  });

  const parseScore = (value: string): number | null => {
    const num = parseInt(value, 10);
    return !isNaN(num) && num >= 1 && num <= 36 ? num : null;
  };

  // Persist the minimum planning inputs. Returns whether a real baseline was saved.
  const savePlanningInputs = async (userId: string): Promise<boolean> => {
    if (form.testDate) {
      const { error } = await supabase.functions.invoke('set-test-date', {
        body: { testDate: format(form.testDate, 'yyyy-MM-dd') },
      });
      if (error) {
        reportError(error instanceof Error ? error : new Error(String(error)), { page: 'Diagnostic', source: 'setTestDate' });
      }
    }

    const minutes = parseInt(form.dailyMinutes, 10);
    await supabase
      .from('user_preferences')
      .upsert({ user_id: userId, daily_minutes: minutes }, { onConflict: 'user_id' });
    await supabase
      .from('profiles')
      .update({ daily_time_cap_mins: minutes })
      .eq('id', userId);

    const current = parseScore(form.currentScore);
    if (current !== null) {
      const scores = Object.fromEntries(SECTIONS.map((s) => [s, current]));
      const { error } = await supabase.functions.invoke('set-baseline', {
        body: {
          scores,
          notes: form.targetScore ? `Target composite: ${form.targetScore}` : undefined,
        },
      });
      if (error) {
        reportError(error instanceof Error ? error : new Error(String(error)), { page: 'Diagnostic', source: 'setBaseline' });
      }
      return true;
    }

    return false;
  };

  const handleBuildPlan = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const hasBaseline = await savePlanningInputs(user.id);

      // No known score → seed an estimated baseline so the plan has data to work with
      if (!hasBaseline) {
        const defaultScores = Object.fromEntries(SECTIONS.map((s) => [s, DEFAULT_SECTION_SCORE]));
        const { error } = await supabase.functions.invoke('set-baseline', {
          body: {
            scores: defaultScores,
            notes: form.targetScore
              ? `Estimated baseline; target composite: ${form.targetScore}`
              : 'Estimated baseline (assessment skipped)',
          },
        });
        if (error) {
          reportError(error instanceof Error ? error : new Error(String(error)), { page: 'Diagnostic', source: 'defaultBaseline' });
          toast.error('Failed to create baseline');
          return;
        }
      }

      toast.info('Building your study plan...');
      const { error: planError } = await supabase.functions.invoke('generate-study-plan', {
        body: { force: true },
      });
      if (planError) {
        reportError(planError instanceof Error ? planError : new Error(String(planError)), { page: 'Diagnostic', source: 'generatePlan' });
        toast.error('Failed to generate study plan');
        return;
      }

      toast.success('Your study plan is ready!');
      navigate('/dashboard');
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), { page: 'Diagnostic', source: 'buildPlan' });
      toast.error('Failed to build study plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTakeAssessment = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Save planning inputs first so they're not lost; the assessment will
      // overwrite the baseline with measured scores once sections are completed.
      await savePlanningInputs(user.id);

      navigate('/diagnostic-test/D2EN');
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), { page: 'Diagnostic', source: 'takeAssessment' });
      toast.error('Failed to start assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="p-6">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Target className="w-7 h-7 text-primary" />
              Build Your Study Plan
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Tell us a few details and we'll build a personalized plan. You can take the
              full assessment now or anytime later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current & Target scores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentScore">Current ACT score (optional)</Label>
                <Input
                  id="currentScore"
                  type="number"
                  min={1}
                  max={36}
                  placeholder="e.g., 22"
                  value={form.currentScore}
                  onChange={(e) => setForm((f) => ({ ...f, currentScore: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetScore">Target ACT score (optional)</Label>
                <Input
                  id="targetScore"
                  type="number"
                  min={1}
                  max={36}
                  placeholder="e.g., 30"
                  value={form.targetScore}
                  onChange={(e) => setForm((f) => ({ ...f, targetScore: e.target.value }))}
                />
              </div>
            </div>

            {/* Test date */}
            <div className="space-y-2">
              <Label>Test date (optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.testDate ? format(form.testDate, 'PPP') : 'Pick your test date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.testDate ?? undefined}
                    onSelect={(date) => setForm((f) => ({ ...f, testDate: date ?? null }))}
                    fromDate={today}
                    toDate={addYears(today, 2)}
                    disabled={{ before: today }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Daily study time */}
            <div className="space-y-2">
              <Label>Daily study time</Label>
              <Select
                value={form.dailyMinutes}
                onValueChange={(v) => setForm((f) => ({ ...f, dailyMinutes: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes/day</SelectItem>
                  <SelectItem value="30">30 minutes/day</SelectItem>
                  <SelectItem value="45">45 minutes/day</SelectItem>
                  <SelectItem value="60">1 hour/day</SelectItem>
                  <SelectItem value="90">1.5 hours/day</SelectItem>
                  <SelectItem value="120">2 hours/day</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <Button onClick={handleBuildPlan} disabled={loading} className="w-full" size="lg">
                {loading ? 'Working...' : 'Build My Study Plan'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={handleTakeAssessment}
                disabled={loading}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                Take Full Assessment
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                The full assessment measures all four sections for the most accurate plan.
                It's optional — you can take it later from your dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
