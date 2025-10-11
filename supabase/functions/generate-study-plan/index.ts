import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to select lessons for a specific day
function selectLessonsForDay(
  lessonsNeeded: number,
  daysLeft: number | null,
  diagnosticResults: Array<{ section: string; score: number }>,
  availableSkills: Array<{ id: string; subject: string; name: string; order_index: number }>,
  completedSkillIds: Set<string>
): string[] {
  const selectedSkillIds: string[] = [];

  // Filter out completed skills
  const learnableSkills = availableSkills.filter(s => !completedSkillIds.has(s.id));

  // Identify weak sections (score < 0.6)
  const weakSections = diagnosticResults
    .filter(d => d.score < 0.6)
    .map(d => d.section.toLowerCase());

  // Sort by priority: weak sections first, then by order_index
  const prioritizedSkills = learnableSkills.sort((a, b) => {
    const aIsWeak = weakSections.includes(a.subject.toLowerCase()) ? 1 : 0;
    const bIsWeak = weakSections.includes(b.subject.toLowerCase()) ? 1 : 0;

    if (aIsWeak !== bIsWeak) return bIsWeak - aIsWeak; // Weak first
    return a.order_index - b.order_index; // Then by order
  });

  // Time-based strategy
  if (daysLeft !== null && daysLeft < 30) {
    // URGENT: Focus only on weak areas
    const weakSkills = prioritizedSkills.filter(s =>
      weakSections.includes(s.subject.toLowerCase())
    );
    selectedSkillIds.push(...weakSkills.slice(0, lessonsNeeded).map(s => s.id));

    // If not enough weak skills, add foundational ones
    if (selectedSkillIds.length < lessonsNeeded) {
      const remaining = lessonsNeeded - selectedSkillIds.length;
      const foundational = prioritizedSkills
        .filter(s => !selectedSkillIds.includes(s.id))
        .slice(0, remaining);
      selectedSkillIds.push(...foundational.map(s => s.id));
    }
  } else {
    // BALANCED: Mix of weak + new
    const weakCount = Math.ceil(lessonsNeeded * 0.6);
    const newCount = lessonsNeeded - weakCount;

    const weakSkills = prioritizedSkills
      .filter(s => weakSections.includes(s.subject.toLowerCase()))
      .slice(0, weakCount);

    const newSkills = prioritizedSkills
      .filter(s => !weakSections.includes(s.subject.toLowerCase()))
      .slice(0, newCount);

    selectedSkillIds.push(...weakSkills.map(s => s.id), ...newSkills.map(s => s.id));
  }

  return selectedSkillIds.slice(0, lessonsNeeded);
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
export function calculateDaysLeft(today: Date, testDate: Date | null): number | null {
  if (!testDate) return null;
  
  const timeDiff = testDate.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  return daysDiff;
}

// Pure function for getting today in Chicago timezone
export function getTodayInChicago(): Date {
  const now = new Date();
  const chicagoTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now);
  
  const year = parseInt(chicagoTime.find(part => part.type === 'year')?.value || '0');
  const month = parseInt(chicagoTime.find(part => part.type === 'month')?.value || '0') - 1; // Month is 0-indexed
  const day = parseInt(chicagoTime.find(part => part.type === 'day')?.value || '0');
  
  return new Date(year, month, day);
}

interface Task {
  type: 'REVIEW' | 'DRILL' | 'LEARN';
  skillId?: string;
  questionId?: string;
  size: number;
  estimatedMins: number;
  priority: number;
}

interface StudyMode {
  name: 'CRASH' | 'ACCEL' | 'MASTERY';
  allowLearn: boolean;
  reviewWeight: number;
  drillWeight: number;
  learnWeight: number;
}

function getStudyMode(daysLeft: number | null): StudyMode {
  if (daysLeft === null || daysLeft > 30) {
    return {
      name: 'MASTERY',
      allowLearn: true,
      reviewWeight: 1,
      drillWeight: 2,
      learnWeight: 3
    };
  } else if (daysLeft <= 7) {
    return {
      name: 'CRASH',
      allowLearn: false,
      reviewWeight: 1,
      drillWeight: 2,
      learnWeight: 4
    };
  } else {
    return {
      name: 'ACCEL',
      allowLearn: true,
      reviewWeight: 1,
      drillWeight: 2,
      learnWeight: 3
    };
  }
}

