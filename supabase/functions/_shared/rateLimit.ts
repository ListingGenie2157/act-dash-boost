/**
 * Simple in-memory rate limiting for edge functions
 * Tracks requests by IP address with configurable limits
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipRequestCounts = new Map<string, RateLimitRecord>();

/**
 * Check if a request should be rate limited
 * @param ip - Client IP address
 * @param limit - Maximum requests allowed in the time window (default: 100)
 * @param windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @returns true if request is allowed, false if rate limit exceeded
 */
export function checkRateLimit(
  ip: string, 
  limit = 100, 
  windowMs = 60000
): boolean {
  const now = Date.now();
  const record = ipRequestCounts.get(ip);
  
  // No record or window expired - allow and reset
  if (!record || now > record.resetTime) {
    ipRequestCounts.set(ip, { 
      count: 1, 
      resetTime: now + windowMs 
    });
    return true;
  }
  
  // Rate limit exceeded
  if (record.count >= limit) {
    return false;
  }
  
  // Increment count and allow
  record.count++;
  return true;
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
