import { useState } from 'react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Select, SelectTrigger, SelectContent, SelectItem, SelectValue, Label } from '@/components/ui';

interface StepPreferencesProps {
  onNext: (values: any) => Promise<void>;
  onBack: () => void;
  onSkip?: () => void;
}

export default function StepPreferences({ onNext, onBack }: StepPreferencesProps) {
  const [form, setForm] = useState({
    dailyMinutes: '25',
    preferredStartHour: '16',
    preferredEndHour: '20',
  });

  return (
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
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button onClick={() => onNext(form)} className="flex-1">
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
