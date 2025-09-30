import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function TaskLauncher() {
  const { date, idx } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      if (!date || idx == null) return navigate("/plan");

      const { data, error } = await supabase
        .from("study_plan_days")
        .select("tasks_json")
        .eq("the_date", date)
        .maybeSingle();

      if (error || !data?.tasks_json) return navigate("/plan");

      const i = Number(idx);
      const task = data.tasks_json[i];
      if (!task) return navigate("/plan");

      const type = String(task.type || "").toUpperCase();
      const code = task.skill_code || "EN";
      const n = task.size ?? 10;

      switch (type) {
        case "LEARN":
          navigate(`/lesson/${code}?date=${encodeURIComponent(date)}&i=${i}`);
          break;
        case "DRILL":
          navigate(`/drill/${code}?n=${n}&date=${encodeURIComponent(date)}&i=${i}`);
          break;
        case "QUIZ":
          navigate(`/quiz/${code}?n=${n}&date=${encodeURIComponent(date)}&i=${i}`);
          break;
        case "SIM":
          navigate(`/simulation?date=${encodeURIComponent(date)}&i=${i}`);
          break;
        default:
          navigate("/plan");
      }
    })();
  }, [date, idx, navigate]);

  return null;
}
