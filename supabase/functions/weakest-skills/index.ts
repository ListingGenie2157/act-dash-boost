// weakest-skills/index.ts
import { corsHeaders, json, serverError, withClient, requireUser } from "../_shared/mod.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { supabase } = withClient(req);
    const user = await requireUser(supabase);
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { data, error } = await supabase
      .from("progress")
      .select("skill_id, seen, correct, skills:skill_id(subject, cluster, name)")
      .eq("user_id", user.id);

    if (error) return serverError(error.message);

    const ranked = (data ?? [])
      .map((r: any) => ({
        skill_id: r.skill_id,
        subject: r.skills.subject,
        cluster: r.skills.cluster,
        name: r.skills.name,
        errorCount: Math.max(0, (r.seen ?? 0) - (r.correct ?? 0)),
      }))
      .sort((a, b) => b.errorCount - a.errorCount);

    return json({ weak: ranked.slice(0, 5) });
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "unknown");
  }
});
