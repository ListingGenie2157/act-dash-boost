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
    .replace(/\u00A0/g, '') // Remove non-breaking spaces
    .replace(/[·•‧⋅・｡。．]/g, '.') // Replace dot-like chars with period
    .replace(/\s*\.\s*/g, '.') // Collapse spaces around separators
    .trim()
    .toUpperCase();
}

// Resolve skill by code or id
async function resolveSkill(supabaseAdmin: any, ref: string): Promise<{ id: string; name: string } | null> {
  const normalized = normalizeSkillCode(ref);
  
  // Try to find skill by id or code
  const { data: skill, error } = await supabaseAdmin
    .from('skills')
    .select('id, name, code')
    .or(`id.eq.${normalized},code.eq.${normalized}`)
    .maybeSingle();
    
  if (error) {
    console.error('Error resolving skill:', error);
    return null;
  }
  
  return skill ? { id: skill.id, name: skill.name } : null;
}

interface LessonContentInput {
  skill_code: string;
  overview_html: string;
  objectives?: string | string[];
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
      success: [] as { skill_code: string }[],
      errors: [] as { skill_code: string; error: string }[],
    };

    for (const lesson of lessons) {
      try {
        const originalSkillCode = lesson.skill_code;
        const normalizedSkillCode = normalizeSkillCode(originalSkillCode);
        
        // Log if normalization changed the code
        if (originalSkillCode !== normalizedSkillCode) {
          console.log(`Skill code normalized: "${originalSkillCode}" → "${normalizedSkillCode}"`);
        }

        // Resolve skill by id or code
        const skill = await resolveSkill(supabase, normalizedSkillCode);

        if (!skill) {
          results.errors.push({
            skill_code: originalSkillCode,
            error: `Skill not found in database (original: "${originalSkillCode}", normalized: "${normalizedSkillCode}")`,
          });
          console.error(`Skill resolution failed for: ${normalizedSkillCode}`);
          continue;
        }

        // Parse objectives (array) and also prepare text version for DB
        const objectives = lesson.objectives 
          ? (typeof lesson.objectives === 'string' 
              ? lesson.objectives.split('|').map((s: string) => s.trim()).filter(Boolean)
              : lesson.objectives)
          : [];
        const objectivesText = Array.isArray(objectives) ? objectives.join('\n') : String((objectives as any) ?? '');
        // Safely coerce estimated_minutes to a number
        const estRaw = (lesson.estimated_minutes as any);
        const estNum = Number(estRaw);
        const estimatedMinutes = Number.isFinite(estNum) && estNum > 0 ? estNum : 15;
        
        console.log(`📝 ${normalizedSkillCode}: skill_id=${skill.id}, estimated_minutes=${estimatedMinutes} (raw: ${estRaw})`);

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

        // Upsert lesson content using resolved skill_id and normalized skill_code
        const { error: upsertError } = await supabase
          .from('lesson_content')
          .upsert({
            skill_code: normalizedSkillCode, // Human-readable code
            skill_id: skill.id, // FK to skills.id (may be UUID or code)
            overview_html: lesson.overview_html,
            objectives: objectivesText,
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
            estimated_minutes: estimatedMinutes,
            difficulty: (() => { const d = (lesson.difficulty || 'medium').toString().toLowerCase(); return d === 'easy' ? 1 : d === 'hard' ? 3 : 2; })(),
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
          results.success.push({ skill_code: normalizedSkillCode });
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
        success_count: results.success.length,
        error_count: results.errors.length,
        total_processed: lessons.length,
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