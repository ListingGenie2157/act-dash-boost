import { useState } from 'react';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface IndependentPracticeCardProps {
  number: number;
  question: string;
  answer?: string;
}

export function IndependentPracticeCard({ number, question, answer }: IndependentPracticeCardProps) {
  const [revealed, setRevealed] = useState(false);
  
  return (
    <Card className={revealed ? 'border-green-300 bg-green-50 dark:bg-green-900/10' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="h-8 w-8 rounded-full flex items-center justify-center">
              {number}
            </Badge>
            <span className="font-medium">Question {number}</span>
          </div>
          {revealed && (
            <CheckCircle className="h-5 w-5 text-green-600" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-base">{question}</p>
        
        {answer && (
          <>
            <Button
              variant={revealed ? 'outline' : 'default'}
              size="sm"
              onClick={() => setRevealed(!revealed)}
              className="w-full sm:w-auto"
            >
              {revealed ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Hide Answer
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Reveal Answer
                </>
              )}
            </Button>
            
            {revealed && (
              <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-300 dark:border-green-700">
                <p className="font-semibold text-green-800 dark:text-green-300 mb-1">
                  Answer:
                </p>
                <p className="text-green-700 dark:text-green-400">{answer}</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
