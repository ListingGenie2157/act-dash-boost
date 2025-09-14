import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';

interface TimerBarProps {
  timeLeftSec: number;
  totalTimeSec: number;
  onTimeEnd: () => void;
  isActive?: boolean;
}

export function TimerBar({ timeLeftSec, totalTimeSec, onTimeEnd, isActive = true }: TimerBarProps) {
  const [timeLeft, setTimeLeft] = useState(timeLeftSec);

  useEffect(() => {
    setTimeLeft(timeLeftSec);
  }, [timeLeftSec]);

  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onTimeEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, isActive, onTimeEnd]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = totalTimeSec > 0 ? ((totalTimeSec - timeLeft) / totalTimeSec) * 100 : 0;
  const isWarning = timeLeft <= 300; // 5 minutes warning
  const isCritical = timeLeft <= 60; // 1 minute critical

  const getVariant = () => {
    if (isCritical) return 'destructive';
    if (isWarning) return 'secondary';
    return 'default';
  };

  return (
    <div className="w-full bg-background border rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Clock className={`h-5 w-5 ${isCritical ? 'text-destructive' : isWarning ? 'text-yellow-600' : 'text-muted-foreground'}`} />
          <span className="font-medium text-sm">Time Remaining</span>
        </div>
        <div className="flex items-center space-x-2">
          {isWarning && (
            <AlertTriangle className={`h-4 w-4 ${isCritical ? 'text-destructive' : 'text-yellow-600'}`} />
          )}
          <Badge variant={getVariant()} className="font-mono text-sm">
            {formatTime(timeLeft)}
          </Badge>
        </div>
      </div>
      
      <Progress 
        value={progressPercent} 
        className={`w-full ${isCritical ? 'progress-destructive' : isWarning ? 'progress-warning' : ''}`}
      />
      
      {isWarning && (
        <div className={`text-xs mt-2 flex items-center space-x-1 ${
          isCritical ? 'text-destructive' : 'text-yellow-600'
        }`}>
          <AlertTriangle className="h-3 w-3" />
          <span>
            {isCritical ? 'Test will auto-submit in less than 1 minute!' : 'Less than 5 minutes remaining'}
          </span>
        </div>
      )}
    </div>
  );
}