import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { getCorsHeaders } from '../_shared/cors.ts';

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

type PassagePayload = {
  title: string;
  passage_text: string;
  marked_text: unknown;
  passage_format: unknown;
  passage_type: string | null;
  has_charts: boolean;
  chart_images: unknown;
};

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

    // Get session_id from query params (GET) or body (POST)
    let session_id: string | null = null;
    
    if (req.method === 'GET') {
      const url = new URL(req.url);
      session_id = url.searchParams.get('session_id');
    } else if (req.method === 'POST') {
      const body = await req.json();
      session_id = body.session_id;
    }

    // Validate session_id format (must be UUID)
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

    // Determine data source
    const useStaging = session.form_id.startsWith('F') || session.form_id.startsWith('DR_') || session.form_id.startsWith('D2') || session.form_id.startsWith('ONB');
    const sectionVariants = getAllSectionVariants(session.section);
    
    type QuestionRow = Record<string, unknown>;
    let questionsData: QuestionRow[] = [];
    let questionsError: unknown = null;

    if (useStaging) {
      // Use safe public view that excludes answer/explanation
      const { data, error } = await supabase
        .from('v_staging_items_public')
        .select('staging_id, form_id, section, ord, skill_code, question, choice_a, choice_b, choice_c, choice_d, difficulty, passage_id, passage_text, passage_title, underlined_text, reference_number, position_in_passage, image_url, image_caption, image_position, calculator_allowed')
        .eq('form_id', session.form_id)
        .in('section', sectionVariants)
        .order('ord');
      questionsData = (data as QuestionRow[]) || [];
      questionsError = error;
    } else {
      // Use safe public view that excludes answer/explanation
      const { data, error } = await supabase
        .from('v_form_section_public')
        .select('*')
        .eq('form_id', session.form_id)
        .in('section', sectionVariants)
        .order('ord');
      questionsData = (data as QuestionRow[]) || [];
      questionsError = error;
    }

    if (questionsError) {
      console.error('[session-fetch] Questions fetch error:', questionsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch questions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Format questions
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

    // Collect passages from multiple sources
    const passages: Record<string, PassagePayload> = {};
    const sessionSectionUpper = session.section.toUpperCase();
    const isPassageSection = ['EN', 'ENGLISH', 'RD', 'READING', 'SCI', 'SC', 'SCIENCE'].includes(sessionSectionUpper);
    
    if (isPassageSection) {
      const passageTextMap = new Map<string, { text: string; title: string }>();
      
      questionsData.forEach(q => {
        const pid = q['passage_id'] as string | undefined;
        const text = (q['passage_text'] as string) ?? (q['passage'] as string);
        if (pid && text && !passageTextMap.has(pid)) {
          passageTextMap.set(pid, {
            text: text,
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

      // Query the passages table for any missing passages
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

      // For questions without passage_id but with passage_text, create synthetic passage
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
