// top of file
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("authorization") ?? req.headers.get("

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
  sections?: Array<{
    section: string;
    score: number;
    notes?: string;
  }>;
  // Legacy format support
  section?: 'English' | 'Math' | 'Reading' | 'Science';
  blocks?: DiagnosticBlock[];
}

// Rough skill mapping for diagnostic questions
const skillMapping: Record<string, string[]> = {
  'algebra': ['math-algebra-linear', 'math-algebra-systems'],
  'geometry': ['math-geometry-coordinate', 'math-geometry-plane'],
  'trigonometry': ['math-trigonometry-basic', 'math-trigonometry-graphs'],
  'grammar': ['english-grammar-usage', 'english-grammar-punctuation'],
  'rhetoric': ['english-rhetoric-strategy', 'english-rhetoric-organization'],
  'reading-comprehension': ['reading-main-ideas', 'reading-details'],
  'scientific-reasoning': ['science-data-representation', 'science-research-summaries']
};

function getSkillFromTags(tags: string[] = []): string | null {
  for (const tag of tags) {
    if (skillMapping[tag]) {
      return skillMapping[tag][0]; // Return first matching skill
    }
  }
  return null;
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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

    const body: DiagnosticRequest = await req.json();
    console.log('Processing diagnostic request:', body);

    let diagnosticResults: any[] = [];

    // Handle new multi-section format (onboarding)
    if (body.sections) {
      console.log('Processing multi-section diagnostic for onboarding');
      
      for (const sectionData of body.sections) {
        const { data: diagnostic, error: insertError } = await supabase
          .from('diagnostics')
          .insert({
            user_id: user.id,
            section: sectionData.section,
            block: 1,
            responses: { score: sectionData.score },
            score: sectionData.score,
            source: 'onboarding',
            notes: sectionData.notes,
            completed_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error saving diagnostic for section:', sectionData.section, insertError);
          continue;
        }

        diagnosticResults.push(diagnostic);
      }
    } 
    // Handle legacy single-section format
    else if (body.section && body.blocks) {
      console.log('Processing single-section diagnostic for section:', body.section);
      
      const { score, skillAccuracy } = scoreDiagnostic(body.blocks);
      console.log('Diagnostic score:', score, 'Skill accuracy:', skillAccuracy);

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

      diagnosticResults.push(diagnostic);
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid diagnostic format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle review queue seeding only for legacy format with actual questions
    if (body.blocks) {
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
      if (missedQuestions.length > 0) {
        const reviewItems = missedQuestions.map(item => ({
          user_id: user.id,
          question_id: item.questionId,
          due_at: new Date().toISOString(),
          interval_days: 0,
          ease: 250,
          lapses: 1
        }));

        const { error: reviewError } = await supabase
          .from('review_queue')
          .insert(reviewItems);

        if (reviewError) {
          console.error('Error seeding review queue:', reviewError);
        } else {
          console.log('Seeded review queue with', reviewItems.length, 'missed questions');
        }
      }
    }

    // Calculate overall results
    let averageScore = 0;
    let sectionResults: any[] = [];

    if (body.sections) {
      // Multi-section onboarding results
      averageScore = body.sections.reduce((sum, s) => sum + s.score, 0) / body.sections.length;
      sectionResults = body.sections.map(s => ({
        section: s.section,
        score: Math.round(s.score * 100), // Convert to percentage
        weak_areas: s.score < 0.6 ? ['general'] : []
      }));
    } else if (body.blocks) {
      // Legacy single-section results
      const { score, skillAccuracy } = scoreDiagnostic(body.blocks);
      averageScore = score;
      
      const weakSkills = Object.entries(skillAccuracy)
        .map(([skill, data]) => ({
          skill,
          accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
          total: data.total
        }))
        .filter(s => s.total >= 2)
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 5);

      sectionResults = [{
        section: body.section,
        score: Math.round(score),
        weak_areas: weakSkills.map(s => s.skill)
      }];
    }

    console.log('Diagnostic completed - Average score:', averageScore, 'Section results:', sectionResults);

    return new Response(
      JSON.stringify({
        predicted_section_score: Math.round(averageScore),
        section_results: sectionResults,
        diagnostic_ids: diagnosticResults.map(d => d.id),
        success: true
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
