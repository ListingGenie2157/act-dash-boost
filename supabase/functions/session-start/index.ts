import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Zod schema for input validation
const SessionStartSchema = z.object({
  form_id: z.string().min(1).max(50),
  section: z.enum(['EN', 'MATH', 'RD', 'SCI']),
  mode: z.enum(['simulation', 'practice', 'booster']),
  coached: z.boolean().optional().default(false)
});

interface SessionStartRequest {
  form_id: string;
  section: string;
  mode: 'simulation' | 'practice' | 'booster';
  coached?: boolean;
}

serve(async (req) => {
  console.log('[session-start] hit', { method: req.method, hasAuth: !!req.headers.get('authorization') });
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
      console.warn('[session-start] unauthorized', { authError: authError?.message, hasUser: !!user });
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    
    // Validate input with zod
    const validationResult = SessionStartSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(JSON.stringify({ 
        error: 'Invalid request data',
        details: validationResult.error.errors 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { form_id, section, mode, coached } = validationResult.data;

    // Validate form_id format for simulations
    if (mode === 'simulation' && !['FA_', 'FB_', 'FC_'].some(prefix => form_id.startsWith(prefix))) {
      return new Response(JSON.stringify({ 
        error: 'Invalid form_id for simulation. Must be FA_*, FB_*, or FC_*' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate section
    if (!['EN', 'MATH', 'RD', 'SCI'].includes(section)) {
      return new Response(JSON.stringify({ error: 'Invalid section' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Set time limits based on section (in seconds)
    const timeLimits = {
      'EN': 45 * 60,    // 45 minutes
      'MATH': 60 * 60,  // 60 minutes
      'RD': 35 * 60,    // 35 minutes
      'SCI': 35 * 60,   // 35 minutes
    };

    const time_limit_sec = timeLimits[section as keyof typeof timeLimits];

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        form_id,
        section,
        mode,
        time_limit_sec,
        coached,
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      return new Response(JSON.stringify({ error: 'Failed to create session' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      session_id: session.id,
      time_limit_sec,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in session-start function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});