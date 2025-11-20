export type TutorSubject = 'AP_CHEM' | 'ACT_MATH' | 'ENGLISH' | 'SCIENCE' | 'MATH' | 'READING';
export type TutorMode = 'practice' | 'quiz' | 'test';
export type TutorRole = 'user' | 'assistant' | 'system';

export interface TutorMessage {
  id: string;
  role: TutorRole;
  content: string;
  createdAt: Date;
}

export interface TutorProblem {
  id: string | null;
  text: string;
  choices?: string[];
  user_answer?: string;
  user_work?: string;
}

export interface TutorContextData {
  subject: TutorSubject;
  topic: string;
  mode: TutorMode;
  problem: TutorProblem | null;
}

export interface TutorChatRequest {
  user_id?: string;
  subject: TutorSubject;
  topic: string;
  mode: TutorMode;
  problem: TutorProblem;
  messages: Array<{
    role: TutorRole;
    content: string;
    timestamp?: string;
  }>;
  session_id?: string;
}

export interface TutorChatResponse {
  assistant_message: string;
  session_id?: string;
}
