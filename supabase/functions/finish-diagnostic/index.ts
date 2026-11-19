import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, getClientIp, createRateLimitResponse } from '../_shared/rateLimit.ts';
import { parseBodyWithLimit } from '../_shared/mod.ts';

// Zod schemas for input validation
const QuestionSchema = z.object({
  id: z.string().min(1),
  skill_tags: z.array(z.string()).optional()
});

const AnswerSchema = z.object({
  questionId: z.string().min(1),
  selectedAnswer: z.string().max(1), // '' = unanswered (e.g. time ran out); scored as incorrect
  // isCorrect is now ignored — server computes correctness
  isCorrect: z.boolean().optional()
});

const DiagnosticBlockSchema = z.object({
  questions: z.array(QuestionSchema).min(1).max(100),
  answers: z.array(AnswerSchema).min(1).max(100)
});

const DiagnosticRequestSchema = z.object({
  section: z.enum(['English', 'Math', 'Reading', 'Science', 'Mixed']),
  blocks: z.array(DiagnosticBlockSchema).min(1).max(10)
});

// Map section names to staging_items form_id prefixes for answer lookup
const SECTION_TO_FORM_PREFIX: Record<string, string[]> = {
  'English': ['D2EN', 'ONB'],
  'Math': ['D2MA', 'ONB'],
  'Reading': ['D2RD', 'ONB'],
  'Science': ['D2SC', 'ONB'],
  'Mixed': ['ONB'],
};

interface DiagnosticBlock {
  questions: Array<{
    id: string;
    skill_tags?: string[];
  }>;
  answers: Array<{
    questionId: string;
    selectedAnswer: string;
    isCorrect?: boolean;
  }>;
}

interface DiagnosticRequest {
  section: 'English' | 'Math' | 'Reading' | 'Science';
  blocks: DiagnosticBlock[];
}

interface ScoredAnswer {
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  skillId: string | null;
}

