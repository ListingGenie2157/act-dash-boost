import { useEffect, useState, useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ChunkTimerBarProps {
  timeLeftSec: number;
  totalTimeSec: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  onTimeEnd: () => void;
  isActive?: boolean;
}

const CHUNK_SIZE = 10; // Questions per chunk

export function ChunkTimerBar({
  timeLeftSec,
  totalTimeSec,
  currentQuestionIndex,
  totalQuestions,
  onTimeEnd,
  isActive = true,
}: ChunkTimerBarProps) {
  const [timeLeft, setTimeLeft] = useState(timeLeftSec);
  const [lastChunkCompleted, setLastChunkCompleted] = useState(-1);

  // Calculate chunk information
  const chunks = useMemo(() => {
    const numChunks = Math.ceil(totalQuestions / CHUNK_SIZE);
    const timePerChunk = totalTimeSec / numChunks;
    return { numChunks, timePerChunk };
  }, [totalQuestions, totalTimeSec]);

  const currentChunk = Math.floor(currentQuestionIndex / CHUNK_SIZE);
  const questionsInChunk = Math.min(CHUNK_SIZE, totalQuestions - currentChunk * CHUNK_SIZE);
  const questionInChunk = (currentQuestionIndex % CHUNK_SIZE) + 1;

  // Expected time remaining based on current chunk
  const expectedTimeRemaining = useMemo(() => {
    const chunksRemaining = chunks.numChunks - currentChunk;
    const progressInChunk = questionInChunk / questionsInChunk;
    return (chunksRemaining - progressInChunk) * chunks.timePerChunk;
  }, [chunks, currentChunk, questionInChunk, questionsInChunk]);

  // Pace status
  const paceStatus = useMemo(() => {
    const diff = timeLeft - expectedTimeRemaining;
    if (diff > 60) return 'ahead';
    if (diff < -60) return 'behind';
    return 'on-pace';
  }, [timeLeft, expectedTimeRemaining]);

  const paceDiff = Math.abs(Math.round(timeLeft - expectedTimeRemaining));

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

  // Chunk completion celebration
  useEffect(() => {
    if (currentChunk > lastChunkCompleted && currentChunk > 0) {
      setLastChunkCompleted(currentChunk);
      
      const diff = Math.round(timeLeft - expectedTimeRemaining);
      if (diff > 30) {
        toast.success(`Chunk ${currentChunk} complete! You're ${Math.round(diff / 60)} min ahead! 🚀`, {
          duration: 4000,
        });
      } else if (diff < -30) {
        toast.warning(`Chunk ${currentChunk} done. Pick up the pace - ${Math.abs(Math.round(diff / 60))} min behind.`, {
          duration: 4000,
        });
      } else {
        toast.info(`Chunk ${currentChunk} complete! Right on pace! 👍`, {
          duration: 3000,
        });
      }
    }
  }, [currentChunk, lastChunkCompleted, timeLeft, expectedTimeRemaining]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const chunkProgress = (questionInChunk / questionsInChunk) * 100;
  const isWarning = timeLeft <= 300;
  const isCritical = timeLeft <= 60;

  const getPaceColor = () => {
    if (paceStatus === 'ahead') return 'text-success';
    if (paceStatus === 'behind') return 'text-destructive';
    return 'text-primary';
  };

  const getPaceBg = () => {
    if (paceStatus === 'ahead') return 'bg-success/10 border-success/20';
    if (paceStatus === 'behind') return 'bg-destructive/10 border-destructive/20';
    return 'bg-primary/10 border-primary/20';
  };

  const getPaceIcon = () => {
    if (paceStatus === 'ahead') return <Zap className="h-4 w-4 text-success" />;
    if (paceStatus === 'behind') return <AlertTriangle className="h-4 w-4 text-destructive" />;
    return <CheckCircle2 className="h-4 w-4 text-primary" />;
  };

  return (
    <div className="w-full bg-background border rounded-lg p-4 shadow-sm space-y-3">
      {/* Chunk Progress Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-semibold">
            Chunk {currentChunk + 1} of {chunks.numChunks}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Q{questionInChunk}/{questionsInChunk}
          </span>
        </div>
        
        {/* Pace Indicator */}
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${getPaceBg()}`}>
          {getPaceIcon()}
          <span className={`text-sm font-medium ${getPaceColor()}`}>
            {paceStatus === 'on-pace' ? 'On Pace' : 
             paceStatus === 'ahead' ? `${formatTime(paceDiff)} ahead` : 
             `${formatTime(paceDiff)} behind`}
          </span>
        </div>
      </div>

      {/* Chunk Progress Bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Chunk Progress</span>
          <span>{Math.round(chunkProgress)}%</span>
        </div>
        <Progress value={chunkProgress} className="h-2" />
      </div>

      {/* Time Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className={`h-4 w-4 ${isCritical ? 'text-destructive' : isWarning ? 'text-warning' : 'text-muted-foreground'}`} />
          <span className="text-sm text-muted-foreground">Total Time</span>
        </div>
        <Badge 
          variant={isCritical ? 'destructive' : isWarning ? 'secondary' : 'default'}
          className="font-mono"
        >
          {formatTime(timeLeft)}
        </Badge>
      </div>

      {/* Critical Warning */}
      {isCritical && (
        <div className="text-xs text-destructive flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          <span>Less than 1 minute remaining!</span>
        </div>
      )}
    </div>
  );
}
