/**
 * Durable rate limiting for edge functions using Supabase database
 * Persists across edge function instances for real security
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

interface RateLimitResult {
  allowed: boolean;
  count: number;
}

/**
 * Check if a request should be rate limited using database-backed storage
 * @param userId - Authenticated user ID (preferred key)
 * @param ip - Client IP address (fallback if no userId)
 * @param endpoint - Endpoint name for rate limit grouping
 * @param limit - Maximum requests allowed in the time window (default: 100)
 * @param windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @returns true if request is allowed, false if rate limit exceeded
 */
export async function checkRateLimit(
  userId: string | null,
  ip: string,
  endpoint: string,
  limit = 100,
  windowMs = 60000
): Promise<boolean> {
  try {
    // Create service role client for rate limit table access
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('Rate limit: Missing env vars, allowing request');
      return true;
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Build rate limit key: prefer userId, fallback to IP
    const key = userId ? `user:${userId}:${endpoint}` : `ip:${ip}:${endpoint}`;
    
    // Call the database function for atomic rate limit check
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_key: key,
      p_limit: limit,
      p_window_ms: windowMs
    });
    
    if (error) {
      console.error('Rate limit check error:', error);
      // On error, allow the request (fail open for availability)
      return true;
    }
    
    const result = data as RateLimitResult;
    
    if (!result.allowed) {
      console.warn(`Rate limit exceeded for ${key}: ${result.count}/${limit}`);
    }
    
    return result.allowed;
  } catch (err) {
    console.error('Rate limit exception:', err);
    // Fail open on errors
    return true;
  }
}

/**
 * Get client IP from request headers
 * Checks various headers that may contain the real IP
 */
export function getClientIp(req: Request): string {
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  
  const xRealIp = req.headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp;
  }
  
  // Fallback to a placeholder if no IP found
  return 'unknown';
}

/**
 * Create a rate limit response
 */
export function createRateLimitResponse(corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ 
      error: 'Rate limit exceeded. Please try again later.' 
    }),
    { 
      status: 429, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}
