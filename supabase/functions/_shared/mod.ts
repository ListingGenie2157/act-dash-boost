/**
 * Shared constants and helpers for edge functions.
 */

/** Maximum request body size: 512 KB */
export const MAX_BODY_BYTES = 524288;

/**
 * Read and validate request body size. Returns parsed JSON or a 413 Response.
 */
export async function parseBodyWithLimit(
  req: Request,
  corsHeaders: Record<string, string>
): Promise<{ data: unknown } | { error: Response }> {
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return {
      error: new Response(
        JSON.stringify({ error: 'Payload too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    };
  }
  try {
    return { data: JSON.parse(raw) };
  } catch {
    return {
      error: new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    };
  }
}
