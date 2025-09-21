import { Target, TrendingUp, Clock, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProgress } from "@/hooks/useProgress";
import { supabase } from "@/integrations/supabase/client";
import type { DiagnosticResults, StudyTask } from "@/types";

interface DashboardProps {
  onStartDay: (day: number) => void;
  onViewReview: () => void;
  onStudyNow?: () => void;
}

export const Dashboard = ({ onStartDay, onViewReview }: DashboardProps) => {
  const { progress } = useProgress();
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResults | null>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [todaysTasks, setTodaysTasks] = useState<StudyTask[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("diagnostic-results");
    if (raw) {
      try {
        setDiagnosticResults(JSON.parse(raw));
      } catch {
        setDiagnosticResults(null);
      }
    }
    void fetchDaysLeft();
    void fetchTodaysTasks();
  }, []);

  const fetchDaysLeft = async () => {
    try {
      const { data, error } = await supabase.functions.invoke<{
        today: string;
        test_date: string | null;
        days_left: number | null;
      }>("days-left", { method: "GET" });
      if (error) {
        console.error("Error fetching days left:", error);
        setDaysLeft(null);
        return;
      }
      setDaysLeft(typeof data?.days_left === "number" ? data.days_left : null);
    } catch (error) {
      console.error("Error fetching days left:", error);
      setDaysLeft(null);
    }
  };

  const fetchTodaysTasks = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("study_tasks")
        .select("*")
        .eq("the_date", today)
        .eq("status", "PENDING")
        .order("created_at", { ascending: true });
      if (!error && data) setTodaysTasks(data as StudyTask[]);
    } catch (error) {
      console.error("Error fetching today's tasks:", error);
    }
  };

  const weakAreas = progress?.weakAreas ?? [];
  const topWeakAreas = [...weakAreas].sort((a, b) => b.errorCount - a.errorCount).slice(0, 3);

  const statusText =
    daysLeft == null
      ? "No test date"
      : daysLeft > 0
      ? `${daysLeft} days until test`
      : daysLeft === 0
      ? "Test Day!"
      : "Test date passed";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">ACT Prep Dashboard</h1>
        <p className="text-muted-foreground">{statusText} • Intensive prep mode</p>
      </div>

      {/* Today’s Tasks */}
      {todaysTasks.length > 0 && (
        <Card className="p-6 shadow-medium border-primary/20">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Play className="w-5 h-5 text-primary" />
                Today&apos;s Study Plan
              </h3>
              <Badge variant="outline">
                {todaysTasks.length} task{todaysTasks.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            <div className="space-y-2">
              {todaysTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        task.type === "REVIEW" ? "bg-primary" : task.type === "DRILL" ? "bg-secondary" : "bg-accent"
                      }`}
                    />
                    <span className="font-medium capitalize">{task.type.toLowerCase()}</span>
                    <span className="text-sm text-muted-foreground">
                      {task.size} question{task.size !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{task.reward_cents || 0}¢</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Weak Areas */}
      {topWeakAreas.length > 0 && (
        <Card className="p-6 shadow-soft">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Areas to Focus On
              </h3>
              <Button variant="outline" size="sm" onClick={onViewReview}>
                Review Wrong Answers
              </Button>
            </div>
            <div className="space-y-3">
              {topWeakAreas.map((area) => (
                <div key={`${area.subject}-${area.topic}`} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                        area.subject === "Math" ? "bg-secondary text-secondary-foreground" : "bg-accent text-accent-foreground"
                      }`}
                    >
                      {area.subject === "Math" ? "M" : "E"}
                    </div>
                    <span className="font-medium capitalize">{area.topic}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {area.errorCount} error{area.errorCount !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 shadow-soft">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-secondary" />
              <h3 className="font-semibold">Quick Drills</h3>
            </div>
            <p className="text-sm text-muted-foreground">Practice with timed rapid-fire questions</p>
            <Button
              variant="drill"
              className="w-full"
              onClick={() => {
                console.warn("Math drill button clicked from Dashboard");
                onStartDay(9);
              }}
            >
              🔢 Start Math Drill (60s)
            </Button>
          </div>
        </Card>

        <Card className="p-6 shadow-soft">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" />
              <h3 className="font-semibold">Grammar Drill</h3>
            </div>
            <p className="text-sm text-muted-foreground">Quick grammar rules practice</p>
            <div className="space-y-2">
              <Button
                variant="success"
                className="w-full"
                onClick={() => {
                  console.warn("Grammar drill button clicked from Dashboard");
                  onStartDay(9);
                }}
              >
                ✏️ Start Grammar Drill (90s)
              </Button>
              <Link to="/sim-english">
                <Button variant="outline" size="sm" className="w-full">
                  Start English SIM
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
