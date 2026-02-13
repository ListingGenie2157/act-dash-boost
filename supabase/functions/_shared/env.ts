/**
 * Fail-fast environment variable validation.
 * Call at the top of every edge function to surface misconfig immediately.
 */
export function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
