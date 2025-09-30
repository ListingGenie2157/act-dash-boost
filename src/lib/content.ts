import { supabase } from '@/integrations/supabase/client';

export async function getLessonBySkill(skill_code: string) {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('skill_code', skill_code)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  return { data, error };
}

export async function getQuestionsBySkill(skill_code: string, n: number) {
  const { data, error } = await supabase
    .from('questions')
    .select('id, stem, choice_a, choice_b, choice_c, choice_d, answer, explanation, skill_code, section')
    .eq('skill_code', skill_code)
    .limit(n);
  return { data, error };
}

export async function getFullTestPackage(id = 'act') {
  const { data, error } = await supabase
    .from('test_packages')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return { data, error };
}
