import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeakestSkillsResponse {
  skill_id: string;
  skill_name: string;
  subject: string;
  cluster: string;
  combined_accuracy: number;
  effective_median_time_ms: number;
  seen: number;
  reason: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.log('No authorization header provided');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('Authentication failed:', authError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Finding weakest skills for user ${user.id}`);

    // Query the user skill stats view for weakness detection
    const { data: skillStats, error: statsError } = await supabase
      .from('vw_user_skill_stats')
      .select('*')
      .eq('user_id', user.id)
      .gte('seen', 20); // Must have seen at least 20 questions

    if (statsError) {
      console.error('Error fetching skill stats:', statsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch skill statistics' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!skillStats || skillStats.length === 0) {
      console.log('No skills with sufficient data found');
      return new Response(JSON.stringify({
        weakest_skills: [],
        message: 'No skills with sufficient practice data found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Apply weakness criteria and identify reasons
    const weakSkills: WeakestSkillsResponse[] = [];

    for (const skill of skillStats) {
      const accuracy = skill.combined_accuracy || 0;
      const timeMs = skill.effective_median_time_ms || 0;
      const timeSecs = timeMs / 1000;
      
      let reasons: string[] = [];
      let isWeak = false;

      // Check mastery gates
      if (accuracy < 0.85) { // Less than 85% accuracy
        reasons.push(`low accuracy (${Math.round(accuracy * 100)}%)`);
        isWeak = true;
      }

      if (timeSecs > 45) { // Slower than 45 seconds average
        reasons.push(`slow response time (${Math.round(timeSecs)}s avg)`);
        isWeak = true;
      }

      if (isWeak) {
        weakSkills.push({
          skill_id: skill.skill_id,
          skill_name: skill.skill_name,
          subject: skill.subject,
          cluster: skill.cluster,
          combined_accuracy: accuracy,
          effective_median_time_ms: timeMs,
          seen: skill.seen,
          reason: reasons.join(', ')
        });
      }
    }

    // Sort by combined weakness score (lower accuracy + higher time = weaker)
    weakSkills.sort((a, b) => {
      const aWeaknessScore = (1 - a.combined_accuracy) + (a.effective_median_time_ms / 60000); // Normalize time to minutes
      const bWeaknessScore = (1 - b.combined_accuracy) + (b.effective_median_time_ms / 60000);
      return bWeaknessScore - aWeaknessScore; // Higher weakness score = weaker skill
    });

    // Return top 3 weakest skills
    const top3Weakest = weakSkills.slice(0, 3);

    const response = {
      weakest_skills: top3Weakest,
      total_weak_skills: weakSkills.length,
      total_skills_analyzed: skillStats.length,
      criteria: {
        min_seen: 20,
        accuracy_threshold: 0.85,
        time_threshold_seconds: 45
      }
    };

    console.log(`Found ${weakSkills.length} weak skills, returning top 3:`, top3Weakest.map(s => s.skill_name));

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in weakest-skills function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});