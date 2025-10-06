import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { CheckCircle } from 'lucide-react';

interface StepDoneProps {
  onDone: () => Promise<void>;
}

export default function StepDone({ onDone }: StepDoneProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-6 w-6 text-green-500" />
          You're All Set!
        </CardTitle>
        <CardDescription>
          Your personalized ACT prep journey starts now.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-semibold mb-2">What's next:</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Access your daily study plan</li>
            <li>• Take practice tests and drills</li>
            <li>• Track your progress over time</li>
            <li>• Improve your ACT scores</li>
          </ul>
        </div>
        <Button onClick={onDone} className="w-full">
          Go to Dashboard
        </Button>
      </CardContent>
    </Card>
  );
}
