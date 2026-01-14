import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, getClientIp, createRateLimitResponse } from '../_shared/rateLimit.ts';

// Zod schema for input validation
const SubmitResponseSchema = z.object({
  session_id: z.string().uuid(),
  question_id: z.string().min(1), // Can be staging_id (integer as string) or UUID
  selected: z.string().length(1).regex(/^[A-E]$/),
  time_ms: z.number().int().nonnegative().max(600000).optional() // Max 10 minutes
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Server misconfigured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting: 100 requests per minute (high volume for test submissions)
    const clientIp = getClientIp(req);
    const isAllowed = await checkRateLimit(user.id, clientIp, 'submit-response', 100, 60000);
    if (!isAllowed) {
      return createRateLimitResponse(corsHeaders);
    }

    const body = await req.json();
    const validationResult = SubmitResponseSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request data',
          details: validationResult.error.errors
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { session_id, question_id, selected, time_ms } = validationResult.data;

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('user_id, form_id, section')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (session.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Session does not belong to user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if this is a staging_id (numeric) or a real UUID
    const isNumericId = /^\d+$/.test(question_id);
    
    let questionData: { answer: string } | null = null;
    let realQuestionId: string | null = null;
    
    if (isNumericId) {
      // Look up from staging_items using staging_id
      const stagingId = parseInt(question_id);
      const { data, error } = await supabase
        .from('staging_items')
        .select('answer')
        .eq('staging_id', stagingId)
        .eq('form_id', session.form_id)
        .single();
      
      if (!error && data) {
        questionData = data;
        // For staging items, we can't store in responses table (requires UUID)
        // Just validate and return correctness without persisting
        const correct = selected === questionData.answer;
        return new Response(
          JSON.stringify({ success: true, correct, persisted: false }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Try v_form_section for UUID-based question IDs
    if (!questionData) {
      const { data, error } = await supabase
        .from('v_form_section')
        .select('answer, question_id')
        .eq('form_id', session.form_id)
        .eq('section', session.section)
        .eq('question_id', question_id)
        .single();
      
      if (!error && data) {
        questionData = data;
        realQuestionId = data.question_id;
      }
    }

    if (!questionData) {
      return new Response(
        JSON.stringify({ error: 'Question not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const correct = selected === questionData.answer;
    const questionIdToStore = realQuestionId || question_id;

    // Check if response already exists (update instead of insert)
    const { data: existingResponse } = await supabase
      .from('responses')
      .select('session_id, question_id')
      .eq('session_id', session_id)
      .eq('question_id', questionIdToStore)
      .maybeSingle();

    if (existingResponse) {
      const { error } = await supabase
        .from('responses')
        .update({
          selected,
          correct,
          time_ms: time_ms || 30000,
          submitted_at: new Date().toISOString()
        })
        .eq('session_id', session_id)
        .eq('question_id', questionIdToStore);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('responses')
        .insert({
          session_id,
          question_id: questionIdToStore,
          selected,
          correct,
          time_ms: time_ms || 30000
        });

      if (error) throw error;
    }

    return new Response(
      JSON.stringify({ success: true, correct }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in submit-response:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
