import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SetBaselineRequest {
  scores: {
    English?: number;
    Math?: number;  
    Reading?: number;
    Science?: number;
  };
  notes?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT and get user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: SetBaselineRequest = await req.json();
    
    if (!body.scores || Object.keys(body.scores).length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one score must be provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate score values
    const validSections = ['English', 'Math', 'Reading', 'Science'];
    for (const [section, score] of Object.entries(body.scores)) {
      if (!validSections.includes(section)) {
        return new Response(
          JSON.stringify({ error: `Invalid section: ${section}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (typeof score !== 'number' || score < 1 || score > 36) {
        return new Response(
          JSON.stringify({ error: `Invalid score for ${section}: must be between 1-36` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Save baseline entries for each provided section
    const savedBaselines = [];

    for (const [section, score] of Object.entries(body.scores)) {
      // First check if a baseline already exists for this user/section/source
      const { data: existingBaseline } = await supabase
        .from('diagnostics')
        .select('id')
        .eq('user_id', user.id)
        .eq('section', section)
        .eq('source', 'self')
        .maybeSingle();

      let result;
      if (existingBaseline) {
        // Update existing baseline
        const { data, error } = await supabase
          .from('diagnostics')
          .update({
            score: score,
            completed_at: new Date().toISOString(),
            notes: body.notes || null,
          })
          .eq('id', existingBaseline.id)
          .select()
          .single();

        if (error) {
          console.error(`Error updating baseline for ${section}:`, error);
          return new Response(
            JSON.stringify({ error: `Failed to update baseline for ${section}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = data;
      } else {
        // Insert new baseline
        const { data, error } = await supabase
          .from('diagnostics')
          .insert({
            user_id: user.id,
            section: section,
            source: 'self',
            score: score,
            completed_at: new Date().toISOString(),
            notes: body.notes || null,
            block: 0, // Default block for self-reported baselines
            responses: null,
          })
          .select()
          .single();

        if (error) {
          console.error(`Error creating baseline for ${section}:`, error);
          return new Response(
            JSON.stringify({ error: `Failed to create baseline for ${section}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        result = data;
      }

      savedBaselines.push(result);
    }

    console.warn(`Successfully saved ${savedBaselines.length} baseline entries for user ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        baselines: savedBaselines 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});