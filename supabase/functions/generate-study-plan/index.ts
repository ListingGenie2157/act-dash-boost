import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimit, getClientIp, createRateLimitResponse } from '../_shared/rateLimit.ts';
import { parseBodyWithLimit } from '../_shared/mod.ts';
import {
  buildPlan,
  classifyAnswer,
  worstBucket,
  SECTION_TARGET_MS,
  type FormPrefix,
  type LessonInfo,
  type PlannedTask,
  type PlannerInput,
  type Section,
  type SkillBucket,
  type SkillStats,
} from '../_shared/planner.ts';

/**
 * Personalized study plan (see docs/superpowers/specs/2026-11-19-study-plan-generator-design.md).
 * Loads the student's data, asks the pure planner for the next 7 days, and writes them
 * without touching finished tasks. Called by the wizard/dashboard (user JWT) and the nightly cron
 * (service role + userId).
 */

const SECTIONS: Section[] = ['English', 'Math', 'Reading', 'Science'];
const LETTERS = ['A', 'B', 'C', 'D'];
const DONE_STATUSES = ['DONE', 'COMPLETED'];
const BUCKET_WINDOW = 4; // most recent timed answers per skill
const FORM_LABEL: Record<string, string> = { FA: 'Form A', FB: 'Form B', FC: 'Form C' };
const REWARD_CENTS: Record<string, number> = { LEARN: 20, DRILL: 15, REVIEW: 10, SIM: 50, WARMUP: 10 };

function todayInChicago(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
  return parts; // en-CA formats as YYYY-MM-DD
}

const json = (body: unknown, cors: Record<string, string>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

/** Fetch every row of a query in pages (PostgREST caps responses at 1000 rows). */
async function fetchAll<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await page(from, from + 999);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < 1000) return out;
  }
}

