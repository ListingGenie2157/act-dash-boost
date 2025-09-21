// set-test-date/index.ts
import { corsHeaders, json, badRequest, serverError, withClient, requireUser, readJson } from "../_shared/mod.ts";

type Body = { testDate: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return badRequest("POST required");

  try {
    const body = await readJson<Body>(req);
    if (!body?.testDate || !/^\d{4}-\d{2}-\d{2}$/.test(body.testDate)) return badRequest("testDate yyyy-mm-dd");

    const { supabase } = withClient(req);
    const user = await requireUser(supabase);
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { data, error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, test_date: body.testDate }, { onConflict: "id" })
      .select("test_date")
      .single();

    if (error) return serverError(error.message);
    return json({ ok: true, test_date: data.test_date });
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "unknown");
  }
});
