import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { updateReviewQueueOnAnswer, type ReviewMode } from '../_shared/review.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, getClientIp, createRateLimitResponse } from '../_shared/rateLimit.ts';
import { parseBodyWithLimit } from '../_shared/mod.ts';

// Zod schemas for input validation
const AnswerSchema = z.object({
  question_id: z.string().uuid(),
  user_answer: z.enum(['A', 'B', 'C', 'D']),
  correct: z.boolean(),
  time_ms: z.number().int().nonnegative().max(600000) // Max 10 minutes per question
});

const CompleteTaskSchema = z.object({
  task_id: z.string().uuid(),
  accuracy: z.number().min(0).max(1),
  time_ms: z.number().int().nonnegative().max(7200000), // Max 2 hours
  answers: z.array(AnswerSchema).optional()
});

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
  const corsHeaders = getCorsHeaders(req);
  
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing required environment variables: SUPABASE_URL or SUPABASE_ANON_KEY');
    }

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { authorization: authHeader } }
    });

    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting: 50 requests per minute
    const clientIp = getClientIp(req);
    const isAllowed = await checkRateLimit(user.id, clientIp, 'complete-task', 50, 60000);
    if (!isAllowed) {
      return createRateLimitResponse(corsHeaders);
    }

    // Parse and validate request body
    const parsed = await parseBodyWithLimit(req, corsHeaders);
    if ('error' in parsed) return parsed.error;
    const body = parsed.data;
    const validationResult = CompleteTaskSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(JSON.stringify({ 
        error: 'Invalid request data',
        details: validationResult.error.errors
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { task_id, accuracy, time_ms, answers } = validationResult.data;

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

    // Add to error bank for incorrect answers using atomic increment RPC
    if (answers) {
      const incorrectAnswers = answers.filter(a => !a.correct);
      if (incorrectAnswers.length > 0) {
        for (const incorrectAnswer of incorrectAnswers) {
          try {
            // Use the atomic increment RPC function
            const { error } = await supabase.rpc('increment_error_bank', {
              p_user_id: user.id,
              p_question_id: incorrectAnswer.question_id
            });
            
            if (error) {
              console.error(`Error incrementing error bank for question ${incorrectAnswer.question_id}:`, error);
            }
          } catch (error) {
            console.error(`Error adding to error bank for question ${incorrectAnswer.question_id}:`, error);
          }
        }
      }
    }

    const response = {
      ...updatedTask,
      message: 'Task completed successfully',
      answers_processed: answers?.length || 0
    };

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
