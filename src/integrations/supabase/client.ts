// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Never ship a service role key here.
const url = import.meta.env.VITE_SUPABASE_URL || "https://hhbkmxrzxcswwokmbtbz.supabase.co";
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoYmtteHJ6eGNzd3dva21idGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNTI5MzcsImV4cCI6MjA3MTgyODkzN30.SWsosSuVDjtaAvlIdEyAwUx9zOY_uViTJWw_5UbgIGE";


export const supabase = createClient<Database>(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  db: { schema: 'public' },
  global: { headers: { 'x-app': 'act-dash-boost', apikey: anon } },
});
