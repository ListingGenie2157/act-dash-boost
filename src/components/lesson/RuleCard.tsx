import { Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { sanitizeHTML } from '@/lib/sanitize';

interface RuleCardProps {
  number: number;
  title: string;
  content: string;
}

export function RuleCard({ number, title, content }: RuleCardProps) {
  const gradients = [
    'from-blue-500/20 to-cyan-500/20',
    'from-purple-500/20 to-pink-500/20',
    'from-amber-500/20 to-orange-500/20',
    'from-green-500/20 to-emerald-500/20',
  ];
  
  const gradient = gradients[(number - 1) % gradients.length];
  
  return (
    <Card className={`border-2 bg-gradient-to-br ${gradient}`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Badge 
            variant="secondary" 
            className="h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold"
          >
            {number}
          </Badge>
          <div className="flex items-center gap-2 flex-1">
            <Lightbulb className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">{title}</h3>
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
