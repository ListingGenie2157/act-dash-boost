import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      service: "act-dash-boost"
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    }
  );
});
