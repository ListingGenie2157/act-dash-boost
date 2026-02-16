import { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  gradient?: string;
  delay?: number;
}

export const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  badge,
  delay = 0
}: FeatureCardProps) => {
  return (
    <div
      className="group relative h-full rounded-lg overflow-hidden transition-all duration-300 card-hover"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Ambient teal glow */}
      <div className="absolute -inset-px rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-md bg-gradient-to-br from-primary/30 via-transparent to-primary-glow/15 pointer-events-none" />

      {/* Card surface */}
      <div
        className="relative h-full flex flex-col rounded-lg p-5 space-y-3 border border-white/[0.08] feature-card-cinematic"
        style={{
          background: 'linear-gradient(180deg, hsl(224 52% 17%) 0%, hsl(224 52% 14%) 100%)',
        }}
      >
        <div className="flex items-start justify-between">
          <div className="p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <Icon className="w-5 h-5 text-foreground" />
          </div>
          {badge && (
            <Badge variant="secondary" className="text-[10px] tracking-wide uppercase">
              {badge}
            </Badge>
          )}
        </div>
        
        <div className="space-y-1.5 flex-1">
          <h3 className="text-base font-bold leading-tight">
            {title}
          </h3>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};
