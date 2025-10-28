import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button, Label, Card, CardContent, CardDescription, CardHeader, CardTitle, Checkbox
} from '@/components/ui';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Onboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    ageVerified: false,
    tosAccepted: false,
    privacyAccepted: false,
  });

  const canProceed = form.ageVerified && form.tosAccepted && form.privacyAccepted;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Save legal info to user_profiles
      const { error: profilesError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          age_verified: form.ageVerified,
          tos_accepted: form.tosAccepted,
          privacy_accepted: form.privacyAccepted,
        }, { onConflict: 'user_id' });

      if (profilesError) {
        toast.error('Failed to save legal information');
        throw profilesError;
      }

      // Mark onboarding complete and set to self-directed mode (no study plan yet)
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          onboarding_complete: true,
          has_study_plan: false
        })
        .eq('id', user.id);

      if (profileUpdateError) {
        toast.error('Failed to update profile');
        throw profileUpdateError;
      }

      toast.success('Welcome to ACT Boost!');
      navigate('/');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to ACT Boost!</CardTitle>
            <CardDescription>Let's get you started. Please accept the following to continue.</CardDescription>
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
              onClick={handleSubmit}
              disabled={!canProceed || loading}
              className="w-full"
            >
              {loading ? 'Setting up...' : 'Get Started'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
