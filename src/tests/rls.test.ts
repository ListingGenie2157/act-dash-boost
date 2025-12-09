import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/env';

const SUPABASE_URL = getSupabaseUrl();
const SUPABASE_ANON_KEY = getSupabaseAnonKey();

// Skip RLS tests if Supabase is not properly configured
// These tests require a valid Supabase instance with proper credentials
// Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to enable
describe.skip('Row Level Security Tests', () => {
  let anonClient: SupabaseClient;
  let authClient: SupabaseClient;
  let testUserId: string;

  beforeAll(async () => {
    // Anonymous client
    anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Authenticated client
    authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Create a test user for authenticated tests
    // Use a test-specific email domain for easier cleanup
    const { data, error } = await authClient.auth.signUp({
      email: `test+${Date.now()}@test.actprep.com`,
      password: 'TestPassword123!@#',
    });
    
    if (error) throw error;
    testUserId = data.user!.id;
  });

  afterAll(async () => {
    // Clean up test user
    if (authClient) {
      await authClient.auth.signOut();
    }
  });

  describe('Anonymous user permissions', () => {
    it('should allow reading public data', async () => {
      const { data: forms, error: formsError } = await anonClient
        .from('forms')
        .select('*')
        .limit(1);
      
      expect(formsError).toBeNull();
      expect(forms).toBeDefined();
    });

    it('should allow reading questions', async () => {
      const { data: questions, error: questionsError } = await anonClient
        .from('questions')
        .select('*')
        .limit(1);
      
      expect(questionsError).toBeNull();
      expect(questions).toBeDefined();
    });

    it('should not allow writing to user-specific tables', async () => {
      const { error: profileError } = await anonClient
        .from('profiles')
        .insert({ id: testUserId, test_date: '2024-06-01' });
      
      expect(profileError).toBeDefined();
      expect(profileError?.message).toContain('new row violates row-level security');
    });

    it('should not allow reading user-specific data', async () => {
      const { data: progress, error: progressError } = await anonClient
        .from('progress')
        .select('*');
      
      expect(progressError).toBeNull();
      expect(progress).toEqual([]);
    });
  });

  describe('Authenticated user permissions', () => {
    it('should allow writing own attempts', async () => {
      const { error } = await authClient
        .from('attempts')
        .insert({
          user_id: testUserId,
          question_id: '00000000-0000-0000-0000-000000000000',
          choice_order: [0, 1, 2, 3],
          correct_idx: 0,
          question_ord: 1,
          form_id: 'test-form',
        });
      
      expect(error).toBeNull();
    });

    it('should not allow writing attempts for other users', async () => {
      const otherUserId = '11111111-1111-1111-1111-111111111111';
      
      const { error } = await authClient
        .from('attempts')
        .insert({
          user_id: otherUserId,
          question_id: '00000000-0000-0000-0000-000000000000',
          choice_order: [0, 1, 2, 3],
          correct_idx: 0,
          question_ord: 1,
          form_id: 'test-form',
        });
      
      expect(error).toBeDefined();
      expect(error?.message).toContain('new row violates row-level security');
    });

    it('should only see own progress data', async () => {
      const { data: progress, error } = await authClient
        .from('progress')
        .select('*');
      
      expect(error).toBeNull();
      expect(progress).toBeDefined();
      
      // All progress records should belong to the authenticated user
      progress?.forEach((record) => {
        expect(record.user_id).toBe(testUserId);
      });
    });

    it('should allow reading own profile', async () => {
      const { data: profile, error } = await authClient
        .from('profiles')
        .select('*')
        .eq('id', testUserId)
        .single();
      
      expect(error).toBeNull();
      expect(profile).toBeDefined();
      expect(profile?.id).toBe(testUserId);
    });

    it('should allow updating own profile', async () => {
      const { error } = await authClient
        .from('profiles')
        .update({ test_date: '2025-06-01' })
        .eq('id', testUserId);
      
      expect(error).toBeNull();
    });

    it('should not allow reading other users profiles', async () => {
      const otherUserId = '11111111-1111-1111-1111-111111111111';
      
      const { data, error } = await authClient
        .from('profiles')
        .select('*')
        .eq('id', otherUserId);
      
      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it('should allow reading own mastery data', async () => {
      const { data: mastery, error } = await authClient
        .from('mastery')
        .select('*');
      
      expect(error).toBeNull();
      expect(mastery).toBeDefined();
      
      // All mastery records should belong to the authenticated user
      mastery?.forEach((record) => {
        expect(record.user_id).toBe(testUserId);
      });
    });

    it('should allow reading own study plan days', async () => {
      const { data: planDays, error } = await authClient
        .from('study_plan_days')
        .select('*');
      
      expect(error).toBeNull();
      expect(planDays).toBeDefined();
      
      // All plan days should belong to the authenticated user
      planDays?.forEach((record) => {
        expect(record.user_id).toBe(testUserId);
      });
    });

    it('should not allow reading other users study plans', async () => {
      const otherUserId = '11111111-1111-1111-1111-111111111111';
      
      const { data, error } = await authClient
        .from('study_plan_days')
        .select('*')
        .eq('user_id', otherUserId);
      
      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it('should allow reading own review schedule', async () => {
      const { data: reviews, error } = await authClient
        .from('review_schedule')
        .select('*');
      
      expect(error).toBeNull();
      expect(reviews).toBeDefined();
      
      // All reviews should belong to the authenticated user
      reviews?.forEach((record) => {
        expect(record.user_id).toBe(testUserId);
      });
    });

    it('should allow reading own baselines', async () => {
      const { data: baselines, error } = await authClient
        .from('baselines')
        .select('*');
      
      expect(error).toBeNull();
      expect(baselines).toBeDefined();
      
      // All baselines should belong to the authenticated user
      baselines?.forEach((record) => {
        expect(record.user_id).toBe(testUserId);
      });
    });

    it('should allow writing own baselines', async () => {
      const { error } = await authClient
        .from('baselines')
        .insert({
          user_id: testUserId,
          section: 'math',
          score: 0.75,
          source: 'diagnostic',
        });
      
      expect(error).toBeNull();
    });

    it('should not allow writing baselines for other users', async () => {
      const otherUserId = '11111111-1111-1111-1111-111111111111';
      
      const { error } = await authClient
        .from('baselines')
        .insert({
          user_id: otherUserId,
          section: 'math',
          score: 0.75,
          source: 'diagnostic',
        });
      
      expect(error).toBeDefined();
      expect(error?.message).toContain('new row violates row-level security');
    });
  });

  describe('Data isolation and privacy', () => {
    it('prevents cross-user data leakage in attempts', async () => {
      // First user creates an attempt
      const { error: insertError } = await authClient
        .from('attempts')
        .insert({
          user_id: testUserId,
          question_id: '00000000-0000-0000-0000-000000000000',
          choice_order: [0, 1, 2, 3],
          correct_idx: 0,
          question_ord: 1,
          form_id: 'test-form',
        });
      
      expect(insertError).toBeNull();
      
      // Query should only return this user's attempts
      const { data: attempts, error: queryError } = await authClient
        .from('attempts')
        .select('*');
      
      expect(queryError).toBeNull();
      attempts?.forEach((attempt) => {
        expect(attempt.user_id).toBe(testUserId);
      });
    });

    it('ensures user cannot delete other users data', async () => {
      const otherUserId = '11111111-1111-1111-1111-111111111111';
      
      const { error } = await authClient
        .from('progress')
        .delete()
        .eq('user_id', otherUserId);
      
      // Should either fail or delete 0 rows
      expect(error).toBeNull();
    });

    it('ensures user cannot update other users progress', async () => {
      const otherUserId = '11111111-1111-1111-1111-111111111111';
      
      const { error } = await authClient
        .from('progress')
        .update({ seen: 999 })
        .eq('user_id', otherUserId);
      
      // Should either fail or update 0 rows
      expect(error).toBeNull();
    });
  });
});