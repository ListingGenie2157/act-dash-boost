import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, getClientIp, createRateLimitResponse } from '../_shared/rateLimit.ts';

// Zod schemas for input validation
const QuestionSchema = z.object({
  id: z.string().min(1),
  skill_tags: z.array(z.string()).optional()
});

const AnswerSchema = z.object({
  questionId: z.string().min(1),
  selectedAnswer: z.string().min(1).max(1),
  isCorrect: z.boolean()
});

const DiagnosticBlockSchema = z.object({
  questions: z.array(QuestionSchema).min(1).max(100),
  answers: z.array(AnswerSchema).min(1).max(100)
});

const DiagnosticRequestSchema = z.object({
  section: z.enum(['English', 'Math', 'Reading', 'Science']),
  blocks: z.array(DiagnosticBlockSchema).min(1).max(10)
});

interface DiagnosticBlock {
  questions: Array<{
    id: string;
    skill_tags?: string[];
  }>;
  answers: Array<{
    questionId: string;
    selectedAnswer: string;
    isCorrect: boolean;
  }>;
}

interface DiagnosticRequest {
  section: 'English' | 'Math' | 'Reading' | 'Science';
  blocks: DiagnosticBlock[];
}

function getSkillFromTags(tags: string[] = []): string | null {
  return tags.length > 0 ? tags[0] : null;
}

function scoreDiagnostic(blocks: DiagnosticBlock[]): { score: number; skillAccuracy: Record<string, { correct: number; total: number }> } {
  let totalCorrect = 0;
  let totalQuestions = 0;
  const skillAccuracy: Record<string, { correct: number; total: number }> = {};

  for (const block of blocks) {
    for (let i = 0; i < block.questions.length; i++) {
      const question = block.questions[i];
      const answer = block.answers[i];
      
      if (answer) {
        totalQuestions++;
        if (answer.isCorrect) {
          totalCorrect++;
        }

        const skill = getSkillFromTags(question.skill_tags);
        if (skill) {
          if (!skillAccuracy[skill]) {
            skillAccuracy[skill] = { correct: 0, total: 0 };
          }
          skillAccuracy[skill].total++;
          if (answer.isCorrect) {
            skillAccuracy[skill].correct++;
          }
        }
      }
    }
  }

  const score = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
  return { score, skillAccuracy };
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

    const requestBody = await req.json();
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

    const { score, skillAccuracy } = scoreDiagnostic(body.blocks);

    const { data: diagnostic, error: insertError } = await supabase
      .from('diagnostics')
      .insert({
        user_id: user.id,
        section: body.section,
        block: 1,
        responses: body.blocks,
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

    const missedQuestions: Array<{ questionId: string; skill: string | null }> = [];
    
    for (const block of body.blocks) {
      for (let i = 0; i < block.questions.length; i++) {
        const question = block.questions[i];
        const answer = block.answers[i];
        
        if (answer && !answer.isCorrect) {
          const skill = getSkillFromTags(question.skill_tags);
          missedQuestions.push({
            questionId: answer.questionId,
            skill
          });
        }
      }
    }

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
