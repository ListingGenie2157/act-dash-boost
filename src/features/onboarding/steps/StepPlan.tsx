import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';

interface StepPlanProps {
  onNext: (values: any) => Promise<void>;
  onBack: () => void;
  onSkip?: () => void;
}

export default function StepPlan({ onNext, onBack }: StepPlanProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Your Study Plan</CardTitle>
        <CardDescription>
          We'll create a personalized study plan based on your test date, goals, and preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Your plan will include:</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Daily study tasks tailored to your schedule</li>
            <li>• Practice questions targeting weak areas</li>
            <li>• Progress tracking and analytics</li>
            <li>• Timed simulation tests</li>
          </ul>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button onClick={() => onNext({})} className="flex-1">
            Generate Plan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
