import { useState, useEffect } from 'react';
import type { UserProgress, LegacyQuestion } from '../types';

const initialProgress: UserProgress = {
  currentDay: 1,
  completedDays: [],
  scores: {},
  wrongAnswers: [],
  weakAreas: []
};

export const useProgress = () => {
  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('act-prep-progress');
    return saved ? JSON.parse(saved) : initialProgress;
  });

  useEffect(() => {
    localStorage.setItem('act-prep-progress', JSON.stringify(progress));
  }, [progress]);

  const updateProgress = (updates: Partial<UserProgress>) => {
    setProgress(prev => ({ ...prev, ...updates }));
  };

  const addWrongAnswer = (questionId: string, question: LegacyQuestion, userAnswer: number) => {
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

  const updateWeakAreas = (subject: 'Math' | 'English', topic: string) => {
    setProgress(prev => {
      const existingArea = prev.weakAreas.find(area => area.subject === subject && area.topic === topic);
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
        : [...prev.completedDays, day]
    }));
  };

  const resetProgress = () => {
    setProgress(initialProgress);
    localStorage.removeItem('act-prep-progress');
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

  return {
    progress,
    updateProgress,
    addWrongAnswer,
    updateWeakAreas,
    completeDay,
    updateScore,
    resetProgress
  };
};