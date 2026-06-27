import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, getClientIp, createRateLimitResponse } from '../_shared/rateLimit.ts';
import { parseBodyWithLimit } from '../_shared/mod.ts';

const SUBJECTS = ["Math", "English", "Reading", "Science"] as const;
type Subject = typeof SUBJECTS[number];

interface DiagnosticScore {
  section: string;
  score: number;
}

interface SkillDefinition {
  id: string;
  subject: string;
  name: string;
  cluster: string;
  order_index: number;
}

interface ProgressSkill {
  skill_id: string;
  mastery_level: number;
  correct: number;
  seen: number;
}

const MAX_TASKS_PER_DAY = 3;
const MAX_TASKS_PER_SUBJECT_PER_DAY = 2;
const COMPLETED_STUDY_TASK_STATUSES = ["SUCCESS", "COMPLETED", "DONE"];

function normalizeSubject(section: string): Subject | null {
  const normalized = section.trim().toLowerCase();

  if (normalized === "math") return "Math";
  if (normalized === "english") return "English";
  if (normalized === "reading") return "Reading";
  if (normalized === "science") return "Science";

  return null;
}

function buildDiagnosticScoreMap(
  diagnosticResults: DiagnosticScore[],
): Map<Subject, number> {
  const scoresBySubject = new Map<Subject, number>();

  diagnosticResults.forEach((diagnostic) => {
    const subject = normalizeSubject(diagnostic.section);
    if (!subject) return;

    const currentScore = scoresBySubject.get(subject);
    if (currentScore === undefined || diagnostic.score < currentScore) {
      scoresBySubject.set(subject, diagnostic.score);
    }
  });

  return scoresBySubject;
}

function getDiagnosticSubjectWeight(score: number | undefined): number {
  if (score === undefined) return 1;
  if (score < 0.6) return 3;
  if (score < 0.75) return 2;
  return 1;
}

function getProgressAccuracy(skill: ProgressSkill): number {
  return skill.seen > 0 ? skill.correct / skill.seen : 0;
}

function buildWeightedSubjectCycle(
  dayOffset: number,
  scoresBySubject: Map<Subject, number>,
): Subject[] {
  const rotatedSubjects = SUBJECTS.map((_, index) =>
    SUBJECTS[(dayOffset + index) % SUBJECTS.length]
  );
  const rotatedIndexBySubject = new Map<Subject, number>(
    rotatedSubjects.map((subject, index) => [subject, index]),
  );

  return [...rotatedSubjects]
    .sort((a, b) => {
      const weightDiff = getDiagnosticSubjectWeight(scoresBySubject.get(b)) -
        getDiagnosticSubjectWeight(scoresBySubject.get(a));
      if (weightDiff !== 0) return weightDiff;

      const scoreDiff = (scoresBySubject.get(a) ?? 1) -
        (scoresBySubject.get(b) ?? 1);
      if (scoreDiff !== 0) return scoreDiff;

      return (rotatedIndexBySubject.get(a) ?? 0) -
        (rotatedIndexBySubject.get(b) ?? 0);
    })
    .flatMap((subject) =>
      Array.from(
        { length: getDiagnosticSubjectWeight(scoresBySubject.get(subject)) },
        () => subject,
      )
    );
}

