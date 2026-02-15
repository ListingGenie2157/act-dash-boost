import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";
import { requireEnv } from "../_shared/env.ts";
import { parseBodyWithLimit } from "../_shared/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://hhbkmxrzxcswwokmbtbz.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LEAD_IP_SALT = Deno.env.get("LEAD_IP_SALT") || "default-salt";

// Rate limit: 10 submissions per 10 minutes per IP
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 10 * 60 * 1000;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim().toLowerCase());
}

async function hashIP(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip + LEAD_IP_SALT);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const parsed = await parseBodyWithLimit(req, corsHeaders);
    if ('error' in parsed) return parsed.error;
    const body = parsed.data as Record<string, unknown>;
    const email = (body.email as string)?.trim()?.toLowerCase();

    // Validate email
    if (!email || !isValidEmail(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get client IP and hash it
    const clientIP =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";
    const ipHash = await hashIP(clientIP);
    const userAgent = req.headers.get("user-agent") || null;

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check rate limit using database function
    const { data: rateLimitResult, error: rateLimitError } = await supabase.rpc(
      "check_rate_limit",
      {
        p_key: `lead:${ipHash}`,
        p_limit: RATE_LIMIT,
        p_window_ms: RATE_WINDOW_MS,
      }
    );

    if (rateLimitError) {
      console.error("Rate limit check failed:", rateLimitError.message);
      // Continue without rate limiting if the check fails
    } else if (rateLimitResult && !rateLimitResult.allowed) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prepare lead data
    const leadData = {
      email,
      role: body.role || null,
      bucket: body.bucket || null,
      test_date: body.test_date || null,
      beta_interest: body.beta_interest === true,
      source: body.source || "landing",
      utm_source: body.utm_source || null,
      utm_medium: body.utm_medium || null,
      utm_campaign: body.utm_campaign || null,
      page_path: body.page_path || null,
      ip_hash: ipHash,
      user_agent: userAgent,
    };

    // Insert lead - handle duplicates via unique constraint
    const { data, error } = await supabase
      .from("leads")
      .insert(leadData)
      .select("id, created_at")
      .single();

    if (error) {
      // Handle unique constraint violation gracefully (duplicate)
      if (error.code === "23505") {
        // Return success for duplicates - they updated the existing record
        return new Response(
          JSON.stringify({ ok: true, duplicate: true }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      console.error("Insert error:", error.message);
      return new Response(JSON.stringify({ error: "Failed to save lead" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ ok: true, id: data.id, created_at: data.created_at }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
