import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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
