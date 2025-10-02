import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const body = await req.json();
    const { taskId, taskType } = body;

    if (!taskId || !taskType) {
      return new Response(JSON.stringify({ error: 'taskId and taskType are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Calculating rewards for task ${taskId} of type ${taskType}`);

    let rewardsEarned = 0;

    if (taskType === 'DRILL') {
      // Check DRILL task performance
      const { data: task } = await supabase
        .from('study_tasks')
        .select('accuracy, median_time_ms, user_id')
        .eq('id', taskId)
        .eq('status', 'DONE')
        .single();

      if (task && task.accuracy >= 0.85 && task.median_time_ms <= 45000) {
        console.log(`DRILL task meets criteria: accuracy=${task.accuracy}, time=${task.median_time_ms}ms`);
        
        // Get applicable DRILL rules
        const { data: parentLinks } = await supabase
          .from('parent_links')
          .select('parent_id')
          .eq('student_id', user.id);
        
        const parentIds = parentLinks?.map(link => link.parent_id) || [];
        
        const { data: rules } = await supabase
          .from('rewards_rules')
          .select('id, amount_cents, parent_id')
          .eq('type', 'DRILL')
          .in('parent_id', parentIds);

        for (const rule of rules || []) {
          // Add to ledger
          const { error: ledgerError } = await supabase
            .from('rewards_ledger')
            .insert({
              student_id: user.id,
              rule_id: rule.id,
              amount_cents: rule.amount_cents
            });

          if (!ledgerError) {
            rewardsEarned += rule.amount_cents;
            console.log(`Added ${rule.amount_cents} cents to ledger for DRILL`);
          }
        }
      }
    } else if (taskType === 'SIM') {
      // Check SIM performance against baseline
      const { data: simResult } = await supabase
        .from('sim_results')
        .select('raw_score, user_id, section')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (simResult) {
        // Get baseline (previous sim or diagnostic)
        const { data: baseline } = await supabase
          .from('sim_results')
          .select('raw_score')
          .eq('user_id', user.id)
          .eq('section', simResult.section)
          .order('created_at', { ascending: false })
          .range(1, 1)
          .single();

        const { data: diagnosticBaseline } = await supabase
          .from('diagnostics')
          .select('score')
          .eq('user_id', user.id)
          .eq('section', simResult.section)
          .order('completed_at', { ascending: false })
          .limit(1)
          .single();

        const baselineScore = baseline?.raw_score || diagnosticBaseline?.score || 0;
        
        if (simResult.raw_score > baselineScore + 2) {
          console.log(`SIM improvement: ${simResult.raw_score} vs baseline ${baselineScore}`);
          
          // Get applicable SIM rules
          const { data: parentLinks2 } = await supabase
            .from('parent_links')
            .select('parent_id')
            .eq('student_id', user.id);
          
          const parentIds2 = parentLinks2?.map(link => link.parent_id) || [];
          
          const { data: rules } = await supabase
            .from('rewards_rules')
            .select('id, amount_cents, parent_id')
            .eq('type', 'SIM')
            .in('parent_id', parentIds2);

          for (const rule of rules || []) {
            const { error: ledgerError } = await supabase
              .from('rewards_ledger')
              .insert({
                student_id: user.id,
                rule_id: rule.id,
                amount_cents: rule.amount_cents
              });

            if (!ledgerError) {
              rewardsEarned += rule.amount_cents;
              console.log(`Added ${rule.amount_cents} cents to ledger for SIM`);
            }
          }
        }
      }
    } else if (taskType === 'STREAK') {
      // Check for streak milestones
      const { data: completedTasks } = await supabase
        .from('study_tasks')
        .select('the_date')
        .eq('user_id', user.id)
        .eq('status', 'DONE')
        .order('the_date', { ascending: false })
        .limit(10);

      if (completedTasks) {
        const dates = completedTasks.map(t => t.the_date).sort();
        let currentStreak = 0;
        let maxStreak = 0;

        for (let i = 0; i < dates.length; i++) {
          if (i === 0 || new Date(dates[i]).getTime() - new Date(dates[i-1]).getTime() === 86400000) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
          } else {
            currentStreak = 1;
          }
        }

        if (maxStreak >= 5) {
          console.log(`Streak milestone reached: ${maxStreak} days`);
          
          // Get applicable STREAK rules
          const { data: parentLinks3 } = await supabase
            .from('parent_links')
            .select('parent_id')
            .eq('student_id', user.id);
          
          const parentIds3 = parentLinks3?.map(link => link.parent_id) || [];
          
          const { data: rules } = await supabase
            .from('rewards_rules')
            .select('id, amount_cents, parent_id, threshold')
            .eq('type', 'STREAK')
            .in('parent_id', parentIds3);

          for (const rule of rules || []) {
            const thresholdDays = rule.threshold?.days || 5;
            if (maxStreak >= thresholdDays) {
              // Check if already awarded for this threshold
              const { data: existing } = await supabase
                .from('rewards_ledger')
                .select('id')
                .eq('student_id', user.id)
                .eq('rule_id', rule.id)
                .gte('earned_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
                .single();

              if (!existing) {
                const { error: ledgerError } = await supabase
                  .from('rewards_ledger')
                  .insert({
                    student_id: user.id,
                    rule_id: rule.id,
                    amount_cents: rule.amount_cents
                  });

                if (!ledgerError) {
                  rewardsEarned += rule.amount_cents;
                  console.log(`Added ${rule.amount_cents} cents to ledger for STREAK`);
                }
              }
            }
          }
        }
      }
    }

    console.log(`Total rewards earned: ${rewardsEarned} cents`);

    return new Response(JSON.stringify({ 
      success: true, 
      rewardsEarned,
      message: `Calculated rewards for ${taskType} task` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in calculate-rewards function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});