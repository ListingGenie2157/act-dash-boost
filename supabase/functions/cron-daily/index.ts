// cron-daily/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { corsHeaders, json } from "../_shared/mod.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const today = new Date().toISOString().slice(0, 10);

  // Create empty plan rows for users with a test_date and no plan today
  const { data: profs, error: pErr } = await admin
    .from("profiles")
    .select("id, test_date")
    .not("test_date", "is", null);

  if (pErr) return json({ error: pErr.message }, { status: 500 });

  const targets = (profs ?? []).map((p: any) => p.id);
  for (const uid of targets) {
    await admin.from("study_plan_days").upsert(
      { user_id: uid, the_date: today, generated_at: new Date().toISOString() },
      { onConflict: "user_id,the_date" }
    );
  }

  return json({ ok: true, users: targets.length });
});
