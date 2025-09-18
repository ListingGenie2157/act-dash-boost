import * as React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button, Input, Label, Card, CardContent, CardDescription, CardHeader, CardTitle,
  Calendar, Popover, PopoverContent, PopoverTrigger,
  Progress
} from '@/components/ui';
import { CalendarIcon, Brain, Clock, Target } from 'lucide-react';
import { addYears, format, startOfToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DiagnosticEvaluation } from './Diagnostic';

interface OnboardingForm {
  // Step 1: Test Date
  testDate: Date | null;
  
  // Step 2: Past Scores (optional)
  scores: { English: string; Math: string; Reading: string; Science: string };
  notes: string;
  
  // Step 3: Diagnostic Assessment (handled by DiagnosticEvaluation component)
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<OnboardingForm>({
    testDate: null,
    scores: { English: '', Math: '', Reading: '', Science: '' },
    notes: ''
  });

  const today = startOfToday();
  const [calendarMonth, setCalendarMonth] = useState<Date>(today);

  const canProceedStep1 = form.testDate !== null;

  const handleSaveInitialData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const updates = [];

      // 1. Set test date in profile
      if (form.testDate) {
        updates.push(
          supabase.functions.invoke('set-test-date', {
            body: { testDate: format(form.testDate, 'yyyy-MM-dd') }
          })
        );
      }

      // 2. Save baseline scores if provided
      const numericScores: Record<string, number> = {};
      Object.entries(form.scores).forEach(([section, score]) => {
        const trimmed = score.trim();
        if (trimmed) {
          const num = parseInt(trimmed, 10);
          if (num >= 1 && num <= 36) numericScores[section] = num;
        }
      });

      if (Object.keys(numericScores).length > 0) {
        updates.push(
          supabase.functions.invoke('set-baseline', {
            body: { scores: numericScores, notes: form.notes.trim() || undefined }
          })
        );
      }

      // Execute all updates
      await Promise.all(updates);

      // Move to diagnostic assessment
      setStep(3);
    } catch (error) {
      console.error('Error saving initial data:', error);
      toast.error('Failed to save data');
    } finally {
      setLoading(false);
    }
  };

  const handleDiagnosticComplete = async (results: Record<string, { score: number }>) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Save diagnostic results and generate study plan
      const { data, error } = await supabase.functions.invoke('finish-diagnostic', {
        body: {
          sections: Object.entries(results).map(([section, result]) => ({
            section: section.toUpperCase(),
            score: result.score / 100, // Convert percentage to decimal
            notes: `Onboarding diagnostic assessment`
          }))
        }
      });

      if (error) throw error;

      // Generate initial study plan
      await supabase.functions.invoke('generate-study-plan', {
        body: { userId: user.id }
      });

      toast.success('Onboarding completed! Your personalized study plan is ready.');
      navigate('/');
    } catch (error) {
      console.error('Error completing diagnostic:', error);
      toast.error('Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <Card>
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Target className="w-12 h-12 text-primary" />
        </div>
        <CardTitle className="text-2xl">Welcome to ACT Boost!</CardTitle>
        <CardDescription>
          Let's set up your personalized ACT preparation plan in just 3 simple steps.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 border rounded-lg bg-primary/5">
            <Calendar className="w-8 h-8 text-primary mx-auto mb-2" />
            <h3 className="font-medium">Step 1</h3>
            <p className="text-sm text-muted-foreground">Set your test date</p>
          </div>
          <div className="p-4 border rounded-lg">
            <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <h3 className="font-medium">Step 2</h3>
            <p className="text-sm text-muted-foreground">Add past scores (optional)</p>
          </div>
          <div className="p-4 border rounded-lg">
            <Brain className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <h3 className="font-medium">Step 3</h3>
            <p className="text-sm text-muted-foreground">Take diagnostic assessment</p>
          </div>
        </div>

        <div>
          <Label>When is your ACT test?</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal mt-2',
                  !form.testDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {form.testDate ? format(form.testDate, 'PPP') : 'Select your test date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={form.testDate || undefined}
                onSelect={(d) => {
                  if (!d) return;
                  setForm(f => ({ ...f, testDate: d }));
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

        <Button
          onClick={() => setStep(2)}
          disabled={!canProceedStep1}
          className="w-full"
        >
          Continue to Step 2
        </Button>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Past ACT Scores (Optional)</CardTitle>
        <CardDescription>
          If you've taken the ACT before, enter your scores to help us personalize your study plan. 
          If not, that's perfectly fine - we'll determine your level through the diagnostic assessment.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['English', 'Math', 'Reading', 'Science'].map(subject => (
            <div key={subject}>
              <Label>{subject}</Label>
              <Input
                type="number"
                min="1"
                max="36"
                placeholder="1-36"
                value={form.scores[subject as keyof typeof form.scores]}
                onChange={(e) => setForm(f => ({ 
                  ...f, 
                  scores: { ...f.scores, [subject]: e.target.value }
                }))}
                className="mt-1"
              />
            </div>
          ))}
        </div>
        
        <div>
          <Label>Additional Notes (Optional)</Label>
          <Input
            placeholder="Any specific areas you struggled with or felt confident about"
            value={form.notes}
            onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
            className="mt-1"
          />
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Don't worry if you haven't taken the ACT before!</strong> Our diagnostic assessment 
            will identify your strengths and areas for improvement to create the perfect study plan for you.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
            Back
          </Button>
          <Button
            onClick={handleSaveInitialData}
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Saving...' : 'Continue to Assessment'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" />
          Diagnostic Assessment
        </CardTitle>
        <CardDescription>
          This 15-20 minute assessment will identify your strengths and areas for improvement 
          to create your personalized study plan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DiagnosticEvaluation 
          onComplete={handleDiagnosticComplete}
          previousScores={
            Object.values(form.scores).some(score => score.trim()) 
              ? {
                  english: parseInt(form.scores.English) || 0,
                  math: parseInt(form.scores.Math) || 0,
                  reading: parseInt(form.scores.Reading) || 0,
                  science: parseInt(form.scores.Science) || 0
                }
              : undefined
          }
        />
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">ACT Boost Setup</h1>
            <span className="text-sm text-muted-foreground">Step {step} of 3</span>
          </div>
          <Progress value={(step / 3) * 100} className="h-2" />
        </div>
        
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
}