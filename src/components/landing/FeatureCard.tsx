import { LucideIcon } from 'lucide-react';

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
      className="pp-card group h-full p-5 transition-all duration-300"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative z-10 flex flex-col h-full space-y-3">
        <div className="flex items-start justify-between">
          <div className="pp-icon">
            <Icon className="w-5 h-5 text-[#2dd4bf]" />
          </div>
          {badge && (
            <span className="pp-badge">
              {badge}
            </span>
          )}
        </div>
        
        <div className="space-y-1.5 flex-1">
          <h3 className="text-base font-bold leading-tight" style={{ color: 'var(--pp-text)' }}>
            {title}
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--pp-muted)' }}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};
