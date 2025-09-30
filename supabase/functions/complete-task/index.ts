import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { updateReviewQueueOnAnswer, type ReviewMode } from '../_shared/review.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompleteTaskRequest {
  task_id: string;
  accuracy: number;
  time_ms: number;
  answers?: Array<{
    question_id: string;
    user_answer: 'A' | 'B' | 'C' | 'D';
    correct: boolean;
    time_ms: number;
  }>;
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

    // Parse request body
    const { task_id, accuracy, time_ms, answers }: CompleteTaskRequest = await req.json();

    if (!task_id || accuracy === undefined || time_ms === undefined) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: task_id, accuracy, time_ms' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Completing task ${task_id} for user ${user.id}`);

    // Get the task to verify ownership and get details
    const { data: task, error: taskError } = await supabase
      .from('study_tasks')
      .select('*')
      .eq('id', task_id)
      .eq('user_id', user.id)
      .single();

    if (taskError || !task) {
      console.error('Task not found:', taskError);
      return new Response(JSON.stringify({ error: 'Task not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine study mode based on days left (simplified logic)
    const { data: profile } = await supabase
      .from('profiles')
      .select('test_date')
      .eq('id', user.id)
      .single();

    const today = new Date();
    const testDate = profile?.test_date ? new Date(profile.test_date + 'T00:00:00') : null;
    const daysLeft = testDate ? Math.ceil((testDate.getTime() - today.getTime()) / (1000 * 3600 * 24)) : null;
    
    const studyMode = daysLeft === null || daysLeft > 30 ? 'MASTERY' : 
                     daysLeft <= 7 ? 'CRASH' : 'MASTERY';

    // Update the task status and metrics
    const { data: updatedTask, error: updateError } = await supabase
      .from('study_tasks')
      .update({
        status: 'COMPLETED',
        accuracy: accuracy,
        median_time_ms: time_ms
      })
      .eq('id', task_id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating task:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update task' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update user progress for this skill
    if (task.skill_id) {
      const { data: existingProgress } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('skill_id', task.skill_id)
        .single();

      const currentSeen = existingProgress?.seen || 0;
      const currentCorrect = existingProgress?.correct || 0;
      const newCorrect = currentCorrect + Math.round(accuracy * task.size);
      const newSeen = currentSeen + task.size;

      // Calculate new mastery level (simplified)
      const newAccuracy = newSeen > 0 ? newCorrect / newSeen : 0;
      const newMasteryLevel = newAccuracy >= 0.85 ? Math.min(100, Math.floor(newAccuracy * 100)) : 0;

      const { error: progressError } = await supabase
        .from('progress')
        .upsert({
          user_id: user.id,
          skill_id: task.skill_id,
          seen: newSeen,
          correct: newCorrect,
          mastery_level: newMasteryLevel,
          median_time_ms: time_ms,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,skill_id'
        });

      if (progressError) {
        console.error('Error updating progress:', progressError);
      }
    }

    // Process individual answers for review queue updates
    if (answers && answers.length > 0) {
      console.log(`Processing ${answers.length} answers for review queue`);
      
      for (const answer of answers) {
        try {
          await updateReviewQueueOnAnswer(
            supabase,
            user.id,
            answer.question_id,
            answer.correct,
            studyMode as ReviewMode
          );
        } catch (error) {
          console.error(`Error updating review queue for question ${answer.question_id}:`, error);
          // Continue with other answers even if one fails
        }
      }
    }

    // Add to error bank for incorrect answers
    if (answers) {
      const incorrectAnswers = answers.filter(a => !a.correct);
      if (incorrectAnswers.length > 0) {
        for (const incorrectAnswer of incorrectAnswers) {
          try {
            await supabase
              .from('error_bank')
              .upsert({
                user_id: user.id,
                question_id: incorrectAnswer.question_id,
                miss_count: 1,
                last_missed_at: new Date().toISOString()
              }, {
                onConflict: 'user_id,question_id',
                ignoreDuplicates: false
              });
          } catch (error) {
            console.error(`Error adding to error bank for question ${incorrectAnswer.question_id}:`, error);
          }
        }
      }
    }

    // Calculate rewards after task completion
    try {
      await supabase.functions.invoke('calculate-rewards', {
        body: { user_id: user.id, task_id: task_id }
      });
    } catch (error) {
      console.error('Error calculating rewards:', error);
      // Don't fail the task completion for rewards calculation failure
    }

    const response = {
      ...updatedTask,
      message: 'Task completed successfully',
      answers_processed: answers?.length || 0
    };

    console.log('Task completion successful:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in complete-task function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});