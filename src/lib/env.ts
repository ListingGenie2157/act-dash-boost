const REQUIRED_ENV_KEYS = {
  VITE_SUPABASE_URL: 'https://your-project.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'public-anon-key',
} as const;

type RequiredEnvKey = keyof typeof REQUIRED_ENV_KEYS;

type SupabaseConfigStatus = {
  url: 'Set' | 'Missing';
  anonKey: 'Set' | 'Missing';
};

const readEnvValue = (key: RequiredEnvKey): string => {
  const value = import.meta.env[key];

  if (!value) {
    const example = REQUIRED_ENV_KEYS[key];
    throw new Error(
      `Missing environment variable: ${key}. Set it in your .env file (e.g. ${key}=${example}).`,
    );
  }

  return value;
};

export const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

export const getSupabaseUrl = (): string => readEnvValue('VITE_SUPABASE_URL');

export const getSupabaseAnonKey = (): string => readEnvValue('VITE_SUPABASE_ANON_KEY');

export const getSupabaseConfigStatus = (): SupabaseConfigStatus => ({
  url: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
});

export const logSupabaseConfigStatus = (): void => {
  if (!import.meta.env.DEV) {
    return;
  }

  console.info('[env] Supabase config status', getSupabaseConfigStatus());
};
