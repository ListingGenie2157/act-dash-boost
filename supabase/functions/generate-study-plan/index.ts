import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, getClientIp, createRateLimitResponse } from '../_shared/rateLimit.ts';

// Helper function to select lessons for a specific day with subject balancing
// Now uses round-robin subject selection to ensure variety across all 4 subjects
function selectLessonsForDay(
  lessonsNeeded: number,
  dayOffset: number, // 0-6 for the 7 days
  diagnosticResults: Array<{ section: string; score: number }>,
  availableSkills: Array<
    { id: string; subject: string; name: string; order_index: number }
  >,
  completedSkillIds: Set<string>,
): string[] {
  if (lessonsNeeded <= 0 || !availableSkills || availableSkills.length === 0) {
    return [];
  }

  // Group skills by subject
  const skillsBySubject: Record<string, typeof availableSkills> = {
    Math: [],
    English: [],
    Reading: [],
    Science: [],
  };

  availableSkills.forEach((skill) => {
    if (skillsBySubject[skill.subject]) {
      skillsBySubject[skill.subject].push(skill);
    }
  });

  // Sort each subject's skills by order_index (curriculum order)
  Object.values(skillsBySubject).forEach((skills) => {
    skills.sort((a, b) => a.order_index - b.order_index);
  });

  // Round-robin subject order, rotated by day for variety
  const subjects = ["Math", "English", "Reading", "Science"];
  const result: string[] = [];
  
  // Track subjects used THIS day to ensure variety within the day
  const subjectsUsedToday = new Set<string>();
  const maxPerSubjectPerDay = 2; // Don't let any subject dominate a single day
  const subjectCountToday: Record<string, number> = { Math: 0, English: 0, Reading: 0, Science: 0 };

  // For each lesson slot, pick from rotating subjects
  for (let i = 0; i < lessonsNeeded && result.length < lessonsNeeded; i++) {
    // Rotate starting subject based on dayOffset + slot index for maximum variety
    const startSubjectIdx = (dayOffset + i) % 4;
    
    // Try each subject in rotation order until we find one with available skills
    let found = false;
    for (let j = 0; j < 4 && !found; j++) {
      const subjectIdx = (startSubjectIdx + j) % 4;
      const subject = subjects[subjectIdx];
      
      // Skip if this subject already has too many lessons today
      if (subjectCountToday[subject] >= maxPerSubjectPerDay) {
        continue;
      }
      
      // Find the next available skill in this subject (not already completed or selected)
      const availableInSubject = skillsBySubject[subject].filter(
        (s) => !completedSkillIds.has(s.id) && !result.includes(s.id)
      );
      
      if (availableInSubject.length > 0) {
        const selectedSkill = availableInSubject[0];
        result.push(selectedSkill.id);
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
export function selectPlaylist(priorities: Task[], capMins: number): Task[] {
  const selected: Task[] = [];
  let remainingMins = capMins;

  for (const task of priorities) {
    if (task.estimatedMins <= remainingMins) {
      selected.push(task);
      remainingMins -= task.estimatedMins;
      if (selected.length >= 3) break; // Max 3 tasks
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
function chooseWeakSkills(
  baseline: Array<{ section: string; score: number }>,
  progress: Array<{ section: string; accuracy: number }>,
  allSkills: Array<
    {
      id?: string;
      subject: string;
      skill_name?: string;
      name?: string;
      cluster: string;
    }
  >,
): string[] {
  const weakSkillIds: string[] = [];

  baseline.forEach((diagnostic) => {
    if (diagnostic.score < 0.6) {
      const sectionSkills = allSkills.filter((s) =>
        s.subject === diagnostic.section
      );
      const clusterGroups: { [cluster: string]: string[] } = {};

      sectionSkills.forEach((skill) => {
        if (!clusterGroups[skill.cluster]) clusterGroups[skill.cluster] = [];
        clusterGroups[skill.cluster].push(
          skill.skill_name || skill.name || skill.id || "",
        );
      });

      const clusters = Object.keys(clusterGroups).slice(0, 2);
      clusters.forEach((cluster) => {
        const clusterSkillIds = clusterGroups[cluster].slice(0, 2);
        weakSkillIds.push(...clusterSkillIds);
      });
    }
  });

  return weakSkillIds.slice(0, 5);
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
    const body = await req.json();
    const force = body?.force === true;
    const cronUserId = body?.userId; // userId passed by cron job

    // Determine if this is a service role call (cron job) or user auth call
    const token = authHeader.replace("Bearer ", "");
    const isServiceRole = token === supabaseServiceKey;
    
    let userId: string;
    let supabase;

    if (isServiceRole && cronUserId) {
      // Cron job call - use service role key and specified userId
      userId = cronUserId;
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
            days: existingPlans.map((p) => ({
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
    allSkills?.forEach((skill) => {
      skillNameMap.set(skill.id, skill.name);
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

    // Get completed lessons (mastery level >= 3)
    const { data: masteryData } = await supabase
      .from("mastery")
      .select("skill_id, correct, total")
      .eq("user_id", userId);

    const completedSkillIds = new Set<string>();
    masteryData?.forEach((m) => {
      if (m.total >= 5 && (m.correct / m.total) >= 0.9) {
        completedSkillIds.add(m.skill_id);
      }
    });

    const lessonsRemaining = totalLessonsAvailable - completedSkillIds.size;
    const lessonsPerDay = daysLeft && daysLeft > 0
      ? Math.min(Math.ceil(lessonsRemaining / daysLeft), 3)
      : Math.min(lessonsRemaining, 3);

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

    const { data: weakestSkills } = await supabase
      .from("progress")
      .select("skill_id, mastery_level, correct, seen")
      .eq("user_id", userId)
      .gt("seen", 0)
      .order("mastery_level", { ascending: true })
      .limit(10); // More skills for 7 days

    // Generate plans for 7 days
    const allPlans: Array<{ the_date: string; tasks: PlanTaskJson[] }> = [];
    const allStudyTasks: StudyTaskInsert[] = [];
    const assignedReviewIds = new Set<string>();
    const assignedSkillIds = new Set<string>(completedSkillIds);

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
          specialTasks.forEach((task: any) => {
            const estimatedSeconds =
              typeof task.estimated_mins === "number" && task.estimated_mins > 0
                ? Math.round(task.estimated_mins * 60)
                : null;

            allStudyTasks.push({
              user_id: userId,
              the_date: dateStr,
              type: task.type,
              skill_id: task.skill_id ?? null,
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
          assignedReviewIds.add(review.question_id);
          reviewsUsed++;
        }
      });

      // 2. DRILL tasks - cycle through weak skills
      let availableWeakSkills = weakestSkills?.filter((s) =>
        !assignedSkillIds.has(s.skill_id)
      ) || [];

      // If no weak skills (new user), pick 2 skills from each subject
      if (availableWeakSkills.length === 0) {
        const subjects = ["Math", "English", "Reading", "Science"];
        const drillSkills: string[] = [];

        subjects.forEach((subject) => {
          const subjectSkills = (allSkills || [])
            .filter((s) => s.subject === subject && !assignedSkillIds.has(s.id))
            .sort((a, b) => a.order_index - b.order_index)
            .slice(0, 2)
            .map((s) => s.id);
          drillSkills.push(...subjectSkills);
        });

        availableWeakSkills = drillSkills.slice(0, 8).map((skillId) => ({
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
        assignedSkillIds.add(skill.skill_id); // Mark as assigned to prevent repetition
      });

      // 3. LEARN tasks
      if (dayMode.allowLearn && lessonsPerDay > 0) {
        const baselineDiagnostics = Object.entries(diagnosticsBySection).map((
          [section, data],
        ) => ({
          section,
          score: data.score,
        }));

        const dailyLessons = selectLessonsForDay(
          lessonsPerDay,
          dayOffset, // Pass day offset for subject rotation
          baselineDiagnostics,
          allSkills || [],
          assignedSkillIds,
        );

        dailyLessons.forEach((skillId, index) => {
          priorities.push({
            type: "LEARN",
            skillId: skillId,
            size: 3,
            estimatedMins: Math.round(12 * timeMultiplier),
            priority: dayMode.learnWeight * 1000 + (25 - index),
          });
          assignedSkillIds.add(skillId);
        });
      }

      // Sort by priority
      priorities.sort((a, b) => b.priority - a.priority);

      // Select tasks within time cap
      const selectedTasks = selectPlaylist(priorities, dailyTimeCap);
      console.log(`Selected ${selectedTasks.length} tasks for ${dateStr}`);

      // Add DRILL tasks immediately after LEARN tasks for same skill
      const tasksWithDrills: Task[] = [];
      selectedTasks.forEach(task => {
        tasksWithDrills.push(task);
        
        // If it's a LEARN task, add a corresponding DRILL task
        if (task.type === 'LEARN' && task.skillId) {
          // Check if there's time left in the daily cap
          const totalMins = tasksWithDrills.reduce((sum, t) => sum + t.estimatedMins, 0);
          const drillMins = Math.round(8 * timeMultiplier);
          
          if (totalMins + drillMins <= dailyTimeCap) {
            tasksWithDrills.push({
              type: 'DRILL',
              skillId: task.skillId,
              size: 5,
              estimatedMins: drillMins,
              priority: task.priority - 0.1, // Slightly lower priority
            });
            console.log(`Added DRILL for LEARN skill: ${task.skillId}`);
          }
        }
      });

      // Convert to JSON format
      const tasksJson = tasksWithDrills.map((task, index) => ({
        sequence: index + 1,
        type: task.type,
        skill_id: task.skillId || null,
        question_id: task.questionId || null,
        size: task.size,
        estimated_mins: task.estimatedMins,
        title: getTaskTitle(task.type, task.skillId ?? null, skillNameMap, task.size),
      }));

      allPlans.push({ the_date: dateStr, tasks: tasksJson });

      // Add to study tasks (use tasksWithDrills which includes correlated drills)
      tasksWithDrills.forEach((task) => {
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
