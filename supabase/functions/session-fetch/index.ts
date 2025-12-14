import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { checkRateLimit, getClientIp, createRateLimitResponse } from '../_shared/rateLimit.ts';
import { getOrFetch, CacheKeys, CacheTTL } from '../_shared/cache.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

/**
 * Get all possible database variants for a section code.
 */
function getAllSectionVariants(sectionCode: string): string[] {
  const upper = sectionCode.toUpperCase();
  
  switch (upper) {
    case 'EN':
    case 'ENGLISH':
      return ['EN', 'English', 'ENGLISH', 'english'];
    case 'MATH':
    case 'MA':
      return ['MA', 'Math', 'MATH', 'math'];
    case 'RD':
    case 'READING':
      return ['RD', 'Reading', 'READING', 'reading'];
    case 'SCI':
    case 'SC':
    case 'SCIENCE':
      return ['SC', 'SCI', 'Science', 'SCIENCE', 'science'];
    default:
      return [sectionCode];
  }
}

/**
 * Normalize section code to standard code for passages table query
 */
function normalizeToCode(section: string): string {
  const upper = section.toUpperCase();
  if (['EN', 'ENGLISH'].includes(upper)) return 'EN';
  if (['MA', 'MATH'].includes(upper)) return 'MATH';
  if (['RD', 'READING'].includes(upper)) return 'RD';
  if (['SC', 'SCI', 'SCIENCE'].includes(upper)) return 'SCI';
  return section;
}

serve(async (req) => {
  console.log('[session-fetch] hit', { method: req.method, hasAuth: !!req.headers.get('authorization') });
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting: 100 requests per minute per IP
  const clientIp = getClientIp(req);
  if (!checkRateLimit(clientIp, 100, 60000)) {
    return createRateLimitResponse(corsHeaders);
  }

  try {
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

    // Determine data source
    const useStaging = session.form_id.startsWith('F') || session.form_id.startsWith('DR_') || session.form_id.startsWith('D2') || session.form_id.startsWith('ONB');
    const sectionVariants = getAllSectionVariants(session.section);
    const sectionCode = normalizeToCode(session.section);
    
    console.log(`[session-fetch] Fetching from ${useStaging ? 'staging_items' : 'v_form_section'}`, {
      form_id: session.form_id,
      session_section: session.section,
      sectionVariants,
      sectionCode,
    });
    
    let questionsData: any[];
    let questionsError: any;

    // CACHED: Form questions are static data - cache for 1 hour
    const cacheKey = CacheKeys.FORM_QUESTIONS(session.form_id, session.section);
    
    if (useStaging) {
      questionsData = await getOrFetch(
        `${cacheKey}:staging`,
        async () => {
          const { data, error } = await supabase
            .from('staging_items')
            .select('*')
            .eq('form_id', session.form_id)
            .in('section', sectionVariants)
            .order('ord');
          if (error) throw error;
          return data || [];
        },
        CacheTTL.FORMS
      );
      questionsError = null;
      console.log(`[session-fetch] staging_items query (cached): ${questionsData.length} questions`);
    } else {
      questionsData = await getOrFetch(
        cacheKey,
        async () => {
          const { data, error } = await supabase
            .from('v_form_section')
            .select('*')
            .eq('form_id', session.form_id)
            .in('section', sectionVariants)
            .order('ord');
          if (error) throw error;
          return data || [];
        },
        CacheTTL.FORMS
      );
      questionsError = null;
      console.log(`[session-fetch] v_form_section query (cached): ${questionsData.length} questions`);
    }

    if (questionsError) {
      console.error('[session-fetch] Questions fetch error:', questionsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch questions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Format questions
    const questions = questionsData.map(q => ({
      id: q.question_id ?? q.id ?? q.staging_id?.toString() ?? `${session.form_id}_${session.section}_${q.ord}`,
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

    // Collect passages from multiple sources
    const passages: Record<string, any> = {};
    const sessionSectionUpper = session.section.toUpperCase();
    const isPassageSection = ['EN', 'ENGLISH', 'RD', 'READING', 'SCI', 'SC', 'SCIENCE'].includes(sessionSectionUpper);
    
    if (isPassageSection) {
      // 1. First extract passages from staging_items rows
      // For English, passage_text may only be on first question of each passage group
      // So we collect all text we find and keep the first non-null value per passage_id
      const passageTextMap = new Map<string, { text: string; title: string }>();
      
      questionsData.forEach(q => {
        const pid = q.passage_id;
        const text = q.passage_text ?? q.passage;
        if (pid && text && !passageTextMap.has(pid)) {
          passageTextMap.set(pid, {
            text: text,
            title: q.passage_title || ''
          });
        }
      });
      
      // Build passages from collected data
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
      
      console.log(`[session-fetch] Extracted ${Object.keys(passages).length} passages from questions`);

      // 2. Query the passages table for any missing passages
      const passageIds = [...new Set(questionsData.map(q => q.passage_id).filter(Boolean))];
      const missingPassageIds = passageIds.filter(id => !passages[id]);
      
      if (missingPassageIds.length > 0) {
        console.log(`[session-fetch] Fetching ${missingPassageIds.length} passages from passages table:`, missingPassageIds);
        
        const { data: passageData, error: passageError } = await supabase
          .from('passages')
          .select('*')
          .in('id', missingPassageIds);
        
        if (passageError) {
          console.error('[session-fetch] Error fetching passages:', passageError);
        } else if (passageData) {
          passageData.forEach(p => {
            passages[p.id] = {
              title: p.title || '',
              passage_text: p.passage_text,
              marked_text: p.marked_text ?? null,
              passage_format: p.passage_format ?? null,
              passage_type: p.passage_type ?? null,
              has_charts: p.has_charts ?? false,
              chart_images: p.chart_images ?? null,
            };
          });
          console.log(`[session-fetch] Added ${passageData.length} passages from passages table`);
        }
      }

      // 3. For questions without passage_id but with passage_text, create synthetic passage
      questionsData.forEach((q, idx) => {
        const text = q.passage_text ?? q.passage;
        if (!q.passage_id && text) {
          const syntheticId = `inline_${idx}`;
          // Assign this synthetic passage_id to the question
          const questionToUpdate = questions.find(qn => qn.ord === q.ord);
          if (questionToUpdate) {
            questionToUpdate.passage_id = syntheticId;
          }
          if (!passages[syntheticId]) {
            passages[syntheticId] = {
              title: q.passage_title || `Passage ${idx + 1}`,
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

      console.log(`[session-fetch] Final passage count: ${Object.keys(passages).length}`);
    }

    return new Response(JSON.stringify({
      questions,
      passages,
    }), {
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
