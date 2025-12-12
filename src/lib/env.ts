import { z } from 'zod';

/**
 * Client-side env access (Vite)
 *
 * Security rules:
 * - Supabase keys must come from environment variables only (no hard-coding).
 * - Never log secrets.
 */

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
});

type ClientEnv = z.infer<typeof envSchema>;

function readClientEnv(): ClientEnv {
  const maybeProcessEnv =
    typeof process !== 'undefined' && typeof process.env === 'object'
      ? process.env
      : undefined;

  const candidate = {
    VITE_SUPABASE_URL:
      import.meta.env.VITE_SUPABASE_URL ??
      (maybeProcessEnv?.VITE_SUPABASE_URL as string | undefined),
    VITE_SUPABASE_ANON_KEY:
      import.meta.env.VITE_SUPABASE_ANON_KEY ??
      (maybeProcessEnv?.VITE_SUPABASE_ANON_KEY as string | undefined),
  };

  const parsed = envSchema.safeParse(candidate);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`[env] Missing/invalid env vars: ${issues}`);
  }
  return parsed.data;
}

export const isBrowser =
  typeof window !== 'undefined' && typeof document !== 'undefined';

export const getSupabaseUrl = (): string => readClientEnv().VITE_SUPABASE_URL;

export const getSupabaseAnonKey = (): string =>
  readClientEnv().VITE_SUPABASE_ANON_KEY;

export const getSupabaseConfigStatus = () => {
  const maybeProcessEnv =
    typeof process !== 'undefined' && typeof process.env === 'object'
      ? process.env
      : undefined;

  const candidate = {
    VITE_SUPABASE_URL:
      import.meta.env.VITE_SUPABASE_URL ??
      (maybeProcessEnv?.VITE_SUPABASE_URL as string | undefined),
    VITE_SUPABASE_ANON_KEY:
      import.meta.env.VITE_SUPABASE_ANON_KEY ??
      (maybeProcessEnv?.VITE_SUPABASE_ANON_KEY as string | undefined),
  };

  const parsed = envSchema.safeParse(candidate);
  return {
    url: parsed.success ? ('Set' as const) : ('Missing' as const),
    anonKey: parsed.success ? ('Set' as const) : ('Missing' as const),
  };
};

export const logSupabaseConfigStatus = (): void => {
  if (!isBrowser) return;
  const status = getSupabaseConfigStatus();
  console.info(
    `[env] Supabase config: url=${status.url === 'Set' ? '✓' : '✗'} anonKey=${
      status.anonKey === 'Set' ? '✓' : '✗'
    }`,
  );
};
