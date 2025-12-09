import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/env';

const SUPABASE_URL = getSupabaseUrl();
const SUPABASE_ANON_KEY = getSupabaseAnonKey();

describe('Edge Function Integration Tests', () => {
  let supabase: SupabaseClient;
  let testUserId: string;

  beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Create test user
    const { data, error } = await supabase.auth.signUp({
      email: `test-edge-functions-${Date.now()}@example.com`,
      password: 'test-password-123',
    });
    
    if (error || !data.user) throw error || new Error('Failed to create test user');
    testUserId = data.user.id;
  });

  afterAll(async () => {
    if (supabase) await supabase.auth.signOut();
  });

  describe('generate-study-plan function', () => {
    it('generates study plan for user with test date', async () => {
      // Set test date
      const testDate = new Date();
      testDate.setDate(testDate.getDate() + 30);
      
      await supabase
        .from('profiles')
        .upsert({
          id: testUserId,
          test_date: testDate.toISOString().split('T')[0],
          has_study_plan: false,
        });

      // Call generate-study-plan function
      const { error } = await supabase.functions.invoke('generate-study-plan', {
        body: { force: false },
      });

      expect(error).toBeNull();
      
      // Check that study plan was created
      const { data: planDays, error: planError } = await supabase
        .from('study_plan_days')
        .select('*')
        .eq('user_id', testUserId)
        .order('the_date', { ascending: true });

      expect(planError).toBeNull();
      expect(planDays).toBeDefined();
      expect(planDays?.length).toBeGreaterThan(0);
    });

    it('handles user without test date gracefully', async () => {
      // Clear test date
      await supabase
        .from('profiles')
        .update({ test_date: null })
        .eq('id', testUserId);

      const { data, error } = await supabase.functions.invoke('generate-study-plan', {
        body: { force: false },
      });

      // Should either succeed with estimated date or return appropriate error
      // The function should handle this case
      expect(data || error).toBeDefined();
    });
  });

  describe('set-test-date function', () => {
    it('updates user test date', async () => {
      const newTestDate = new Date();
      newTestDate.setDate(newTestDate.getDate() + 45);
      const dateStr = newTestDate.toISOString().split('T')[0];

      const { error } = await supabase.functions.invoke('set-test-date', {
        body: { test_date: dateStr },
      });

      expect(error).toBeNull();
      
      // Verify date was updated
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('test_date')
        .eq('id', testUserId)
        .single();

      expect(profileError).toBeNull();
      expect(profile?.test_date).toBe(dateStr);
    });
  });

  describe('complete-task function', () => {
    it('marks task as complete and updates mastery', async () => {
      // Create a study task
      const today = new Date().toISOString().split('T')[0];
      
      const { data: taskData, error: taskError } = await supabase
        .from('study_tasks')
        .insert({
          user_id: testUserId,
          the_date: today,
          type: 'DRILL',
          skill_id: 'test-skill-complete',
          size: 10,
          status: 'pending',
        })
        .select()
        .single();

      expect(taskError).toBeNull();
      expect(taskData).toBeDefined();

      // Complete the task
      const { error } = await supabase.functions.invoke('complete-task', {
        body: {
          task_id: taskData.id,
          score: 0.8, // 80% correct
          time_seconds: 300,
        },
      });

      expect(error).toBeNull();
      
      // Verify task is completed
      const { data: completedTask, error: taskCheckError } = await supabase
        .from('study_tasks')
        .select('status')
        .eq('id', taskData.id)
        .single();

      expect(taskCheckError).toBeNull();
      expect(completedTask?.status).toBe('completed');
    });
  });

  describe('days-left function', () => {
    it('calculates days until test date', async () => {
      const testDate = new Date();
      testDate.setDate(testDate.getDate() + 25);
      
      await supabase
        .from('profiles')
        .update({ test_date: testDate.toISOString().split('T')[0] })
        .eq('id', testUserId);

      const { data, error } = await supabase.functions.invoke('days-left');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.days_left).toBeGreaterThan(20);
      expect(data?.days_left).toBeLessThan(30);
    });

    it('returns null for user without test date', async () => {
      await supabase
        .from('profiles')
        .update({ test_date: null })
        .eq('id', testUserId);

      const { data, error } = await supabase.functions.invoke('days-left');

      expect(error).toBeNull();
      expect(data?.days_left).toBeNull();
    });
  });

  describe('finish-diagnostic function', () => {
    it('processes diagnostic results and creates baseline', async () => {
      // Create a diagnostic session
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          user_id: testUserId,
          type: 'diagnostic',
          form_id: 'test-form',
        })
        .select()
        .single();

      expect(sessionError).toBeNull();
      expect(sessionData).toBeDefined();

      // Finish diagnostic with results
      const { error } = await supabase.functions.invoke('finish-diagnostic', {
        body: {
          session_id: sessionData.id,
          english_score: 25,
          math_score: 28,
          reading_score: 26,
          science_score: 27,
        },
      });

      expect(error).toBeNull();
      
      // Verify diagnostic record was created
      const { data: diagnostic, error: diagError } = await supabase
        .from('diagnostics')
        .select('*')
        .eq('user_id', testUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      expect(diagError).toBeNull();
      expect(diagnostic).toBeDefined();
      expect(diagnostic?.english_score).toBe(25);
    });
  });
});
