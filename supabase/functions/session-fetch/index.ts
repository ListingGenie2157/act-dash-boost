import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  console.log('[session-fetch] hit', { method: req.method, hasAuth: !!req.headers.get('authorization') });
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Accept both GET and POST methods

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

    // Get session_id from query params (GET) or body (POST)
    let session_id: string | null = null;
    
    if (req.method === 'GET') {
      const url = new URL(req.url);
      session_id = url.searchParams.get('session_id');
    } else if (req.method === 'POST') {
      const body = await req.json();
      session_id = body.session_id;
    }

    if (!session_id) {
      return new Response(JSON.stringify({ error: 'Missing session_id parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    // Fetch questions: use staging_items for F* forms, v_form_section for others
    const useStaging = session.form_id.startsWith('F');
    console.log(`Fetching questions from ${useStaging ? 'staging_items' : 'v_form_section'} for form ${session.form_id}, section ${session.section}`);
    
    let questionsData: any[];
    let questionsError: any;

    if (useStaging) {
      const { data, error } = await supabase
        .from('staging_items')
        .select('*')
        .eq('form_id', session.form_id)
        .eq('section', session.section)
        .order('ord');
      questionsData = data || [];
      questionsError = error;
    } else {
      const { data, error } = await supabase
        .from('v_form_section')
        .select('*')
        .eq('form_id', session.form_id)
        .eq('section', session.section)
        .order('ord');
      questionsData = data || [];
      questionsError = error;
    }

    if (questionsError) {
      console.error('Questions fetch error:', {
        error: questionsError,
        form_id: session.form_id,
        section: session.section,
        useStaging
      });
      return new Response(JSON.stringify({ error: 'Failed to fetch questions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!questionsData || questionsData.length === 0) {
      console.warn('No questions found for session:', {
        session_id,
        form_id: session.form_id,
        section: session.section,
        useStaging
      });
    } else {
      console.log(`Successfully fetched ${questionsData.length} questions`);
    }

    // Format questions: map all ACT-style fields including staging_items columns
    const questions = questionsData.map(q => ({
      id: q.question_id ?? q.id ?? `${session.form_id}_${session.section}_${q.ord}`,
      ord: q.ord,
      question: q.question ?? q.stem,
      choice_a: q.choice_a,
      choice_b: q.choice_b,
      choice_c: q.choice_c,
      choice_d: q.choice_d,
      choice_e: q.choice_e ?? null,
      passage_id: q.passage_id ?? null,
      image_url: q.image_url ?? null,
      image_caption: q.image_caption ?? null,
      image_position: q.image_position ?? 'above_question',
      underlined_text: q.underlined_text ?? null,
      reference_number: q.reference_number ?? null,
      position_in_passage: q.position_in_passage ?? null,
      calculator_allowed: q.calculator_allowed ?? true,
    }));

    // Collect unique passages for RD/SCI sections with all fields
    const passages: Record<string, any> = {};
    
    if (['RD', 'SCI'].includes(session.section)) {
      questionsData.forEach(q => {
        const pid = q.passage_id;
        const text = q.passage_text ?? q.passage;
        if (pid && text) {
          passages[pid] = {
            title: q.passage_title || '',
            passage_text: text,
            marked_text: q.marked_text ?? null,
            passage_format: q.passage_format ?? null,
            passage_type: q.passage_type ?? null,
            has_charts: q.has_charts ?? false,
            chart_images: q.chart_images ?? null,
          };
        }
      });
      console.log(`Extracted ${Object.keys(passages).length} passages for ${session.section} section`);
    }

    return new Response(JSON.stringify({
      questions,
      passages,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in session-fetch function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});