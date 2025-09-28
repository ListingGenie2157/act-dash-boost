import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ProgressDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate('/')}>
            ← Back
          </Button>
          <h1 className="text-2xl font-bold">Progress Dashboard</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Progress Dashboard - Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This progress dashboard will provide comprehensive analytics of your ACT prep journey.
              Features will include:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-sm">
              <li>Score progression charts</li>
              <li>Subject-wise performance breakdown</li>
              <li>Time spent analytics</li>
              <li>Weak areas identification</li>
              <li>Study streak tracking</li>
              <li>Goal progress monitoring</li>
              <li>Predicted score ranges</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProgressDashboard;