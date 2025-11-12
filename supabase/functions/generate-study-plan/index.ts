import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  createClient,
  type SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2.56.0";

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

type PlannerSupabaseClient = SupabaseClient<unknown, unknown, unknown>;

interface PlanTaskEntry {
  type: string;
  skill_id: string | null;
  question_id: string | null;
  size: number;
  estimated_mins: number;
  title: string;
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

interface DayPlan {
  the_date: string;
  tasksJson: PlanTaskEntry[];
  studyTasks: StudyTaskInsert[];
}

interface UserContext {
  profile: { test_date: string | null; daily_time_cap_mins: number | null } | null;
  userPreferences:
    | {
      daily_minutes: number | null;
      preferred_start_hour: number | null;
      preferred_end_hour: number | null;
    }
    | null;
  accommodations: { time_multiplier: number | null } | null;
  allSkills:
    | Array<{ id: string; name: string; subject: string; cluster: string; order_index: number }>
    | null;
  skillNameMap: Map<string, string>;
  lessonsWithContent: Array<{ skill_code: string }> | null;
  masteryData: Array<{ skill_id: string; correct: number; total: number }> | null;
  completedSkillIds: Set<string>;
  dueReviews: Array<{ question_id: string; due_at: string }> | null;
  diagnosticsBySection: Record<string, { score: number; source: string }>;
  weakestSkills:
    | Array<{ skill_id: string; mastery_level: number; correct: number; seen: number }>
    | null;
}

interface PlanningContext extends UserContext {
  userId: string;
  today: Date;
  timeMultiplier: number;
  lessonsPerDay: number;
  assignedReviewIds: Set<string>;
  assignedSkillIds: Set<string>;
}

function makeTaskKey(dateStr: string, type: string | null, skillId: string | null): string {
  return `${dateStr}__${type ?? ""}__${skillId ?? ""}`;
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

async function loadUserContext(
  supabase: PlannerSupabaseClient,
  userId: string,
): Promise<UserContext> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("test_date, daily_time_cap_mins")
    .eq("id", userId)
    .single();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
    throw new Error("Failed to fetch profile");
  }

  const { data: userPreferences, error: userPreferencesError } = await supabase
    .from("user_preferences")
    .select("daily_minutes, preferred_start_hour, preferred_end_hour")
    .eq("user_id", userId)
    .maybeSingle();

  if (userPreferencesError) {
    console.error("Error fetching user preferences:", userPreferencesError);
  }

  const { data: accommodations, error: accommodationsError } = await supabase
    .from("accommodations")
    .select("time_multiplier")
    .eq("user_id", userId)
    .maybeSingle();

  if (accommodationsError) {
    console.error("Error fetching accommodations:", accommodationsError);
  }

  const { data: allSkills, error: allSkillsError } = await supabase
    .from("skills")
    .select("id, name, subject, cluster, order_index")
    .order("order_index", { ascending: true });

  if (allSkillsError) {
    console.error("Error fetching skills:", allSkillsError);
  }

  const skillNameMap = new Map<string, string>();
  allSkills?.forEach((skill) => {
    skillNameMap.set(skill.id, skill.name);
  });

  const { data: lessonsWithContent, error: lessonsError } = await supabase
    .from("lesson_content")
    .select("skill_code");

  if (lessonsError) {
    console.error("Error fetching lesson content:", lessonsError);
  }

  const { data: masteryData, error: masteryError } = await supabase
    .from("mastery")
    .select("skill_id, correct, total")
    .eq("user_id", userId);

  if (masteryError) {
    console.error("Error fetching mastery data:", masteryError);
  }

  const completedSkillIds = new Set<string>();
  masteryData?.forEach((m) => {
    if (m.total >= 5 && (m.correct / m.total) >= 0.9) {
      completedSkillIds.add(m.skill_id);
    }
  });

  const { data: dueReviews, error: dueReviewsError } = await supabase
    .from("review_queue")
    .select("question_id, due_at")
    .eq("user_id", userId)
    .lte("due_at", new Date().toISOString())
    .order("due_at", { ascending: true })
    .limit(50);

  if (dueReviewsError) {
    console.error("Error fetching review queue:", dueReviewsError);
  }

