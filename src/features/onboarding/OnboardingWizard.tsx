import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Stepper from '@/components/ui/Stepper';
import StepAccount from './steps/StepAccount';
import StepTestDate from './steps/StepTestDate';
import StepDiagnostic from './steps/StepDiagnostic';
import StepPreferences from './steps/StepPreferences';
import StepNotifications from './steps/StepNotifications';
import StepPlan from './steps/StepPlan';
import StepDone from './steps/StepDone';

const steps = [
  { id: 'account', label: 'Account', component: StepAccount },
  { id: 'date', label: 'Test Date', component: StepTestDate },
  { id: 'diagnostic', label: 'Diagnostic', component: StepDiagnostic },
  { id: 'prefs', label: 'Preferences', component: StepPreferences },
  { id: 'notify', label: 'Notifications', component: StepNotifications },
  { id: 'plan', label: 'Plan', component: StepPlan },
  { id: 'done', label: 'Done', component: StepDone },
];

interface OnboardingWizardProps {
  initialStep?: string;
}

export default function OnboardingWizard({ initialStep }: OnboardingWizardProps) {
  const initialIndex = Math.max(0, steps.findIndex(s => s.id === initialStep));
  const [index, setIndex] = useState(initialIndex === -1 ? 0 : initialIndex);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const persistStep = useMutation({
    mutationFn: async (payload: { stepId?: string; complete?: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const updates: any = {};
      if (payload.stepId) updates.onboarding_step = payload.stepId;
      if (payload.complete !== undefined) updates.onboarding_complete = payload.complete;

      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...updates }, { onConflict: 'id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const saveOnboardingData = async (stepData: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Step 1: Account basics
      if (stepData.ageVerified !== undefined) {
        await supabase.from('user_profiles').upsert({
          user_id: user.id,
          age_verified: stepData.ageVerified,
          tos_accepted: stepData.tosAccepted,
          privacy_accepted: stepData.privacyAccepted,
        }, { onConflict: 'user_id' });
      }

      // Step 2: Test date
      if (stepData.testDate) {
        await supabase.from('profiles').upsert({
          id: user.id,
          test_date: format(stepData.testDate, 'yyyy-MM-dd'),
        }, { onConflict: 'id' });
      }

      // Step 4: Preferences
      if (stepData.dailyMinutes !== undefined) {
        await supabase.from('user_preferences').upsert({
          user_id: user.id,
          daily_minutes: parseInt(stepData.dailyMinutes),
          preferred_start_hour: parseInt(stepData.preferredStartHour),
          preferred_end_hour: parseInt(stepData.preferredEndHour),
        }, { onConflict: 'user_id' });
      }

      // Step 5: Notifications
      if (stepData.emailNotifications !== undefined) {
        await supabase.from('user_preferences').upsert({
          user_id: user.id,
          email_notifications: stepData.emailNotifications,
          quiet_start_hour: parseInt(stepData.quietStartHour),
          quiet_end_hour: parseInt(stepData.quietEndHour),
        }, { onConflict: 'user_id' });
      }
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      toast.error('Failed to save progress');
    }
  };

  const handleNext = async (values: any) => {
    // Merge form data
    const updatedFormData = { ...formData, ...values };
    setFormData(updatedFormData);

    // Save step-specific data to database
    await saveOnboardingData(values);

    // Persist progress
    await persistStep.mutateAsync({ stepId: steps[index].id });

    // Move to next step
    setIndex(i => Math.min(i + 1, steps.length - 1));
  };

  const handleBack = () => {
    setIndex(i => Math.max(i - 1, 0));
  };

  const handleSkip = async () => {
    await persistStep.mutateAsync({ stepId: steps[index].id });
    setIndex(i => Math.min(i + 1, steps.length - 1));
  };

  const handleDone = async () => {
    await persistStep.mutateAsync({ complete: true, stepId: 'done' });
    
    // Check if user chose to take diagnostic
    if (formData.diagnosticChoice === 'now') {
      navigate('/diagnostic');
    } else {
      navigate('/');
    }
  };

  const StepComp = steps[index].component;
  const isLastStep = index === steps.length - 1;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Getting you ACT-ready</h1>
          <p className="text-muted-foreground">Complete your profile to get started</p>
        </div>

        <Stepper steps={steps} activeIndex={index} />

        <div className="mt-6">
          {isLastStep ? (
            <StepComp onDone={handleDone} />
          ) : (
            <StepComp
              onNext={handleNext}
              onBack={handleBack}
              onSkip={handleSkip}
            />
          )}
        </div>
      </div>
    </div>
  );
}
