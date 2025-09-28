import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TimedSection = () => {
  const { sectionId } = useParams<{ sectionId: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate('/')}>
            ← Back
          </Button>
          <h1 className="text-2xl font-bold">
            Timed Section {sectionId}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Timed Section - Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This timed section will provide realistic ACT practice with section {sectionId}.
              Features will include:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-sm">
              <li>Official ACT timing</li>
              <li>Real test conditions</li>
              <li>Progress tracking</li>
              <li>Answer review</li>
              <li>Performance analytics</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TimedSection;