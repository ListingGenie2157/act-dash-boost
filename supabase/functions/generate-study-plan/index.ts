import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-app",
};

// Helper function to select lessons for a specific day with subject balancing
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

  // Sort each subject's skills by order_index
  Object.values(skillsBySubject).forEach((skills) => {
    skills.sort((a, b) => a.order_index - b.order_index);
  });

  // Identify weak subjects from diagnostics
  const weakSubjects = new Set<string>();
  const sectionToSubject: Record<string, string> = {
    "Math": "Math",
    "English": "English",
    "Reading": "Reading",
    "Science": "Science",
  };

  diagnosticResults.forEach((diag) => {
    if (diag.score < 24) { // < 75% accuracy
      const subject = sectionToSubject[diag.section];
      if (subject) weakSubjects.add(subject);
    }
  });

  // If no weak subjects identified, treat all as equal
  if (weakSubjects.size === 0) {
    ["Math", "English", "Reading", "Science"].forEach((s) =>
      weakSubjects.add(s)
    );
  }

  // Rotate primary subject based on day (ensures balance across 7 days)
  const subjects = ["Math", "English", "Reading", "Science"];
  const primarySubject = subjects[dayOffset % 4];

  // Select lessons: 60% from weak subjects, 40% from others, prioritize primary subject
  const result: string[] = [];
  const weakSubjectsList = Array.from(weakSubjects);

  // Start with primary subject if it's weak
  if (weakSubjects.has(primarySubject)) {
    const primarySkills = skillsBySubject[primarySubject].filter((s) =>
      !completedSkillIds.has(s.id)
    );
    if (primarySkills.length > 0) {
      result.push(primarySkills[0].id);
      completedSkillIds.add(primarySkills[0].id);
    }
  }

  // Fill remaining slots with balanced selection
  let attempts = 0;
  while (result.length < lessonsNeeded && attempts < 100) {
    attempts++;

    // Alternate between weak subjects
    const subjectToUse =
      weakSubjectsList[result.length % weakSubjectsList.length];
    const availableSkills = skillsBySubject[subjectToUse]?.filter((s) =>
      !completedSkillIds.has(s.id)
    ) || [];

    if (availableSkills.length > 0) {
      result.push(availableSkills[0].id);
      completedSkillIds.add(availableSkills[0].id);
    } else {
      // If no skills available in this subject, try others
      let found = false;
      for (const subject of subjects) {
        const skills = skillsBySubject[subject]?.filter((s) =>
          !completedSkillIds.has(s.id)
        ) || [];
        if (skills.length > 0) {
          result.push(skills[0].id);
          completedSkillIds.add(skills[0].id);
          found = true;
          break;
        }
      }
      if (!found) {
        break;
      }
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

interface Task {
  type: "REVIEW" | "DRILL" | "LEARN";
  skillId?: string;
  questionId?: string;
  size: number;
  estimatedMins: number;
  priority: number;
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
}> {
  const tasks: Array<{
    type: string;
    section?: string;
    size: number;
    estimated_mins: number;
  }> = [];

  // Final week focuses on review and light practice, not full simulations
  if (daysLeft >= 3 && daysLeft <= 7) {
    tasks.push({
      type: "REVIEW",
      size: 15,
      estimated_mins: 30,
    });
  } else if (daysLeft === 2) {
    tasks.push({
      type: "REVIEW",
      size: 10,
      estimated_mins: 20,
    });
  } else if (daysLeft === 1) {
    tasks.push({
      type: "WARMUP",
      size: 5,
      estimated_mins: 15,
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

    // Initialize Supabase client with proper env validation and auth header
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") ||
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "Missing required environment variables: SUPABASE_URL or SUPABASE_ANON_KEY",
      );
    }

    // Create client with Authorization header so RLS works properly
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Verify the JWT token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      token,
    );

    if (authError || !user) {
      console.warn("Authentication failed:", authError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body for force flag
    const body = await req.json();
    const force = body?.force === true;

    console.log(
      `Generate study plan called. Force: ${force}, User: ${user.id}`,
    );

    const today = getTodayInChicago();
    const todayStr = today.toISOString().split("T")[0];

    // Check if plan already generated for this week
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().split("T")[0];

    // If force=true, delete existing pending tasks
    if (force) {
      console.log("Force regeneration: Deleting existing plans...");

      const { error: deleteDaysError } = await supabase
        .from("study_plan_days")
        .delete()
        .eq("user_id", user.id)
        .gte("the_date", todayStr);

      if (deleteDaysError) {
        console.error("Error deleting study_plan_days:", deleteDaysError);
      }

      const { error: deleteTasksError } = await supabase
        .from("study_tasks")
        .delete()
        .eq("user_id", user.id)
        .in("status", ["PENDING", "STARTED"])
        .gte("the_date", todayStr)
        .lte("the_date", weekEndStr);

      if (deleteTasksError) {
        console.error("Error deleting study_tasks:", deleteTasksError);
      }

      console.log(
        "Existing plans deleted. Proceeding with fresh generation...",
      );
    }

    // Check if plan already exists (skip if force=true)
    if (!force) {
      const { data: existingPlans } = await supabase
        .from("study_plan_days")
        .select("*")
        .eq("user_id", user.id)
        .gte("the_date", todayStr)
        .lte("the_date", weekEndStr);

      if (existingPlans && existingPlans.length === 7) {
        console.warn("7-day plan already exists for this week");

        // Set has_study_plan flag even for existing plans
        const { error: profileUpdateError } = await supabase
          .from("profiles")
          .update({ has_study_plan: true })
          .eq("id", user.id);

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
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("test_date, daily_time_cap_mins")
      .eq("id", user.id)
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
      .eq("user_id", user.id)
      .single();

    // Get accommodations
    const { data: accommodations } = await supabase
      .from("accommodations")
      .select("time_multiplier")
      .eq("user_id", user.id)
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

    console.warn(
      `Study mode: ${mode.name}, Days left: ${daysLeft}, Time cap: ${dailyTimeCap}mins, Time multiplier: ${timeMultiplier}`,
    );

    // Calculate lesson metrics for time-adaptive planning
    const { data: lessonsWithContent } = await supabase
      .from("lesson_content")
      .select("skill_code");

    const totalLessonsAvailable = lessonsWithContent?.length || 30;

    // Get completed lessons (mastery level >= 3)
    const { data: masteryData } = await supabase
      .from("mastery")
      .select("skill_id, correct, total")
      .eq("user_id", user.id);

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

    console.log(
      `📚 Lessons: ${lessonsRemaining} remaining, ${lessonsPerDay} per day needed (${daysLeft} days left)`,
    );

    // Fetch review and weakness data once for all days
    const { data: dueReviews } = await supabase
      .from("review_queue")
      .select("question_id, due_at")
      .eq("user_id", user.id)
      .lte("due_at", new Date().toISOString())
      .order("due_at", { ascending: true })
      .limit(50); // Fetch more for 7 days

    const { data: latestDiagnostics } = await supabase
      .from("diagnostics")
      .select("section, score, source")
      .eq("user_id", user.id)
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
      .eq("user_id", user.id)
      .gt("seen", 0)
      .order("mastery_level", { ascending: true })
      .limit(10); // More skills for 7 days

    // Generate plans for 7 days
    const allPlans: Array<{ the_date: string; tasks: any[] }> = [];
    const allStudyTasks: any[] = [];
    const assignedReviewIds = new Set<string>();
    const assignedSkillIds = new Set<string>(completedSkillIds);

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + dayOffset);
      const dateStr = targetDate.toISOString().split("T")[0];
      const dayDaysLeft = daysLeft !== null ? daysLeft - dayOffset : null;
      const dayMode = getStudyMode(dayDaysLeft);

      console.log(`\n📅 Generating plan for ${dateStr} (${dayOffset + 1}/7)`);

      // Check for test week special scheduling
      if (dayDaysLeft !== null && dayDaysLeft > 0 && dayDaysLeft <= 7) {
        console.warn(`Test week mode: ${dayDaysLeft} days until test`);
        const specialTasks = getTestWeekTasks(dayDaysLeft, user.id, dateStr);
        if (specialTasks.length > 0) {
          allPlans.push({ the_date: dateStr, tasks: specialTasks });
          specialTasks.forEach((task: any) => {
            allStudyTasks.push({
              user_id: user.id,
              the_date: dateStr,
              type: task.type,
              skill_id: task.skill_id || null,
              size: task.size,
              status: "PENDING",
              reward_cents: task.type === "SIM"
                ? 50
                : task.type === "REVIEW"
                ? 10
                : 25,
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

      // Convert to JSON format
      const tasksJson = selectedTasks.map((task) => ({
        type: task.type,
        skill_id: task.skillId || null,
        question_id: task.questionId || null,
        size: task.size,
        estimated_mins: task.estimatedMins,
        title: getTaskTitle(task.type, task.skillId, skillNameMap, task.size),
      }));

      allPlans.push({ the_date: dateStr, tasks: tasksJson });

      // Add to study tasks
      selectedTasks.forEach((task) => {
        allStudyTasks.push({
          user_id: user.id,
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
        });
      });
    }

    // Save all plans to database
    const planRecords = allPlans.map((plan) => ({
      user_id: user.id,
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
      .eq("id", user.id);

    if (profileUpdateError) {
      console.error("Error updating has_study_plan flag:", profileUpdateError);
    }

    // Save all study tasks
    if (allStudyTasks.length > 0) {
      // Delete existing tasks for the 7-day range first
      await supabase
        .from("study_tasks")
        .delete()
        .eq("user_id", user.id)
        .gte("the_date", todayStr)
        .lte("the_date", weekEndStr);

      // Insert new tasks
      const { error: tasksError } = await supabase
        .from("study_tasks")
        .insert(allStudyTasks);

      if (tasksError) {
        console.error("Error saving study tasks:", tasksError);
      } else {
        console.log(
          `✅ Saved ${allStudyTasks.length} study tasks across 7 days`,
        );
      }
    }

    // lesson_schedule table removed - all task tracking now unified in study_tasks

    // Schedule practice simulations based on time until test (only OUTSIDE the 7-day window)
    if (daysLeft && daysLeft > 7) {
      const simDates = [];

      if (daysLeft >= 90) {
        // 3+ months: schedule once per month
        for (let day = 30; day <= daysLeft; day += 30) {
          // Skip dates within the 7-day window
          if (day > 7) {
            const simDate = new Date(today);
            simDate.setDate(today.getDate() + day);
            simDates.push(simDate.toISOString().split("T")[0]);
          }
        }
      } else if (daysLeft >= 21) {
        // 3+ weeks: schedule once per week
        for (let day = 14; day <= daysLeft - 7; day += 7) {
          // Start from day 14 to avoid 7-day window
          const simDate = new Date(today);
          simDate.setDate(today.getDate() + day);
          simDates.push(simDate.toISOString().split("T")[0]);
        }
      } else {
        // 8-20 days: schedule 1 sim mid-way (if outside 7-day window)
        const midPoint = Math.floor(daysLeft / 2);
        if (midPoint > 7) {
          const simDate = new Date(today);
          simDate.setDate(today.getDate() + midPoint);
          simDates.push(simDate.toISOString().split("T")[0]);
        }
      }

      // Create SIM tasks for scheduled dates using UPSERT to prevent duplicates
      if (simDates.length > 0) {
        const simTasks = simDates.map((dateStr) => ({
          user_id: user.id,
          the_date: dateStr,
          type: "SIM" as const,
          skill_id: null,
          size: 60, // Full section simulation
          status: "PENDING" as const,
          reward_cents: 50,
        }));

        const { error: simError } = await supabase
          .from("study_tasks")
          .upsert(simTasks, {
            onConflict: "user_id,the_date,type",
            ignoreDuplicates: false,
          });

        if (simError) {
          console.error("Error scheduling SIM tasks:", simError);
        } else {
          console.log(`🎯 Scheduled ${simDates.length} practice simulations (outside 7-day window)`);
        }
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

    console.warn("7-day study plan generated successfully:", response);

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
