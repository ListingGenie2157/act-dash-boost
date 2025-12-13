import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button, Label, Card, CardContent, CardDescription, CardHeader, CardTitle, Checkbox, Input
} from '@/components/ui';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import preppitLogo from '@/assets/preppit-logo.png';

export default function Onboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    ageVerified: false,
    tosAccepted: false,
    privacyAccepted: false,
  });

  const canProceed = form.firstName.trim() && form.ageVerified && form.tosAccepted && form.privacyAccepted;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Save legal info and mark onboarding complete
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          first_name: form.firstName.trim(),
          age_verified: form.ageVerified,
          tos_accepted: form.tosAccepted,
          privacy_accepted: form.privacyAccepted,
          onboarding_complete: true,
          has_study_plan: false,
          daily_time_cap_mins: 30 // Default 30 minutes per day
        })
        .eq('id', user.id);

      if (profileUpdateError) {
        toast.error('Failed to update profile');
        throw profileUpdateError;
      }

      toast.success('Welcome to Preppit!');
      navigate('/');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="backdrop-blur-sm border-primary/20 shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img src={preppitLogo} alt="Preppit" className="h-16 w-auto" />
            </div>
            <CardTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Welcome to Preppit!</CardTitle>
            <CardDescription>Let's get you started. Please accept the following to continue.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Enter your first name"
                  value={form.firstName}
                  onChange={(e) => setForm(f => ({ ...f, firstName: e.target.value }))}
                  className="focus:ring-2 focus:ring-primary"
                />
              </div>
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
              className="w-full bg-gradient-to-r from-primary to-accent hover:shadow-lg transition-all"
            >
              {loading ? 'Setting up...' : 'Get Started'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
