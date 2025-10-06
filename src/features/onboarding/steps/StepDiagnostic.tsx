import { useState } from 'react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, RadioGroup, RadioGroupItem, Label } from '@/components/ui';

interface StepDiagnosticProps {
  onNext: (values: any) => Promise<void>;
  onBack: () => void;
  onSkip?: () => void;
}

export default function StepDiagnostic({ onNext, onBack, onSkip }: StepDiagnosticProps) {
  const [choice, setChoice] = useState<'now' | 'later'>('now');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diagnostic Assessment</CardTitle>
        <CardDescription>
          Take a quick diagnostic to identify your strengths and areas for improvement.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={choice} onValueChange={(value) => setChoice(value as 'now' | 'later')}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="now" id="now" />
            <Label htmlFor="now" className="flex-1">
              <div>
                <div className="font-medium">Take diagnostic now</div>
                <div className="text-sm text-muted-foreground">
                  20-minute assessment to personalize your study plan
                </div>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="later" id="later" />
            <Label htmlFor="later" className="flex-1">
              <div>
                <div className="font-medium">Skip for now</div>
                <div className="text-sm text-muted-foreground">
                  Start with general practice and take diagnostic later
                </div>
              </div>
            </Label>
          </div>
        </RadioGroup>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          {choice === 'later' && onSkip ? (
            <Button variant="outline" onClick={onSkip} className="flex-1">
              Skip
            </Button>
          ) : (
            <Button onClick={() => onNext({ diagnosticChoice: choice })} className="flex-1">
              Continue
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