function getSkillFromTags(tags: string[] = []): string | null {
  return tags.length > 0 ? tags[0] : null;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Server misconfigured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting: 10 diagnostics per minute
    const clientIp = getClientIp(req);
    const isAllowed = await checkRateLimit(user.id, clientIp, 'finish-diagnostic', 10, 60000);
    if (!isAllowed) {
      return createRateLimitResponse(corsHeaders);
    }

    const parsed = await parseBodyWithLimit(req, corsHeaders);
    if ('error' in parsed) return parsed.error;
    const requestBody = parsed.data;
    const validationResult = DiagnosticRequestSchema.safeParse(requestBody);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request data',
          details: validationResult.error.errors
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: DiagnosticRequest = validationResult.data;

    // Reject submissions with no answered questions at all (e.g. an accidental submit on page load)
    const answeredCount = body.blocks.reduce(
      (n, b) => n + b.answers.filter(a => a.selectedAnswer !== '').length, 0
    );
    if (answeredCount === 0) {
      return new Response(
        JSON.stringify({ error: 'No questions answered' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── SERVER-SIDE ANSWER VALIDATION ──
    // Collect all staging_ids from client answers
    const allStagingIds = body.blocks.flatMap(b => 
      b.answers.map(a => parseInt(a.questionId, 10))
    ).filter(id => !isNaN(id));

    // Fetch real answers from staging_items (service role bypasses RLS)
    const answerMap = new Map<string, string>();
    if (allStagingIds.length > 0) {
      const { data: stagingRows, error: stagingError } = await supabase
        .from('staging_items')
        .select('staging_id, answer')
        .in('staging_id', allStagingIds);

      if (stagingError) {
        console.error('Error fetching staging answers:', stagingError);
      } else {
        for (const row of stagingRows || []) {
          answerMap.set(String(row.staging_id), row.answer.toUpperCase());
        }
      }
    }

    // Map selectedAnswer index (0-3) to letter
    const IDX_TO_LETTER = ['A', 'B', 'C', 'D'];

    // Score with server-validated correctness
    let totalCorrect = 0;
    let totalQuestions = 0;
    const skillAccuracy: Record<string, { correct: number; total: number }> = {};
    const scoredAnswers: ScoredAnswer[] = [];
    const missedQuestions: Array<{ questionId: string; skill: string | null }> = [];

    // Build server-validated blocks for storage
    const validatedBlocks: DiagnosticBlock[] = [];

    for (const block of body.blocks) {
      const validatedAnswers: Array<{ questionId: string; selectedAnswer: string; isCorrect: boolean }> = [];

      for (let i = 0; i < block.questions.length; i++) {
        const question = block.questions[i];
        const answer = block.answers[i];
        
        if (answer) {
          totalQuestions++;

          // Determine correctness server-side
          const realAnswer = answerMap.get(answer.questionId);
          let selectedLetter = answer.selectedAnswer.toUpperCase();
          // If client sends a numeric index, convert to letter
          const numIdx = parseInt(selectedLetter, 10);
          if (!isNaN(numIdx) && numIdx >= 0 && numIdx <= 3) {
            selectedLetter = IDX_TO_LETTER[numIdx];
          }

          const isCorrect = realAnswer ? selectedLetter === realAnswer : false;
          
          if (isCorrect) totalCorrect++;

          const skill = getSkillFromTags(question.skill_tags);
          if (skill) {
            if (!skillAccuracy[skill]) {
              skillAccuracy[skill] = { correct: 0, total: 0 };
            }
            skillAccuracy[skill].total++;
            if (isCorrect) {
              skillAccuracy[skill].correct++;
            }
          }

          scoredAnswers.push({
            questionId: answer.questionId,
            selectedAnswer: selectedLetter,
            isCorrect,
            skillId: skill
          });

          validatedAnswers.push({
            questionId: answer.questionId,
            selectedAnswer: selectedLetter,
            isCorrect
          });

          if (!isCorrect) {
            missedQuestions.push({ questionId: answer.questionId, skill });
          }
        }
      }

      validatedBlocks.push({
        questions: block.questions,
        answers: validatedAnswers
      });
    }

    const score = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    // ── SAVE DIAGNOSTIC ──
    const { data: diagnostic, error: insertError } = await supabase
      .from('diagnostics')
      .insert({
        user_id: user.id,
        section: body.section,
        block: 1,
        responses: validatedBlocks, // Store server-validated results
        score: score,
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving diagnostic:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save diagnostic' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── UPDATE REVIEW QUEUE for missed questions ──
    if (missedQuestions.length > 0) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      const validReviewItems = missedQuestions
        .filter(item => uuidRegex.test(item.questionId))
        .map(item => ({
          user_id: user.id,
          question_id: item.questionId,
          due_at: new Date().toISOString(),
          interval_days: 0,
          ease: 250,
          lapses: 1
        }));

      if (validReviewItems.length > 0) {
        await supabase
          .from('review_queue')
          .insert(validReviewItems);
      }
    }

    // ── UPDATE ERROR BANK for missed questions ──
    for (const missed of missedQuestions) {
      if (missed.skill) {
        // Use the increment_error_bank function (handles upsert)
        await supabase.rpc('increment_error_bank', {
          p_user_id: user.id,
          p_question_id: missed.questionId
        });
      }
    }

    // ── UPDATE MASTERY for each skill ──
    for (const [skillId, data] of Object.entries(skillAccuracy)) {
      const { error: masteryError } = await supabase
        .from('mastery')
        .upsert({
          user_id: user.id,
          skill_id: skillId,
          total: data.total,
          correct: data.correct,
          avg_time_ms: 0, // diagnostic doesn't track per-question time
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'user_id,skill_id'
        });

      if (masteryError) {
        console.error('Error upserting mastery:', masteryError);
      }
    }

    // ── UPDATE PROGRESS for each skill ──
    for (const [skillId, data] of Object.entries(skillAccuracy)) {
      const accuracy = data.total > 0 ? data.correct / data.total : 0;
      const masteryLevel = accuracy >= 0.8 ? 3 : accuracy >= 0.5 ? 2 : 1;

      const { error: progressError } = await supabase
        .from('progress')
        .upsert({
          user_id: user.id,
          skill_id: skillId,
          seen: data.total,
          correct: data.correct,
          mastery_level: masteryLevel,
          median_time_ms: 0,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,skill_id'
        });

      if (progressError) {
        console.error('Error upserting progress:', progressError);
      }
    }

    // ── RESPONSE ──
    const predictedSectionScore = Math.round(score);

    const weakSkills = Object.entries(skillAccuracy)
      .map(([skill, data]) => ({
        skill,
        accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
        total: data.total
      }))
      .filter(s => s.total >= 2)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);

    return new Response(
      JSON.stringify({
        predicted_section_score: predictedSectionScore,
        top_5_weak_skills: weakSkills,
        diagnostic_id: diagnostic.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error processing diagnostic:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});