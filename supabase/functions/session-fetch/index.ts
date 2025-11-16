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

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

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
      global: { headers: { authorization: authHeader } }
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
      console.error('Questions fetch error:', questionsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch questions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Format questions: map staging_items columns if needed
    const questions = questionsData.map(q => ({
      id: useStaging ? `staging-${q.staging_id}` : q.question_id,
      ord: q.ord,
      question: useStaging ? q.question : q.question,
      choice_a: q.choice_a,
      choice_b: q.choice_b,
      choice_c: q.choice_c,
      choice_d: q.choice_d,
      passage_id: q.passage_id,
    }));

    // Collect unique passages for RD/SCI sections
    const passages: Record<string, { title: string; passage_text: string }> = {};
    
    if (['RD', 'SCI'].includes(session.section)) {
      questionsData.forEach(q => {
        if (q.passage_id && q.passage_text) {
          passages[q.passage_id] = {
            title: q.passage_title || '',
            passage_text: q.passage_text,
          };
        }
      });
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