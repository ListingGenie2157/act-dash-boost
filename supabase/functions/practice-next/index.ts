import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PracticeNextRequest {
  section: string;
  count: number;
  target_skill_ids?: string[];
}

serve(async (req) => {
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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user from the JWT token
    const authHeader = req.headers.get('authorization')!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { section, count, target_skill_ids }: PracticeNextRequest = await req.json();

    // Validate section
    if (!['EN', 'MATH', 'RD', 'SCI'].includes(section)) {
      return new Response(JSON.stringify({ error: 'Invalid section' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build query for adaptive question selection
    let query = supabase
      .from('questions')
      .select(`
        id,
        stem,
        choice_a,
        choice_b,
        choice_c,
        choice_d,
        difficulty,
        skill_id,
        skills!inner(subject)
      `);

    // Filter by section/subject mapping
    const subjectMap = {
      'EN': 'English',
      'MATH': 'Math',
      'RD': 'Reading',
      'SCI': 'Science'
    };
    
    query = query.eq('skills.subject', subjectMap[section as keyof typeof subjectMap]);

    // Filter by target skills if provided
    if (target_skill_ids && target_skill_ids.length > 0) {
      query = query.in('skill_id', target_skill_ids);
    }

    const { data: allQuestions, error: questionsError } = await query;

    if (questionsError) {
      console.error('Questions fetch error:', questionsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch questions' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!allQuestions || allQuestions.length === 0) {
      return new Response(JSON.stringify({ error: 'No questions found for the specified criteria' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's mastery data for adaptive selection
    const skillIds = [...new Set(allQuestions.map(q => q.skill_id))];
    const { data: masteryData } = await supabase
      .from('mastery')
      .select('skill_id, correct, total')
      .eq('user_id', user.id)
      .in('skill_id', skillIds);

    // Create mastery lookup map
    const masteryMap = new Map();
    masteryData?.forEach(m => {
      const accuracy = m.total > 0 ? m.correct / m.total : 0;
      masteryMap.set(m.skill_id, accuracy);
    });

    // Sort questions by weakness (lowest accuracy first), then randomly
    const sortedQuestions = allQuestions.sort((a, b) => {
      const accuracyA = masteryMap.get(a.skill_id) ?? 0;
      const accuracyB = masteryMap.get(b.skill_id) ?? 0;
      
      // First sort by accuracy (ascending - weakest first)
      if (accuracyA !== accuracyB) {
        return accuracyA - accuracyB;
      }
      
      // Then randomly within same accuracy level
      return Math.random() - 0.5;
    });

    // Take the requested count
    const selectedQuestions = sortedQuestions.slice(0, count);

    // Format questions for response
    const questions = selectedQuestions.map(q => ({
      id: q.id,
      question: q.stem,
      choice_a: q.choice_a,
      choice_b: q.choice_b,
      choice_c: q.choice_c,
      choice_d: q.choice_d,
      skill_id: q.skill_id,
    }));

    return new Response(JSON.stringify({
      questions,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in practice-next function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});