import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportRecord {
  ord: number;
  form_id: string;
  section: string;
  passage_id?: string;
  passage_type?: string;
  passage_title?: string;
  passage_text?: string;
  topic?: string;
  skill_code: string;
  difficulty: string;
  question: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  answer: string;
  explanation?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    // Use service role key for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the JWT token from the Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    // Verify user is authenticated and is an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response('Unauthorized', { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    // Check if user is admin (you may need to implement is_admin RPC function)
    const { data: isAdmin, error: adminError } = await supabase
      .rpc('is_admin', { user_id: user.id });

    if (adminError || !isAdmin) {
      return new Response('Forbidden', { 
        status: 403, 
        headers: corsHeaders 
      });
    }

    const { records } = await req.json() as { records: ImportRecord[] };

    if (!Array.isArray(records) || records.length === 0) {
      return new Response('Invalid data', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Clear existing staging items for this form_id if provided
    const formIds = [...new Set(records.map(r => r.form_id))];
    for (const formId of formIds) {
      const { error: deleteError } = await supabase
        .from('staging_items')
        .delete()
        .eq('form_id', formId);

      if (deleteError) {
        console.error('Error clearing staging items:', deleteError);
      }
    }

    // Insert new records in batches
    const batchSize = 100;
    let totalInserted = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('staging_items')
        .insert(batch)
        .select('staging_id');

      if (error) {
        console.error('Batch insert error:', error);
        return new Response(`Import failed: ${error.message}`, { 
          status: 500, 
          headers: corsHeaders 
        });
      }

      totalInserted += data?.length || 0;
    }

    return new Response(JSON.stringify({
      success: true,
      imported: totalInserted,
      message: `Successfully imported ${totalInserted} records`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Import error:', error);
    return new Response(`Server error: ${error.message}`, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});