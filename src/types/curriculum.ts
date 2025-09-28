// Curriculum types following proper architecture spec

export interface Lesson {
  id: string;
  subject: 'English' | 'Math' | 'Reading' | 'Science';
  title: string;
  body: string;
  skill_code: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  subject: 'English' | 'Math' | 'Reading' | 'Science';
  stem: string;
  choices: string[]; // JSON array of choices
  answer: string; // Correct answer key
  explanation?: string;
  skill_code: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface StudyPlan {
  id: string;
  user_id: string;
  test_date: string; // ISO date
  target_math?: number; // 1-36
  target_english?: number; // 1-36
  created_at: string;
  updated_at: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  date: string; // ISO date
  topic: string;
  skill_code?: string;
  materials_ref?: any; // JSONB reference to lesson/question IDs
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  created_at: string;
  updated_at: string;
}

export interface PracticeAttempt {
  id: string;
  user_id: string;
  started_at: string;
  finished_at?: string;
  session_type: 'practice' | 'diagnostic' | 'quiz';
}

export interface PracticeItem {
  id: string;
  attempt_id: string;
  question_id: string;
  choice?: string; // User's selected answer
  correct: boolean;
  time_ms: number;
  created_at: string;
}

export interface ProgressAggregate {
  user_id: string;
  domain: string; // 'English', 'Math', 'Reading', 'Science', 'Algebra', 'Grammar', etc.
  mastery_pct: number;
  last_updated: string;
}

export interface UserSettings {
  user_id: string;
  email_opt_in: boolean;
  timezone: string;
  created_at: string;
  updated_at: string;
}

// Domain mappings for skill codes
export const SKILL_DOMAINS = {
  // English domains
  'E1': 'Grammar',
  'E2': 'Grammar',
  'E3': 'Grammar',
  'E4': 'Style',
  'E5': 'Punctuation',
  'E6': 'Punctuation',
  'E7': 'Structure',
  'E8': 'Rhetoric',

  // Math domains
  'M1': 'Number & Quantity',
  'M2': 'Algebra',
  'M3': 'Algebra',
  'M4': 'Functions',
  'M5': 'Functions',
  'M6': 'Geometry',
  'M7': 'Geometry',
  'M8': 'Trigonometry',
  'M9': 'Statistics',
  'M10': 'Modeling',

  // Reading domains
  'R1': 'Comprehension',
  'R2': 'Analysis',
  'R3': 'Structure',
  'R4': 'Integration',
  'R5': 'Strategy',

  // Science domains
  'S1': 'Data',
  'S2': 'Research',
  'S3': 'Viewpoints',
  'S4': 'Analysis',
  'S5': 'Strategy'
} as const;

export type SkillCode = keyof typeof SKILL_DOMAINS;
export type Domain = typeof SKILL_DOMAINS[SkillCode];