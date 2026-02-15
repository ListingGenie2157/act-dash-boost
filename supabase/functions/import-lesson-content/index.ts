import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, getClientIp, createRateLimitResponse } from '../_shared/rateLimit.ts';
import { parseBodyWithLimit } from '../_shared/mod.ts';

type SupabaseClientLike = ReturnType<typeof createClient>;

// Normalize skill codes to handle formatting issues
function normalizeSkillCode(code: string): string {
  return code
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
    .replace(/\u00A0/g, '')
    .replace(/[·•‧⋅・｡。．]/g, '.')
    .replace(/\s*\.\s*/g, '.')
    .trim()
    .toUpperCase();
}

async function resolveSkill(supabaseAdmin: SupabaseClientLike, ref: string): Promise<{ id: string; name: string } | null> {
  const normalized = normalizeSkillCode(ref);
  
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
  
  return [question, ...options, answerLetter, explanation, difficulty];
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return new Response(JSON.stringify({ success: false, error: 'Server misconfigured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use authenticated (anon-key) client for auth verification
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: isAdmin, error: adminError } = await supabaseAuth.rpc('is_admin');
    if (adminError || !isAdmin) {
      return new Response(JSON.stringify({ success: false, error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting: 5 imports per minute
    const clientIp = getClientIp(req);
    const isAllowed = await checkRateLimit(user.id, clientIp, 'import-lesson-content', 5, 60000);
    if (!isAllowed) {
      return createRateLimitResponse(corsHeaders);
    }

    // Service-role client for imports
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const parsed = await parseBodyWithLimit(req, corsHeaders);
    if ('error' in parsed) return parsed.error;
    const body = parsed.data;
    const lessons: LessonContentInput[] = Array.isArray(body) ? body : [body];

    const results = {
      success: [] as { skill_code: string }[],
      errors: [] as { skill_code: string; error: string }[],
    };

    for (const lesson of lessons) {
      try {
        const originalSkillCode = lesson.skill_code;
        const normalizedSkillCode = normalizeSkillCode(originalSkillCode);

        const skill = await resolveSkill(supabase, normalizedSkillCode);

        if (!skill) {
          results.errors.push({
            skill_code: originalSkillCode,
            error: `Skill not found in database (original: "${originalSkillCode}", normalized: "${normalizedSkillCode}")`,
          });
          continue;
        }

        const objectivesArr: string[] = (() => {
          const raw = lesson.objectives;
          if (!raw) return [];
          if (typeof raw === 'string') {
            return raw.split('|').map((s) => s.trim()).filter(Boolean);
          }
          if (Array.isArray(raw)) {
            return raw.map((s) => String(s).trim()).filter(Boolean);
          }
          return [];
        })();
        const objectivesText = objectivesArr.join('\n');
        
        const estRaw = lesson.estimated_minutes;
        const estimatedMinutes =
          typeof estRaw === 'number' && Number.isFinite(estRaw) && estRaw > 0 ? estRaw : 15;

        const quizData: Record<string, string[] | null> = {};
        for (let i = 1; i <= 10; i++) {
          const key = `checkpoint_quiz_q${i}` as keyof LessonContentInput;
          const rawQ = lesson[key];
          if (rawQ) {
            if (typeof rawQ === 'string') {
              quizData[`checkpoint_quiz_q${i}`] = parseCheckpointQuestion(rawQ, i);
            } else if (Array.isArray(rawQ)) {
              quizData[`checkpoint_quiz_q${i}`] = rawQ as string[];
            }
          } else {
            quizData[`checkpoint_quiz_q${i}`] = null;
          }
        }

        const { error: upsertError } = await supabase
          .from('lesson_content')
          .upsert({
            skill_code: normalizedSkillCode,
            skill_id: skill.id,
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
          results.errors.push({
            skill_code: lesson.skill_code,
            error: upsertError.message,
          });
        } else {
          results.success.push({ skill_code: normalizedSkillCode });
        }
      } catch (err) {
        results.errors.push({
          skill_code: lesson.skill_code,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

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
    console.error('Import error:', error);
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
