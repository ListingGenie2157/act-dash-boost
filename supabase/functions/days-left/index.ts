// days-left/index.ts
import { corsHeaders, json, serverError, withClient, requireUser } from "../_shared/mod.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { supabase } = withClient(req);
    const user = await requireUser(supabase);
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { data, error } = await supabase.from("profiles").select("test_date").eq("id", user.id).maybeSingle();
    if (error) return serverError(error.message);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let days_left: number | null = null;
    if (data?.test_date) {
      const td = new Date(data.test_date as string);
      td.setHours(0, 0, 0, 0);
      days_left = Math.ceil((td.getTime() - today.getTime()) / 86_400_000);
    }

    return json({
      today: today.toISOString().slice(0, 10),
      test_date: data?.test_date ?? null,
      days_left,
    });
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "unknown");
  }
});
