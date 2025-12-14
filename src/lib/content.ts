import { supabase } from '@/integrations/supabase/client';

/**
 * Resolve a skill reference (code or id) to a skill id
 */
export async function resolveSkillId(ref: string): Promise<string | null> {
  const normalized = ref.trim().toUpperCase();
  
  const { data: skill, error } = await supabase
    .from('skills')
    .select('id')
    .or(`id.eq.${normalized},code.eq.${normalized}`)
    .maybeSingle();
    
  if (error || !skill) {
    console.error('Skill resolution failed for:', ref, error);
    return null;
  }
  
  return skill.id;
}

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
  // Resolve skill_code to skill_id first
  const skillId = await resolveSkillId(skill_code);
  
  if (!skillId) {
    return { data: null, error: new Error(`Skill not found: ${skill_code}`) };
  }
  
  const { data, error } = await supabase
    .from('questions')
    .select('id, stem, choice_a, choice_b, choice_c, choice_d, answer, explanation, skill_id, difficulty, time_limit_secs')
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
