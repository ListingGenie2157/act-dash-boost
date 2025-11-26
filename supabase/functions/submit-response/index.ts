import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Zod schema for input validation
const SubmitResponseSchema = z.object({
  session_id: z.string().uuid(),
  question_id: z.string().uuid(),
  selected: z.string().length(1).regex(/^[A-E]$/),
  time_ms: z.number().int().nonnegative().max(600000).optional() // Max 10 minutes
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization')!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      console.error('Session not found:', sessionError);
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

    // Look up correct answer from v_form_section
    const { data: questionData, error: questionError } = await supabase
      .from('v_form_section')
      .select('answer')
      .eq('form_id', session.form_id)
      .eq('section', session.section)
      .eq('question_id', question_id)
      .single();

    if (questionError || !questionData) {
      console.error('Question not found:', questionError);
      return new Response(
        JSON.stringify({ error: 'Question not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const correct = selected === questionData.answer;

    // Check if response already exists (update instead of insert)
    const { data: existingResponse } = await supabase
      .from('responses')
      .select('session_id, question_id')
      .eq('session_id', session_id)
      .eq('question_id', question_id)
      .maybeSingle();

    let result;
    if (existingResponse) {
      // Update existing response
      const { data, error } = await supabase
        .from('responses')
        .update({
          selected,
          correct,
          time_ms: time_ms || 30000,
          submitted_at: new Date().toISOString()
        })
        .eq('session_id', session_id)
        .eq('question_id', question_id);

      if (error) throw error;
      result = data;
    } else {
      // Insert new response
      const { data, error } = await supabase
        .from('responses')
        .insert({
          session_id,
          question_id,
          selected,
          correct,
          time_ms: time_ms || 30000
        });

      if (error) throw error;
      result = data;
    }

    console.log(`Response saved: session=${session_id}, question=${question_id}, selected=${selected}, correct=${correct}`);

    return new Response(
      JSON.stringify({ success: true, correct }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in submit-response:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
