import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const url = 'https://hhbkmxrzxcswwokmbtbz.supabase.co';
const anon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoYmtteHJ6eGNzd3dva21idGJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI1MjkzNywiZXhwIjoyMDcxODI4OTM3fQ.PfATFIiDwgr5XmAs19iYNmFJH5MFYZDj1QSKYzbP_YY';

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
