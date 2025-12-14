import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

interface TestCompanionProps {
  enabled: boolean;
  tipCount: number;
}

export function TestCompanion({ enabled, tipCount }: TestCompanionProps) {
  if (!enabled) return null;

  return (
    <div className="fixed top-20 right-4 z-40">
      <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1.5">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs">Coached Mode</span>
        <span className="text-xs text-muted-foreground">({tipCount} tips)</span>
      </Badge>
    </div>
  );
}
