import { useState, useEffect, useCallback } from 'react';
import { TimerState } from '../types';

export const useTimer = (initialTime: number) => {
  const [timerState, setTimerState] = useState<TimerState>({
    timeLeft: initialTime,
    isActive: false,
    isCompleted: false
  });

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (timerState.isActive && timerState.timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimerState(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1
        }));
      }, 1000);
    } else if (timerState.timeLeft === 0) {
      setTimerState(prev => ({
        ...prev,
        isActive: false,
        isCompleted: true
      }));
    }

    return () => clearInterval(intervalId);
  }, [timerState.isActive, timerState.timeLeft]);

  const startTimer = useCallback(() => {
    setTimerState(prev => ({ ...prev, isActive: true }));
  }, []);

  const pauseTimer = useCallback(() => {
    setTimerState(prev => ({ ...prev, isActive: false }));
  }, []);

  const resetTimer = useCallback(() => {
    setTimerState({
      timeLeft: initialTime,
      isActive: false,
      isCompleted: false
    });
  }, [initialTime]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    ...timerState,
    startTimer,
    pauseTimer,
    resetTimer,
    formatTime: formatTime(timerState.timeLeft)
  };
};