async function loadPlannerInput(db: SupabaseClient, userId: string, today: string) {
  const [
    profileRes, prefsRes, accomRes, diagRes, skillsRes, lessonsRes, masteryRes, learnDoneRes, reviewRes,
  ] = await Promise.all([
    db.from('profiles').select('test_date, target_score, daily_time_cap_mins, science_required, sim_preferred_dow').eq('id', userId).maybeSingle(),
    db.from('user_preferences').select('daily_minutes').eq('user_id', userId).maybeSingle(),
    db.from('accommodations').select('time_multiplier').eq('user_id', userId).maybeSingle(),
    db.from('diagnostics').select('section, score, source, completed_at').eq('user_id', userId).not('completed_at', 'is', null).order('completed_at', { ascending: false }),
    db.from('skills').select('id, name, subject, order_index'),
    db.from('lesson_content').select('skill_code'),
    db.from('mastery').select('skill_id, correct, total').eq('user_id', userId),
    db.from('study_tasks').select('skill_id').eq('user_id', userId).eq('type', 'LEARN').in('status', DONE_STATUSES),
    db.from('review_queue').select('question_id', { count: 'exact', head: true }).eq('user_id', userId).lte('due_at', new Date().toISOString()),
  ]);
  if (profileRes.error) throw profileRes.error;

  const profile = profileRes.data;
  const timeMultiplier = Number(accomRes.data?.time_multiplier) || 1;

  // Skills / lessons
  const skills = new Map((skillsRes.data ?? []).map((s: { id: string; name: string; subject: string; order_index: number }) => [s.id, s]));
  const sectionOfSkill = (code: string): Section | null => {
    const subject = skills.get(code)?.subject as Section | undefined;
    return subject && SECTIONS.includes(subject) ? subject : null;
  };

  // Bank question counts per skill and question counts per locked form
  const items = await fetchAll<{ skill_code: string | null; form_id: string | null }>((from, to) =>
    db.from('staging_items').select('skill_code, form_id').or('form_id.like.DR_*,form_id.like.FA_*,form_id.like.FB_*,form_id.like.FC_*').range(from, to));
  const bankCount: Record<string, number> = {};
  const formQuestionCounts: Record<FormPrefix, number> = { FA: 0, FB: 0, FC: 0 };
  for (const it of items) {
    const prefix = (it.form_id ?? '').slice(0, 2);
    if (prefix === 'DR' && it.skill_code) bankCount[it.skill_code] = (bankCount[it.skill_code] ?? 0) + 1;
    if (prefix === 'FA' || prefix === 'FB' || prefix === 'FC') formQuestionCounts[prefix]++;
  }

  const lessons: LessonInfo[] = [];
  for (const row of lessonsRes.data ?? []) {
    const code = (row as { skill_code: string }).skill_code;
    const section = sectionOfSkill(code);
    if (!section) continue;
    lessons.push({ skillId: code, section, orderIndex: skills.get(code)?.order_index ?? 999, bankQuestions: bankCount[code] ?? 0 });
  }

  // Section estimates: the most recent score per section wins (rows are newest first), whether the
  // student reported it or a diagnostic measured it — an old diagnostic never overrides a newer report
  const sectionEstimates: PlannerInput['sectionEstimates'] = {};
  for (const d of (diagRes.data ?? []) as Array<{ section: string; score: number | null; source: string | null }>) {
    const section = d.section as Section;
    if (!SECTIONS.includes(section) || d.score === null || sectionEstimates[section]) continue;
    sectionEstimates[section] = { score: Number(d.score), source: d.source === 'self' ? 'self' : 'diagnostic' };
  }

  const mastery: Record<string, SkillStats> = {};
  for (const m of (masteryRes.data ?? []) as Array<{ skill_id: string; correct: number; total: number }>) {
    mastery[m.skill_id] = { correct: m.correct, total: m.total };
  }

  // Attempts: diagnostic accuracy per skill + timed-answer buckets. Correctness is checked against the
  // answer key (diagnostic attempts store a placeholder correct_idx).
  const attempts = await fetchAll<{ question_id: number; form_id: string; choice_order: number[]; selected_idx: number | null; time_ms: number | null; created_at: string }>((from, to) =>
    db.from('attempts').select('question_id, form_id, choice_order, selected_idx, time_ms, created_at')
      .eq('user_id', userId).order('created_at', { ascending: false }).range(from, to));
  const relevant = attempts.filter(a => a.time_ms !== null || /^(D2|ONB)/.test(a.form_id));
  const ids = [...new Set(relevant.map(a => a.question_id))];
  const keyById = new Map<number, { answer: string; skill: string | null }>();
  for (let i = 0; i < ids.length; i += 500) {
    const { data, error } = await db.from('staging_items').select('staging_id, answer, skill_code').in('staging_id', ids.slice(i, i + 500));
    if (error) throw error;
    for (const r of data ?? []) keyById.set(r.staging_id, { answer: (r.answer ?? '').trim().toUpperCase(), skill: r.skill_code });
  }

  const diagnosticSkillStats: Record<string, SkillStats> = {};
  const timedBySkill: Record<string, SkillBucket[]> = {};
  for (const a of relevant) {
    const key = keyById.get(a.question_id);
    if (!key?.skill) continue;
    const isDiagnostic = /^(D2|ONB)/.test(a.form_id);
    const originalIdx = a.selected_idx === null ? null
      : isDiagnostic ? (a.choice_order?.[a.selected_idx] ?? a.selected_idx) : a.selected_idx;
    const correct = originalIdx === null ? null : LETTERS[originalIdx] === key.answer;

    if (isDiagnostic && correct !== null) {
      const s = (diagnosticSkillStats[key.skill] ??= { correct: 0, total: 0 });
      s.total++;
      if (correct) s.correct++;
    }
    if (a.time_ms !== null) {
      const list = (timedBySkill[key.skill] ??= []);
      const section = sectionOfSkill(key.skill);
      if (section && list.length < BUCKET_WINDOW) {
        list.push(classifyAnswer({ correct, timeMs: a.time_ms, targetMs: SECTION_TARGET_MS[section] * timeMultiplier }));
      }
    }
  }
  const skillBuckets: Record<string, SkillBucket> = {};
  for (const [skill, list] of Object.entries(timedBySkill)) {
    const worst = worstBucket(list);
    if (worst) skillBuckets[skill] = worst;
  }

  const input: PlannerInput = {
    today,
    testDate: profile?.test_date ?? null,
    targetScore: profile?.target_score ?? null,
    dailyMinutes: prefsRes.data?.daily_minutes || profile?.daily_time_cap_mins || 30,
    timeMultiplier,
    scienceRequired: profile?.science_required !== false,
    simPreferredDow: typeof profile?.sim_preferred_dow === 'number' ? profile.sim_preferred_dow : null,
    sectionEstimates,
    lessons,
    completedSkillIds: (learnDoneRes.data ?? []).map((t: { skill_id: string | null }) => t.skill_id).filter((x): x is string => !!x),
    mastery,
    diagnosticSkillStats,
    skillBuckets,
    dueReviewCount: reviewRes.count ?? 0,
    formQuestionCounts,
  };
  return { input, skillNames: new Map([...skills].map(([id, s]) => [id, s.name])) };
}

