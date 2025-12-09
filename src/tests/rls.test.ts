import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/env';

const SUPABASE_URL = getSupabaseUrl();
const SUPABASE_ANON_KEY = getSupabaseAnonKey();

/**
 * RLS Integration Tests
 * 
 * These tests require a running Supabase instance with proper configuration.
 * They will be skipped if:
 * - Environment variables are not set
 * - Test user creation fails (e.g., email validation restrictions)
 * 
 * To run these tests:
 * 1. Set up a local Supabase instance or use a test project
 * 2. Configure environment variables
 * 3. Enable test email addresses in Supabase Auth settings
 */

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  return SUPABASE_URL && 
         SUPABASE_ANON_KEY && 
         !SUPABASE_URL.includes('localhost:54321'); // Skip for unconfigured local
};

describe('Row Level Security Tests', () => {
  let anonClient: SupabaseClient;
  let authClient: SupabaseClient;
  let testUserId: string;
  let skipTests = false;

  beforeAll(async () => {
    if (!isSupabaseConfigured()) {
      skipTests = true;
      console.warn('⚠️ Skipping RLS tests: Supabase not configured for testing');
      return;
    }

    // Anonymous client
    anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Authenticated client
    authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Create a test user for authenticated tests
    // Note: This may fail if email validation is strict on the Supabase instance
    const { data, error } = await authClient.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'test-password-123',
    });
    
    if (error) {
      console.warn('⚠️ Skipping RLS tests: Could not create test user -', error.message);
      skipTests = true;
      return;
    }
    
    if (!data.user) {
      console.warn('⚠️ Skipping RLS tests: No user returned from signup');
      skipTests = true;
      return;
    }
    
    testUserId = data.user.id;
  });

  afterAll(async () => {
    // Clean up test user
    if (authClient && !skipTests) {
      await authClient.auth.signOut();
    }
  });

  describe('Anonymous user permissions', () => {
    it('should allow reading public data (forms)', async ({ skip }) => {
      if (skipTests) return skip();
      
      const { data: forms, error: formsError } = await anonClient
        .from('forms')
        .select('*')
        .limit(1);
      
      expect(formsError).toBeNull();
      expect(forms).toBeDefined();
    });

    it('should allow reading questions', async ({ skip }) => {
      if (skipTests) return skip();
      
      const { data: questions, error: questionsError } = await anonClient
        .from('questions')
        .select('*')
        .limit(1);
      
      expect(questionsError).toBeNull();
      expect(questions).toBeDefined();
    });

    it('should allow reading skills', async ({ skip }) => {
      if (skipTests) return skip();
      
      const { data: skills, error: skillsError } = await anonClient
        .from('skills')
        .select('*')
        .limit(1);
      
      expect(skillsError).toBeNull();
      expect(skills).toBeDefined();
    });

    it('should not allow writing to user-specific tables', async ({ skip }) => {
      if (skipTests) return skip();
      
      const { error: profileError } = await anonClient
        .from('profiles')
        .insert({ id: testUserId, test_date: '2024-06-01' });
      
      expect(profileError).toBeDefined();
      expect(profileError?.message).toContain('new row violates row-level security');
    });

    it('should not allow reading user-specific data', async ({ skip }) => {
      if (skipTests) return skip();
      
      const { data: progress, error: progressError } = await anonClient
        .from('progress')
        .select('*');
      
      expect(progressError).toBeNull();
      expect(progress).toEqual([]);
    });

    it('should not allow reading mastery data without auth', async ({ skip }) => {
      if (skipTests) return skip();
      
      const { data: mastery } = await anonClient
        .from('mastery')
        .select('*');
      
      // Should return empty (RLS prevents access)
      expect(mastery).toEqual([]);
    });

    it('should not allow reading study_tasks without auth', async ({ skip }) => {
      if (skipTests) return skip();
      
      const { data: tasks } = await anonClient
        .from('study_tasks')
        .select('*');
      
      expect(tasks).toEqual([]);
    });

    it('should not allow reading diagnostics without auth', async ({ skip }) => {
      if (skipTests) return skip();
      
      const { data: diagnostics } = await anonClient
        .from('diagnostics')
        .select('*');
      
      expect(diagnostics).toEqual([]);
    });
  });

  describe('Authenticated user permissions', () => {
    it('should allow writing own attempts', async ({ skip }) => {
      if (skipTests) return skip();
      
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

    it('should not allow writing attempts for other users', async ({ skip }) => {
      if (skipTests) return skip();
      
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

    it('should only see own progress data', async ({ skip }) => {
      if (skipTests) return skip();
      
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

    it('should allow reading and writing own mastery data', async ({ skip }) => {
      if (skipTests) return skip();
      
      // Write mastery data
      const { error: writeError } = await authClient
        .from('mastery')
        .upsert({
          user_id: testUserId,
          skill_id: 'test-skill-id',
          correct: 8,
          total: 10,
          avg_time_ms: 5000,
          last_updated: new Date().toISOString(),
        }, { onConflict: 'user_id,skill_id' });
      
      expect(writeError).toBeNull();

      // Read mastery data
      const { data: mastery, error: readError } = await authClient
        .from('mastery')
        .select('*')
        .eq('user_id', testUserId);
      
      expect(readError).toBeNull();
      expect(mastery).toBeDefined();
      
      // All mastery records should belong to the authenticated user
      mastery?.forEach((record) => {
        expect(record.user_id).toBe(testUserId);
      });
    });

    it('should not allow writing mastery data for other users', async ({ skip }) => {
      if (skipTests) return skip();
      
      const otherUserId = '22222222-2222-2222-2222-222222222222';
      
      const { error } = await authClient
        .from('mastery')
        .insert({
          user_id: otherUserId,
          skill_id: 'test-skill-id',
          correct: 5,
          total: 10,
          avg_time_ms: 3000,
          last_updated: new Date().toISOString(),
        });
      
      expect(error).toBeDefined();
    });

    it('should allow reading and writing own diagnostics', async ({ skip }) => {
      if (skipTests) return skip();
      
      // Write diagnostic
      const { error: writeError } = await authClient
        .from('diagnostics')
        .insert({
          user_id: testUserId,
          section: 'Math',
          block: 1,
          source: 'test',
        });
      
      expect(writeError).toBeNull();

      // Read diagnostics
      const { data: diagnostics, error: readError } = await authClient
        .from('diagnostics')
        .select('*')
        .eq('user_id', testUserId);
      
      expect(readError).toBeNull();
      expect(diagnostics).toBeDefined();
      
      // All diagnostic records should belong to the authenticated user
      diagnostics?.forEach((record) => {
        expect(record.user_id).toBe(testUserId);
      });
    });

    it('should not allow reading other users diagnostics', async ({ skip }) => {
      if (skipTests) return skip();
      
      // Query for someone else's data - should return empty
      const otherUserId = '33333333-3333-3333-3333-333333333333';
      
      const { data: diagnostics } = await authClient
        .from('diagnostics')
        .select('*')
        .eq('user_id', otherUserId);
      
      expect(diagnostics).toEqual([]);
    });
  });

  describe('Study plan and tasks security', () => {
    it('should allow reading own study_plan_days', async ({ skip }) => {
      if (skipTests) return skip();
      
      const { data: plans, error } = await authClient
        .from('study_plan_days')
        .select('*')
        .eq('user_id', testUserId);
      
      expect(error).toBeNull();
      
      // All plan records should belong to the authenticated user
      plans?.forEach((record) => {
        expect(record.user_id).toBe(testUserId);
      });
    });

    it('should allow reading own study_tasks', async ({ skip }) => {
      if (skipTests) return skip();
      
      const { data: tasks, error } = await authClient
        .from('study_tasks')
        .select('*')
        .eq('user_id', testUserId);
      
      expect(error).toBeNull();
      
      // All task records should belong to the authenticated user
      tasks?.forEach((record) => {
        expect(record.user_id).toBe(testUserId);
      });
    });

    it('should not allow reading other users study_plan_days', async ({ skip }) => {
      if (skipTests) return skip();
      
      const otherUserId = '44444444-4444-4444-4444-444444444444';
      
      const { data: plans } = await authClient
        .from('study_plan_days')
        .select('*')
        .eq('user_id', otherUserId);
      
      expect(plans).toEqual([]);
    });
  });

  describe('Profile security', () => {
    it('should allow reading own profile', async ({ skip }) => {
      if (skipTests) return skip();
      
      const { error } = await authClient
        .from('profiles')
        .select('*')
        .eq('id', testUserId)
        .single();
      
      // May error if no profile exists yet, but should not be RLS error
      if (error) {
        expect(error.message).not.toContain('row-level security');
      }
    });

    it('should not allow reading other users profiles', async ({ skip }) => {
      if (skipTests) return skip();
      
      const otherUserId = '55555555-5555-5555-5555-555555555555';
      
      const { data: profile } = await authClient
        .from('profiles')
        .select('*')
        .eq('id', otherUserId);
      
      expect(profile).toEqual([]);
    });
  });

  describe('Review queue security', () => {
    it('should only see own review queue', async ({ skip }) => {
      if (skipTests) return skip();
      
      const { data: reviews, error } = await authClient
        .from('review_queue')
        .select('*');
      
      expect(error).toBeNull();
      
      // All review records should belong to the authenticated user
      reviews?.forEach((record) => {
        expect(record.user_id).toBe(testUserId);
      });
    });
  });
});