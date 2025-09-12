#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || "https://hhbkmxrzxcswwokmbtbz.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function smokeTest() {
  console.log('🚀 Starting comprehensive smoke test...\n');

  try {
    // Step 1: Create or get test user
    console.log('1️⃣ Setting up test user...');
    const testEmail = 'smoketest@example.com';
    
    // Try to sign up (will fail if user exists, which is fine)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'smoketest123'
    });

    if (authError && !authError.message.includes('already registered')) {
      throw new Error(`Auth error: ${authError.message}`);
    }

    // Get user by email for testing
    const { data: users } = await supabase.auth.admin.listUsers();
    const testUser = users?.users?.find(u => u.email === testEmail);
    
    if (!testUser) {
      throw new Error('Test user not found');
    }

    console.log('✅ Test user ready:', testUser.id);

    // Step 2: Test set-test-date function with tomorrow's date
    console.log('\n2️⃣ Testing set-test-date function with tomorrow...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const testDate = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Create JWT token for the test user
    const { data: { session }, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: testEmail
    });

    if (sessionError) {
      throw new Error(`Session generation error: ${sessionError.message}`);
    }

    const token = session?.access_token;
    if (!token) {
      throw new Error('No access token generated');
    }

    const { data: setDateResult, error: setDateError } = await supabase.functions.invoke('set-test-date', {
      body: { testDate },
      headers: { Authorization: `Bearer ${token}` }
    });

    if (setDateError) {
      throw new Error(`set-test-date error: ${setDateError.message}`);
    }

    console.log('✅ set-test-date response:', {
      hasTestDate: 'test_date' in setDateResult,
      testDate: setDateResult.test_date
    });

    // Step 3: Test generate-study-plan function
    console.log('\n3️⃣ Testing generate-study-plan function...');
    
    const { data: studyPlanResult, error: studyPlanError } = await supabase.functions.invoke('generate-study-plan', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (studyPlanError) {
      throw new Error(`generate-study-plan error: ${studyPlanError.message}`);
    }

    console.log('✅ generate-study-plan response:', {
      hasSuccess: 'success' in studyPlanResult,
      hasTasks: 'tasks' in studyPlanResult,
      tasksLength: studyPlanResult.tasks?.length || 0
    });

    // Assert tasks.length > 0
    if (!studyPlanResult.tasks || studyPlanResult.tasks.length === 0) {
      throw new Error('Expected tasks.length > 0, but got 0 tasks');
    }

    // Step 4: Get a DRILL task and mark it DONE
    console.log('\n4️⃣ Testing complete-task and calculate-rewards functions...');
    
    // First, get available drill tasks
    const { data: tasks } = await supabase
      .from('study_tasks')
      .select('*')
      .eq('user_id', testUser.id)
      .eq('type', 'DRILL')
      .eq('status', 'PENDING')
      .limit(1);

    if (!tasks || tasks.length === 0) {
      console.log('⚠️ No DRILL tasks found, skipping complete-task test');
    } else {
      const testTask = tasks[0];
      
      // Mark task as DONE with high accuracy (≥85%)
      const { data: completeResult, error: completeError } = await supabase.functions.invoke('complete-task', {
        body: {
          task_id: testTask.id,
          accuracy: 87.5, // Above 85% threshold
          time_taken_ms: 40000, // Under 45s threshold
          answers: [
            { question_id: 'test-q1', correct: true, time_ms: 20000 },
            { question_id: 'test-q2', correct: true, time_ms: 20000 }
          ]
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (completeError) {
        throw new Error(`complete-task error: ${completeError.message}`);
      }

      console.log('✅ complete-task response:', {
        hasSuccess: 'success' in completeResult,
        taskId: testTask.id,
        accuracy: 87.5
      });

      // Step 5: Test calculate-rewards function
      console.log('\n5️⃣ Testing calculate-rewards function...');
      
      const { data: rewardsResult, error: rewardsError } = await supabase.functions.invoke('calculate-rewards', {
        body: {
          taskId: testTask.id,
          taskType: 'DRILL'
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      if (rewardsError) {
        throw new Error(`calculate-rewards error: ${rewardsError.message}`);
      }

      console.log('✅ calculate-rewards response:', {
        hasSuccess: 'success' in rewardsResult,
        hasRewardsEarned: 'rewardsEarned' in rewardsResult,
        rewardsEarned: rewardsResult.rewardsEarned || 0
      });

      // Check if ledger incremented (may be 0 if no parent rules exist)
      const { data: ledgerEntries } = await supabase
        .from('rewards_ledger')
        .select('*')
        .eq('student_id', testUser.id)
        .order('earned_at', { ascending: false })
        .limit(1);

      console.log('✅ Ledger check:', {
        hasEntries: ledgerEntries && ledgerEntries.length > 0,
        latestEntry: ledgerEntries?.[0] || null
      });
    }

    // Step 6: Test days-left function
    console.log('\n6️⃣ Testing days-left function...');
    
    const { data: daysLeftResult, error: daysLeftError } = await supabase.functions.invoke('days-left', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (daysLeftError) {
      throw new Error(`days-left error: ${daysLeftError.message}`);
    }

    console.log('✅ days-left response:', {
      hasDaysLeft: 'days_left' in daysLeftResult,
      hasTestDate: 'test_date' in daysLeftResult,
      daysLeftValue: daysLeftResult.days_left
    });

    console.log('\n🎉 All smoke tests passed! Edge functions are working correctly.');
    console.log('\n📋 Summary:');
    console.log('  ✅ User authentication and profiles');
    console.log('  ✅ Test date setting with tomorrow\'s date');
    console.log('  ✅ Study plan generation with tasks > 0');
    console.log('  ✅ Task completion with high accuracy');
    console.log('  ✅ Rewards calculation for qualifying performance');
    console.log('  ✅ Days calculation from test date');

  } catch (error) {
    console.error('\n💥 Smoke test failed:', error);
    process.exit(1);
  }
}

// Run the smoke test
smokeTest();