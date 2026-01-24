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

// Note: getLessonBySkill and getFullTestPackage were removed as dead code.
// These functions queried non-existent columns and were never used.

interface DrillQuestion {
  id: string;
  stem: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  skill_id: string | null;
  difficulty: number;
  time_limit_secs: number;
}

export async function getQuestionsBySkill(skill_code: string, n: number): Promise<{ data: DrillQuestion[] | null; error: Error | null }> {
  // Resolve skill_code to skill_id first
  const skillId = await resolveSkillId(skill_code);
  
  if (!skillId) {
    return { data: null, error: new Error(`Skill not found: ${skill_code}`) };
  }
  
  // Query v_staging_items_public for drill questions (excludes answer/explanation for security)
  const { data, error } = await supabase
    .from('v_staging_items_public')
    .select('staging_id, question, choice_a, choice_b, choice_c, choice_d, skill_code, difficulty, form_id')
    .eq('skill_code', skillId)
    .like('form_id', 'DR_%')
    .limit(n);

  if (error) {
    return { data: null, error };
  }

  // Map v_staging_items_public format to expected question format
  // Note: answer/explanation are NOT included (server-side validation only)
  const mappedData: DrillQuestion[] = (data || [])
    .filter(item => item.staging_id !== null)
    .map(item => ({
      id: item.staging_id!.toString(),
      stem: item.question || '',
      choice_a: item.choice_a || '',
      choice_b: item.choice_b || '',
      choice_c: item.choice_c || '',
      choice_d: item.choice_d || '',
      skill_id: item.skill_code,
      difficulty: item.difficulty === 'easy' ? 1 : item.difficulty === 'hard' ? 3 : 2,
      time_limit_secs: 45,
    }));

  return { data: mappedData, error: null };
}
