export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Lesson {
  id: string;
  title: string;
  subject: 'math' | 'english';
  concept: string;
  examples: string[];
  practiceQuestions: Question[];
  quiz: Question[];
}

export interface Day {
  day: number;
  mathLesson: Lesson;
  englishLesson: Lesson;
  completed: boolean;
}

export interface DrillSession {
  id: string;
  subject: 'math' | 'english';
  title: string;
  timeLimit: number; // seconds
  questions: Question[];
}

export interface UserProgress {
  currentDay: number;
  completedDays: number[];
  scores: {
    [lessonId: string]: {
      practiceScore: number;
      quizScore: number;
      drillScore?: number;
    };
  };
  wrongAnswers: {
    questionId: string;
    question: Question;
    userAnswer: number;
    timestamp: Date;
  }[];
  weakAreas: {
    subject: 'math' | 'english';
    topic: string;
    errorCount: number;
  }[];
}

export interface TimerState {
  timeLeft: number;
  isActive: boolean;
  isCompleted: boolean;
}