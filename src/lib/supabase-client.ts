import type { SupabaseClient } from '@supabase/supabase-js';

export interface TaskCompletionParams {
  taskId: string;
  correctCount: number;
  totalCount: number;
  medianTimeMs: number;
}

export async function completeTask(
  supabase: SupabaseClient,
  params: TaskCompletionParams
) {
  const { data, error } = await supabase.functions.invoke('complete-task', {
    body: {
      task_id: params.taskId,
      accuracy: params.correctCount / params.totalCount,
      time_ms: params.medianTimeMs
    }
  });

  if (error) {
    throw error;
  }

  return data;
}

export interface StudyPlanParams {
  userId: string;
  targetDate?: string;
}

export async function generateStudyPlan(
  supabase: SupabaseClient,
  params?: StudyPlanParams
) {
  const { data, error } = await supabase.functions.invoke('generate-study-plan', {
    body: params || {}
  });

  if (error) {
    throw error;
  }

  return data;
}

export interface DiagnosticParams {
  sections: Array<{
    section: string;
    score: number;
    notes?: string;
  }>;
}

export async function submitDiagnostic(
  supabase: SupabaseClient,
  params: DiagnosticParams
) {
  const { data, error } = await supabase.functions.invoke('finish-diagnostic', {
    body: params
  });

  if (error) {
    throw error;
  }

  return data;
}