import { useState } from 'react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Checkbox, Label } from '@/components/ui';

interface StepAccountProps {
  onNext: (values: any) => Promise<void>;
  onBack?: () => void;
  onSkip?: () => void;
}

export default function StepAccount({ onNext }: StepAccountProps) {
  const [form, setForm] = useState({
    ageVerified: false,
    tosAccepted: false,
    privacyAccepted: false,
  });

  const canProceed = form.ageVerified && form.tosAccepted && form.privacyAccepted;

  return (
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
          onClick={() => onNext(form)}
          disabled={!canProceed}
          className="w-full"
        >
          Continue
        </Button>
      </CardContent>
    </Card>
  );
}
