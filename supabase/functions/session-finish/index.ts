import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface SessionFinishRequest {
  session_id: string;
}

interface MissedQuestion {
  question_id: string;
  staging_id: number;
  question_text: string;
  selected: string;
  correct_answer: string;
  explanation: string | null;
  skill_code: string;
  time_ms: number;
  miss_reason: string | null;
}

serve(async (req) => {
  console.log('[session-finish] hit', { method: req.method, hasAuth: !!req.headers.get('authorization') });
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Initialize Supabase client with anon key and auth header
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the user from the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { session_id }: SessionFinishRequest = await req.json();

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark session as ended
    const { error: updateError } = await supabase
      .from('sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', session_id);

    if (updateError) {
      console.error('Session update error:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to finish session' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all responses for the session
    const { data: responses, error: responsesError } = await supabase
      .from('responses')
      .select('*')
      .eq('session_id', session_id);

    if (responsesError) {
      console.error('Responses fetch error:', responsesError);
      return new Response(JSON.stringify({ error: 'Failed to fetch responses' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate summary statistics
    const totalQuestions = responses?.length || 0;
    const correctAnswers = responses?.filter(r => r.correct).length || 0;
    const rawScore = correctAnswers;
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const avgTimeMs = totalQuestions > 0 ? responses.reduce((sum, r) => sum + (r.time_ms || 0), 0) / totalQuestions : 0;

    // Get staging_items data for skill codes and missed question details
    const questionIds = responses?.map(r => r.question_id) || [];
    const stagingIds = questionIds.map(id => parseInt(id)).filter(id => !isNaN(id));
    
    const skillStats: Record<string, { correct: number; total: number; totalTime: number }> = {};
    const missedQuestions: MissedQuestion[] = [];
    
    if (stagingIds.length > 0) {
      const { data: stagingItems } = await supabase
        .from('staging_items')
        .select('staging_id, skill_code, question, answer, explanation, choice_a, choice_b, choice_c, choice_d')
        .in('staging_id', stagingIds);
      
      const stagingItemMap = new Map<number, typeof stagingItems[0]>();
      stagingItems?.forEach(item => {
        stagingItemMap.set(item.staging_id, item);
      });
      
      responses?.forEach(response => {
        const stagingId = parseInt(response.question_id);
        const stagingItem = stagingItemMap.get(stagingId);
        
        if (stagingItem) {
          const skillCode = stagingItem.skill_code;
          
          // Update skill stats
          if (!skillStats[skillCode]) {
            skillStats[skillCode] = { correct: 0, total: 0, totalTime: 0 };
          }
          skillStats[skillCode].total++;
          skillStats[skillCode].totalTime += response.time_ms || 0;
          if (response.correct) {
            skillStats[skillCode].correct++;
          } else {
            // Add to missed questions array
            missedQuestions.push({
              question_id: response.question_id,
              staging_id: stagingId,
              question_text: stagingItem.question,
              selected: response.selected,
              correct_answer: stagingItem.answer,
              explanation: stagingItem.explanation,
              skill_code: skillCode,
              time_ms: response.time_ms,
              miss_reason: response.miss_reason || null,
            });
          }
        }
      });
    }

    const perSkill = Object.entries(skillStats).map(([skill_id, stats]) => ({
      skill_id,
      correct: stats.correct,
      total: stats.total,
      accuracy: (stats.correct / stats.total) * 100,
      avg_time_ms: stats.totalTime / stats.total,
    }));

    const summary = {
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      raw_score: rawScore,
      accuracy,
      avg_time_ms: avgTimeMs,
    };

    console.log('[session-finish] returning', { 
      totalQuestions, 
      correctAnswers, 
      missedCount: missedQuestions.length 
    });

    return new Response(JSON.stringify({
      summary,
      per_skill: perSkill,
      missed_questions: missedQuestions,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in session-finish function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
