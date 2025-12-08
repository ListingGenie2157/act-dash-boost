// src/types/api.ts
import type { ACTSection, TaskType, TaskStatus } from '@/lib/constants';

export interface StudyPlanTask {
  id: string;
  user_id: string;
  study_date: string; // ISO
  section: ACTSection;
  task_type: TaskType;
  status: TaskStatus;
  skill_code: string | null;
  lesson_id?: string | null;
  drill_id?: string | null;
  form_id?: string | null;
  completed_at?: string | null;
}

export interface GenerateStudyPlanRequest {
  user_id: string;
  test_date: string; // ISO
  baseline_scores?: Partial<Record<ACTSection, number>>;
  weak_skills?: string[];
}

export interface GenerateStudyPlanResponse {
  success: true;
  created_tasks: StudyPlanTask[];
}