  const { data: latestDiagnostics, error: diagnosticsError } = await supabase
    .from("diagnostics")
    .select("section, score, source")
    .eq("user_id", userId)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false });

  if (diagnosticsError) {
    console.error("Error fetching diagnostics:", diagnosticsError);
  }

  const diagnosticsBySection: Record<string, { score: number; source: string }> = {};
  latestDiagnostics?.forEach((d) => {
    const current = diagnosticsBySection[d.section];
    if (!current || (d.source === "diagnostic" && current.source === "self")) {
      diagnosticsBySection[d.section] = {
        score: d.score || 0,
        source: d.source || "diagnostic",
      };
    }
  });

  const { data: weakestSkills, error: weakestError } = await supabase
    .from("progress")
    .select("skill_id, mastery_level, correct, seen")
    .eq("user_id", userId)
    .gt("seen", 0)
    .order("mastery_level", { ascending: true })
    .limit(10);

  if (weakestError) {
    console.error("Error fetching progress data:", weakestError);
  }

  return {
    profile,
    userPreferences: userPreferences ?? null,
    accommodations: accommodations ?? null,
    allSkills: allSkills ?? null,
    skillNameMap,
    lessonsWithContent: lessonsWithContent ?? null,
    masteryData: masteryData ?? null,
    completedSkillIds,
    dueReviews: dueReviews ?? null,
    diagnosticsBySection,
    weakestSkills: weakestSkills ?? null,
  };
}

function buildCalendar(today: Date): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }
  return dates;
}

function allocateTasksForDay(
  targetDate: Date,
  context: PlanningContext,
  daysLeft: number | null,
  dailyTimeCap: number,
): DayPlan {
  const dateStr = targetDate.toISOString().split("T")[0];
  const dayOffset = Math.round(
    (targetDate.getTime() - context.today.getTime()) / (1000 * 3600 * 24),
  );
  const dayMode = getStudyMode(daysLeft);

  if (daysLeft !== null && daysLeft > 0 && daysLeft <= 7) {
    console.warn(`Test week mode: ${daysLeft} days until test for ${dateStr}`);
    const specialTasks = getTestWeekTasks(daysLeft, context.userId, dateStr);
    if (specialTasks.length > 0) {
      const tasksJson: PlanTaskEntry[] = specialTasks.map((task) => ({
        type: task.type,
        skill_id: null,
        question_id: null,
        size: task.size,
        estimated_mins: task.estimated_mins,
        title: getTaskTitle(task.type, null, context.skillNameMap, task.size),
      }));

      const studyTasks: StudyTaskInsert[] = specialTasks.map((task) => ({
        user_id: context.userId,
        the_date: dateStr,
        type: task.type,
        skill_id: null,
        size: task.size,
        status: "PENDING",
        reward_cents: task.type === "SIM"
          ? 50
          : task.type === "REVIEW"
          ? 10
          : task.type === "DRILL"
          ? 15
          : 20,
        phase: null,
        time_limit_seconds: null,
        is_critical: true,
      }));

      return { the_date: dateStr, tasksJson, studyTasks };
    }
  }

  const priorities: Task[] = [];
  let reviewsUsed = 0;

  (context.dueReviews || []).forEach((review, index) => {
    if (!context.assignedReviewIds.has(review.question_id) && reviewsUsed < 3) {
      priorities.push({
        type: "REVIEW",
        questionId: review.question_id,
        size: 1,
        estimatedMins: Math.round(2 * context.timeMultiplier),
        priority: dayMode.reviewWeight * 1000 + (100 - index),
      });
      context.assignedReviewIds.add(review.question_id);
      reviewsUsed++;
    }
  });

  let availableWeakSkills =
    (context.weakestSkills || []).filter((s) =>
      !context.assignedSkillIds.has(s.skill_id)
    ) || [];

  if (availableWeakSkills.length === 0) {
    const subjects = ["Math", "English", "Reading", "Science"];
    const drillSkills: string[] = [];
    (context.allSkills || []).forEach((skill) => {
      if (subjects.includes(skill.subject) && !context.assignedSkillIds.has(skill.id)) {
        drillSkills.push(skill.id);
      }
    });

    const groupedBySubject: Record<string, string[]> = {
      Math: [],
      English: [],
      Reading: [],
      Science: [],
    };

    (context.allSkills || []).forEach((skill) => {
      if (!groupedBySubject[skill.subject]) return;
      if (!context.assignedSkillIds.has(skill.id)) {
        groupedBySubject[skill.subject].push(skill.id);
      }
    });

    const fallbackSkills: string[] = [];
    Object.keys(groupedBySubject).forEach((subject) => {
      const subjectSkills = groupedBySubject[subject]
        .sort((a, b) => a.localeCompare(b))
        .slice(0, 2);
      fallbackSkills.push(...subjectSkills);
    });

    availableWeakSkills = fallbackSkills.slice(0, 8).map((skillId) => ({
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
      estimatedMins: Math.round(8 * context.timeMultiplier),
      priority: dayMode.drillWeight * 1000 + (50 - index),
    });
  });

  if (dayMode.allowLearn && context.lessonsPerDay > 0) {
    const baselineDiagnostics = Object.entries(context.diagnosticsBySection).map(([
      section,
      data,
    ]) => ({ section, score: data.score }));

    const dailyLessons = selectLessonsForDay(
      context.lessonsPerDay,
      dayOffset,
      baselineDiagnostics,
      context.allSkills || [],
      context.assignedSkillIds,
    );

    dailyLessons.forEach((skillId, index) => {
      priorities.push({
        type: "LEARN",
        skillId,
        size: 3,
        estimatedMins: Math.round(12 * context.timeMultiplier),
        priority: dayMode.learnWeight * 1000 + (25 - index),
      });
      context.assignedSkillIds.add(skillId);
    });
  }

  priorities.sort((a, b) => b.priority - a.priority);

  const selectedTasks = selectPlaylist(priorities, dailyTimeCap);
  console.log(`Selected ${selectedTasks.length} tasks for ${dateStr}`);

  const tasksJson: PlanTaskEntry[] = selectedTasks.map((task) => ({
    type: task.type,
    skill_id: task.skillId || null,
    question_id: task.questionId || null,
    size: task.size,
    estimated_mins: task.estimatedMins,
    title: getTaskTitle(task.type, task.skillId || null, context.skillNameMap, task.size),
  }));

  const studyTasks: StudyTaskInsert[] = selectedTasks.map((task) => ({
    user_id: context.userId,
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
    phase: null,
    time_limit_seconds: null,
    is_critical: true,
  }));

  return { the_date: dateStr, tasksJson, studyTasks };
}

