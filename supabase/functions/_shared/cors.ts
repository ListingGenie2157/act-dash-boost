/**
 * CORS utility with origin allowlist for production security
 */

const ALLOWED_ORIGINS = [
  'https://f00c702a-a021-4c8d-8fea-70469fe2ed7c.lovableproject.com',
  'https://id-preview--f00c702a-a021-4c8d-8fea-70469fe2ed7c.lovable.app',
  'http://localhost:5173',
  'http://localhost:8080',
  // Add your custom domain here when you have one
];

/**
 * Get CORS headers with origin validation
 * In production, restricts to known origins; in development, allows localhost
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  
  // Check if origin is in allowlist
  const isAllowed = ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || origin.endsWith('.lovable.app') || origin.endsWith('.lovableproject.com')
  );
  
  const allowedOrigin = isAllowed ? origin : ALLOWED_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
}

/**
 * Legacy CORS headers for backward compatibility during transition
 * TODO: Remove this after all functions are updated to use getCorsHeaders
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-app',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};
