import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckpointQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface LessonContentInput {
  skill_code: string;
  overview_html: string;
  objectives?: string[];
  concept_explanation: string;
  guided_practice?: string;
  error_analysis?: string;
  common_traps?: string;
  independent_practice?: string;
  independent_practice_answers?: string;
  checkpoint_quiz_q1?: string;
  checkpoint_quiz_q2?: string;
  checkpoint_quiz_q3?: string;
  checkpoint_quiz_q4?: string;
  checkpoint_quiz_q5?: string;
  checkpoint_quiz_q6?: string;
  checkpoint_quiz_q7?: string;
  checkpoint_quiz_q8?: string;
  checkpoint_quiz_q9?: string;
  checkpoint_quiz_q10?: string;
  recap?: string;
  estimated_minutes?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

function parseCheckpointQuestion(raw: string, questionNumber: number): CheckpointQuestion | null {
  if (!raw || raw.trim() === '') return null;
  
  const parts = raw.split('||').map(s => s.trim());
  
  if (parts.length < 7) {
    console.warn(`Question ${questionNumber} has only ${parts.length} parts, expected at least 7`);
    return null;
  }
  
  const question = parts[0];
  
  const options = [
    parts[1].replace(/^[A-D]\)\s*/, ''),
    parts[2].replace(/^[A-D]\)\s*/, ''),
    parts[3].replace(/^[A-D]\)\s*/, ''),
    parts[4].replace(/^[A-D]\)\s*/, '')
  ];
  
  const answerPart = parts[5];
  const answerMatch = answerPart.match(/ANSWER:\s*([A-D])/i);
  if (!answerMatch) {
    console.warn(`Question ${questionNumber} has invalid answer format: ${answerPart}`);
    return null;
  }
  const correctAnswer = answerMatch[1].toUpperCase().charCodeAt(0) - 65;
  
  const explanation = parts[6].replace(/^["']|["']$/g, '');
  const difficulty = parts[7] || 'medium';
  
  return {
    id: `checkpoint_q${questionNumber}`,
    question,
    options,
    correctAnswer,
    explanation,
    difficulty: difficulty as 'easy' | 'medium' | 'hard'
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: adminCheck, error: adminError } = await supabase.rpc('is_admin', {
      user_email: user.email,
    });

    if (adminError || !adminCheck) {
      throw new Error('Unauthorized: Admin access required');
    }

    const body = await req.json();
    const lessons: LessonContentInput[] = Array.isArray(body) ? body : [body];

    console.log(`📚 Processing ${lessons.length} lesson(s) for import`);

    const results = {
      success: [] as string[],
      errors: [] as { skill_code: string; error: string }[],
    };

    for (const lesson of lessons) {
      try {
        // Validate skill_code exists
        const { data: skill, error: skillError } = await supabase
          .from('skills')
          .select('id, name')
          .eq('id', lesson.skill_code)
          .maybeSingle();

        if (skillError || !skill) {
          results.errors.push({
            skill_code: lesson.skill_code,
            error: 'Skill not found in database',
          });
          continue;
        }

        // Parse objectives
        const objectives = lesson.objectives 
          ? (typeof lesson.objectives === 'string' 
              ? lesson.objectives.split('|').map(s => s.trim()).filter(Boolean)
              : lesson.objectives)
          : [];

        // Parse checkpoint quiz questions
        const checkpointQuestions: CheckpointQuestion[] = [];
        for (let i = 1; i <= 10; i++) {
          const key = `checkpoint_quiz_q${i}` as keyof LessonContentInput;
          const rawQ = lesson[key];
          if (rawQ && typeof rawQ === 'string') {
            const parsed = parseCheckpointQuestion(rawQ, i);
            if (parsed) checkpointQuestions.push(parsed);
          }
        }

        // Upsert lesson content
        const { error: upsertError } = await supabase
          .from('lesson_content')
          .upsert({
            skill_code: lesson.skill_code,
            overview_html: lesson.overview_html,
            objectives: objectives,
            concept_explanation: lesson.concept_explanation,
            guided_practice: lesson.guided_practice || '',
            error_analysis: lesson.error_analysis || '',
            common_traps: lesson.common_traps || null,
            independent_practice: lesson.independent_practice || null,
            independent_practice_answers: lesson.independent_practice_answers || null,
            checkpoint_quiz_questions: checkpointQuestions,
            recap: lesson.recap || null,
            estimated_minutes: lesson.estimated_minutes || 15,
            difficulty: lesson.difficulty || 'medium',
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'skill_code',
          });

        if (upsertError) {
          results.errors.push({
            skill_code: lesson.skill_code,
            error: upsertError.message,
          });
          console.error(`❌ Error importing ${skill.name}:`, upsertError);
        } else {
          results.success.push(skill.name);
          console.log(`✅ Imported: ${skill.name} (${checkpointQuestions.length} checkpoint questions)`);
        }
      } catch (err) {
        results.errors.push({
          skill_code: lesson.skill_code,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    console.log(`✅ Import complete: ${results.success.length} succeeded, ${results.errors.length} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        imported: results.success.length,
        failed: results.errors.length,
        details: results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('❌ Import error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
