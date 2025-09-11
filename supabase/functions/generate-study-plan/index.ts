import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      allowLearn: false, // Only allow LEARN for prerequisites
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
function getTestWeekTasks(daysLeft: number, userId: string, dateStr: string): any[] {
  const tasks: any[] = [];
  
  if (daysLeft === 7 || daysLeft === 5 || daysLeft === 3) {
    // T-7, T-5, T-3: English SIM
    tasks.push({
      type: 'SIM',
      section: 'english',
      size: 75,
      estimated_mins: 45
    });
  } else if (daysLeft === 2) {
    // T-2: Only REVIEW tasks
    tasks.push({
      type: 'REVIEW',
      size: 10,
      estimated_mins: 20
    });
  } else if (daysLeft === 1) {
    // T-1: 15-minute warmup
    tasks.push({
      type: 'WARMUP',
      size: 5,
      estimated_mins: 15
    });
  }
  
  return tasks;
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
      console.log('No authorization header provided');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.log('Authentication failed:', authError?.message);
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
      console.log('Plan already exists for today');
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

    const testDate = profile?.test_date ? new Date(profile.test_date + 'T00:00:00') : null;
    const daysLeft = calculateDaysLeft(today, testDate);
    const dailyTimeCap = profile?.daily_time_cap_mins || 30;
    const mode = getStudyMode(daysLeft);

    console.log(`Study mode: ${mode.name}, Days left: ${daysLeft}, Time cap: ${dailyTimeCap}mins`);

    // Check for test week special scheduling
    if (daysLeft !== null && daysLeft <= 7) {
      const specialTasks = getTestWeekTasks(daysLeft, user.id, todayStr);
      if (specialTasks.length > 0) {
        // Save special test week plan
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
          // Create study tasks for special schedule
          const studyTasks = specialTasks.map((task: any) => ({
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
            days_left: daysLeft
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // Get due reviews
    const { data: dueReviews } = await supabase
      .from('review_queue')
      .select('question_id, due_at')
      .eq('user_id', user.id)
      .lte('due_at', new Date().toISOString())
      .order('due_at', { ascending: true })
      .limit(10);

    // Get weakest skills (lowest mastery level with some activity)
    const { data: weakestSkills } = await supabase
      .from('progress')
      .select('skill_id, mastery_level, correct, seen')
      .eq('user_id', user.id)
      .gt('seen', 0)
      .order('mastery_level', { ascending: true })
      .limit(3);

    // Get skills for learning (no progress yet, prerequisites met)
    const { data: userProgress } = await supabase
      .from('progress')
      .select('skill_id')
      .eq('user_id', user.id);

    const learnedSkillIds = new Set(userProgress?.map(p => p.skill_id) || []);

    const { data: availableSkills } = await supabase
      .from('skills')
      .select('id, prereq_skill_ids, name')
      .order('order_index', { ascending: true });

    const learnableSkills = availableSkills?.filter(skill => {
      if (learnedSkillIds.has(skill.id)) return false;
      if (!skill.prereq_skill_ids || skill.prereq_skill_ids.length === 0) return true;
      return skill.prereq_skill_ids.every(prereqId => learnedSkillIds.has(prereqId));
    }) || [];

    // Build priority task list
    const priorities: Task[] = [];

    // 1. REVIEW tasks (highest priority)
    dueReviews?.forEach((review, index) => {
      priorities.push({
        type: 'REVIEW',
        questionId: review.question_id,
        size: 1,
        estimatedMins: 2, // Estimated 2 mins per review question
        priority: mode.reviewWeight * 1000 + (100 - index) // Higher priority for earlier due dates
      });
    });

    // 2. DRILL tasks (medium priority)
    weakestSkills?.forEach((skill, index) => {
      priorities.push({
        type: 'DRILL',
        skillId: skill.skill_id,
        size: 5, // 5 questions per drill
        estimatedMins: 8, // Estimated 8 mins for 5 questions
        priority: mode.drillWeight * 1000 + (50 - index)
      });
    });

    // 3. LEARN tasks (lowest priority, mode-dependent)
    if (mode.allowLearn || mode.name === 'CRASH') {
      learnableSkills.slice(0, 2).forEach((skill, index) => {
        const isPrerequisite = mode.name === 'CRASH'; // In CRASH mode, only include if prerequisite
        if (mode.name !== 'CRASH' || isPrerequisite) {
          priorities.push({
            type: 'LEARN',
            skillId: skill.id,
            size: 3, // 3 questions to learn
            estimatedMins: 12, // Estimated 12 mins for learning
            priority: mode.learnWeight * 1000 + (25 - index)
          });
        }
      });
    }

    // Sort by priority (higher numbers first)
    priorities.sort((a, b) => b.priority - a.priority);

    // Select tasks within time cap
    const selectedTasks = selectPlaylist(priorities, dailyTimeCap);

    console.log(`Selected ${selectedTasks.length} tasks for ${dailyTimeCap} minutes`);

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

    const response = {
      the_date: todayStr,
      tasks: tasksJson,
      mode: mode.name,
      days_left: daysLeft
    };

    console.log('Study plan generated successfully:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-study-plan function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});