// Test week special scheduling
function getTestWeekTasks(daysLeft: number, userId: string, dateStr: string): Array<{
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
  
  if (daysLeft === 7 || daysLeft === 5 || daysLeft === 3) {
    tasks.push({
      type: 'SIM',
      section: 'english',
      size: 75,
      estimated_mins: 45
    });
  } else if (daysLeft === 2) {
    tasks.push({
      type: 'REVIEW',
      size: 10,
      estimated_mins: 20
    });
  } else if (daysLeft === 1) {
    tasks.push({
      type: 'WARMUP',
      size: 5,
      estimated_mins: 15
    });
  }
  
  return tasks;
}

// Helper function for choosing weak skills from baseline
function chooseWeakSkills(baseline: Array<{ section: string; score: number }>, progress: Array<{ section: string; accuracy: number }>, allSkills: Array<{ id?: string; subject: string; skill_name?: string; name?: string; cluster: string }>): string[] {
  const weakSkillIds: string[] = [];
  
  baseline.forEach(diagnostic => {
    if (diagnostic.score < 0.6) {
      const sectionSkills = allSkills.filter(s => s.subject === diagnostic.section);
      const clusterGroups: { [cluster: string]: string[] } = {};
      
      sectionSkills.forEach(skill => {
        if (!clusterGroups[skill.cluster]) clusterGroups[skill.cluster] = [];
        clusterGroups[skill.cluster].push(skill.skill_name || skill.name || skill.id || '');
      });
      
      const clusters = Object.keys(clusterGroups).slice(0, 2);
      clusters.forEach(cluster => {
        const clusterSkillIds = clusterGroups[cluster].slice(0, 2);
        weakSkillIds.push(...clusterSkillIds);
      });
    }
  });
  
  return weakSkillIds.slice(0, 5);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.warn('No authorization header provided');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.warn('Authentication failed:', authError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const today = getTodayInChicago();
    const todayStr = today.toISOString().split('T')[0];

    // Check if plan already generated for today
    const { data: existingPlan } = await supabase
      .from('study_plan_days')
      .select('*')
      .eq('user_id', user.id)
      .eq('the_date', todayStr)
      .single();

    if (existingPlan) {
      console.warn('Plan already exists for today');
      return new Response(JSON.stringify({
        the_date: todayStr,
        tasks: existingPlan.tasks_json || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('test_date, daily_time_cap_mins')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return new Response(JSON.stringify({ error: 'Failed to fetch profile' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user preferences
    const { data: userPreferences } = await supabase
      .from('user_preferences')
      .select('daily_minutes, preferred_start_hour, preferred_end_hour')
      .eq('user_id', user.id)
      .single();

    // Get accommodations
    const { data: accommodations } = await supabase
      .from('accommodations')
      .select('time_multiplier')
      .eq('user_id', user.id)
      .single();

    // Get all skills for lesson tracking
    const { data: allSkills } = await supabase
      .from('skills')
      .select('id, name, subject, cluster, order_index')
      .order('order_index', { ascending: true });

    const timeMultiplier = accommodations?.time_multiplier || 1.0;
    const testDate = profile?.test_date ? new Date(profile.test_date + 'T00:00:00') : null;
    const daysLeft = calculateDaysLeft(today, testDate);
    const dailyTimeCap = userPreferences?.daily_minutes || profile?.daily_time_cap_mins || 30;
    const mode = getStudyMode(daysLeft);

    console.warn(`Study mode: ${mode.name}, Days left: ${daysLeft}, Time cap: ${dailyTimeCap}mins, Time multiplier: ${timeMultiplier}`);

    // Calculate lesson metrics for time-adaptive planning
    const { data: lessonsWithContent } = await supabase
      .from('lesson_content')
      .select('skill_code');
    
    const totalLessonsAvailable = lessonsWithContent?.length || 30;
    
    // Get completed lessons (mastery level >= 3)
    const { data: masteryData } = await supabase
      .from('mastery')
      .select('skill_id, correct, total')
      .eq('user_id', user.id);

    const completedSkillIds = new Set<string>();
    masteryData?.forEach(m => {
      if (m.total >= 5 && (m.correct / m.total) >= 0.8) {
        completedSkillIds.add(m.skill_id);
      }
    });

    const lessonsRemaining = totalLessonsAvailable - completedSkillIds.size;
    const lessonsPerDay = daysLeft && daysLeft > 0 
      ? Math.min(Math.ceil(lessonsRemaining / daysLeft), 3) 
      : Math.min(lessonsRemaining, 3);

    console.log(`📚 Lessons: ${lessonsRemaining} remaining, ${lessonsPerDay} per day needed (${daysLeft} days left)`);

    // Check for test week special scheduling
    if (daysLeft !== null && daysLeft <= 7) {
      const specialTasks = getTestWeekTasks(daysLeft, user.id, todayStr);
      if (specialTasks.length > 0) {
        const { error: planError } = await supabase
          .from('study_plan_days')
          .upsert({
            user_id: user.id,
            the_date: todayStr,
            tasks_json: specialTasks,
            generated_at: new Date().toISOString()
          });

        if (planError) {
          console.error('Error saving test week plan:', planError);
        } else {
          const studyTasks = specialTasks.map((task: { type: string; skill_id?: string; size: number }) => ({
            user_id: user.id,
            the_date: todayStr,
            type: task.type,
            skill_id: task.skill_id || null,
            size: task.size,
            status: 'PENDING',
            reward_cents: task.type === 'SIM' ? 50 : task.type === 'REVIEW' ? 10 : 25
          }));

          if (studyTasks.length > 0) {
            await supabase.from('study_tasks').upsert(studyTasks, { 
              onConflict: 'user_id,the_date,type,skill_id',
              ignoreDuplicates: false 
            });
          }

          return new Response(JSON.stringify({
            the_date: todayStr,
            tasks: specialTasks,
            mode: 'TEST_WEEK',
            days_left: daysLeft,
            lessons_remaining: lessonsRemaining,
            lessons_per_day: lessonsPerDay
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    const { data: dueReviews } = await supabase
      .from('review_queue')
      .select('question_id, due_at')
      .eq('user_id', user.id)
      .lte('due_at', new Date().toISOString())
      .order('due_at', { ascending: true })
      .limit(10);

    const { data: latestDiagnostics } = await supabase
      .from('diagnostics')
      .select('section, score, source')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false });

    const diagnosticsBySection: { [key: string]: { score: number; source: string } } = {};
    latestDiagnostics?.forEach(d => {
      const current = diagnosticsBySection[d.section];
      if (!current || (d.source === 'diagnostic' && current.source === 'self')) {
        diagnosticsBySection[d.section] = { score: d.score || 0, source: d.source || 'diagnostic' };
      }
    });

    const { data: weakestSkills } = await supabase
      .from('progress')
      .select('skill_id, mastery_level, correct, seen')
      .eq('user_id', user.id)
      .gt('seen', 0)
      .order('mastery_level', { ascending: true })
      .limit(3);

    const combinedWeakSkills = weakestSkills || [];

    // Build priority task list
    const priorities: Task[] = [];

    // 1. REVIEW tasks (highest priority)
    dueReviews?.forEach((review, index) => {
      priorities.push({
        type: 'REVIEW',
        questionId: review.question_id,
        size: 1,
        estimatedMins: Math.round(2 * timeMultiplier),
        priority: mode.reviewWeight * 1000 + (100 - index)
      });
    });

    // 2. DRILL tasks (medium priority)
    combinedWeakSkills?.forEach((skill, index) => {
      priorities.push({
        type: 'DRILL',
        skillId: skill.skill_id,
        size: 5,
        estimatedMins: Math.round(8 * timeMultiplier),
        priority: mode.drillWeight * 1000 + (50 - index)
      });
    });

    // 3. LEARN tasks (time-adaptive, lesson-count aware)
    if (mode.allowLearn && lessonsPerDay > 0) {
      const baselineDiagnostics = Object.entries(diagnosticsBySection).map(([section, data]) => ({
        section,
        score: data.score
      }));

      const todaysLessons = selectLessonsForDay(
        lessonsPerDay,
        daysLeft,
        baselineDiagnostics,
        allSkills || [],
        completedSkillIds
      );

      todaysLessons.forEach((skillId, index) => {
        priorities.push({
          type: 'LEARN',
          skillId: skillId,
          size: 3,
          estimatedMins: Math.round(12 * timeMultiplier),
          priority: mode.learnWeight * 1000 + (25 - index)
        });
      });
    }

    // Sort by priority (higher numbers first)
    priorities.sort((a, b) => b.priority - a.priority);

    // Select tasks within time cap
    const selectedTasks = selectPlaylist(priorities, dailyTimeCap);

    console.warn(`Selected ${selectedTasks.length} tasks for ${dailyTimeCap} minutes`);

    // Save to database
    const tasksJson = selectedTasks.map(task => ({
      type: task.type,
      skill_id: task.skillId || null,
      question_id: task.questionId || null,
      size: task.size,
      estimated_mins: task.estimatedMins
    }));

    // Upsert study plan
    const { error: planError } = await supabase
      .from('study_plan_days')
      .upsert({
        user_id: user.id,
        the_date: todayStr,
        tasks_json: tasksJson,
        generated_at: new Date().toISOString()
      });

    if (planError) {
      console.error('Error saving study plan:', planError);
      return new Response(JSON.stringify({ error: 'Failed to save study plan' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Set has_study_plan flag to true in profiles
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ has_study_plan: true })
      .eq('id', user.id);

    if (profileUpdateError) {
      console.error('Error updating has_study_plan flag:', profileUpdateError);
    }

    // Create individual study tasks
    const studyTasks = selectedTasks.map(task => ({
      user_id: user.id,
      the_date: todayStr,
      type: task.type,
      skill_id: task.skillId || null,
      size: task.size,
      status: 'PENDING',
      reward_cents: task.type === 'REVIEW' ? 10 : task.type === 'DRILL' ? 15 : 20
    }));

    if (studyTasks.length > 0) {
      const { error: tasksError } = await supabase
        .from('study_tasks')
        .upsert(studyTasks, { 
          onConflict: 'user_id,the_date,type,skill_id',
          ignoreDuplicates: false 
        });

      if (tasksError) {
        console.error('Error saving study tasks:', tasksError);
      }
    }

    // Generate and save 7-day lesson schedule
    if (lessonsPerDay > 0 && daysLeft) {
      const scheduleEntries = [];
      const seenSkills = new Set<string>(completedSkillIds);

      for (let i = 0; i < Math.min(daysLeft, 30); i++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + i);
        const dateStr = targetDate.toISOString().split('T')[0];

        const baselineDiagnostics = Object.entries(diagnosticsBySection).map(([section, data]) => ({
          section,
          score: data.score
        }));

        const dailyLessons = selectLessonsForDay(
          lessonsPerDay,
          daysLeft - i,
          baselineDiagnostics,
          allSkills || [],
          seenSkills
        );

        dailyLessons.forEach((skillId, index) => {
          if (!seenSkills.has(skillId)) {
            seenSkills.add(skillId);
            scheduleEntries.push({
              user_id: user.id,
              the_date: dateStr,
              skill_id: skillId,
              priority: index,
              status: 'PENDING'
            });
          }
        });
      }

      if (scheduleEntries.length > 0) {
        const { error: scheduleError } = await supabase
          .from('lesson_schedule')
          .upsert(scheduleEntries, { onConflict: 'user_id,the_date,skill_id' });

        if (scheduleError) {
          console.error('Error saving lesson schedule:', scheduleError);
        } else {
          console.log(`📅 Saved ${scheduleEntries.length} lessons to schedule`);
        }
      }
    }

    const response = {
      the_date: todayStr,
      tasks: tasksJson,
      mode: mode.name,
      days_left: daysLeft,
      lessons_remaining: lessonsRemaining,
      lessons_per_day: lessonsPerDay
    };

    console.warn('Study plan generated successfully:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Error in generate-study-plan function:', msg);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

