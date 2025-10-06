import { useState } from 'react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Switch, Select, SelectTrigger, SelectContent, SelectItem, SelectValue, Label } from '@/components/ui';

interface StepNotificationsProps {
  onNext: (values: any) => Promise<void>;
  onBack: () => void;
  onSkip?: () => void;
}

export default function StepNotifications({ onNext, onBack, onSkip }: StepNotificationsProps) {
  const [form, setForm] = useState({
    emailNotifications: true,
    quietStartHour: '22',
    quietEndHour: '8',
  });

  return (
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
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          {onSkip && (
            <Button variant="outline" onClick={onSkip} className="flex-1">
              Skip
            </Button>
          )}
          <Button onClick={() => onNext(form)} className="flex-1">
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
