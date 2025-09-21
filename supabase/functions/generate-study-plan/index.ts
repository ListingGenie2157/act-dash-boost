// generate-study-plan/index.ts
import { corsHeaders, json, badRequest, serverError, withClient, requireUser } from "../_shared/mod.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST" && req.method !== "PUT") return badRequest("POST/PUT required");

  try {
    const { supabase } = withClient(req);
    const user = await requireUser(supabase);
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const today = new Date().toISOString().slice(0, 10);

    // Ensure a plan row exists
    const { error: upErr } = await supabase
      .from("study_plan_days")
      .upsert({ user_id: user.id, the_date: today, generated_at: new Date().toISOString() }, { onConflict: "user_id,the_date" });

    if (upErr) return serverError(upErr.message);

    // Pick top 2 weakest skills
    const { data: weak, error: wErr } = await supabase
      .from("progress")
      .select("skill_id, seen, correct")
      .eq("user_id", user.id);

    if (wErr) return serverError(wErr.message);

    const ranked = (weak ?? [])
      .map((r: any) => ({ skill_id: r.skill_id, e: (r.seen ?? 0) - (r.correct ?? 0) }))
      .sort((a, b) => b.e - a.e)
      .slice(0, 2);

    const tasks = [
      { type: "DRILL", size: 10, skill_id: ranked[0]?.skill_id ?? null },
      { type: "DRILL", size: 10, skill_id: ranked[1]?.skill_id ?? null },
      { type: "REVIEW", size: 10, skill_id: null },
    ].filter(Boolean).map((t) => ({
      user_id: user.id,
      the_date: today,
      type: t.type,
      size: t.size,
      skill_id: t.skill_id,
      status: "PENDING",
      reward_cents: 0,
    }));

    if (tasks.length) {
      const { error: tErr } = await supabase.from("study_tasks").insert(tasks);
      if (tErr && !tErr.message.includes("duplicate")) return serverError(tErr.message);
    }

    return json({ ok: true, tasks: tasks.length });
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "unknown");
  }
});
