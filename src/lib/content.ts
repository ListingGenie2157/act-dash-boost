import { supabase } from '@/integrations/supabase/client';

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
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return { data, error };
}
