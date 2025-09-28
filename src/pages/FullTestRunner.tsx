import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const FullTestRunner = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate('/')}>
            ← Back
          </Button>
          <h1 className="text-2xl font-bold">
            Full ACT Practice Test {id}
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Full Test Runner - Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This full test runner will provide complete ACT practice tests.
              Features will include:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-sm">
              <li>Full 4-section ACT simulation</li>
              <li>Official timing (3 hours 35 minutes)</li>
              <li>Real test interface</li>
              <li>Comprehensive scoring</li>
              <li>Detailed performance analysis</li>
              <li>Answer explanations</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FullTestRunner;