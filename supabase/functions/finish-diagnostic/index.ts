import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app',
}

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

// Get skill ID directly from tags (now coming from skills table)
function getSkillFromTags(tags: string[] = []): string | null {
  // Tags now contain actual skill_ids from the skills table
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

        // Track skill-level accuracy
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
  console.log('🚀 finish-diagnostic function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth
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
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestBody = await req.json();
    const validationResult = DiagnosticRequestSchema.safeParse(requestBody);
    
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request data',
          details: validationResult.error.errors
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: DiagnosticRequest = validationResult.data;
    console.log('Processing diagnostic for section:', body.section);

    // Score the diagnostic
    const { score, skillAccuracy } = scoreDiagnostic(body.blocks);
    console.log('Diagnostic score:', score, 'Skill accuracy:', skillAccuracy);

    // Save diagnostic results
    const { data: diagnostic, error: insertError } = await supabase
      .from('diagnostics')
      .insert({
        user_id: user.id,
        section: body.section,
        block: 1, // For now, treating as single combined result
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

    // Get missed questions for review queue seeding
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

    // Seed review queue with missed items (due now for immediate review)
    // Only insert valid UUIDs (staging_items use bigint staging_id, not UUIDs)
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
        const { error: reviewError } = await supabase
          .from('review_queue')
          .insert(validReviewItems);

        if (reviewError) {
          console.error('Error seeding review queue:', reviewError);
        } else {
          console.log('Seeded review queue with', validReviewItems.length, 'missed questions');
        }
      } else {
        console.log('No valid UUID question IDs found for review queue seeding');
      }
    }

    // Calculate predicted section score (simplified)
    const predictedSectionScore = Math.round(score);

    // Get top 5 weak skills
    const weakSkills = Object.entries(skillAccuracy)
      .map(([skill, data]) => ({
        skill,
        accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
        total: data.total
      }))
      .filter(s => s.total >= 2) // Only include skills with at least 2 questions
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);

    console.log('Top weak skills:', weakSkills);

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