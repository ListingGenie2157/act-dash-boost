import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { UserProgress, Question } from '@/types';
import { debounce } from 'lodash';

interface ProgressContextType {
  progress: UserProgress;
  updateProgress: (updates: Partial<UserProgress>) => void;
  addWrongAnswer: (questionId: string, question: Question, userAnswer: number) => void;
  updateWeakAreas: (subject: 'math' | 'english', topic: string) => void;
  completeDay: (day: number) => void;
  updateScore: (lessonId: string, practiceScore: number, quizScore: number) => void;
  resetProgress: () => void;
  isLoading: boolean;
}

const initialProgress: UserProgress = {
  currentDay: 1,
  completedDays: [],
  scores: {},
  wrongAnswers: [],
  weakAreas: []
};

const ProgressContext = createContext<ProgressContextType | null>(null);

/**
 * Progress Provider component that manages user progress state
 * Provides progress data and methods to all child components
 */
export const ProgressProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState<UserProgress>(initialProgress);

  // Load progress from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('act-prep-progress');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate the parsed data structure
        if (parsed && typeof parsed === 'object') {
          setProgress(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load progress from localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced save to localStorage to prevent excessive writes
  const debouncedSave = useMemo(
    () => debounce((data: UserProgress) => {
      try {
        localStorage.setItem('act-prep-progress', JSON.stringify(data));
      } catch (error) {
        console.error('Failed to save progress to localStorage:', error);
      }
    }, 500),
    []
  );

  // Save progress whenever it changes
  useEffect(() => {
    if (!isLoading) {
      debouncedSave(progress);
    }
  }, [progress, debouncedSave, isLoading]);

  const updateProgress = (updates: Partial<UserProgress>) => {
    setProgress(prev => ({ ...prev, ...updates }));
  };

  const addWrongAnswer = (questionId: string, question: Question, userAnswer: number) => {
    setProgress(prev => ({
      ...prev,
      wrongAnswers: [
        ...prev.wrongAnswers,
        {
          questionId,
          question,
          userAnswer,
          timestamp: new Date()
        }
      ]
    }));
  };

  const updateWeakAreas = (subject: 'math' | 'english', topic: string) => {
    setProgress(prev => {
      const existingArea = prev.weakAreas.find(
        area => area.subject === subject && area.topic === topic
      );
      
      if (existingArea) {
        return {
          ...prev,
          weakAreas: prev.weakAreas.map(area =>
            area.subject === subject && area.topic === topic
              ? { ...area, errorCount: area.errorCount + 1 }
              : area
          )
        };
      } else {
        return {
          ...prev,
          weakAreas: [...prev.weakAreas, { subject, topic, errorCount: 1 }]
        };
      }
    });
  };

  const completeDay = (day: number) => {
    setProgress(prev => ({
      ...prev,
      completedDays: prev.completedDays.includes(day) 
        ? prev.completedDays 
        : [...prev.completedDays, day].sort((a, b) => a - b)
    }));
  };

  const updateScore = (lessonId: string, practiceScore: number, quizScore: number) => {
    setProgress(prev => ({
      ...prev,
      scores: {
        ...prev.scores,
        [lessonId]: {
          practiceScore,
          quizScore
        }
      }
    }));
  };

  const resetProgress = () => {
    setProgress(initialProgress);
    localStorage.removeItem('act-prep-progress');
  };

  const value: ProgressContextType = {
    progress,
    updateProgress,
    addWrongAnswer,
    updateWeakAreas,
    completeDay,
    updateScore,
    resetProgress,
    isLoading
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};

/**
 * Custom hook to access the progress context
 * @throws Error if used outside of ProgressProvider
 */
export const useProgressContext = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgressContext must be used within ProgressProvider');
  }
  return context;
};

export default ProgressContext;