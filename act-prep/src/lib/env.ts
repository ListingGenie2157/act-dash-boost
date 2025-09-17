export type AppEnv = {
  VITE_SUPABASE_URL: string
  VITE_SUPABASE_ANON_KEY: string
  VITE_APP_ENV?: 'development' | 'staging' | 'production'
  VITE_APP_NAME?: string
  VITE_TELEMETRY_ENABLED?: string | boolean
}

const env = import.meta.env as unknown as AppEnv

function requireEnv(name: keyof AppEnv): string {
  const value = (env[name] as unknown as string) ?? ''
  if (!value) {
    // eslint-disable-next-line no-console
    console.error(`Missing required env: ${String(name)}`)
  }
  return value
}

export const APP_ENV = (env.VITE_APP_ENV ?? 'development') as NonNullable<AppEnv['VITE_APP_ENV']>
export const APP_NAME = env.VITE_APP_NAME ?? 'ACT Prep'
export const TELEMETRY_ENABLED = String(env.VITE_TELEMETRY_ENABLED ?? 'true') === 'true'

export const SUPABASE_URL = requireEnv('VITE_SUPABASE_URL')
export const SUPABASE_ANON_KEY = requireEnv('VITE_SUPABASE_ANON_KEY')