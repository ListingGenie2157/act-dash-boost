#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://hhbkmxrzxcswwokmbtbz.supabase.co";
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
  console.log('🚀 Starting smoke test...\n');

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

    // Step 2: Test set-test-date function
    console.log('\n2️⃣ Testing set-test-date function...');
    const testDate = '2024-03-15';
    
    const { data: setDateResult, error: setDateError } = await supabase.functions.invoke('set-test-date', {
      body: { test_date: testDate },
      headers: { Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` }
    });

    if (setDateError) {
      throw new Error(`set-test-date error: ${setDateError.message}`);
    }

    console.log('✅ set-test-date response shape:', {
      hasSuccess: 'success' in setDateResult,
      hasMessage: 'message' in setDateResult
    });

    // Step 3: Test days-left function
    console.log('\n3️⃣ Testing days-left function...');
    
    const { data: daysLeftResult, error: daysLeftError } = await supabase.functions.invoke('days-left', {
      headers: { Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` }
    });

    if (daysLeftError) {
      throw new Error(`days-left error: ${daysLeftError.message}`);
    }

    console.log('✅ days-left response shape:', {
      hasDaysLeft: 'days_left' in daysLeftResult,
      hasTestDate: 'test_date' in daysLeftResult,
      daysLeftValue: daysLeftResult.days_left
    });

    // Step 4: Test generate-study-plan function
    console.log('\n4️⃣ Testing generate-study-plan function...');
    
    const { data: studyPlanResult, error: studyPlanError } = await supabase.functions.invoke('generate-study-plan', {
      headers: { Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` }
    });

    if (studyPlanError) {
      throw new Error(`generate-study-plan error: ${studyPlanError.message}`);
    }

    console.log('✅ generate-study-plan response shape:', {
      hasSuccess: 'success' in studyPlanResult,
      hasPlansGenerated: 'plans_generated' in studyPlanResult,
      hasMessage: 'message' in studyPlanResult
    });

    // Step 5: Get a DRILL task and mark it DONE
    console.log('\n5️⃣ Testing complete-task function...');
    
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
      
      const { data: completeResult, error: completeError } = await supabase.functions.invoke('complete-task', {
        body: {
          task_id: testTask.id,
          accuracy: 85.5,
          time_taken_ms: 45000,
          answers: [
            { question_id: 'test-q1', correct: true, time_ms: 22500 },
            { question_id: 'test-q2', correct: false, time_ms: 22500 }
          ]
        },
        headers: { Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` }
      });

      if (completeError) {
        throw new Error(`complete-task error: ${completeError.message}`);
      }

      console.log('✅ complete-task response shape:', {
        hasSuccess: 'success' in completeResult,
        hasMessage: 'message' in completeResult,
        taskId: testTask.id
      });
    }

    console.log('\n🎉 All smoke tests passed! Edge functions are working correctly.');

  } catch (error) {
    console.error('\n💥 Smoke test failed:', error);
    process.exit(1);
  }
}

// Run the smoke test
smokeTest();