// Select lessons with diagnostic-weighted round-robin subject balancing.
export function selectLessonsForDay(
  lessonsNeeded: number,
  dayOffset: number, // 0-6 for the 7 days
  diagnosticResults: DiagnosticScore[],
  availableSkills: SkillDefinition[],
  trackedSkillIds: Set<string>,
  diagnosticWeakSkillIds: Set<string> = new Set<string>(),
): string[] {
  if (lessonsNeeded <= 0 || !availableSkills || availableSkills.length === 0) {
    return [];
  }

  // Group skills by subject
  const skillsBySubject: Record<Subject, SkillDefinition[]> = {
    Math: [],
    English: [],
    Reading: [],
    Science: [],
  };

  availableSkills.forEach((skill) => {
    const subject = normalizeSubject(skill.subject);
    if (subject) {
      skillsBySubject[subject].push(skill);
    }
  });

  // Sort each subject by diagnostic cluster priority, then curriculum order.
  Object.values(skillsBySubject).forEach((skills) => {
    skills.sort((a, b) => {
      const weakDiff = Number(diagnosticWeakSkillIds.has(b.id)) -
        Number(diagnosticWeakSkillIds.has(a.id));
      if (weakDiff !== 0) return weakDiff;
      return a.order_index - b.order_index;
    });
  });

  const scoresBySubject = buildDiagnosticScoreMap(diagnosticResults);
  const subjectCycle = buildWeightedSubjectCycle(dayOffset, scoresBySubject);
  const result: string[] = [];
  const selectedSkillIds = new Set<string>();
  const subjectCountToday: Record<Subject, number> = {
    Math: 0,
    English: 0,
    Reading: 0,
    Science: 0,
  };

  // For each lesson slot, pick from weighted rotating subjects.
  for (let i = 0; i < lessonsNeeded && result.length < lessonsNeeded; i++) {
    let found = false;

    for (let j = 0; j < subjectCycle.length && !found; j++) {
      const subject = subjectCycle[(i + j) % subjectCycle.length];

      // Skip if this subject already has too many lessons today
      if (subjectCountToday[subject] >= MAX_TASKS_PER_SUBJECT_PER_DAY) {
        continue;
      }

      // Find the next available skill in this subject (not already completed or selected)
      const selectedSkill = skillsBySubject[subject].find(
        (s) => !trackedSkillIds.has(s.id) && !selectedSkillIds.has(s.id),
      );

      if (selectedSkill) {
        result.push(selectedSkill.id);
        selectedSkillIds.add(selectedSkill.id);
        subjectCountToday[subject]++;
        found = true;
      }
    }
    
    // If no subjects have available skills, break
    if (!found) {
      break;
    }
  }

  return result;
}

// Pure function for task selection with time cap
export function selectPlaylist(
  priorities: Task[],
  capMins: number,
  getSubject?: (task: Task) => string | null,
): Task[] {
  const selected: Task[] = [];
  const subjectCounts = new Map<string, number>();
  let remainingMins = capMins;

  for (const task of priorities) {
    const subject = getSubject?.(task) ?? null;
    if (
      subject &&
      (subjectCounts.get(subject) ?? 0) >= MAX_TASKS_PER_SUBJECT_PER_DAY
    ) {
      continue;
    }

    if (task.estimatedMins <= remainingMins) {
      selected.push(task);
      if (subject) {
        subjectCounts.set(subject, (subjectCounts.get(subject) ?? 0) + 1);
      }
      remainingMins -= task.estimatedMins;
      if (selected.length >= MAX_TASKS_PER_DAY) break;
    }
  }

  return selected;
}

// Pure function for calculating days left
export function calculateDaysLeft(
  today: Date,
  testDate: Date | null,
): number | null {
  if (!testDate) return null;

  const timeDiff = testDate.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return daysDiff;
}

// Pure function for getting today in Chicago timezone
export function getTodayInChicago(): Date {
  const now = new Date();
  const chicagoTime = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = parseInt(
    chicagoTime.find((part) => part.type === "year")?.value || "0",
  );
  const month =
    parseInt(chicagoTime.find((part) => part.type === "month")?.value || "0") -
    1; // Month is 0-indexed
  const day = parseInt(
    chicagoTime.find((part) => part.type === "day")?.value || "0",
  );

  return new Date(year, month, day);
}

