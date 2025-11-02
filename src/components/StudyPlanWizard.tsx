import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import { format, addYears, startOfToday } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StudyPlanWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlanGenerated?: () => void;
}

interface WizardForm {
  testDate: Date | null;
  previousScores: { English: string; Math: string; Reading: string; Science: string };
  targetScore: string;
  dailyMinutes: string;
  diagnosticChoice: 'quick' | 'thorough' | 'skip';
  practiceExamDays: string[];
  accommodations: string;
}

export function StudyPlanWizard({ open, onOpenChange, onPlanGenerated }: StudyPlanWizardProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<WizardForm>({
    testDate: null,
    previousScores: { English: '', Math: '', Reading: '', Science: '' },
    targetScore: '',
    dailyMinutes: '30',
    diagnosticChoice: 'quick',
    practiceExamDays: [],
    accommodations: '100',
  });

  const totalSteps = 5;
  const today = startOfToday();

  const canProceedStep1 = form.testDate !== null;
  const canProceedStep2 = form.targetScore.trim() !== '';
  const canProceedStep3 = form.dailyMinutes !== '';

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // 1. Save test date
      if (form.testDate) {
        const { error: testDateError } = await supabase.functions.invoke('set-test-date', {
          body: { testDate: format(form.testDate, 'yyyy-MM-dd') },
        });
        if (testDateError) {
          console.error('Error setting test date:', testDateError);
          toast.error('Failed to set test date');
          return;
        }
      }

      // 2. Save target and previous scores as baseline
      const scores: Record<string, number> = {};
      Object.entries(form.previousScores).forEach(([section, score]) => {
        const trimmed = score.trim();
        if (trimmed) {
          const num = parseInt(trimmed, 10);
          if (num >= 1 && num <= 36) scores[section] = num;
        }
      });

      // Only call set-baseline if we have actual scores to save
      if (Object.keys(scores).length > 0) {
        const { error: baselineError } = await supabase.functions.invoke('set-baseline', {
          body: {
            scores: scores,
            notes: form.targetScore ? `Target composite: ${form.targetScore}` : undefined
          }
        });
        if (baselineError) {
          console.error('Error saving baseline:', baselineError);
        }
      }

      // 3. Save accommodations
      if (form.accommodations !== '100') {
        const { error: accommodationsError } = await supabase
          .from('accommodations')
          .upsert({
            user_id: user.id,
            time_multiplier: parseFloat(form.accommodations) / 100,
            accommodation_type: form.accommodations === '150' ? 'time_and_half' : 'double_time',
          }, { onConflict: 'user_id' });

        if (accommodationsError) {
          console.error('Error saving accommodations:', accommodationsError);
        }
      }

      // 4. Save study preferences
      const { error: preferencesError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          daily_minutes: parseInt(form.dailyMinutes, 10),
        }, { onConflict: 'user_id' });

      if (preferencesError) {
        console.error('Error saving preferences:', preferencesError);
      }

      // 5. Update profile with daily time cap
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          daily_time_cap_mins: parseInt(form.dailyMinutes, 10),
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
      }

      toast.success('Study plan preferences saved!');

      // 6. Route based on diagnostic choice
      onOpenChange(false);

      if (form.diagnosticChoice === 'skip') {
        // Create placeholder diagnostics so generate-study-plan has data to work with
        const placeholderSections = [
          { section: 'EN', score: 18, notes: 'Estimated baseline' },
          { section: 'MA', score: 18, notes: 'Estimated baseline' },
          { section: 'RD', score: 18, notes: 'Estimated baseline' },
          { section: 'SCI', score: 18, notes: 'Estimated baseline' }
        ];

        const { error: diagnosticError } = await supabase.functions.invoke('finish-diagnostic', {
          body: { sections: placeholderSections }
        });

        if (diagnosticError) {
          console.error('Error creating baseline:', diagnosticError);
          toast.error('Failed to create baseline');
          return;
        }

        // Generate plan immediately after creating baseline
        const { error: planError } = await supabase.functions.invoke('generate-study-plan', {
          method: 'POST'
        });

        if (planError) {
          console.error('Error generating plan:', planError);
          toast.error('Failed to generate study plan');
        } else {
          toast.success('Your personalized study plan is ready!');
          onPlanGenerated?.();
        }
      } else {
        // Take diagnostic first
        toast.info(`Taking ${form.diagnosticChoice === 'quick' ? '20-minute' : '60-minute'} diagnostic...`);
        navigate('/diagnostic');
      }
    } catch (error) {
      console.error('Error setting up study plan:', error);
      toast.error('Failed to set up study plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <Label>When is your ACT test?</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Select your test date to help us create the perfect study timeline.
        </p>
        <Calendar
          mode="single"
          selected={form.testDate ?? undefined}
          onSelect={(date) => setForm(f => ({ ...f, testDate: date ?? null }))}
          fromDate={today}
          toDate={addYears(today, 2)}
          disabled={{ before: today }}
          className="rounded-md border mx-auto"
        />
      </div>
      <Button
        onClick={() => {
          // Allow skip if user doesn't know test date
          if (!form.testDate) {
            setForm(f => ({ ...f, testDate: addYears(today, 1) })); // Default to 1 year out
          }
        }}
        variant="ghost"
        className="w-full"
      >
        I don't know my test date yet
      </Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div>
        <Label>Previous ACT Scores (Optional)</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Enter any previous scores to help us identify your weak areas.
        </p>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(form.previousScores).map(([section, score]) => (
            <div key={section}>
              <Label htmlFor={section}>{section}</Label>
              <Input
                id={section}
                type="number"
                min={1}
                max={36}
                placeholder="1-36"
                value={score}
                onChange={(e) => setForm(f => ({
                  ...f,
                  previousScores: { ...f.previousScores, [section]: e.target.value }
                }))}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="target">Target Composite Score *</Label>
        <p className="text-sm text-muted-foreground mb-2">
          What composite score are you aiming for?
        </p>
        <Input
          id="target"
          type="number"
          min={1}
          max={36}
          placeholder="e.g., 30"
          value={form.targetScore}
          onChange={(e) => setForm(f => ({ ...f, targetScore: e.target.value }))}
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <Label>Daily Study Time Available</Label>
        <p className="text-sm text-muted-foreground mb-3">
          How much time can you dedicate to studying each day?
        </p>
        <Select
          value={form.dailyMinutes}
          onValueChange={(v) => setForm(f => ({ ...f, dailyMinutes: v }))}
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

      <div>
        <Label>Testing Accommodations</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Do you have extra time accommodations?
        </p>
        <Select
          value={form.accommodations}
          onValueChange={(v) => setForm(f => ({ ...f, accommodations: v }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="100">No accommodations</SelectItem>
            <SelectItem value="150">Time and a half (50% extra)</SelectItem>
            <SelectItem value="200">Double time (100% extra)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div>
        <Label>Diagnostic Assessment</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Take a diagnostic to identify your strengths and weaknesses. This helps us create the most effective study plan.
        </p>
        <RadioGroup
          value={form.diagnosticChoice}
          onValueChange={(value) => setForm(f => ({ ...f, diagnosticChoice: value as 'quick' | 'thorough' | 'skip' }))}
        >
          <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="quick" id="quick" className="mt-1" />
            <Label htmlFor="quick" className="cursor-pointer flex-1">
              <div className="font-semibold">Quick Diagnostic (20 minutes)</div>
              <div className="text-sm text-muted-foreground mt-1">
                A shorter assessment covering all four sections. Perfect for getting started quickly.
              </div>
            </Label>
          </div>

          <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="thorough" id="thorough" className="mt-1" />
            <Label htmlFor="thorough" className="cursor-pointer flex-1">
              <div className="font-semibold">Thorough Diagnostic (60 minutes)</div>
              <div className="text-sm text-muted-foreground mt-1">
                A comprehensive assessment with more questions per section for accurate results.
              </div>
            </Label>
          </div>

          <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="skip" id="skip" className="mt-1" />
            <Label htmlFor="skip" className="cursor-pointer flex-1">
              <div className="font-semibold">Skip for Now</div>
              <div className="text-sm text-muted-foreground mt-1">
                Start with a general study plan. You can take a diagnostic later.
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-4">
      <div>
        <Label>Practice Exam Schedule (Optional)</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Which days would you like to schedule full-length practice tests? We recommend 1-2 per week.
        </p>
        <div className="space-y-2">
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
            <div key={day} className="flex items-center space-x-2">
              <Checkbox
                id={day}
                checked={form.practiceExamDays.includes(day)}
                onCheckedChange={(checked) => {
                  setForm(f => ({
                    ...f,
                    practiceExamDays: checked
                      ? [...f.practiceExamDays, day]
                      : f.practiceExamDays.filter(d => d !== day)
                  }));
                }}
              />
              <Label htmlFor={day} className="cursor-pointer">{day}</Label>
            </div>
          ))}
        </div>
        {form.practiceExamDays.length === 0 && (
          <p className="text-sm text-muted-foreground mt-3">
            💡 Tip: We'll schedule practice tests automatically based on your test date and progress.
          </p>
        )}
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="space-y-6">
      <div className="bg-muted/50 p-6 rounded-lg space-y-4">
        <div className="flex items-start gap-3">
          <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <div className="font-semibold">Test Date</div>
            <div className="text-sm text-muted-foreground">
              {form.testDate ? format(form.testDate, 'PPP') : 'Not set'}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <div className="font-semibold">Target Score</div>
            <div className="text-sm text-muted-foreground">{form.targetScore || 'Not set'}</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <div className="font-semibold">Daily Study Time</div>
            <div className="text-sm text-muted-foreground">{form.dailyMinutes} minutes</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <div className="font-semibold">Diagnostic</div>
            <div className="text-sm text-muted-foreground">
              {form.diagnosticChoice === 'quick' ? 'Quick (20 min)' :
               form.diagnosticChoice === 'thorough' ? 'Thorough (60 min)' :
               'Skip for now'}
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {form.diagnosticChoice === 'skip'
          ? 'Your study plan will be generated immediately after you click "Complete Setup".'
          : 'You\'ll be taken to the diagnostic assessment next. Your study plan will be generated after completion.'}
      </p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Your Personalized Study Plan</DialogTitle>
          <DialogDescription>
            Step {step} of {totalSteps + 1} - Let's set up your ACT preparation journey
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="w-full bg-muted h-2 rounded-full mb-6">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / (totalSteps + 1)) * 100}%` }}
          />
        </div>

        {/* Step Content */}
        <div className="py-4">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
          {step === 6 && renderReview()}
        </div>
        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={loading}
              className="flex-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          
          {step < totalSteps + 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={
                loading ||
                (step === 1 && !canProceedStep1) ||
                (step === 2 && !canProceedStep2) ||
                (step === 3 && !canProceedStep3)
              }
              className="flex-1"
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Setting up...' : 'Complete Setup'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
