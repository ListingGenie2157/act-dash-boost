import React, { useState, useEffect, useRef } from 'react'
import { cn, formatTime } from '../../lib/utils'
import { Clock, Pause, Play, AlertTriangle } from 'lucide-react'
import { Button } from '../ui/Button'

interface TimerProps {
  duration: number // in seconds
  onTimeUp: () => void
  isPaused?: boolean
  onPause?: () => void
  onResume?: () => void
  showWarning?: boolean
  warningThreshold?: number // percentage of time remaining to show warning
  className?: string
}

export function Timer({
  duration,
  onTimeUp,
  isPaused = false,
  onPause,
  onResume,
  showWarning = true,
  warningThreshold = 10,
  className,
}: TimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration)
  const [isWarning, setIsWarning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(Date.now())
  const pausedTimeRef = useRef<number>(0)

  useEffect(() => {
    if (!isPaused) {
      startTimer()
    } else {
      stopTimer()
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPaused])

  useEffect(() => {
    if (showWarning && timeRemaining <= duration * (warningThreshold / 100)) {
      setIsWarning(true)
    }

    if (timeRemaining <= 0) {
      onTimeUp()
      stopTimer()
    }
  }, [timeRemaining, duration, warningThreshold, showWarning, onTimeUp])

  const startTimer = () => {
    if (intervalRef.current) return

    const startTime = Date.now() - pausedTimeRef.current
    startTimeRef.current = startTime

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const remaining = Math.max(0, duration - elapsed)
      setTimeRemaining(remaining)
    }, 100)
  }

  const stopTimer = () => {
    if (intervalRef.current) {
      pausedTimeRef.current = Date.now() - startTimeRef.current
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const percentage = (timeRemaining / duration) * 100

  return (
    <div className={cn('bg-white rounded-lg shadow-sm border p-4', className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Clock className={cn(
            'w-5 h-5 mr-2',
            isWarning ? 'text-orange-500' : 'text-gray-600'
          )} />
          <span className={cn(
            'text-2xl font-mono font-semibold',
            isWarning ? 'text-orange-600' : 'text-gray-900'
          )}>
            {formatTime(timeRemaining)}
          </span>
        </div>

        {(onPause || onResume) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={isPaused ? onResume : onPause}
          >
            {isPaused ? (
              <>
                <Play className="w-4 h-4 mr-1" />
                Resume
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 mr-1" />
                Pause
              </>
            )}
          </Button>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            isWarning ? 'bg-orange-500' : 'bg-primary-500'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {isWarning && (
        <div className="flex items-center mt-2 text-sm text-orange-600">
          <AlertTriangle className="w-4 h-4 mr-1" />
          Time is running low!
        </div>
      )}
    </div>
  )
}

interface CompactTimerProps {
  duration: number
  onTimeUp: () => void
  isPaused?: boolean
}

export function CompactTimer({ duration, onTimeUp, isPaused = false }: CompactTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!isPaused) {
      const startTime = Date.now()
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        const remaining = Math.max(0, duration - elapsed)
        setTimeRemaining(remaining)
        
        if (remaining === 0) {
          onTimeUp()
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
          }
        }
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPaused, duration, onTimeUp])

  const isWarning = timeRemaining <= duration * 0.1

  return (
    <div className={cn(
      'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
      isWarning ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
    )}>
      <Clock className="w-4 h-4 mr-1" />
      {formatTime(timeRemaining)}
    </div>
  )
}