// Helper: Get start of week (Sunday)
function startOfWeekSunday(date: Date): Date {
  const dow = date.getDay(); // 0=Sun..6=Sat
  const d = new Date(date);
  d.setDate(d.getDate() - dow);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Helper: Convert Date to ISO date string (YYYY-MM-DD)
function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Compute SIM dates: 3 weeks, 2 weeks, 1 week before test on preferred day
function computeSimDates(
  testDate: Date,
  today: Date,
  preferredDow: number, // 0=Sunday..6=Saturday
): string[] {
  const offsets = [21, 14, 7]; // 3 weeks, 2 weeks, 1 week out
  const todayStripped = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const testStripped = new Date(testDate.getFullYear(), testDate.getMonth(), testDate.getDate());
  const dates = new Set<string>();

  for (const offset of offsets) {
    const base = new Date(testStripped);
    base.setDate(base.getDate() - offset);

    // "week of base date" snapped to preferred weekday
    const weekStart = startOfWeekSunday(base);
    const simDate = new Date(weekStart);
    simDate.setDate(weekStart.getDate() + preferredDow);

    if (simDate >= todayStripped && simDate < testStripped) {
      dates.add(toISODate(simDate));
    }
  }

  return Array.from(dates).sort();
}

interface Task {
  type: "REVIEW" | "DRILL" | "LEARN";
  skillId?: string;
  questionId?: string;
  size: number;
  estimatedMins: number;
  priority: number;
  title?: string;
}

interface StudyTaskInsert {
  user_id: string;
  the_date: string;
  type: string;
  skill_id: string | null;
  size: number;
  status: string;
  reward_cents: number | null;
  phase: number | null;
  time_limit_seconds: number | null;
  is_critical: boolean;
}

interface PlanTaskJson {
  sequence?: number;
  type: string;
  skill_id?: string | null;
  question_id?: string | null;
  size: number;
  estimated_mins: number;
  title: string;
}

interface StudyMode {
  name: "CRASH" | "ACCEL" | "MASTERY";
  allowLearn: boolean;
  reviewWeight: number;
  drillWeight: number;
  learnWeight: number;
}

function getStudyMode(daysLeft: number | null): StudyMode {
  if (daysLeft === null || daysLeft > 30) {
    return {
      name: "MASTERY",
      allowLearn: true,
      reviewWeight: 1,
      drillWeight: 2,
      learnWeight: 3,
    };
  } else if (daysLeft <= 7) {
    return {
      name: "CRASH",
      allowLearn: false,
      reviewWeight: 1,
      drillWeight: 2,
      learnWeight: 4,
    };
  } else {
    return {
      name: "ACCEL",
      allowLearn: true,
      reviewWeight: 1,
      drillWeight: 2,
      learnWeight: 3,
    };
  }
}

// Test week special scheduling - focused on final review
function getTestWeekTasks(
  daysLeft: number,
  userId: string,
  dateStr: string,
): Array<{
  type: string;
  section?: string;
  size: number;
  estimated_mins: number;
  title: string;
}> {
  const tasks: Array<{
    type: string;
    section?: string;
    size: number;
    estimated_mins: number;
    title: string;
  }> = [];

  // Final week focuses on review and light practice, not full simulations
  if (daysLeft >= 3 && daysLeft <= 7) {
    tasks.push({
      type: "REVIEW",
      size: 15,
      estimated_mins: 30,
      title: "Final Week Review"
    });
  } else if (daysLeft === 2) {
    tasks.push({
      type: "REVIEW",
      size: 10,
      estimated_mins: 20,
      title: "Pre-Test Review"
    });
  } else if (daysLeft === 1) {
    tasks.push({
      type: "WARMUP",
      size: 5,
      estimated_mins: 15,
      title: "Test Day Warmup"
    });
  }

  return tasks;
}

// Helper function for choosing weak skills from baseline
export function chooseWeakSkills(
  baseline: DiagnosticScore[],
  progress: ProgressSkill[],
  allSkills: SkillDefinition[],
): string[] {
  const weakSkillIds: string[] = [];
  const progressBySkill = new Map(
    progress.map((skill) => [skill.skill_id, skill]),
  );

  [...baseline]
    .sort((a, b) => a.score - b.score)
    .forEach((diagnostic) => {
      if (diagnostic.score < 0.6) {
        const diagnosticSubject = normalizeSubject(diagnostic.section);
        if (!diagnosticSubject) return;

        const sectionSkills = allSkills.filter((s) =>
          normalizeSubject(s.subject) === diagnosticSubject
        );
        const clusterGroups: { [cluster: string]: string[] } = {};

        sectionSkills.forEach((skill) => {
          const progressRow = progressBySkill.get(skill.id);
          const hasSparseOrNoProgress = !progressRow || progressRow.seen < 20;
          if (!hasSparseOrNoProgress) return;

          if (!clusterGroups[skill.cluster]) clusterGroups[skill.cluster] = [];
          clusterGroups[skill.cluster].push(skill.id);
        });

        const clusters = Object.keys(clusterGroups).slice(0, 2);
        clusters.forEach((cluster) => {
          const clusterSkillIds = clusterGroups[cluster].slice(0, 2);
          weakSkillIds.push(...clusterSkillIds);
        });
      }
    });

  return Array.from(new Set(weakSkillIds)).slice(0, 5);
}

function getTaskTitle(
  type: string,
  skillId: string | null,
  skillNameMap: Map<string, string>,
  size: number,
): string {
  if (skillId && skillNameMap.has(skillId)) {
    const skillName = skillNameMap.get(skillId);
    switch (type) {
      case "LEARN":
        return `Learn: ${skillName}`;
      case "DRILL":
        return `Practice: ${skillName}`;
      case "REVIEW":
        return `Review: ${skillName}`;
      default:
        return skillName || `${type} Task`;
    }
  }

  // Fallback for tasks without skill_id
  switch (type) {
    case "LEARN":
      return "New Lesson";
    case "DRILL":
      return `Practice Drill (${size} questions)`;
    case "REVIEW":
      return `Review ${size} question${size > 1 ? "s" : ""}`;
    default:
      return `${type} Task`;
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
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
    // Get the authorization header first
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.warn("No authorization header provided");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase client with proper env validation
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || (!supabaseAnonKey && !supabaseServiceKey)) {
      throw new Error(
        "Missing required environment variables: SUPABASE_URL or SUPABASE_ANON_KEY",
      );
    }

    // Parse request body for force flag and optional userId (for cron job)
    const parsed = await parseBodyWithLimit(req, corsHeaders);
    if ('error' in parsed) return parsed.error;
    const body = parsed.data as Record<string, unknown>;
    const force = body?.force === true;
    const cronUserId = body?.userId; // userId passed by cron job

    // Determine if this is a service role call (cron job) or user auth call
    const token = authHeader.replace("Bearer ", "");
    const isServiceRole = token === supabaseServiceKey;
    
    let userId: string;
    let supabase;

    if (isServiceRole && cronUserId) {
      // Cron job call - use service role key and specified userId
      userId = cronUserId as string;
      if (!supabaseServiceKey) {
        throw new Error('Service role key required for cron job calls');
      }
      supabase = createClient(supabaseUrl, supabaseServiceKey);
    } else {
      // Normal user call - verify JWT and use their ID
      const clientKey = supabaseAnonKey || supabaseServiceKey;
      if (!clientKey) {
        throw new Error('No valid Supabase key available');
      }
      supabase = createClient(supabaseUrl, clientKey, {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      });

      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        console.warn("Authentication failed");
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = user.id;
    }

    // Rate limit: 10 plan generations per minute per user
    const clientIp = getClientIp(req);
    const rateLimitAllowed = await checkRateLimit(userId, clientIp, 'generate-study-plan', 10, 60000);
    if (!rateLimitAllowed) {
      return createRateLimitResponse(corsHeaders);
    }

    const today = getTodayInChicago();
    const todayStr = today.toISOString().split("T")[0];

    // Check if plan already generated for this week
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().split("T")[0];

    // If force=true, delete existing pending tasks
    if (force) {
      const { error: deleteDaysError } = await supabase
        .from("study_plan_days")
        .delete()
        .eq("user_id", userId)
        .gte("the_date", todayStr);

      if (deleteDaysError) {
        console.error("Error deleting study_plan_days:", deleteDaysError);
      }

      const { error: deleteTasksError } = await supabase
        .from("study_tasks")
        .delete()
        .eq("user_id", userId)
        .in("status", ["PENDING", "STARTED"])
        .gte("the_date", todayStr)
        .lte("the_date", weekEndStr);

      if (deleteTasksError) {
        console.error("Error deleting study_tasks:", deleteTasksError);
      }
    }

    // Check if plan already exists (skip if force=true)
    // Plans need regeneration if:
    // 1. Less than 7 future days exist (rolling window approach)
    // 2. Force flag is set
    if (!force) {
      const { data: existingPlans } = await supabase
        .from("study_plan_days")
        .select("*")
        .eq("user_id", userId)
        .gte("the_date", todayStr)
        .lte("the_date", weekEndStr)
        .order("the_date", { ascending: true });

      // Count how many FUTURE days (today onwards) have plans
      const futurePlansCount = existingPlans?.length || 0;
      
      if (futurePlansCount >= 7) {

        // Set has_study_plan flag even for existing plans
        const { error: profileUpdateError } = await supabase
          .from("profiles")
          .update({ has_study_plan: true })
          .eq("id", userId);

        if (profileUpdateError) {
          console.error(
            "Error updating has_study_plan flag:",
            profileUpdateError,
          );
        }

        return new Response(
          JSON.stringify({
            days: (existingPlans || []).map((p: { the_date: string; tasks_json?: unknown[] }) => ({
              the_date: p.the_date,
              tasks: p.tasks_json || [],
            })),
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      
      // If we have some but not all days, regenerate
      if (futurePlansCount > 0) {
        
        // Delete existing future plans to regenerate cleanly
        const { error: deleteDaysError } = await supabase
          .from("study_plan_days")
          .delete()
          .eq("user_id", userId)
          .gte("the_date", todayStr);

        if (deleteDaysError) {
          console.error("Error deleting stale study_plan_days:", deleteDaysError);
        }

        const { error: deleteTasksError } = await supabase
          .from("study_tasks")
          .delete()
          .eq("user_id", userId)
          .in("status", ["PENDING", "STARTED"])
          .gte("the_date", todayStr);

        if (deleteTasksError) {
          console.error("Error deleting stale study_tasks:", deleteTasksError);
        }
      }
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("test_date, daily_time_cap_mins, plan_mode, sim_preferred_dow")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch profile" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get user preferences
    const { data: userPreferences } = await supabase
      .from("user_preferences")
      .select("daily_minutes, preferred_start_hour, preferred_end_hour")
      .eq("user_id", userId)
      .single();

    // Get accommodations
    const { data: accommodations } = await supabase
      .from("accommodations")
      .select("time_multiplier")
      .eq("user_id", userId)
      .single();

    // Get all skills for lesson tracking
    const { data: allSkills } = await supabase
      .from("skills")
      .select("id, name, subject, cluster, order_index")
      .order("order_index", { ascending: true });

    // Create skill name lookup map
    const skillNameMap = new Map<string, string>();
    const skillOrderMap = new Map<string, number>();
    const skillSubjectMap = new Map<string, Subject>();
    allSkills?.forEach((skill) => {
      skillNameMap.set(skill.id, skill.name);
      skillOrderMap.set(skill.id, skill.order_index);
      const subject = normalizeSubject(skill.subject);
      if (subject) {
        skillSubjectMap.set(skill.id, subject);
      }
    });

    const timeMultiplier = accommodations?.time_multiplier || 1.0;
    const testDate = profile?.test_date
      ? new Date(profile.test_date + "T00:00:00")
      : null;
    const daysLeft = calculateDaysLeft(today, testDate);
    const dailyTimeCap = userPreferences?.daily_minutes ||
      profile?.daily_time_cap_mins || 30;
    const mode = getStudyMode(daysLeft);

    // Compute SIM dates for personalized plan with preferred day
    const planMode = profile?.plan_mode || null;
    const simPreferredDow = typeof profile?.sim_preferred_dow === "number"
      ? profile.sim_preferred_dow
      : null;

    const simDates =
      testDate && planMode === "PERSONALIZED" && simPreferredDow !== null
        ? computeSimDates(testDate, today, simPreferredDow)
        : [];
    const simDateSet = new Set(simDates);

    const simTasks: StudyTaskInsert[] = simDates.map((dateStr) => ({
      user_id: userId,
      the_date: dateStr,
      type: "SIM",
      skill_id: null,
      size: 60,
      status: "PENDING",
      reward_cents: 50,
      phase: 0,
      time_limit_seconds: 60 * 60,
      is_critical: true,
    }));

    // Study mode computed based on days left

    // Calculate lesson metrics for time-adaptive planning
    const { data: lessonsWithContent } = await supabase
      .from("lesson_content")
      .select("skill_code");

    const totalLessonsAvailable = lessonsWithContent?.length || 30;

    // Track skills that should not receive duplicate LEARN tasks.
    const { data: masteryData } = await supabase
      .from("mastery")
      .select("skill_id, correct, total")
      .eq("user_id", userId);

    const { data: progressData } = await supabase
      .from("progress")
      .select("skill_id, mastery_level, correct, seen")
      .eq("user_id", userId);

    const lookbackStart = new Date(today);
    lookbackStart.setDate(today.getDate() - 7);
    const lookbackStartStr = lookbackStart.toISOString().split("T")[0];

    const { data: recentlyCompletedStudyTasks } = await supabase
      .from("study_tasks")
      .select("skill_id")
      .eq("user_id", userId)
      .in("status", COMPLETED_STUDY_TASK_STATUSES)
      .gte("the_date", lookbackStartStr)
      .lt("the_date", todayStr)
      .not("skill_id", "is", null)
      .limit(100);

    const trackedSkillIds = new Set<string>();
    const recentlyCompletedSkillIds = new Set<string>();

    masteryData?.forEach((m) => {
      if (!m.skill_id) return;

      if (m.total > 0) {
        trackedSkillIds.add(m.skill_id);
      }

      if (m.total >= 5 && (m.correct / m.total) >= 0.9) {
        trackedSkillIds.add(m.skill_id);
      }
    });

    progressData?.forEach((progress) => {
      if (progress.skill_id && progress.seen > 0) {
        trackedSkillIds.add(progress.skill_id);
      }
    });

    recentlyCompletedStudyTasks?.forEach((task) => {
      if (task.skill_id) {
        trackedSkillIds.add(task.skill_id);
        recentlyCompletedSkillIds.add(task.skill_id);
      }
    });

    const lessonsRemaining = Math.max(
      totalLessonsAvailable - trackedSkillIds.size,
      0,
    );
    const lessonsPerDay = daysLeft && daysLeft > 0
      ? Math.min(Math.ceil(lessonsRemaining / daysLeft), MAX_TASKS_PER_DAY)
      : Math.min(lessonsRemaining, MAX_TASKS_PER_DAY);

    // Calculate lessons per day based on remaining content

    // Fetch review and weakness data once for all days
    const { data: dueReviews } = await supabase
      .from("review_queue")
      .select("question_id, due_at")
      .eq("user_id", userId)
      .lte("due_at", new Date().toISOString())
      .order("due_at", { ascending: true })
      .limit(50); // Fetch more for 7 days

    const { data: latestDiagnostics } = await supabase
      .from("diagnostics")
      .select("section, score, source")
      .eq("user_id", userId)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false });

    const diagnosticsBySection: {
      [key: string]: { score: number; source: string };
    } = {};
    latestDiagnostics?.forEach((d) => {
      const current = diagnosticsBySection[d.section];
      if (
        !current || (d.source === "diagnostic" && current.source === "self")
      ) {
        diagnosticsBySection[d.section] = {
          score: d.score || 0,
          source: d.source || "diagnostic",
        };
      }
    });

    const baselineDiagnostics = Object.entries(diagnosticsBySection).map((
      [section, data],
    ) => ({
      section,
      score: data.score,
    }));

    const diagnosticWeakSkillIds = chooseWeakSkills(
      baselineDiagnostics,
      progressData || [],
      allSkills || [],
    );
    const diagnosticWeakSkillIdSet = new Set(diagnosticWeakSkillIds);

    const weakSkillCandidateMap = new Map<string, ProgressSkill>();
    diagnosticWeakSkillIds.forEach((skillId) => {
      weakSkillCandidateMap.set(skillId, {
        skill_id: skillId,
        mastery_level: 0,
        correct: 0,
        seen: 0,
      });
    });

    (progressData || [])
      .filter((skill) => skill.seen > 0)
      .sort((a, b) => {
        const masteryDiff = a.mastery_level - b.mastery_level;
        if (masteryDiff !== 0) return masteryDiff;
        return getProgressAccuracy(a) - getProgressAccuracy(b);
      })
      .forEach((skill) => {
        if (!weakSkillCandidateMap.has(skill.skill_id)) {
          weakSkillCandidateMap.set(skill.skill_id, skill);
        }
      });

    const weakestSkills = Array.from(weakSkillCandidateMap.values()).slice(
      0,
      10,
    );

    // Generate plans for 7 days
    const allPlans: Array<{ the_date: string; tasks: PlanTaskJson[] }> = [];
    const allStudyTasks: StudyTaskInsert[] = [];
    const assignedReviewIds = new Set<string>();
    const assignedSkillIds = new Set<string>(trackedSkillIds);
    const drillEligibleSkillIds = new Set<string>(trackedSkillIds);
    const drilledSkillIds = new Set<string>(recentlyCompletedSkillIds);

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + dayOffset);
      const dateStr = targetDate.toISOString().split("T")[0];
      const dayDaysLeft = daysLeft !== null ? daysLeft - dayOffset : null;
      const dayMode = getStudyMode(dayDaysLeft);

      // Generate plan for this day

      // Skip normal tasks on SIM days
      const isSimDay = simDateSet.has(dateStr);
      if (isSimDay) {

        // Reflect SIM in study_plan_days
        allPlans.push({
          the_date: dateStr,
          tasks: [{
            sequence: 1,
            type: "SIM",
            size: 60,
            estimated_mins: 60,
            title: "Full practice test",
          }],
        });

        // DO NOT push to allStudyTasks – SIM tasks handled via simTasks
        continue; // Skip to next day
      }

      // Check for test week special scheduling
      if (dayDaysLeft !== null && dayDaysLeft > 0 && dayDaysLeft <= 7) {
        const specialTasks = getTestWeekTasks(dayDaysLeft, userId, dateStr);
        if (specialTasks.length > 0) {
          allPlans.push({ the_date: dateStr, tasks: specialTasks });
          specialTasks.forEach((task) => {
            const estimatedSeconds =
              typeof task.estimated_mins === "number" && task.estimated_mins > 0
                ? Math.round(task.estimated_mins * 60)
                : null;

            allStudyTasks.push({
              user_id: userId,
              the_date: dateStr,
              type: task.type,
              skill_id: (task as Record<string, unknown>).skill_id as string ?? null,
              size: task.size,
              status: "PENDING",
              reward_cents: task.type === "SIM"
                ? 50
                : task.type === "REVIEW"
                ? 10
                : 25,
              phase: 0,
              time_limit_seconds: estimatedSeconds,
              is_critical: true,
            });
          });
          continue; // Skip normal task generation for test week
        }
      }

      // Build priority task list for this day
      const priorities: Task[] = [];
      const drillEligibleBeforeToday = new Set(drillEligibleSkillIds);
      let reviewsUsed = 0;

      // 1. REVIEW tasks - distribute across 7 days
      dueReviews?.forEach((review, index) => {
        if (!assignedReviewIds.has(review.question_id) && reviewsUsed < 3) {
          priorities.push({
            type: "REVIEW",
            questionId: review.question_id,
            size: 1,
            estimatedMins: Math.round(2 * timeMultiplier),
            priority: dayMode.reviewWeight * 1000 + (100 - index),
          });
          reviewsUsed++;
        }
      });

      // 2. LEARN tasks must be selected before DRILL tasks.
      if (dayMode.allowLearn && lessonsPerDay > 0) {
        const dailyLessons = selectLessonsForDay(
          lessonsPerDay,
          dayOffset, // Pass day offset for subject rotation
          baselineDiagnostics,
          allSkills || [],
          assignedSkillIds,
          diagnosticWeakSkillIdSet,
        );

        dailyLessons.forEach((skillId, index) => {
          priorities.push({
            type: "LEARN",
            skillId: skillId,
            size: 3,
            estimatedMins: Math.round(12 * timeMultiplier),
            priority: dayMode.learnWeight * 1000 + (25 - index),
          });
        });
      }

      // 3. DRILL tasks only target progress-tracked or previously learned skills.
      let availableWeakSkills = weakestSkills.filter((skill) =>
        drillEligibleBeforeToday.has(skill.skill_id) &&
        !drilledSkillIds.has(skill.skill_id)
      );

      if (availableWeakSkills.length === 0) {
        availableWeakSkills = Array.from(drillEligibleBeforeToday)
          .filter((skillId) => !drilledSkillIds.has(skillId))
          .sort((a, b) => {
            const weakDiff = Number(diagnosticWeakSkillIdSet.has(b)) -
              Number(diagnosticWeakSkillIdSet.has(a));
            if (weakDiff !== 0) return weakDiff;
            return (skillOrderMap.get(a) ?? Number.MAX_SAFE_INTEGER) -
              (skillOrderMap.get(b) ?? Number.MAX_SAFE_INTEGER);
          })
          .slice(0, 8)
          .map((skillId) => ({
            skill_id: skillId,
            mastery_level: 0,
            correct: 0,
            seen: 0,
          }));
      }

      availableWeakSkills.slice(0, 2).forEach((skill, index) => {
        priorities.push({
          type: "DRILL",
          skillId: skill.skill_id,
          size: 5,
          estimatedMins: Math.round(8 * timeMultiplier),
          priority: dayMode.drillWeight * 1000 + (50 - index),
        });
      });

      // Sort by priority
      priorities.sort((a, b) => {
        const priorityDiff = b.priority - a.priority;
        if (priorityDiff !== 0) return priorityDiff;

        const taskOrder: Record<Task["type"], number> = {
          LEARN: 0,
          DRILL: 1,
          REVIEW: 2,
        };
        return taskOrder[a.type] - taskOrder[b.type];
      });

      // Select tasks within time cap
      const selectedTasks = selectPlaylist(
        priorities,
        dailyTimeCap,
        (task) => task.skillId ? skillSubjectMap.get(task.skillId) ?? null : null,
      );
      const tasksForDay: Task[] = selectedTasks.length > 0
        ? selectedTasks
        : [{
          type: "DRILL" as const,
          size: 5,
          estimatedMins: Math.max(
            1,
            Math.min(
              Math.round(10 * timeMultiplier),
              Math.max(dailyTimeCap, 1),
            ),
          ),
          priority: 0,
          title: "General Performance Drill",
        }];
      console.log(`Selected ${tasksForDay.length} tasks for ${dateStr}`);

      tasksForDay.forEach((task) => {
        if (task.questionId) {
          assignedReviewIds.add(task.questionId);
        }

        if (!task.skillId) return;

        assignedSkillIds.add(task.skillId);
        if (task.type === "LEARN") {
          drillEligibleSkillIds.add(task.skillId);
        } else if (task.type === "DRILL") {
          drilledSkillIds.add(task.skillId);
        }
      });

      // Convert to JSON format
      const tasksJson = tasksForDay.map((task, index) => ({
        sequence: index + 1,
        type: task.type,
        skill_id: task.skillId || null,
        question_id: task.questionId || null,
        size: task.size,
        estimated_mins: task.estimatedMins,
        title: task.title ??
          getTaskTitle(task.type, task.skillId ?? null, skillNameMap, task.size),
      }));

      allPlans.push({ the_date: dateStr, tasks: tasksJson });

      // Add to study tasks after time-cap filtering has finalized the playlist.
      tasksForDay.forEach((task) => {
        const estimatedSeconds =
          typeof task.estimatedMins === "number" && task.estimatedMins > 0
            ? Math.round(task.estimatedMins * 60)
            : null;

        allStudyTasks.push({
          user_id: userId,
          the_date: dateStr,
          type: task.type,
          skill_id: task.skillId || null,
          size: task.size,
          status: "PENDING",
          reward_cents: task.type === "REVIEW"
            ? 10
            : task.type === "DRILL"
            ? 15
            : 20,
          phase: 0,
          time_limit_seconds: estimatedSeconds,
          is_critical: task.type === "DRILL",
        });
      });
    }

    // Save all plans to database
    const planRecords = allPlans.map((plan) => ({
      user_id: userId,
      the_date: plan.the_date,
      tasks_json: plan.tasks,
      generated_at: new Date().toISOString(),
    }));

    const { error: planError } = await supabase
      .from("study_plan_days")
      .upsert(planRecords, { onConflict: "user_id,the_date" });

    if (planError) {
      console.error("Error saving 7-day study plan:", planError);
      return new Response(
        JSON.stringify({ error: "Failed to save study plan" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Set has_study_plan flag
    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({ has_study_plan: true })
      .eq("id", userId);

    if (profileUpdateError) {
      console.error("❌ Error updating has_study_plan:", profileUpdateError);
    } else {
      console.log("✅ Profile updated: has_study_plan = true");
    }

    // Save all study tasks
    console.log(`📊 Attempting to save ${allStudyTasks.length} tasks to study_tasks table`);
    
    if (allStudyTasks.length === 0) {
      console.warn("⚠️ WARNING: No study tasks generated!");
      console.warn("Weak skills count:", weakestSkills?.length || 0);
      console.warn("Available skills count:", allSkills?.length || 0);
      console.warn("Lessons per day:", lessonsPerDay);
    }
    
    if (allStudyTasks.length > 0) {
      // Delete existing NON-SIM tasks for the 7-day range
      await supabase
        .from("study_tasks")
        .delete()
        .eq("user_id", userId)
        .neq("type", "SIM")
        .gte("the_date", todayStr)
        .lte("the_date", weekEndStr);

      // Upsert new non-SIM tasks (handles regeneration gracefully)
      const { error: tasksError } = await supabase
        .from("study_tasks")
        .upsert(allStudyTasks, { 
          onConflict: 'user_id,the_date,type,skill_id',
          ignoreDuplicates: false 
        });

      if (tasksError) {
        console.error("❌ Error saving study tasks:", tasksError.message);
      } else {
        console.log(
          `✅ Saved ${allStudyTasks.length} non-SIM study tasks across 7 days`,
        );
      }
    }

    // lesson_schedule table removed - all task tracking now unified in study_tasks

    // Upsert SIM tasks for personalized plan (3–2–1 weeks out on preferred day)
    if (simTasks.length > 0) {
      const { error: simError } = await supabase
        .from("study_tasks")
        .upsert(simTasks, {
          onConflict: "user_id,the_date,type,skill_id",
          ignoreDuplicates: false,
        });

      if (simError) {
        console.error("Error upserting SIM study tasks:", simError);
      } else {
        console.log(`🎯 Upserted ${simTasks.length} SIM tasks (3–2–1 weeks before test)`);
      }
    }

    const response = {
      days: allPlans,
      mode: mode.name,
      days_left: daysLeft,
      lessons_remaining: lessonsRemaining,
      lessons_per_day: lessonsPerDay,
      total_tasks: allStudyTasks.length,
    };

    console.log(`✅ Study plan generated: ${allStudyTasks.length} tasks, mode=${mode.name}, daysLeft=${daysLeft}`);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Error in generate-study-plan function:", msg);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
