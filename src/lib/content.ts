import { supabase } from '@/integrations/supabase/client';

export async function getLessonBySkill(skill_code: string) {
  // Since there's no lessons table, we fetch from skills table
  const { data, error } = await supabase
    .from('skills')
    .select('id, name, description, subject, cluster, order_index, prereq_skill_ids, created_at')
    .eq('id', skill_code)
    .maybeSingle();
  
  // Transform skill data into lesson-like format
  const lesson = data ? {
    id: data.id,
    title: data.name,
    body: data.description || 'No content available',
    skill_code: data.id,
    subject: data.subject,
  } : null;
  
  return { data: lesson, error };
}

export async function getQuestionsBySkill(skill_code: string, n: number) {
  const { data, error } = await supabase
    .from('questions')
    .select('id, stem, choice_a, choice_b, choice_c, choice_d, answer, explanation, skill_id, difficulty, time_limit_secs')
    .eq('skill_id', skill_code)
export async function getQuestionsBySkill(skillId: string, n: number) {
  const { data, error } = await supabase
    .from('questions')
    .select('id, stem, choice_a, choice_b, choice_c, choice_d, answer, explanation, skill_id, difficulty')
    .eq('skill_id', skillId)
    .limit(n);
  return { data, error };
}

export async function getFullTestPackage(id = 'act') {
  const { data, error } = await supabase
    .from('test_packages')
    .select('id, name, description, sections, created_at, updated_at')
    .eq('id', id)
    .maybeSingle();
  return { data, error };
}
