import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { getSupabaseUrl, getSupabaseAnonKey } from '@/lib/env';

// Get Supabase credentials from environment variables
// This will throw an error if credentials are missing, preventing the app from running with invalid config
let supabaseUrl: string;
let supabaseAnonKey: string;

try {
  supabaseUrl = getSupabaseUrl();
  supabaseAnonKey = getSupabaseAnonKey();
} catch (error) {
  // Throw a user-friendly error if configuration is missing
  throw new Error(
    'Supabase configuration is missing. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment variables.'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  db: { schema: 'public' },
  global: { headers: { 'x-app': 'act-dash-boost', apikey: supabaseAnonKey } },
});
