import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const error = new Error('Missing required Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set');
  logger.error('Supabase configuration error', error);
  throw error;
}

if (import.meta.env.DEV) {
  logger.info('Supabase client initialized', { url: supabaseUrl.substring(0, 20) + '...' });
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