function taskTitle(task: PlannedTask, names: Map<string, string>): string {
  const name = task.skillId ? names.get(task.skillId) ?? task.skillId : '';
  switch (task.type) {
    case 'LEARN': return `Learn: ${name}`;
    case 'DRILL': return `Practice: ${name}`;
    case 'REVIEW': return `Review ${task.size} missed question${task.size === 1 ? '' : 's'}`;
    case 'SIM': return `Practice Test – ${FORM_LABEL[task.skillId ?? ''] ?? 'Full ACT'}`;
    case 'WARMUP': return 'Test-day warm-up';
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, corsHeaders, 405);

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, corsHeaders, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !anonKey || !serviceKey) throw new Error('Missing Supabase environment variables');

    const parsed = await parseBodyWithLimit(req, corsHeaders);
    if ('error' in parsed) return parsed.error;
    const body = (parsed.data ?? {}) as Record<string, unknown>;
    const force = body.force === true;

    // Cron (service role + userId) or a signed-in student
    const token = authHeader.replace('Bearer ', '');
    let userId: string;
    if (token === serviceKey && typeof body.userId === 'string') {
      userId = body.userId;
    } else {
      const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
      const { data: { user }, error } = await userClient.auth.getUser(token);
      if (error || !user) return json({ error: 'Unauthorized' }, corsHeaders, 401);
      userId = user.id;
    }

    const allowed = await checkRateLimit(userId, getClientIp(req), 'generate-study-plan', 10, 60000);
    if (!allowed) return createRateLimitResponse(corsHeaders);

    // All reads/writes below are explicitly scoped to userId
    const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const today = todayInChicago();

    // Already planned today (and not forced): return the existing plan
    if (!force) {
      const { data: profile } = await db.from('profiles').select('plan_summary, plan_summary_at').eq('id', userId).maybeSingle();
      const plannedAt = profile?.plan_summary_at ? new Date(profile.plan_summary_at) : null;
      if (plannedAt && new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(plannedAt) === today) {
        const { data: days } = await db.from('study_plan_days').select('the_date, tasks_json')
          .eq('user_id', userId).gte('the_date', today).order('the_date');
        return json({ days: (days ?? []).map(d => ({ the_date: d.the_date, tasks: d.tasks_json ?? [] })), summary: profile?.plan_summary ?? null }, corsHeaders);
      }
    }

    const { input, skillNames } = await loadPlannerInput(db, userId, today);
    const { days, summary } = buildPlan(input);

    // Finished work stays as is; only pending future tasks are replaced
    const lastDate = days.length ? days[days.length - 1].date : today;
    const { data: finished } = await db.from('study_tasks').select('the_date, type, skill_id, form_id')
      .eq('user_id', userId).gte('the_date', today).not('status', 'in', '("PENDING","STARTED")');
    const finishedKeys = new Set((finished ?? []).map(t => `${t.the_date}|${t.type}|${t.skill_id ?? ''}|${t.form_id ?? ''}`));

    const delTasks = await db.from('study_tasks').delete()
      .eq('user_id', userId).in('status', ['PENDING', 'STARTED']).gte('the_date', today);
    if (delTasks.error) throw delTasks.error;
    const delDays = await db.from('study_plan_days').delete().eq('user_id', userId).gte('the_date', today);
    if (delDays.error) throw delDays.error;

    const planRows = days.map(day => ({
      user_id: userId,
      the_date: day.date,
      generated_at: new Date().toISOString(),
      tasks_json: day.tasks.map((t, i) => ({
        sequence: i + 1,
        type: t.type,
        skill_id: t.type === 'SIM' ? null : t.skillId,
        form_id: t.type === 'SIM' ? t.skillId : null,
        size: t.size,
        estimated_mins: t.minutes,
        title: taskTitle(t, skillNames),
      })),
    }));
    if (planRows.length) {
      const { error } = await db.from('study_plan_days').insert(planRows);
      if (error) throw error;
    }

    const taskRows = days.flatMap(day => day.tasks.map(t => ({
      user_id: userId,
      the_date: day.date,
      type: t.type,
      skill_id: t.type === 'SIM' ? null : t.skillId,
      form_id: t.type === 'SIM' ? t.skillId : null,
      size: t.size,
      status: 'PENDING',
      reward_cents: REWARD_CENTS[t.type],
      phase: 0,
      time_limit_seconds: t.minutes * 60,
      is_critical: t.type === 'DRILL' || t.type === 'SIM',
    }))).filter(t => !finishedKeys.has(`${t.the_date}|${t.type}|${t.skill_id ?? ''}|${t.form_id ?? ''}`));
    if (taskRows.length) {
      const { error } = await db.from('study_tasks')
        .upsert(taskRows, { onConflict: 'user_id,the_date,type,skill_id', ignoreDuplicates: true });
      if (error) throw error;
    }

    const summaryRow = {
      lessons_remaining: summary.lessonsRemaining,
      days_until_test: summary.daysUntilTest,
      lessons_per_day: summary.lessonsPerDay,
      lessons_that_fit: summary.lessonsThatFit,
      lessons_left_out: summary.lessonsLeftOut,
      extra_minutes_per_day: summary.extraMinutesPerDay,
      next_exam: summary.nextExam,
      daily_minutes: input.dailyMinutes,
      plan_through: lastDate,
    };
    await db.from('profiles').update({ plan_summary: summaryRow, plan_summary_at: new Date().toISOString(), has_study_plan: true }).eq('id', userId);

    return json({ days: planRows.map(r => ({ the_date: r.the_date, tasks: r.tasks_json })), summary: summaryRow }, corsHeaders);
  } catch (err: unknown) {
    console.error('generate-study-plan error:', err instanceof Error ? err.message : String(err));
    return json({ error: 'Internal server error' }, corsHeaders, 500);
  }
});
