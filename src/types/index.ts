// Database Question type (from questions table)
export interface Question {
  id: string;
  stem: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  answer: string;
  explanation?: string;
  skill_code?: string;
  section?: string;
  ord?: number;
  form_id?: string;
  passage_id?: string | null;
  passage_title?: string | null;
  passage_text?: string | null;
}

// Legacy Question type for curriculum/lesson data
export interface LegacyQuestion {
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
  practiceQuestions: LegacyQuestion[];
  quiz: LegacyQuestion[];
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
  questions: LegacyQuestion[];
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
  question: LegacyQuestion;
  userAnswer: number;
  timestamp: Date;
}

export interface WeakArea {
  subject: 'Math' | 'English';
  topic: string;
  errorCount: number;
}

export interface SupabaseClientLike {
  from: (table: string) => {
    select: (columns?: string) => Promise<{ data: unknown; error: unknown }>;
    insert: (data: unknown) => Promise<{ data: unknown; error: unknown }>;
    update: (data: unknown) => Promise<{ data: unknown; error: unknown }>;
    delete: () => Promise<{ data: unknown; error: unknown }>;
  };
  auth: {
    getUser: () => Promise<{ data: { user: unknown }; error: unknown }>;
    signUp: (credentials: { email: string; password: string }) => Promise<{ data: unknown; error: unknown }>;
    signIn: (credentials: { email: string; password: string }) => Promise<{ data: unknown; error: unknown }>;
  };
  functions: {
    invoke: (name: string, options?: { body?: unknown }) => Promise<{ data: unknown; error: unknown }>;
  };
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
  question: LegacyQuestion;
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
  type: 'DRILL' | 'REVIEW' | 'LEARN' | 'SIM' | 'FLASH';
  skill_id: string | null;
  the_date: string;
  status: string | null;
  size: number;
  accuracy: number | null;
  median_time_ms: number | null;
  reward_cents: number | null;
  created_at: string | null;
  // Joined skill data (optional)
  skills?: {
    name: string;
    subject: string;
  } | null;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  subject: string;
  cluster: string;
  order_index: number;
  prereq_skill_ids: string[] | null;
  created_at: string | null;
}

export interface StudyPlanTask {
  type: string;
  size?: number;
  estimated_mins?: number;
  skill_code?: string; // Legacy field name
  skill_id?: string; // Current field name
  content_hint?: string;
  title?: string;
}

export interface StudyPlanDay {
  the_date: string;
  user_id: string;
  tasks_json: StudyPlanTask[] | null;
  generated_at: string | null;
}