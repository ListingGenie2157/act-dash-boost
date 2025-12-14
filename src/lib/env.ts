/**
 * Supabase Configuration
 * 
 * PUBLIC values (Supabase URL + anon key) MUST come from environment variables.
 * Never hardcode keys into the client bundle.
 */

type EnvMap = Record<string, string | undefined>;

function getViteEnv(): EnvMap | null {
  try {
    // Vite injects env vars onto import.meta.env at build/runtime.
    const meta = import.meta as unknown as { env?: EnvMap };
    return meta.env ?? null;
  } catch {
    return null;
  }
}

function getProcessEnv(): EnvMap | null {
  const globalProcess = (globalThis as unknown as { process?: { env?: EnvMap } }).process;
  return globalProcess?.env ?? null;
}

function readEnv(key: string): string | undefined {
  return getViteEnv()?.[key] ?? getProcessEnv()?.[key];
}

function requireEnv(primaryKey: string, fallbackKey?: string): string {
  const value = readEnv(primaryKey) ?? (fallbackKey ? readEnv(fallbackKey) : undefined);
  if (!value) {
    const keys = [primaryKey, fallbackKey].filter(Boolean).join(' or ');
    throw new Error(`[env] Missing required environment variable: ${keys}`);
  }
  return value;
}

const SUPABASE_URL = requireEnv('VITE_SUPABASE_URL', 'SUPABASE_URL');
const SUPABASE_ANON_KEY = requireEnv('VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY');

export const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

export const getSupabaseUrl = (): string => SUPABASE_URL;

export const getSupabaseAnonKey = (): string => SUPABASE_ANON_KEY;

export const getSupabaseConfigStatus = () => ({
  url: 'Set' as const,
  anonKey: 'Set' as const,
});

export const logSupabaseConfigStatus = (): void => {
  if (!isBrowser) return;
  // Intentionally no console logging in production.
};
