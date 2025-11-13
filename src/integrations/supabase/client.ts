import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const FALLBACK_SUPABASE_URL = 'https://hhbkmxrzxcswwokmbtbz.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoYmtteHJ6eGNzd3dva21idGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNTI5MzcsImV4cCI6MjA3MTgyODkzN30.SWsosSuVDjtaAvlIdEyAwUx9zOY_uViTJWw_5UbgIGE';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  FALLBACK_SUPABASE_URL;

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || // fallback to old name
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  FALLBACK_SUPABASE_ANON_KEY;

if (import.meta.env.DEV && (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY)) {
  console.warn('[env] Supabase env vars not set; using fallback project config');
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
