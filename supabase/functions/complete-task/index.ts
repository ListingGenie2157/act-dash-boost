// complete-task/index.ts
import { corsHeaders, json, badRequest, serverError, withClient, requireUser, readJson } from "../_shared/mod.ts";

type Body = {
  taskId: string;
  status?: "DONE" | "SKIPPED";
  accuracy?: number | null;
  median_time_ms?: number | null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return badRequest("POST required");

  try {
    const body = await readJson<Body>(req);
    if (!body?.taskId) return badRequest("taskId required");

    const { supabase } = withClient(req);
    const user = await requireUser(supabase);
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const updates: Record<string, unknown> = {
      status: body.status ?? "DONE",
    };
    if (body.accuracy != null) updates.accuracy = body.accuracy;
    if (body.median_time_ms != null) updates.median_time_ms = body.median_time_ms;

    const { error } = await supabase
      .from("study_tasks")
      .update(updates)
      .eq("id", body.taskId)
      .eq("user_id", user.id);

    if (error) return serverError(error.message);
    return json({ ok: true });
  } catch (e) {
    return serverError(e instanceof Error ? e.message : "unknown");
  }
});
