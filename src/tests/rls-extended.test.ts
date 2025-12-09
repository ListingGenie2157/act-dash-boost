import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/env';

const SUPABASE_URL = getSupabaseUrl();
const SUPABASE_ANON_KEY = getSupabaseAnonKey();

describe('Extended RLS Tests - Key Security Paths', () => {
  let anonClient: SupabaseClient;
  let authClient1: SupabaseClient;
  let authClient2: SupabaseClient;
  let testUserId1: string;
  let testUserId2: string;

  beforeAll(async () => {
    anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Create two test users for cross-user isolation tests
    authClient1 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    authClient2 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data: data1, error: error1 } = await authClient1.auth.signUp({
      email: `test-rls-1-${Date.now()}@example.com`,
      password: 'test-password-123',
    });
    
    const { data: data2, error: error2 } = await authClient2.auth.signUp({
      email: `test-rls-2-${Date.now()}@example.com`,
      password: 'test-password-123',
    });
    
    if (error1 || !data1.user) throw error1 || new Error('Failed to create user 1');
    if (error2 || !data2.user) throw error2 || new Error('Failed to create user 2');
    
    testUserId1 = data1.user.id;
    testUserId2 = data2.user.id;
  });

  afterAll(async () => {
    if (authClient1) await authClient1.auth.signOut();
    if (authClient2) await authClient2.auth.signOut();
  });

  describe('Mastery table RLS', () => {
    it('users can only view their own mastery records', async () => {
      // User 1 creates a mastery record
      const { error: insertError } = await authClient1
        .from('mastery')
        .insert({
          user_id: testUserId1,
          skill_id: 'test-skill-1',
          correct: 5,
          total: 10,
        });
      
      expect(insertError).toBeNull();

      // User 1 can see their own record
      const { data: ownData, error: ownError } = await authClient1
        .from('mastery')
        .select('*')
        .eq('skill_id', 'test-skill-1');
      
      expect(ownError).toBeNull();
      expect(ownData?.length).toBeGreaterThan(0);
      expect(ownData?.every(r => r.user_id === testUserId1)).toBe(true);

      // User 2 cannot see user 1's records
      const { data: otherData, error: otherError } = await authClient2
        .from('mastery')
        .select('*')
        .eq('skill_id', 'test-skill-1');
      
      expect(otherError).toBeNull();
      expect(otherData?.length).toBe(0);
    });

    it('users cannot insert mastery for other users', async () => {
      const { error } = await authClient1
        .from('mastery')
        .insert({
          user_id: testUserId2, // Trying to insert for user 2
          skill_id: 'test-skill-2',
          correct: 5,
          total: 10,
        });
      
      expect(error).toBeDefined();
      expect(error?.message).toMatch(/row-level security|policy/i);
    });
  });

  describe('Study plan days RLS', () => {
    it('users can only view their own study plans', async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // User 1 creates a study plan
      const { error: insertError } = await authClient1
        .from('study_plan_days')
        .insert({
          user_id: testUserId1,
          the_date: today,
          tasks_json: [{ type: 'LEARN', title: 'Test Task' }],
        });
      
      expect(insertError).toBeNull();

      // User 1 can see their plan
      const { data: ownData, error: ownError } = await authClient1
        .from('study_plan_days')
        .select('*')
        .eq('the_date', today);
      
      expect(ownError).toBeNull();
      expect(ownData?.length).toBeGreaterThan(0);
      expect(ownData?.every(r => r.user_id === testUserId1)).toBe(true);

      // User 2 cannot see user 1's plan
      const { data: otherData, error: otherError } = await authClient2
        .from('study_plan_days')
        .select('*')
        .eq('the_date', today);
      
      expect(otherError).toBeNull();
      expect(otherData?.length).toBe(0);
    });

    it('users cannot update other users study plans', async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // User 1 creates a plan
      await authClient1
        .from('study_plan_days')
        .insert({
          user_id: testUserId1,
          the_date: today,
          tasks_json: [{ type: 'LEARN', title: 'Original Task' }],
        });

      // User 2 tries to update user 1's plan
      const { error } = await authClient2
        .from('study_plan_days')
        .update({ tasks_json: [{ type: 'DRILL', title: 'Hacked Task' }] })
        .eq('user_id', testUserId1)
        .eq('the_date', today);
      
      expect(error).toBeDefined();
      expect(error?.message).toMatch(/row-level security|policy/i);
    });
  });

  describe('Responses table RLS', () => {
    it('users can only view their own responses', async () => {
      // User 1 creates a response
      const { error: insertError } = await authClient1
        .from('responses')
        .insert({
          user_id: testUserId1,
          question_id: 'test-question-1',
          session_id: 'test-session-1',
          correct: true,
          time_ms: 5000,
        });
      
      expect(insertError).toBeNull();

      // User 1 can see their response
      const { data: ownData, error: ownError } = await authClient1
        .from('responses')
        .select('*')
        .eq('question_id', 'test-question-1');
      
      expect(ownError).toBeNull();
      expect(ownData?.length).toBeGreaterThan(0);
      expect(ownData?.every(r => r.user_id === testUserId1)).toBe(true);

      // User 2 cannot see user 1's responses
      const { data: otherData, error: otherError } = await authClient2
        .from('responses')
        .select('*')
        .eq('question_id', 'test-question-1');
      
      expect(otherError).toBeNull();
      expect(otherData?.length).toBe(0);
    });
  });

  describe('Diagnostics table RLS', () => {
    it('users can only update their own diagnostics with restrictions', async () => {
      // User 1 creates a diagnostic
      const { data: insertData, error: insertError } = await authClient1
        .from('diagnostics')
        .insert({
          user_id: testUserId1,
          form_id: 'test-form',
          english_score: 25,
          math_score: 30,
          reading_score: 28,
          science_score: 27,
        })
        .select()
        .single();
      
      expect(insertError).toBeNull();
      expect(insertData).toBeDefined();

      // User 2 cannot update user 1's diagnostic
      const { error: updateError } = await authClient2
        .from('diagnostics')
        .update({ english_score: 36 })
        .eq('id', insertData.id);
      
      expect(updateError).toBeDefined();
      expect(updateError?.message).toMatch(/row-level security|policy/i);
    });
  });

  describe('Review queue RLS', () => {
    it('users can only manage their own review queue items', async () => {
      // User 1 creates a review item
      const { error: insertError } = await authClient1
        .from('review_queue')
        .insert({
          user_id: testUserId1,
          question_id: 'test-question-review',
          due_at: new Date().toISOString(),
          interval_days: 1,
          ease: 250,
        });
      
      expect(insertError).toBeNull();

      // User 2 cannot see user 1's review items
      const { data: otherData, error: otherError } = await authClient2
        .from('review_queue')
        .select('*')
        .eq('question_id', 'test-question-review');
      
      expect(otherError).toBeNull();
      expect(otherData?.length).toBe(0);
    });
  });

  describe('Anonymous user restrictions', () => {
    it('anonymous users cannot access user-specific tables', async () => {
      const tables = ['mastery', 'study_plan_days', 'responses', 'diagnostics', 'review_queue'];
      
      for (const table of tables) {
        const { data, error } = await anonClient
          .from(table)
          .select('*')
          .limit(1);
        
        // Should either error or return empty array
        if (error) {
          expect(error.message).toMatch(/row-level security|policy|permission/i);
        } else {
          expect(data).toEqual([]);
        }
      }
    });

    it('anonymous users can read public data (questions, skills)', async () => {
      const { data: questions, error: qError } = await anonClient
        .from('questions')
        .select('id')
        .limit(1);
      
      expect(qError).toBeNull();
      expect(questions).toBeDefined();

      const { data: skills, error: sError } = await anonClient
        .from('skills')
        .select('id')
        .limit(1);
      
      expect(sError).toBeNull();
      expect(skills).toBeDefined();
    });
  });
});
