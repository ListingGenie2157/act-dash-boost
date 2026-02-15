import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, getClientIp, createRateLimitResponse } from '../_shared/rateLimit.ts';
import { parseBodyWithLimit } from '../_shared/mod.ts';

// Pure function for validating date input (testable)
export function validateTestDate(testDateString: string): { isValid: boolean; error?: string; date?: Date } {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(testDateString)) {
    return { isValid: false, error: 'Date must be in YYYY-MM-DD format' };
  }

  const testDate = new Date(testDateString + 'T00:00:00');
  
  if (isNaN(testDate.getTime())) {
    return { isValid: false, error: 'Invalid date provided' };
  }

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseKey,
      { global: { headers: { Authorization: req.headers.get('authorization') ?? '' } } }
    );

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting: 10 requests per minute
    const clientIp = getClientIp(req);
    const isAllowed = await checkRateLimit(user.id, clientIp, 'set-test-date', 10, 60000);
    if (!isAllowed) {
      return createRateLimitResponse(corsHeaders);
    }

    const parsed = await parseBodyWithLimit(req, corsHeaders);
    if ('error' in parsed) return parsed.error;
    const { testDate } = parsed.data as { testDate: string };

    if (!testDate) {
      return new Response(JSON.stringify({ error: 'testDate is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const validation = validateTestDate(testDate);
    if (!validation.isValid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!existingProfile) {
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

      return new Response(JSON.stringify({ test_date: newProfile.test_date }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
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
