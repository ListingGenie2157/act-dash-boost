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
  subject: 'Math' | 'English';
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
  subject: 'Math' | 'English';
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
  wrongAnswers: WrongAnswer[];
  weakAreas: WeakArea[];
}

export interface WrongAnswer {
  questionId: string;
  question: Question;
  userAnswer: number;
  timestamp: Date;
}

export interface WeakArea {
  subject: 'Math' | 'English';
  topic: string;
  errorCount: number;
}

export interface SupabaseClientLike {
  from: (table: string) => any;
  auth: any;
  functions: any;
}

export interface TimerState {
  timeLeft: number;
  isActive: boolean;
  isCompleted: boolean;
}

export interface DrillResult {
  questionId: string;
  correct: boolean;
  elapsedMs: number;
}

export type DrillResults = DrillResult[];

export interface QuizAnswer {
  questionId: string;
  question: Question;
  userAnswer: number;
}

export type QuizAnswers = QuizAnswer[];

export interface DiagnosticResults {
  score: number;
  section: string;
  completedAt: string;
  weakSkills?: WeakArea[];
}

export interface StudyTask {
  id: string;
  user_id: string;
  type: string; // This comes from the database as string
  skill_id: string;
  the_date: string;
  status: string;
  size: number;
  accuracy: number;
  median_time_ms: number;
  reward_cents: number;
  created_at: string;
}