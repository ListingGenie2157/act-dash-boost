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
    // Verify cron secret to prevent unauthorized triggering
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedSecret = Deno.env.get('CRON_SECRET');
    
    if (!expectedSecret) {
      console.error('CRON_SECRET not configured');
      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (cronSecret !== expectedSecret) {
      console.warn('Unauthorized cron attempt');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
    
    // Calculate the date 7 days from today
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 6);
    const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0];

    console.log(`Checking plans for period: ${todayStr} to ${sevenDaysStr}`);

    // Get all users with test dates (active users)
    const { data: activeUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, test_date')
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

    // Get study plan days for all users for the next 7 days
    const { data: existingPlans } = await supabase
      .from('study_plan_days')
      .select('user_id, the_date')
      .gte('the_date', todayStr)
      .lte('the_date', sevenDaysStr);

    // Count plans per user
    const planCountByUser: Record<string, number> = {};
    existingPlans?.forEach(plan => {
      planCountByUser[plan.user_id] = (planCountByUser[plan.user_id] || 0) + 1;
    });

    // Filter users who need plan refresh (less than 7 future days planned)
    const usersNeedingPlans = activeUsers.filter(user => {
      const futurePlansCount = planCountByUser[user.id] || 0;
      // Also skip users whose test date has already passed
      const testDate = new Date(user.test_date + 'T00:00:00');
      const testPassed = testDate < today;
      
      if (testPassed) {
        console.log(`User ${user.id}: Test date passed, skipping`);
        return false;
      }
      
      if (futurePlansCount < 7) {
        console.log(`User ${user.id}: Only ${futurePlansCount}/7 future days, needs regeneration`);
        return true;
      }
      
      return false;
    });

    console.log(`${usersNeedingPlans.length} users need plan generation`);

    let successCount = 0;
    let errorCount = 0;
    const batchSize = 5; // Process in batches to avoid overwhelming the system

    // Process users in batches using service role
    for (let i = 0; i < usersNeedingPlans.length; i += batchSize) {
      const batch = usersNeedingPlans.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (user) => {
        try {
          console.log(`Generating plan for user ${user.id}...`);
          
          // Create a service role client that impersonates the user
          // This is done by creating a JWT for the user
          const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user.id);
          
          if (userError || !userData?.user) {
            console.error(`Error fetching user ${user.id}:`, userError);
            throw new Error(`Could not find user: ${user.id}`);
          }

          // Generate a new session for this user
          const { data: sessionData, error: sessionError } = await supabase.auth.admin.createUser({
            email: userData.user.email || `temp-${user.id}@placeholder.com`,
            email_confirm: true,
            user_metadata: userData.user.user_metadata,
          });

          // Instead of creating new users, just use the service role to call the function
          // with a user-scoped client
          const response = await fetch(`${supabaseUrl}/functions/v1/generate-study-plan`, {
            method: 'POST',
            headers: {
              // Use service role key with user impersonation
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'x-user-id': user.id, // Custom header to identify user
            },
            body: JSON.stringify({ force: true, userId: user.id })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error generating plan for user ${user.id}:`, errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }

          const result = await response.json();
          console.log(`Successfully generated plan for user ${user.id}:`, result.days?.length || 0, 'days');
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
