import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
    <Card 
      className="group relative overflow-hidden border-white/[0.06] hover:border-primary/30 transition-all duration-300 card-hover"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="relative p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="p-3 rounded-xl bg-secondary group-hover:scale-110 transition-all duration-300">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          {badge && (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>
        </div>

        
      </CardContent>
    </Card>
  );
};
