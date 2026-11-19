import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, getClientIp, createRateLimitResponse } from '../_shared/rateLimit.ts';
import { parseBodyWithLimit } from '../_shared/mod.ts';

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

    // Service-role client for answer lookups (v_form_section is service-role-only)
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Server misconfigured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
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

    const parsed = await parseBodyWithLimit(req, corsHeaders);
    if ('error' in parsed) return parsed.error;
    const body = parsed.data;
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

    // Verify session belongs to user (defense-in-depth: single query with user_id)
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('user_id, form_id, section')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if this is a staging_id (numeric) or a real UUID
    const isNumericId = /^\d+$/.test(question_id);
    
    let questionData: { answer: string } | null = null;
    let realQuestionId: string | null = null;
    
    if (isNumericId) {
      // Look up the answer from staging_items (service role: students cannot read answers).
      // responses.question_id is text, so the staging_id is persisted below like any other id.
      const stagingId = parseInt(question_id);
      const { data, error } = await serviceClient
        .from('staging_items')
        .select('answer')
        .eq('staging_id', stagingId)
        .eq('form_id', session.form_id)
        .single();

      if (!error && data) {
        questionData = data;
        realQuestionId = String(stagingId);
      }
    }
    
    // Try v_form_section for UUID-based question IDs (service-role only)
    if (!questionData) {
      const { data, error } = await serviceClient
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
