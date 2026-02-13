import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, getClientIp, createRateLimitResponse } from '../_shared/rateLimit.ts';
import { getAllSectionVariants } from '../_shared/sectionVariants.ts';

type PassagePayload = {
  title: string;
  passage_text: string;
  marked_text: unknown;
  passage_format: unknown;
  passage_type: string | null;
  has_charts: boolean;
  chart_images: unknown;
};

type QuestionRow = Record<string, unknown>;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    // Rate limit
    const ip = getClientIp(req);
    const allowed = await checkRateLimit(user.id, ip, 'session-fetch', 30, 60000);
    if (!allowed) {
      return createRateLimitResponse(corsHeaders);
    }

    // Get session_id
    let session_id: string | null = null;
    if (req.method === 'GET') {
      const url = new URL(req.url);
      session_id = url.searchParams.get('session_id');
    } else if (req.method === 'POST') {
      const body = await req.json();
      session_id = body.session_id;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!session_id || !uuidRegex.test(session_id)) {
      return new Response(JSON.stringify({ error: 'Invalid or missing session_id format' }), {
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

    // Subscription gating (exempt diagnostic/onboarding)
    const isExemptForm = session.form_id.startsWith('D2') || session.form_id.startsWith('ONB');

    if (!isExemptForm) {
      const serviceClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
        auth: { persistSession: false },
      });
      const { data: sub } = await serviceClient
        .from('subscriptions')
        .select('status, current_period_end')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .limit(1)
        .maybeSingle();

      if (!sub || (sub.current_period_end && new Date(sub.current_period_end) < new Date())) {
        return new Response(JSON.stringify({ error: 'Subscription required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // ── Fetch pinned question IDs (new sessions) ───────────────────────
    const { data: pinnedRows } = await supabase
      .from('session_questions')
      .select('question_id, ord, passage_id')
      .eq('session_id', session_id)
      .order('ord');

    const hasPinned = pinnedRows && pinnedRows.length > 0;

    const useStaging = session.form_id.startsWith('F') || session.form_id.startsWith('DR_')
      || session.form_id.startsWith('D2') || session.form_id.startsWith('ONB');
    const sectionVariants = getAllSectionVariants(session.section);

    let questionsData: QuestionRow[] = [];
    let questionsError: unknown = null;

    if (hasPinned) {
      // ── Secure path: fetch only pinned question IDs ────────────────
      const pinnedIds = pinnedRows.map(r => r.question_id);

      if (useStaging) {
        const numericIds = pinnedIds.map(Number).filter(n => !isNaN(n));
        const { data, error } = await supabase
          .from('v_staging_items_public')
          .select('staging_id, form_id, section, ord, skill_code, question, choice_a, choice_b, choice_c, choice_d, difficulty, passage_id, passage_text, passage_title, underlined_text, reference_number, position_in_passage, image_url, image_caption, image_position, calculator_allowed')
          .in('staging_id', numericIds);
        questionsData = (data as QuestionRow[]) || [];
        questionsError = error;
      } else {
        const { data, error } = await supabase
          .from('v_form_section_public')
          .select('*')
          .in('question_id', pinnedIds);
        questionsData = (data as QuestionRow[]) || [];
        questionsError = error;
      }

      // Re-sort by pinned ord
      const ordMap = new Map(pinnedRows.map(r => [r.question_id, r.ord]));
      questionsData.sort((a, b) => {
        const idA = String(a['question_id'] ?? a['staging_id'] ?? '');
        const idB = String(b['question_id'] ?? b['staging_id'] ?? '');
        return (ordMap.get(idA) ?? 0) - (ordMap.get(idB) ?? 0);
      });
    } else {
      // ── Legacy fallback for sessions created before pinning ────────
      if (useStaging) {
        const { data, error } = await supabase
          .from('v_staging_items_public')
          .select('staging_id, form_id, section, ord, skill_code, question, choice_a, choice_b, choice_c, choice_d, difficulty, passage_id, passage_text, passage_title, underlined_text, reference_number, position_in_passage, image_url, image_caption, image_position, calculator_allowed')
          .eq('form_id', session.form_id)
          .in('section', sectionVariants)
          .order('ord');
        questionsData = (data as QuestionRow[]) || [];
        questionsError = error;
      } else {
        const { data, error } = await supabase
          .from('v_form_section_public')
          .select('*')
          .eq('form_id', session.form_id)
          .in('section', sectionVariants)
          .order('ord');
        questionsData = (data as QuestionRow[]) || [];
        questionsError = error;
      }
    }

    if (questionsError) {
      console.error('[session-fetch] Questions fetch error:', questionsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch questions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Format questions ───────────────────────────────────────────────
    const questions = questionsData.map((q) => {
      const questionId =
        (typeof q['question_id'] === 'string' ? q['question_id'] : null) ??
        (typeof q['id'] === 'string' ? q['id'] : null) ??
        (typeof q['staging_id'] === 'number' ? String(q['staging_id']) : null) ??
        `${session.form_id}_${session.section}_${q['ord'] ?? 0}`;

      return {
        id: questionId,
        ord: typeof q['ord'] === 'number' ? q['ord'] : 0,
        question: (q['question'] as string) ?? (q['stem'] as string) ?? '',
        choice_a: (q['choice_a'] as string) ?? '',
        choice_b: (q['choice_b'] as string) ?? '',
        choice_c: (q['choice_c'] as string) ?? '',
        choice_d: (q['choice_d'] as string) ?? '',
        choice_e: (q['choice_e'] as string) ?? null,
        passage_id: (q['passage_id'] as string) ?? null,
        image_url: (q['image_url'] as string) ?? null,
        image_caption: (q['image_caption'] as string) ?? null,
        image_position: (q['image_position'] as string) ?? 'above_question',
        underlined_text: (q['underlined_text'] as string) ?? null,
        reference_number: typeof q['reference_number'] === 'number' ? q['reference_number'] : null,
        position_in_passage: typeof q['position_in_passage'] === 'number' ? q['position_in_passage'] : null,
        calculator_allowed: typeof q['calculator_allowed'] === 'boolean' ? q['calculator_allowed'] : true,
      };
    });

    // ── Collect passages ───────────────────────────────────────────────
    const passages: Record<string, PassagePayload> = {};
    const sessionSectionUpper = session.section.toUpperCase();
    const isPassageSection = ['EN', 'ENGLISH', 'RD', 'READING', 'SCI', 'SC', 'SCIENCE'].includes(sessionSectionUpper);

    if (isPassageSection) {
      // Extract inline passage text from question rows
      const passageTextMap = new Map<string, { text: string; title: string }>();
      questionsData.forEach(q => {
        const pid = q['passage_id'] as string | undefined;
        const text = (q['passage_text'] as string) ?? (q['passage'] as string);
        if (pid && text && !passageTextMap.has(pid)) {
          passageTextMap.set(pid, {
            text,
            title: (q['passage_title'] as string) || ''
          });
        }
      });

      passageTextMap.forEach((value, pid) => {
        passages[pid] = {
          title: value.title,
          passage_text: value.text,
          marked_text: null,
          passage_format: null,
          passage_type: null,
          has_charts: false,
          chart_images: null,
        };
      });

      // Fetch missing passages from passages table
      const passageIds = [...new Set(questionsData.map(q => q['passage_id'] as string).filter(Boolean))];
      const missingPassageIds = passageIds.filter(id => !passages[id]);

      if (missingPassageIds.length > 0) {
        const { data: passageData, error: passageError } = await supabase
          .from('passages')
          .select('*')
          .in('id', missingPassageIds);

        if (!passageError && passageData) {
          passageData.forEach((p: Record<string, unknown>) => {
            passages[p['id'] as string] = {
              title: (p['title'] as string) || '',
              passage_text: p['passage_text'] as string,
              marked_text: p['marked_text'] ?? null,
              passage_format: p['passage_format'] ?? null,
              passage_type: (p['passage_type'] as string) ?? null,
              has_charts: (p['has_charts'] as boolean) ?? false,
              chart_images: p['chart_images'] ?? null,
            };
          });
        }
      }

      // Synthetic passages for questions without passage_id but with passage_text
      questionsData.forEach((q, idx) => {
        const text = (q['passage_text'] as string) ?? (q['passage'] as string);
        if (!q['passage_id'] && text) {
          const syntheticId = `inline_${idx}`;
          const questionToUpdate = questions.find(qn => qn.ord === (q['ord'] as number));
          if (questionToUpdate) {
            questionToUpdate.passage_id = syntheticId;
          }
          if (!passages[syntheticId]) {
            passages[syntheticId] = {
              title: (q['passage_title'] as string) || `Passage ${idx + 1}`,
              passage_text: text,
              marked_text: null,
              passage_format: null,
              passage_type: null,
              has_charts: false,
              chart_images: null,
            };
          }
        }
      });
    }

    return new Response(JSON.stringify({ questions, passages }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[session-fetch] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
