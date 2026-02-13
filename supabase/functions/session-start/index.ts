import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, getClientIp, createRateLimitResponse } from '../_shared/rateLimit.ts';
import { getAllSectionVariants } from '../_shared/sectionVariants.ts';
import { requireEnv } from '../_shared/env.ts';

const SessionStartSchema = z.object({
  form_id: z.string().min(1).max(50),
  section: z.enum(['EN', 'MATH', 'RD', 'SCI']),
  mode: z.enum(['simulation', 'practice', 'booster']),
  coached: z.boolean().optional().default(false)
});

/** Max sessions any single user can create per calendar day */
const MAX_SESSIONS_PER_DAY = 15;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

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
    const supabaseUrl = requireEnv('SUPABASE_URL');
    const supabaseAnonKey = requireEnv('SUPABASE_ANON_KEY');
    const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

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

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting: 20 sessions per minute
    const clientIp = getClientIp(req);
    const isAllowed = await checkRateLimit(user.id, clientIp, 'session-start', 20, 60000);
    if (!isAllowed) {
      return createRateLimitResponse(corsHeaders);
    }

    const body = await req.json();

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

    // ── Daily session cap ──────────────────────────────────────────────
    const today = new Date().toISOString().split('T')[0];
    const { count, error: countError } = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', `${today}T00:00:00Z`);

    if (!countError && count !== null && count >= MAX_SESSIONS_PER_DAY) {
      return new Response(JSON.stringify({
        error: 'Daily session limit reached. Try again tomorrow.'
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Time limits (ACT Enhanced format 2024+) ────────────────────────
    const timeLimits: Record<string, number> = {
      'EN': 35 * 60,
      'MATH': 50 * 60,
      'RD': 40 * 60,
      'SCI': 40 * 60,
    };
    const time_limit_sec = timeLimits[section];

    // ── Create session ─────────────────────────────────────────────────
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

    // ── Pin questions to session (anti-scrape) ─────────────────────────
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const sectionVariants = getAllSectionVariants(section);
    const useStaging = form_id.startsWith('F') || form_id.startsWith('DR_')
      || form_id.startsWith('D2') || form_id.startsWith('ONB');

    type PinRow = { session_id: string; question_id: string; ord: number; passage_id: string | null };
    let pinRows: PinRow[] = [];

    if (useStaging) {
      const { data } = await serviceClient
        .from('staging_items')
        .select('staging_id, ord, passage_id')
        .eq('form_id', form_id)
        .in('section', sectionVariants)
        .order('ord');
      pinRows = (data || []).map((q: { staging_id: number; ord: number; passage_id: string | null }) => ({
        session_id: session.id,
        question_id: String(q.staging_id),
        ord: q.ord,
        passage_id: q.passage_id || null,
      }));
    } else {
      const { data } = await serviceClient
        .from('form_questions')
        .select('question_id, ord, passage_id')
        .eq('form_id', form_id)
        .in('section', sectionVariants)
        .order('ord');
      pinRows = (data || []).map((q: { question_id: string; ord: number; passage_id: string | null }) => ({
        session_id: session.id,
        question_id: q.question_id,
        ord: q.ord,
        passage_id: q.passage_id || null,
      }));
    }

    if (pinRows.length > 0) {
      const { error: pinError } = await serviceClient
        .from('session_questions')
        .insert(pinRows);
      if (pinError) {
        console.error('Failed to pin questions to session:', pinError);
        // Non-fatal: session-fetch falls back to legacy query
      }
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
