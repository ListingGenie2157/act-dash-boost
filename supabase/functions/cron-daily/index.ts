import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting daily cron job...');

    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get today in Chicago timezone
    const today = getTodayInChicago();
    const todayStr = today.toISOString().split('T')[0];

    // Get all users who don't have a study plan for today
    // We'll use profiles table to get active users (those with test dates)
    const { data: activeUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id')
      .not('test_date', 'is', null);

    if (usersError) {
      console.error('Error fetching active users:', usersError);
      throw usersError;
    }

    if (!activeUsers || activeUsers.length === 0) {
      console.log('No active users found');
      return new Response(JSON.stringify({ 
        message: 'No active users found',
        processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${activeUsers.length} active users`);

    // Get users who already have plans for today
    const { data: existingPlans } = await supabase
      .from('study_plan_days')
      .select('user_id')
      .eq('the_date', todayStr);

    const usersWithPlans = new Set(existingPlans?.map(p => p.user_id) || []);

    // Filter users who need plan generation
    const usersNeedingPlans = activeUsers.filter(user => !usersWithPlans.has(user.id));

    console.log(`${usersNeedingPlans.length} users need plan generation`);

    let successCount = 0;
    let errorCount = 0;
    const batchSize = 5; // Process in batches to avoid overwhelming the system

    // Process users in batches
    for (let i = 0; i < usersNeedingPlans.length; i += batchSize) {
      const batch = usersNeedingPlans.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (user) => {
        try {
          // Create a JWT token for the user to call the generate-study-plan function
          const { data: tokenData, error: tokenError } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: `user-${user.id}@temp.com`, // Placeholder email for token generation
            options: {
              redirectTo: 'http://localhost:3000' // Placeholder redirect
            }
          });

          if (tokenError) {
            console.error(`Error generating token for user ${user.id}:`, tokenError);
            throw tokenError;
          }

          // Extract the access token from the response
          const accessToken = (tokenData as any)?.properties?.access_token;
          
          if (!accessToken) {
            throw new Error('No access token generated');
          }

          // Call the generate-study-plan function for this user
          const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-study-plan`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'apikey': Deno.env.get('SUPABASE_ANON_KEY') ?? ''
            },
            body: JSON.stringify({})
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error generating plan for user ${user.id}:`, errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }

          const result = await response.json();
          console.log(`Successfully generated plan for user ${user.id}:`, result.tasks?.length || 0, 'tasks');
          return { userId: user.id, success: true };

        } catch (error) {
          console.error(`Failed to generate plan for user ${user.id}:`, error);
          return { userId: user.id, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
      });

      // Wait for batch to complete
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } else {
          console.error(`Batch promise rejected for user ${batch[index].id}:`, result.reason);
          errorCount++;
        }
      });

      // Small delay between batches to be gentle on the system
      if (i + batchSize < usersNeedingPlans.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const summary = {
      message: 'Daily cron job completed',
      total_active_users: activeUsers.length,
      users_needing_plans: usersNeedingPlans.length,
      successful_generations: successCount,
      failed_generations: errorCount,
      execution_date: todayStr
    };

    console.log('Cron job summary:', summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in cron-daily function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Pure function for getting today in Chicago timezone
function getTodayInChicago(): Date {
  const now = new Date();
  const chicagoTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now);
  
  const year = parseInt(chicagoTime.find(part => part.type === 'year')?.value || '0');
  const month = parseInt(chicagoTime.find(part => part.type === 'month')?.value || '0') - 1; // Month is 0-indexed
  const day = parseInt(chicagoTime.find(part => part.type === 'day')?.value || '0');
  
  return new Date(year, month, day);
}