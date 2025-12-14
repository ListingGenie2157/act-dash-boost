/**
 * Supabase Configuration
 * 
 * These values are hardcoded because:
 * 1. They are PUBLIC/PUBLISHABLE values - safe to expose in client code
 * 2. Lovable's build system doesn't support VITE_* env vars the same way local Vite does
 * 3. Only SECRET keys (like SERVICE_ROLE_KEY) should be in Supabase secrets
 * 
 * This is the official pattern for Lovable projects with Supabase.
 */
const SUPABASE_URL = 'https://hhbkmxrzxcswwokmbtbz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoYmtteHJ6eGNzd3dva21idGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNTI5MzcsImV4cCI6MjA3MTgyODkzN30.SWsosSuVDjtaAvlIdEyAwUx9zOY_uViTJWw_5UbgIGE';

export const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

export const getSupabaseUrl = (): string => SUPABASE_URL;

export const getSupabaseAnonKey = (): string => SUPABASE_ANON_KEY;

export const getSupabaseConfigStatus = () => ({
  url: 'Set' as const,
  anonKey: 'Set' as const,
});

export const logSupabaseConfigStatus = (): void => {
  if (!isBrowser) return;
  console.info('[env] Supabase config: ✓ URL and anon key configured');
};
