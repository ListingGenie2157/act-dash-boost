/**
 * Supabase Configuration
 * 
 * Environment-aware configuration:
 * - Development: Uses localhost Supabase or staging project (via VITE_* env vars)
 * - Production: Uses production Supabase project (hardcoded fallback)
 * 
 * To use a different environment:
 * 1. Create a .env.local file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
 * 2. For local dev with Supabase CLI: use http://127.0.0.1:54321
 * 
 * Only SECRET keys (like SERVICE_ROLE_KEY) should be in Supabase Edge Function secrets.
 */

// Production fallback values (safe to expose - these are public/anon keys)
const PROD_SUPABASE_URL = 'https://hhbkmxrzxcswwokmbtbz.supabase.co';
const PROD_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoYmtteHJ6eGNzd3dva21idGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNTI5MzcsImV4cCI6MjA3MTgyODkzN30.SWsosSuVDjtaAvlIdEyAwUx9zOY_uViTJWw_5UbgIGE';

// Check for environment variable overrides (for local dev / staging)
const getEnvVar = (key: string): string | undefined => {
  // Vite injects these at build time
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] as string | undefined;
  }
  return undefined;
};

export const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

/**
 * Detect current environment
 */
export const getEnvironment = (): 'production' | 'development' | 'test' => {
  const env = getEnvVar('MODE') || getEnvVar('VITE_ENV');
  if (env === 'test') return 'test';
  if (env === 'development' || getEnvVar('DEV') === 'true') return 'development';
  return 'production';
};

/**
 * Check if running with local Supabase CLI
 */
export const isLocalSupabase = (): boolean => {
  const url = getEnvVar('VITE_SUPABASE_URL');
  return url?.includes('127.0.0.1') || url?.includes('localhost') || false;
};

export const getSupabaseUrl = (): string => {
  // Check for environment variable override first
  const envUrl = getEnvVar('VITE_SUPABASE_URL');
  if (envUrl) {
    return envUrl;
  }
  // Fall back to production
  return PROD_SUPABASE_URL;
};

export const getSupabaseAnonKey = (): string => {
  // Check for environment variable override first
  const envKey = getEnvVar('VITE_SUPABASE_ANON_KEY');
  if (envKey) {
    return envKey;
  }
  // Fall back to production
  return PROD_SUPABASE_ANON_KEY;
};

export const getSupabaseConfigStatus = () => {
  const envUrl = getEnvVar('VITE_SUPABASE_URL');
  const envKey = getEnvVar('VITE_SUPABASE_ANON_KEY');
  
  return {
    url: envUrl ? 'EnvVar' : 'Fallback' as const,
    anonKey: envKey ? 'EnvVar' : 'Fallback' as const,
    environment: getEnvironment(),
    isLocal: isLocalSupabase(),
  };
};

export const logSupabaseConfigStatus = (): void => {
  if (!isBrowser) return;
  
  const status = getSupabaseConfigStatus();
  const isUsingEnvVars = status.url === 'EnvVar' || status.anonKey === 'EnvVar';
  
  // Use console.warn for environment logging (allowed by ESLint rules)
  if (status.isLocal) {
    console.warn('[env] Supabase: 🔧 LOCAL development mode (Supabase CLI)');
  } else if (isUsingEnvVars) {
    console.warn(`[env] Supabase: ⚙️ Using environment overrides (${status.environment})`);
  } else {
    // Production is the expected state, no need to log
  }
};