async function writePlanToDatabase(
  supabase: PlannerSupabaseClient,
  userId: string,
  todayDate: Date,
  calendarDates: Date[],
  dayPlans: DayPlan[],
  _force: boolean,
): Promise<Map<string, PlanTaskEntry[]>> {
  const todayStr = todayDate.toISOString().split("T")[0];
  const calendarDateStrs = calendarDates.map((date) =>
    date.toISOString().split("T")[0]
  );
  const futureDates = calendarDateStrs.filter((date) => date >= todayStr);

  if (futureDates.length > 0) {
    const { error: deleteTasksError } = await supabase
      .from("study_tasks")
      .delete()
      .eq("user_id", userId)
      .in("the_date", futureDates)
      .in("status", ["PENDING", "STARTED"]);

    if (deleteTasksError) {
      console.error("Error deleting pending study tasks:", deleteTasksError);
      throw new Error("Failed to clean up pending study tasks");
    }
  }

  const lockedTasksByDate = new Map<string, Set<string>>();

  if (futureDates.length > 0) {
    const { data: existingTasks, error: existingTasksError } = await supabase
      .from("study_tasks")
      .select("the_date, type, status, skill_id")
      .eq("user_id", userId)
      .in("the_date", futureDates);

    if (existingTasksError) {
      console.error("Error loading existing study tasks:", existingTasksError);
      throw new Error("Failed to load existing study tasks");
    }

    existingTasks?.forEach((task) => {
      const shouldPreserve = task.status === null ||
        (task.status !== "PENDING" && task.status !== "STARTED");
      if (shouldPreserve) {
        const key = makeTaskKey(task.the_date, task.type, task.skill_id);
        if (!lockedTasksByDate.has(task.the_date)) {
          lockedTasksByDate.set(task.the_date, new Set());
        }
        lockedTasksByDate.get(task.the_date)?.add(key);
      }
    });
  }

  const existingPlanDaysMap = new Map<string, PlanTaskEntry[]>();

  if (futureDates.length > 0) {
    const { data: existingPlanDays, error: existingPlanDaysError } = await supabase
      .from("study_plan_days")
      .select("the_date, tasks_json")
      .eq("user_id", userId)
      .in("the_date", futureDates);

    if (existingPlanDaysError) {
      console.error("Error loading existing plan days:", existingPlanDaysError);
    } else {
      existingPlanDays?.forEach((day) => {
        if (day?.the_date) {
          const tasks = Array.isArray(day.tasks_json)
            ? (day.tasks_json as PlanTaskEntry[])
            : [];
          existingPlanDaysMap.set(day.the_date, tasks);
        }
      });
    }
  }

  const studyTasksToInsert: StudyTaskInsert[] = [];
  const finalTasksByDate = new Map<string, PlanTaskEntry[]>();

  dayPlans
    .filter((plan) => plan.the_date >= todayStr)
    .forEach((plan) => {
      const lockedSet = lockedTasksByDate.get(plan.the_date) || new Set<string>();

      const filteredStudyTasks = plan.studyTasks.filter((task) => {
        const key = makeTaskKey(plan.the_date, task.type, task.skill_id);
        return !lockedSet.has(key);
      });

      const filteredTasksJson = plan.tasksJson.filter((task) => {
        const key = makeTaskKey(plan.the_date, task.type, task.skill_id);
        return !lockedSet.has(key);
      });

      studyTasksToInsert.push(...filteredStudyTasks);

      const previousTasksJson = existingPlanDaysMap.get(plan.the_date) || [];
      const preservedTasksJson = previousTasksJson.filter((task) => {
        const key = makeTaskKey(
          plan.the_date,
          task.type || null,
          task.skill_id || null,
        );
        return lockedSet.has(key);
      });

      const combinedTasks = [...preservedTasksJson, ...filteredTasksJson];
      finalTasksByDate.set(plan.the_date, combinedTasks);
    });

  const planRecords = Array.from(finalTasksByDate.entries()).map(([
    dateStr,
    tasks,
  ]) => ({
    user_id: userId,
    the_date: dateStr,
    tasks_json: tasks,
    generated_at: new Date().toISOString(),
  }));

  if (planRecords.length > 0) {
    const { error: planError } = await supabase
      .from("study_plan_days")
      .upsert(planRecords, { onConflict: "user_id,the_date" });

    if (planError) {
      console.error("Error saving 7-day study plan:", planError);
      throw new Error("Failed to save study plan");
    }
  }

  if (studyTasksToInsert.length > 0) {
    const { error: tasksError } = await supabase
      .from("study_tasks")
      .insert(studyTasksToInsert);

    if (tasksError) {
      console.error("Error saving study tasks:", tasksError);
      throw new Error("Failed to save study tasks");
    }
  }

  return finalTasksByDate;
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
    const calendarDates = buildCalendar(today);
    const todayStr = calendarDates[0].toISOString().split("T")[0];
    const weekEndStr = calendarDates[calendarDates.length - 1]
      .toISOString()
      .split("T")[0];

    if (force) {
      console.log("Force regeneration requested for current 7-day window");
    }

    if (!force) {
      const { data: existingPlans } = await supabase
        .from("study_plan_days")
        .select("the_date, tasks_json")
        .eq("user_id", user.id)
        .gte("the_date", todayStr)
        .lte("the_date", weekEndStr);

      if (existingPlans && existingPlans.length === calendarDates.length) {
        console.warn("7-day plan already exists for this week");

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

        const orderedPlans = [...existingPlans].sort((a, b) =>
          a.the_date.localeCompare(b.the_date)
        );

        return new Response(
          JSON.stringify({
            days: orderedPlans.map((plan) => ({
              the_date: plan.the_date,
              tasks: Array.isArray(plan.tasks_json) ? plan.tasks_json : [],
            })),
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    const userContext = await loadUserContext(supabase, user.id);
    const timeMultiplier = userContext.accommodations?.time_multiplier || 1.0;
    const testDate = userContext.profile?.test_date
      ? new Date(`${userContext.profile.test_date}T00:00:00`)
      : null;
    const daysLeft = calculateDaysLeft(today, testDate);
    const dailyTimeCap = userContext.userPreferences?.daily_minutes ||
      userContext.profile?.daily_time_cap_mins || 30;
    const mode = getStudyMode(daysLeft);

    const totalLessonsAvailable = userContext.lessonsWithContent?.length || 30;
    const lessonsRemainingRaw =
      totalLessonsAvailable - userContext.completedSkillIds.size;
    const lessonsRemaining = Math.max(lessonsRemainingRaw, 0);
    const lessonsPerDay = daysLeft && daysLeft > 0
      ? Math.min(Math.ceil(lessonsRemaining / daysLeft), 3)
      : Math.min(lessonsRemaining, 3);

    console.warn(
      `Study mode: ${mode.name}, Days left: ${daysLeft}, Time cap: ${dailyTimeCap}mins, Time multiplier: ${timeMultiplier}`,
    );
    console.log(
      `📚 Lessons: ${lessonsRemaining} remaining, ${lessonsPerDay} per day needed (${daysLeft} days left)`,
    );

    const planningContext: PlanningContext = {
      ...userContext,
      userId: user.id,
      today,
      timeMultiplier,
      lessonsPerDay,
      assignedReviewIds: new Set<string>(),
      assignedSkillIds: new Set<string>(userContext.completedSkillIds),
    };

    const dayPlans: DayPlan[] = [];
    calendarDates.forEach((date, index) => {
      const dateStr = date.toISOString().split("T")[0];
      console.log(`\n📅 Generating plan for ${dateStr} (${index + 1}/7)`);
      const dayDaysLeft = daysLeft !== null ? daysLeft - index : null;
      const plan = allocateTasksForDay(
        date,
        planningContext,
        dayDaysLeft,
        dailyTimeCap,
      );
      dayPlans.push(plan);
    });

    const finalTasksByDate = await writePlanToDatabase(
      supabase,
      user.id,
      today,
      calendarDates,
      dayPlans,
      force,
    );

    const totalTasks = dayPlans.reduce(
      (sum, plan) => sum + plan.studyTasks.length,
      0,
    );

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

    if (daysLeft && daysLeft > 7) {
      const simDates: string[] = [];

      if (daysLeft >= 90) {
        for (let day = 30; day <= daysLeft; day += 30) {
          if (day > 7) {
            const simDate = new Date(today);
            simDate.setDate(today.getDate() + day);
            simDates.push(simDate.toISOString().split("T")[0]);
          }
        }
      } else if (daysLeft >= 21) {
        for (let day = 14; day <= daysLeft - 7; day += 7) {
          const simDate = new Date(today);
          simDate.setDate(today.getDate() + day);
          simDates.push(simDate.toISOString().split("T")[0]);
        }
      } else {
        const midPoint = Math.floor(daysLeft / 2);
        if (midPoint > 7) {
          const simDate = new Date(today);
          simDate.setDate(today.getDate() + midPoint);
          simDates.push(simDate.toISOString().split("T")[0]);
        }
      }

      if (simDates.length > 0) {
        const simTasks = simDates.map((dateStr) => ({
          user_id: user.id,
          the_date: dateStr,
          type: "SIM" as const,
          skill_id: null,
          size: 60,
          status: "PENDING" as const,
          reward_cents: 50,
          phase: null,
          time_limit_seconds: null,
          is_critical: true,
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
          console.log(
            `🎯 Scheduled ${simDates.length} practice simulations (outside 7-day window)`,
          );
        }
      }
    }

    const responseDays = calendarDates.map((date) => {
      const dateStr = date.toISOString().split("T")[0];
      const tasks = finalTasksByDate.get(dateStr) ||
        dayPlans.find((plan) => plan.the_date === dateStr)?.tasksJson ||
        [];
      return { the_date: dateStr, tasks };
    });

    const response = {
      days: responseDays,
      mode: mode.name,
      days_left: daysLeft,
      lessons_remaining: lessonsRemaining,
      lessons_per_day: lessonsPerDay,
      total_tasks: totalTasks,
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
