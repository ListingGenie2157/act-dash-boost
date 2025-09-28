import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ReviewQueue = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate('/')}>
            ← Back
          </Button>
          <h1 className="text-2xl font-bold">Review Queue</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Review Queue - Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This review queue will help you practice questions you've gotten wrong using spaced repetition.
              Features will include:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-sm">
              <li>Spaced repetition algorithm</li>
              <li>Personalized review schedule</li>
              <li>Wrong answer tracking</li>
              <li>Progress monitoring</li>
              <li>Mastery indicators</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReviewQueue;