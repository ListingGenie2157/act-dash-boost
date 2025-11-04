import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app',
};

// Checkpoint questions are stored as simple arrays in the database
// Format: [question, optA, optB, optC, optD, answer_letter, explanation, difficulty]

// Normalize skill codes to handle formatting issues
function normalizeSkillCode(code: string): string {
  return code
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '') // Remove zero-width characters
    .replace(/[·•‧⋅・｡。．]/g, '.') // Replace dot-like chars with period
    .replace(/\s*\.\s*/g, '.') // Collapse spaces around separators
    .trim()
    .toUpperCase();
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
  checkpoint_quiz_q1?: string | string[];
  checkpoint_quiz_q2?: string | string[];
  checkpoint_quiz_q3?: string | string[];
  checkpoint_quiz_q4?: string | string[];
  checkpoint_quiz_q5?: string | string[];
  checkpoint_quiz_q6?: string | string[];
  checkpoint_quiz_q7?: string | string[];
  checkpoint_quiz_q8?: string | string[];
  checkpoint_quiz_q9?: string | string[];
  checkpoint_quiz_q10?: string | string[];
  recap?: string;
  estimated_minutes?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

// Parse checkpoint question from pipe-delimited string to array format
// Input: "question || A) opt || B) opt || C) opt || D) opt || ANSWER: B || explanation || medium"
// Output: [question, optA, optB, optC, optD, "B", explanation, difficulty]
function parseCheckpointQuestion(raw: string, questionNumber: number): string[] | null {
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
  const answerLetter = answerMatch[1].toUpperCase();
  
  const explanation = parts[6].replace(/^["']|["']$/g, '');
  const difficulty = parts[7] || 'medium';
  
  // Return as simple array: [question, optA, optB, optC, optD, answer, explanation, difficulty]
  return [question, ...options, answerLetter, explanation, difficulty];
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
        // Normalize skill_code
        const originalCode = lesson.skill_code;
        const normalizedCode = normalizeSkillCode(originalCode);
        
        if (originalCode !== normalizedCode) {
          console.log(`Normalized skill code: "${originalCode}" → "${normalizedCode}"`);
        }
        
        // Validate skill_code exists
        const { data: skill, error: skillError } = await supabase
          .from('skills')
          .select('id, name')
          .eq('id', normalizedCode)
          .maybeSingle();

        if (skillError || !skill) {
          results.errors.push({
            skill_code: originalCode,
            error: `Skill not found in database (normalized to: ${normalizedCode})`,
          });
          console.warn(`Skill not found: original="${originalCode}", normalized="${normalizedCode}"`);
          continue;
        }

        // Parse objectives
        const objectives = lesson.objectives 
          ? (typeof lesson.objectives === 'string' 
              ? lesson.objectives.split('|').map(s => s.trim()).filter(Boolean)
              : lesson.objectives)
          : [];

        // Parse checkpoint quiz questions into individual columns
        const quizData: Record<string, string[] | null> = {};
        for (let i = 1; i <= 10; i++) {
          const key = `checkpoint_quiz_q${i}` as keyof LessonContentInput;
          const rawQ = lesson[key];
          if (rawQ) {
            if (typeof rawQ === 'string') {
              const parsed = parseCheckpointQuestion(rawQ, i);
              quizData[`checkpoint_quiz_q${i}`] = parsed;
            } else if (Array.isArray(rawQ)) {
              // Already an array, use as-is
              quizData[`checkpoint_quiz_q${i}`] = rawQ;
            }
          } else {
            quizData[`checkpoint_quiz_q${i}`] = null;
          }
        }

        // Upsert lesson content
        const { error: upsertError } = await supabase
          .from('lesson_content')
          .upsert({
            skill_code: normalizedCode,
            overview_html: lesson.overview_html,
            objectives: objectives,
            concept_explanation: lesson.concept_explanation,
            guided_practice: lesson.guided_practice || '',
            error_analysis: lesson.error_analysis || '',
            common_traps: lesson.common_traps || null,
            independent_practice: lesson.independent_practice || null,
            independent_practice_answers: lesson.independent_practice_answers || null,
            checkpoint_quiz_q1: quizData.checkpoint_quiz_q1,
            checkpoint_quiz_q2: quizData.checkpoint_quiz_q2,
            checkpoint_quiz_q3: quizData.checkpoint_quiz_q3,
            checkpoint_quiz_q4: quizData.checkpoint_quiz_q4,
            checkpoint_quiz_q5: quizData.checkpoint_quiz_q5,
            checkpoint_quiz_q6: quizData.checkpoint_quiz_q6,
            checkpoint_quiz_q7: quizData.checkpoint_quiz_q7,
            checkpoint_quiz_q8: quizData.checkpoint_quiz_q8,
            checkpoint_quiz_q9: quizData.checkpoint_quiz_q9,
            checkpoint_quiz_q10: quizData.checkpoint_quiz_q10,
            recap: lesson.recap || null,
            estimated_minutes: lesson.estimated_minutes || 15,
            difficulty: lesson.difficulty || 'medium',
          }, {
            onConflict: 'skill_code',
          });

        if (upsertError) {
          console.error(`❌ FULL ERROR for ${lesson.skill_code}:`, JSON.stringify(upsertError, null, 2));
          results.errors.push({
            skill_code: lesson.skill_code,
            error: upsertError.message,
          });
        } else {
          const quizCount = Object.values(quizData).filter(q => q !== null).length;
          results.success.push(skill.name);
          console.log(`✅ Imported: ${skill.name} (${quizCount} checkpoint questions)`);
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
