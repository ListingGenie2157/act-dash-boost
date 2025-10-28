import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app',
};

// Pure function for validating date input (testable)
export function validateTestDate(testDateString: string): { isValid: boolean; error?: string; date?: Date } {
  // Check if date string matches YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(testDateString)) {
    return { isValid: false, error: 'Date must be in YYYY-MM-DD format' };
  }

  // Parse the date
  const testDate = new Date(testDateString + 'T00:00:00');
  
  // Check if date is valid
  if (isNaN(testDate.getTime())) {
    return { isValid: false, error: 'Invalid date provided' };
  }

  // Check if date is in the future (compare with today in Chicago timezone)
  const now = new Date();
  const chicagoTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now);
  
  const year = parseInt(chicagoTime.find(part => part.type === 'year')?.value || '0');
  const month = parseInt(chicagoTime.find(part => part.type === 'month')?.value || '0') - 1;
  const day = parseInt(chicagoTime.find(part => part.type === 'day')?.value || '0');
  
  const todayChicago = new Date(year, month, day);
  
  if (testDate < todayChicago) {
    return { isValid: false, error: 'Test date cannot be in the past' };
  }

  return { isValid: true, date: testDate };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Initialize Supabase client with proper env validation
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables: SUPABASE_URL or SUPABASE_ANON_KEY');
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseKey,
      { global: { headers: { Authorization: req.headers.get('authorization') ?? '' } } }
    );

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.warn('No authorization header provided');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.warn('Authentication failed:', authError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body = await req.json();
    const { testDate } = body;

    if (!testDate) {
      return new Response(JSON.stringify({ error: 'testDate is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate the test date
    const validation = validateTestDate(testDate);
    if (!validation.isValid) {
      console.warn('Date validation failed:', validation.error);
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if profile exists, create if not
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!existingProfile) {
      // Create profile with test_date
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({ 
          id: user.id, 
          test_date: testDate 
        })
        .select('test_date')
        .single();

      if (insertError) {
        console.error('Error creating profile:', insertError);
        return new Response(JSON.stringify({ error: 'Failed to create profile' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.warn('Profile created with test date:', testDate);
      return new Response(JSON.stringify({ test_date: newProfile.test_date }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // Update existing profile
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ test_date: testDate })
        .eq('id', user.id)
        .select('test_date')
        .single();

      if (updateError) {
        console.error('Error updating profile:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to update profile' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.warn('Profile updated with test date:', testDate);
      return new Response(JSON.stringify({ test_date: updatedProfile.test_date }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in set-test-date function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});