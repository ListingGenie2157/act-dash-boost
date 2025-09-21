// finish-diagnostic/index.ts
import { corsHeaders, json, badRequest, serverError, withClient, requireUser, readJson } from "../_shared/mod.ts";

type Body = {
  results: Array<{ skill_id: string; correct: boolean; time_ms?: number }>;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return badRequest("POST required");

  try {
    const body = await readJson<Body>(req);
    if (!body?.results?.length) return badRequest("results[] required");

    const { supabase } = withClient(req);
    const user = await requireUser(supabase);
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    // Aggregate per-skill
    const agg = new Map<string, { seen: number; correct: number; times: number[] }>();
    for (const r of body.results) {
      const a = agg.get(r.skill_id) ?? { seen: 0, correct: 0, times: [] };
      a.seen += 1;
      a.correct += r.correct ? 1 : 0;
      if (typeof r.time_ms === "number") a.times.push(r.time_ms);
      agg.set(r.skill_id, a);
    }

    // Upsert progress rows
    const rows = Array.from(agg.entries()).map(([skill_id, v]) => ({
      user_id: user.id,
      skill_id,
      seen: v.seen,
      correct: v.correct,
      median_time_ms: v.times.sort((a, b) => a - b)[Math.floor(v.times.length / 2)] ?? 0,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("progress").upsert(rows, { onConflict: "user_id,skill_id" });
    if (error) return serverError(error.message);

    return json({ ok: true, updated: rows.length });
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "unknown");
  }
});
