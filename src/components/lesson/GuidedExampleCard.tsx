import { Target } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { sanitizeHTML } from '@/lib/sanitize';

interface GuidedExampleCardProps {
  number: number;
  content: string;
}

export function GuidedExampleCard({ number, content }: GuidedExampleCardProps) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Badge 
            variant="default" 
            className="h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold"
          >
            {number}
          </Badge>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Example {number}</h3>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          className="prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: sanitizeHTML(content) }}
        />
      </CardContent>
    </Card>
  );
}
