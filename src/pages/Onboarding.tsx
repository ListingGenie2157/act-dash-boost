import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button, Input, Label, Textarea, Card, CardContent, CardDescription, CardHeader, CardTitle,
  Calendar, Popover, PopoverContent, PopoverTrigger,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Switch, Checkbox, RadioGroup, RadioGroupItem
} from '@/components/ui';
import { CalendarIcon, CheckCircle } from 'lucide-react';
import { addYears, format, startOfToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OnboardingForm {
  // Step 1: Legal
  ageVerified: boolean;
  tosAccepted: boolean;
  privacyAccepted: boolean;
  
  // Step 2: Test Date
  testDate: Date | null;
  
  // Step 3: Accommodations
  timeMultiplier: string;
  
  // Step 4: Study Preferences
  dailyMinutes: string;
  preferredStartHour: string;
  preferredEndHour: string;
  
  // Step 5: Notifications
  emailNotifications: boolean;
  quietStartHour: string;
  quietEndHour: string;
  
  // Step 6: Starting Path
  startWith: 'diagnostic' | 'daily';
  
  // Step 7: Past Scores (optional)
  scores: { English: string; Math: string; Reading: string; Science: string };
  notes: string;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<OnboardingForm>({
    ageVerified: false,
    tosAccepted: false,
    privacyAccepted: false,
    testDate: null,
    timeMultiplier: '100',
    dailyMinutes: '25',
    preferredStartHour: '16',
    preferredEndHour: '20',
    emailNotifications: true,
    quietStartHour: '22',
    quietEndHour: '8',
    startWith: 'diagnostic',
    scores: { English: '', Math: '', Reading: '', Science: '' },
    notes: ''
  });

  const today = startOfToday();
  const [calendarMonth, setCalendarMonth] = useState<Date>(today);

  const canProceedStep1 = form.ageVerified && form.tosAccepted && form.privacyAccepted;
  const canProceedStep2 = form.testDate !== null;

  const handleSubmitOnboarding = async () => {
    setLoading(true);
    try {
      // Get authenticated user first
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Save all onboarding data
      const updates = [];

      // 1. Create user profile
      updates.push(
        supabase.from('user_profiles').upsert({
          user_id: user.id,
          age_verified: form.ageVerified,
          tos_accepted: form.tosAccepted,
          privacy_accepted: form.privacyAccepted,
        })
      );

      // 2. Set test date and mark onboarding complete in profile
      if (form.testDate) {
        updates.push(
          supabase.functions.invoke('set-test-date', {
            body: { testDate: format(form.testDate, 'yyyy-MM-dd') },
          })
        );
        updates.push(
          supabase.from('profiles').upsert({
            id: user.id,
            test_date: format(form.testDate, 'yyyy-MM-dd'),
            onboarding_complete: true
          })
        );
      }

      // 3. Save accommodations
      if (form.timeMultiplier !== '100') {
        updates.push(
          supabase.from('accommodations').upsert({
            user_id: user.id,
            time_multiplier: parseFloat(form.timeMultiplier) / 100,
            accommodation_type: form.timeMultiplier === '150' ? 'time_and_half' : 'double_time',
          })
        );
      }

      // 4. Save preferences
      updates.push(
        supabase.from('user_preferences').upsert({
          user_id: user.id,
          daily_minutes: parseInt(form.dailyMinutes, 10),
          preferred_start_hour: parseInt(form.preferredStartHour, 10),
          preferred_end_hour: parseInt(form.preferredEndHour, 10),
          email_notifications: form.emailNotifications,
          quiet_start_hour: parseInt(form.quietStartHour, 10),
          quiet_end_hour: parseInt(form.quietEndHour, 10),
        })
      );

      // 5. Save starting preference
      updates.push(
        supabase.from('user_goals').upsert({
          user_id: user.id,
          start_with: form.startWith,
        })
      );

      // 6. Save baseline scores if provided
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

      toast.success('Onboarding completed successfully!');
      
      // Navigate based on user preference
      if (form.startWith === 'diagnostic') {
        navigate('/diagnostic');
      } else {
        // Generate study plan for daily practice path
        toast.info('Creating your study plan...');
        const { error: planError } = await supabase.functions.invoke('generate-study-plan', {
          method: 'POST'
        });
        
        if (planError) {
          console.error('Error generating study plan:', planError);
          toast.error('Failed to generate study plan, but you can create one later');
        } else {
          toast.success('Study plan ready!');
        }
        
        // Go to main app
        navigate('/');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to ACT Boost!</CardTitle>
        <CardDescription>Let's get you started with a few quick questions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="age"
              checked={form.ageVerified}
              onCheckedChange={(checked) => setForm(f => ({ ...f, ageVerified: !!checked }))}
            />
            <Label htmlFor="age">I am 13 years of age or older</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="tos"
              checked={form.tosAccepted}
              onCheckedChange={(checked) => setForm(f => ({ ...f, tosAccepted: !!checked }))}
            />
            <Label htmlFor="tos">I agree to the Terms of Service</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="privacy"
              checked={form.privacyAccepted}
              onCheckedChange={(checked) => setForm(f => ({ ...f, privacyAccepted: !!checked }))}
            />
            <Label htmlFor="privacy">I agree to the Privacy Policy</Label>
          </div>
        </div>
        <Button
          onClick={() => setStep(2)}
          disabled={!canProceedStep1}
          className="w-full"
        >
          Continue
        </Button>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
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
                  !form.testDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {form.testDate ? format(form.testDate, 'PPP') : 'Select test date'}
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
            Back
          </Button>
          <Button
            onClick={() => setStep(3)}
            disabled={!canProceedStep2}
            className="flex-1"
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Accommodations</CardTitle>
        <CardDescription>Do you have extra time accommodations for the ACT?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Extra time</Label>
          <Select
            value={form.timeMultiplier}
            onValueChange={(v) => setForm(f => ({ ...f, timeMultiplier: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Extra time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="100">None</SelectItem>
              <SelectItem value="150">+50% (Time and half)</SelectItem>
              <SelectItem value="200">+100% (Double time)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
            Back
          </Button>
          <Button onClick={() => setStep(4)} className="flex-1">
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep4 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Study Preferences</CardTitle>
        <CardDescription>How much do you want to study each day?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Daily study minutes</Label>
          <Select
            value={form.dailyMinutes}
            onValueChange={(v) => setForm(f => ({ ...f, dailyMinutes: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Daily minutes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="25">25 minutes</SelectItem>
              <SelectItem value="40">40 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Preferred start time</Label>
            <Select
              value={form.preferredStartHour}
              onValueChange={(v) => setForm(f => ({ ...f, preferredStartHour: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Preferred end time</Label>
            <Select
              value={form.preferredEndHour}
              onValueChange={(v) => setForm(f => ({ ...f, preferredEndHour: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
            Back
          </Button>
          <Button onClick={() => setStep(5)} className="flex-1">
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep5 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>How would you like to receive reminders?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Email notifications</Label>
            <p className="text-sm text-muted-foreground">Receive study reminders via email</p>
          </div>
          <Switch
            checked={form.emailNotifications}
            onCheckedChange={(checked) => setForm(f => ({ ...f, emailNotifications: checked }))}
          />
        </div>
        {form.emailNotifications && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Quiet hours start</Label>
              <Select
                value={form.quietStartHour}
                onValueChange={(v) => setForm(f => ({ ...f, quietStartHour: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quiet hours end</Label>
              <Select
                value={form.quietEndHour}
                onValueChange={(v) => setForm(f => ({ ...f, quietEndHour: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep(4)} className="flex-1">
            Back
          </Button>
          <Button onClick={() => setStep(6)} className="flex-1">
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep6 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Choose Your Starting Path</CardTitle>
        <CardDescription>How would you like to begin your ACT preparation?</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={form.startWith}
          onValueChange={(value) => setForm(f => ({ ...f, startWith: value as 'diagnostic' | 'daily' }))}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="diagnostic" id="diagnostic" />
            <Label htmlFor="diagnostic" className="flex-1">
              <div>
                <div className="font-medium">Quick Diagnostic Test</div>
                <div className="text-sm text-muted-foreground">
                  Take a 20-minute assessment to identify your strengths and weaknesses
                </div>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="daily" id="daily" />
            <Label htmlFor="daily" className="flex-1">
              <div>
                <div className="font-medium">Start Daily Practice</div>
                <div className="text-sm text-muted-foreground">
                  Jump right into your personalized daily study plan
                </div>
              </div>
            </Label>
          </div>
        </RadioGroup>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep(5)} className="flex-1">
            Back
          </Button>
          <Button onClick={() => setStep(7)} className="flex-1">
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep7 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Past ACT Scores (Optional)</CardTitle>
        <CardDescription>
          Enter any previous ACT scores to help personalize your study plan. You can skip this step.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(form.scores).map(([section, score]) => (
            <div key={section}>
              <Label htmlFor={section}>{section}</Label>
              <Input
                id={section}
                inputMode="numeric"
                type="number"
                min={1}
                max={36}
                placeholder="1–36"
                value={score}
                onChange={(e) => setForm(f => ({
                  ...f,
                  scores: { ...f.scores, [section]: e.target.value }
                }))}
              />
            </div>
          ))}
        </div>
        <div>
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            placeholder="Any additional context about your previous test experience..."
            value={form.notes}
            onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep(6)} className="flex-1">
            Back
          </Button>
          <Button
            onClick={handleSubmitOnboarding}
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Setting up...' : 'Complete Setup'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderCompletedStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-6 w-6 text-green-500" />
          Setup Complete!
        </CardTitle>
        <CardDescription>
          {form.startWith === 'diagnostic'
            ? 'Start with a diagnostic to personalize your plan.'
            : 'Your personalized study plan is ready!'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-semibold mb-2">What happens next:</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {form.startWith === 'diagnostic' ? (
              <>
                <li>• Take a 20-minute diagnostic</li>
                <li>• Get your personalized study plan</li>
                <li>• Start improving your ACT scores</li>
              </>
            ) : (
              <>
                <li>• Access your daily study tasks</li>
                <li>• Track your progress over time</li>
                <li>• Improve your ACT scores</li>
              </>
            )}
          </ul>
        </div>
        <Button
          onClick={() => {
            if (form.startWith === 'diagnostic') {
              navigate('/diagnostic');
            } else {
              navigate('/dashboard');
            }
          }}
          className="w-full"
        >
          {form.startWith === 'diagnostic' ? 'Start Diagnostic Test' : 'Go to Dashboard'}
        </Button>
      </CardContent>
    </Card>
  );

  const totalSteps = 7;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">
              Step {step} of {totalSteps}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round((step / totalSteps) * 100)}% complete
            </span>
          </div>
          <div className="w-full bg-muted h-2 rounded-full">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
        {step === 6 && renderStep6()}
        {step === 7 && renderStep7()}
        {step > 7 && renderCompletedStep()}
      </div>
    </div>
  );
}