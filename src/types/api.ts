/**
 * Shared API Types
 * 
 * These types define the contracts between frontend and Edge Functions.
 * Keep these in sync with Zod schemas in Edge Functions.
 */

// =============================================================================
// Common Types
// =============================================================================

export type Section = 'EN' | 'MATH' | 'RD' | 'SCI';
export type Subject = 'English' | 'Math' | 'Reading' | 'Science';
export type SessionMode = 'simulation' | 'practice' | 'booster';
export type TaskType = 'LEARN' | 'DRILL' | 'MIXED' | 'REVIEW' | 'SIM';
export type TaskStatus = 'PENDING' | 'STARTED' | 'COMPLETED' | 'SKIPPED';
export type Answer = 'A' | 'B' | 'C' | 'D' | 'E';
export type StudyMode = 'CRASH' | 'ACCEL' | 'MASTERY';
export type PlanMode = 'PERSONALIZED' | 'BALANCED' | null;

// =============================================================================
// Session API Types
// =============================================================================

/** Input for session-start Edge Function */
export interface SessionStartRequest {
  form_id: string;
  section: Section;
  mode: SessionMode;
  coached?: boolean;
}

/** Output from session-start Edge Function */
export interface SessionStartResponse {
  session_id: string;
  time_limit_sec: number;
}

/** Input for submit-response Edge Function */
export interface SubmitResponseRequest {
  session_id: string;
  question_id: string;
  selected: Answer;
  time_ms?: number;
}

/** Output from submit-response Edge Function */
export interface SubmitResponseResponse {
  success: boolean;
  correct: boolean;
}

/** Input for session-finish Edge Function */
export interface SessionFinishRequest {
  session_id: string;
}

/** Output from session-finish Edge Function */
export interface SessionFinishResponse {
  summary: {
    total_questions: number;
    correct_answers: number;
    raw_score: number;
    accuracy: number;
    avg_time_ms: number;
  };
  per_skill: Array<{
    skill_id: string;
    correct: number;
    total: number;
    accuracy: number;
    avg_time_ms: number;
  }>;
}

// =============================================================================
// Study Plan API Types
// =============================================================================

/** A single task in a study plan */
export interface StudyPlanTask {
  sequence?: number;
  type: TaskType;
  skill_id?: string | null;
  question_id?: string | null;
  size: number;
  estimated_mins: number;
  title: string;
}

/** Input for generate-study-plan Edge Function */
export interface GenerateStudyPlanRequest {
  force?: boolean;
}

/** Output from generate-study-plan Edge Function */
export interface GenerateStudyPlanResponse {
  days: Array<{
    the_date: string;
    tasks: StudyPlanTask[];
  }>;
  mode: StudyMode;
  days_left: number | null;
  lessons_remaining: number;
  lessons_per_day: number;
  total_tasks: number;
}

// =============================================================================
// Complete Task API Types
// =============================================================================

/** Answer record for task completion */
export interface TaskAnswer {
  question_id: string;
  user_answer: Answer;
  correct: boolean;
  time_ms: number;
}

/** Input for complete-task Edge Function */
export interface CompleteTaskRequest {
  task_id: string;
  accuracy: number;
  time_ms: number;
  answers?: TaskAnswer[];
}

/** Output from complete-task Edge Function */
export interface CompleteTaskResponse {
  id: string;
  status: TaskStatus;
  accuracy: number;
  median_time_ms: number;
  message: string;
  answers_processed: number;
}

// =============================================================================
// Diagnostic API Types
// =============================================================================

/** A question in a diagnostic block */
export interface DiagnosticQuestion {
  id: string;
  skill_tags?: string[];
}

/** An answer in a diagnostic block */
export interface DiagnosticAnswer {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
}

/** A block of questions in a diagnostic */
export interface DiagnosticBlock {
  questions: DiagnosticQuestion[];
  answers: DiagnosticAnswer[];
}

/** Input for finish-diagnostic Edge Function */
export interface FinishDiagnosticRequest {
  section: Subject;
  blocks: DiagnosticBlock[];
}

/** Weak skill identified from diagnostic */
export interface WeakSkillResult {
  skill: string;
  accuracy: number;
  total: number;
}

/** Output from finish-diagnostic Edge Function */
export interface FinishDiagnosticResponse {
  predicted_section_score: number;
  top_5_weak_skills: WeakSkillResult[];
  diagnostic_id: string;
}

// =============================================================================
// Tutor Chat API Types
// =============================================================================

/** Message in a tutor chat */
export interface TutorMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

/** Problem context for tutor */
export interface TutorProblem {
  id: string | null;
  text: string;
  choices?: string[];
  user_answer?: string;
  user_work?: string;
}

/** Input for tutor-chat Edge Function */
export interface TutorChatRequest {
  subject: string;
  topic: string;
  mode: 'practice' | 'quiz' | 'test';
  problem: TutorProblem;
  messages: TutorMessage[];
  session_id?: string;
}

/** Output from tutor-chat Edge Function */
export interface TutorChatResponse {
  assistant_message: string;
  session_id: string;
}

// =============================================================================
// Days Left API Types
// =============================================================================

/** Output from days-left Edge Function */
export interface DaysLeftResponse {
  days_left: number | null;
  test_date: string | null;
  study_mode: StudyMode;
}

// =============================================================================
// Magic String Constants
// =============================================================================

/** Valid form IDs for simulations and diagnostics */
export const FORM_IDS = {
  DIAGNOSTIC: ['ONB', 'D2EN', 'D2MA', 'D2RD', 'D2SCI'],
  ENGLISH: ['EN_A', 'EN_B', 'EN_C', 'FA_EN', 'FB_EN', 'FC_EN'],
  MATH: ['MATH_A', 'MATH_B', 'MATH_C', 'FA_MATH', 'FB_MATH', 'FC_MATH'],
  READING: ['RD_A', 'RD_B', 'RD_C', 'FA_RD', 'FB_RD', 'FC_RD'],
  SCIENCE: ['SCI_A', 'SCI_B', 'SCI_C', 'FA_SCI', 'FB_SCI', 'FC_SCI'],
} as const;

/** Time limits by section (in seconds) */
export const SECTION_TIME_LIMITS: Record<Section, number> = {
  EN: 45 * 60,   // 45 minutes
  MATH: 60 * 60, // 60 minutes
  RD: 35 * 60,   // 35 minutes
  SCI: 35 * 60,  // 35 minutes
};

/** Section to subject mapping */
export const SECTION_TO_SUBJECT: Record<Section, Subject> = {
  EN: 'English',
  MATH: 'Math',
  RD: 'Reading',
  SCI: 'Science',
};

/** Subject to section mapping */
export const SUBJECT_TO_SECTION: Record<Subject, Section> = {
  English: 'EN',
  Math: 'MATH',
  Reading: 'RD',
  Science: 'SCI',
};
