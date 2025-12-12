import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { checkRateLimit, createRateLimitResponse, getClientIp } from "../_shared/rateLimit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    const ip = getClientIp(req);
    if (!checkRateLimit(`ip:${ip}`, 60, 60_000)) {
      return createRateLimitResponse(corsHeaders);
    }

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

    if (!checkRateLimit(`user:${user.id}:session-finish`, 10, 60_000)) {
      return createRateLimitResponse(corsHeaders);
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

    // Get all responses for the session (no join - questions table may not have staging_items data)
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

    // For per-skill stats, try to get skill_code from staging_items
    // question_id in responses may be staging_id (integer as string)
    const questionIds = responses?.map(r => r.question_id) || [];
    const stagingIds = questionIds.map(id => parseInt(id)).filter(id => !isNaN(id));
    
    let skillStats: Record<string, { correct: number; total: number; totalTime: number }> = {};
    
    if (stagingIds.length > 0) {
      const { data: stagingItems } = await supabase
        .from('staging_items')
        .select('staging_id, skill_code')
        .in('staging_id', stagingIds);
      
      const stagingSkillMap = new Map<number, string>();
      stagingItems?.forEach(item => {
        stagingSkillMap.set(item.staging_id, item.skill_code);
      });
      
      responses?.forEach(response => {
        const stagingId = parseInt(response.question_id);
        const skillCode = stagingSkillMap.get(stagingId);
        if (skillCode) {
          if (!skillStats[skillCode]) {
            skillStats[skillCode] = { correct: 0, total: 0, totalTime: 0 };
          }
          skillStats[skillCode].total++;
          skillStats[skillCode].totalTime += response.time_ms || 0;
          if (response.correct) {
            skillStats[skillCode].correct++;
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