import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/env';

const SUPABASE_URL = getSupabaseUrl();
const SUPABASE_ANON_KEY = getSupabaseAnonKey();

describe('Row Level Security Tests', () => {
  let anonClient: SupabaseClient;
  let authClient: SupabaseClient;
  let testUserId: string;

  beforeAll(async () => {
    // Anonymous client
    anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Authenticated client
    authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Create a test user for authenticated tests
    const { data, error } = await authClient.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'test-password-123',
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
    it('should allow reading public data from forms', async () => {
      const { data: forms, error: formsError } = await anonClient
        .from('forms')
        .select('*')
        .limit(1);
      
      expect(formsError).toBeNull();
      expect(forms).toBeDefined();
    });

    it('should allow reading public staging_items for drills', async () => {
      // staging_items with DR_* or FA_* form_ids are accessible to authenticated users
      const { data: stagingItems, error: stagingError } = await authClient
        .from('staging_items')
        .select('staging_id, question, form_id')
        .like('form_id', 'DR_%')
        .limit(1);
      
      // This should work for authenticated users
      expect(stagingError).toBeNull();
      expect(stagingItems).toBeDefined();
    });

    it('should block anonymous access to questions table (admin only)', async () => {
      const { data: questions } = await anonClient
        .from('questions')
        .select('*')
        .limit(1);
      
      // questions table is now admin-only, so anonymous should get empty result or error
      // With restrictive RLS, it returns empty array rather than error
      expect(questions).toEqual([]);
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

    it('should block authenticated non-admin access to questions table', async () => {
      const { data: questions } = await authClient
        .from('questions')
        .select('*')
        .limit(1);
      
      // questions table is admin-only, so regular users get empty result
      expect(questions).toEqual([]);
    });
  });
});
