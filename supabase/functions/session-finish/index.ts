import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SessionFinishRequest {
  session_id: string;
}

serve(async (req) => {
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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user from the JWT token
    const authHeader = req.headers.get('authorization')!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    
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

    // Get all responses for the session with question details
    const { data: responses, error: responsesError } = await supabase
      .from('responses')
      .select(`
        *,
        questions:v_form_section!inner(skill_id)
      `)
      .eq('session_id', session_id);

    if (responsesError) {
      console.error('Responses fetch error:', responsesError);
      return new Response(JSON.stringify({ error: 'Failed to fetch responses' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate summary statistics
    const totalQuestions = responses.length;
    const correctAnswers = responses.filter(r => r.correct).length;
    const rawScore = correctAnswers;
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const avgTimeMs = totalQuestions > 0 ? responses.reduce((sum, r) => sum + r.time_ms, 0) / totalQuestions : 0;

    // Calculate per-skill statistics
    const skillStats: Record<string, { correct: number; total: number; totalTime: number }> = {};
    
    responses.forEach(response => {
      const skillId = response.questions?.skill_id;
      if (skillId) {
        if (!skillStats[skillId]) {
          skillStats[skillId] = { correct: 0, total: 0, totalTime: 0 };
        }
        skillStats[skillId].total++;
        skillStats[skillId].totalTime += response.time_ms;
        if (response.correct) {
          skillStats[skillId].correct++;
        }
      }
    });

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

    return new Response(JSON.stringify({
      summary,
      per_skill: perSkill,
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