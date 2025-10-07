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
    .from('questions_secure')
    .select('id, stem, choice_a, choice_b, choice_c, choice_d, skill_code, section, difficulty, time_limit_secs')
    .eq('skill_code', skill_code)
    .limit(n);
  return { data, error };
}

export async function checkAnswer(questionId: string, userAnswer: string) {
  const { data, error } = await supabase
    .rpc('check_answer', {
      p_question_id: questionId,
      p_user_answer: userAnswer
    });
  return { data: data?.[0], error };
}

export async function getFullTestPackage(id = 'act') {
  const { data, error } = await supabase
    .from('test_packages')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return { data, error };
}
