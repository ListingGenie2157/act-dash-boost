import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface LiveStreakCounterProps {
  currentStreak: number;
  bestStreak: number;
  streakEvent: 'scored' | 'broke' | null;
}

export function LiveStreakCounter({ currentStreak, bestStreak, streakEvent }: LiveStreakCounterProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  // Trigger animations and celebrations
  useEffect(() => {
    if (streakEvent === 'scored') {
      setIsAnimating(true);
      
      // Milestone celebrations
      if (currentStreak === 3) {
        toast('🔥 3 in a row!', { duration: 2000 });
      } else if (currentStreak === 5) {
        toast('🔥🔥 5 in a row! On fire!', { duration: 2500 });
      } else if (currentStreak === 10) {
        toast('🔥🔥🔥 Perfect 10! Unstoppable!', { duration: 3000 });
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else if (currentStreak > 10 && currentStreak % 5 === 0) {
        toast(`🔥 ${currentStreak} streak! Legendary!`, { duration: 2500 });
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      }
      
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    } else if (streakEvent === 'broke' && currentStreak === 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [currentStreak, streakEvent]);

  // Determine visual intensity based on streak
  const getFlameColor = () => {
    if (currentStreak === 0) return 'text-muted-foreground';
    if (currentStreak < 3) return 'text-orange-400';
    if (currentStreak < 5) return 'text-orange-500';
    if (currentStreak < 10) return 'text-red-500';
    return 'text-amber-400'; // Golden for 10+
  };

  const getFlameSize = () => {
    if (currentStreak === 0) return 'h-5 w-5';
    if (currentStreak < 3) return 'h-6 w-6';
    if (currentStreak < 5) return 'h-7 w-7';
    return 'h-8 w-8';
  };

  const getBackgroundGlow = () => {
    if (currentStreak === 0) return '';
    if (currentStreak < 3) return 'bg-orange-500/10';
    if (currentStreak < 5) return 'bg-orange-500/20';
    if (currentStreak < 10) return 'bg-red-500/20';
    return 'bg-amber-500/30 ring-2 ring-amber-400/50'; // Golden glow for 10+
  };

  const getStatusText = () => {
    if (currentStreak === 0) return '';
    if (currentStreak < 3) return '';
    if (currentStreak < 5) return 'Hot!';
    if (currentStreak < 10) return 'On Fire!';
    return 'Unstoppable!';
  };

  return (
    <div className="flex items-center gap-3">
      {/* Streak Counter */}
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300',
          getBackgroundGlow(),
          streakEvent === 'scored' && isAnimating && 'scale-110',
          streakEvent === 'broke' && isAnimating && 'animate-[shake_0.5s_ease-in-out]'
        )}
      >
        <Flame
          className={cn(
            'transition-all duration-300',
            getFlameColor(),
            getFlameSize(),
            streakEvent === 'scored' && isAnimating && 'animate-pulse'
          )}
        />
        <div className="flex flex-col items-start">
          <div className="flex items-baseline gap-1">
            <span className={cn(
              'font-bold text-lg tabular-nums',
              currentStreak > 0 ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {currentStreak}
            </span>
            {getStatusText() && (
              <span className={cn(
                'text-xs font-semibold',
                currentStreak >= 10 ? 'text-amber-400' : 'text-orange-500'
              )}>
                {getStatusText()}
              </span>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground">streak</span>
        </div>
      </div>

      {/* Best Streak (subtle) */}
      {bestStreak > 0 && (
        <div className="text-xs text-muted-foreground">
          Best: <span className="font-semibold">{bestStreak}</span>
        </div>
      )}
    </div>
  );
}
