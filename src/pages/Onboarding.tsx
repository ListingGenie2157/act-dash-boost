import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button, Label, Card, CardContent, CardDescription, CardHeader, CardTitle, Checkbox, Input
} from '@/components/ui';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { reportError } from '@/lib/errorReporter';
import preppitLogo from '@/assets/preppit-logo.png';
import { Monitor, FileText, School, Globe, HelpCircle } from 'lucide-react';
import { PageLoadingSpinner } from '@/components/LoadingSpinner';

export default function Onboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setChecking(false); return; }
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_complete')
          .eq('id', user.id)
          .maybeSingle();
        if (profile?.onboarding_complete) {
          navigate('/dashboard', { replace: true });
          return;
        }
      } catch {
        // proceed to onboarding form
      }
      setChecking(false);
    };
    checkOnboarding();
  }, [navigate]);
  const [form, setForm] = useState({
    firstName: '',
    ageVerified: false,
    tosAccepted: false,
    privacyAccepted: false,
    testFormat: '' as 'digital' | 'paper' | '',
    administration: '' as 'school_day' | 'national' | '',
    scienceRequired: null as boolean | null,
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
          daily_time_cap_mins: 30,
          test_format: form.testFormat || null,
          administration: form.administration || null,
          science_required: form.scienceRequired,
        })
        .eq('id', user.id);

      if (profileUpdateError) {
        toast.error('Failed to update profile');
        throw profileUpdateError;
      }

      setDone(true);
    } catch (error) {
      reportError(error instanceof Error ? error : new Error(String(error)), { page: 'Onboarding' });
      toast.error('Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) return <PageLoadingSpinner />;

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-primary/20 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">You're set up, {form.firstName.trim()}.</CardTitle>
            <CardDescription>
              The diagnostic shows where you stand so your study plan starts in the right place.
              The quick version takes about 35 minutes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" size="lg" onClick={() => navigate('/diagnostic')}>
              Take the diagnostic
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard')}>
              Skip for now
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              You can take it any time from your dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card className="backdrop-blur-sm border-primary/20 shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img src={preppitLogo} alt="Preppit Pacing" className="h-16 w-auto" />
            </div>
            <CardTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Welcome to Preppit Pacing!</CardTitle>
            <CardDescription>Let's personalize your ACT prep experience.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name */}
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

            {/* Test Format */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">How will you take the ACT?</Label>
              <RadioGroup
                value={form.testFormat}
                onValueChange={(value) => setForm(f => ({ ...f, testFormat: value as 'digital' | 'paper' }))}
                className="grid grid-cols-2 gap-3"
              >
                <Label
                  htmlFor="digital"
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    form.testFormat === 'digital' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value="digital" id="digital" />
                  <Monitor className="h-4 w-4 text-primary" />
                  <span className="text-sm">Online/Digital</span>
                </Label>
                <Label
                  htmlFor="paper"
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    form.testFormat === 'paper' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value="paper" id="paper" />
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm">Paper</span>
                </Label>
              </RadioGroup>
            </div>

            {/* Administration Type */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">What type of test administration?</Label>
              <RadioGroup
                value={form.administration}
                onValueChange={(value) => setForm(f => ({ ...f, administration: value as 'school_day' | 'national' }))}
                className="grid grid-cols-2 gap-3"
              >
                <Label
                  htmlFor="school_day"
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    form.administration === 'school_day' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value="school_day" id="school_day" />
                  <School className="h-4 w-4 text-primary" />
                  <span className="text-sm">School Day</span>
                </Label>
                <Label
                  htmlFor="national"
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    form.administration === 'national' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value="national" id="national" />
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="text-sm">National</span>
                </Label>
              </RadioGroup>
            </div>

            {/* Science Required */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Is the Science section required for you?</Label>
              <RadioGroup
                value={form.scienceRequired === null ? '' : form.scienceRequired ? 'yes' : 'no'}
                onValueChange={(value) => setForm(f => ({ 
                  ...f, 
                  scienceRequired: value === '' ? null : value === 'yes' 
                }))}
                className="grid grid-cols-3 gap-3"
              >
                <Label
                  htmlFor="science_yes"
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                    form.scienceRequired === true ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value="yes" id="science_yes" />
                  <span className="text-sm">Yes</span>
                </Label>
                <Label
                  htmlFor="science_no"
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                    form.scienceRequired === false ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value="no" id="science_no" />
                  <span className="text-sm">No</span>
                </Label>
                <Label
                  htmlFor="science_unsure"
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                    form.scienceRequired === null && form.administration !== '' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value="" id="science_unsure" />
                  <HelpCircle className="h-4 w-4" />
                  <span className="text-sm">Not sure</span>
                </Label>
              </RadioGroup>
              <p className="text-xs text-muted-foreground">
                Science is optional on the Enhanced ACT, but may be required for School Day testing.
              </p>
            </div>

            {/* Legal Checkboxes */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="age"
                  checked={form.ageVerified}
                  onCheckedChange={(checked) => setForm(f => ({ ...f, ageVerified: !!checked }))}
                />
                <Label htmlFor="age" className="text-sm">I am 13 years of age or older</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tos"
                  checked={form.tosAccepted}
                  onCheckedChange={(checked) => setForm(f => ({ ...f, tosAccepted: !!checked }))}
                />
                <Label htmlFor="tos" className="text-sm">
                  I agree to the{' '}
                  <a 
                    href="/terms" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary underline hover:no-underline"
                  >
                    Terms of Service
                  </a>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="privacy"
                  checked={form.privacyAccepted}
                  onCheckedChange={(checked) => setForm(f => ({ ...f, privacyAccepted: !!checked }))}
                />
                <Label htmlFor="privacy" className="text-sm">
                  I agree to the{' '}
                  <a 
                    href="/privacy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary underline hover:no-underline"
                  >
                    Privacy Policy
                  </a>
                </Label>
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