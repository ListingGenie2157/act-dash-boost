import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Settings = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate('/')}>
            ← Back
          </Button>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Settings - Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This settings page will allow you to customize your ACT prep experience.
              Features will include:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-sm">
              <li>Account management</li>
              <li>Notification preferences</li>
              <li>Study reminders</li>
              <li>Accessibility options</li>
              <li>Test accommodations</li>
              <li>Privacy controls</li>
              <li>Data export/import</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;