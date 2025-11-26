import { supabase } from '@/integrations/supabase/client';
import type { PlanTaskJson } from '@/types/studyPlan';
import { logger } from '@/utils/logger';

export type StudyPlanTaskType = 'LEARN' | 'DRILL' | 'REVIEW' | 'SIM' | 'FLASH' | 'QUIZ';

interface SkillMeta {
  id: string;
  name: string;
  subject: string | null;
}

interface StudyPlanDayRow {
  the_date: string;
  tasks_json: PlanTaskJson[] | null;
}

export interface NormalizedStudyPlanTask {
  sequence: number;
  type: StudyPlanTaskType | string;
  size: number;
  title?: string;
  subject?: string | null;
  skillId?: string;
}

export interface NormalizedStudyPlanDay {
  date: string;
  tasks: NormalizedStudyPlanTask[];
}

const normalizeType = (type?: string): StudyPlanTaskType | string => {
  if (!type) return 'LEARN';
  return type.toUpperCase();
};

const normalizeTasks = (
  tasks: PlanTaskJson[] | null,
  skillsMap: Map<string, SkillMeta>
): NormalizedStudyPlanTask[] => {
  if (!Array.isArray(tasks)) {
    return [];
  }

  return tasks
    .map((task, index) => {
      const skillId = task.skill_id ?? undefined;
      const skillMeta = skillId ? skillsMap.get(skillId) : undefined;

      return {
        sequence: task.sequence ?? index,
        type: normalizeType(task.type),
        size: task.size ?? 0,
        title: task.title ?? skillMeta?.name,
        subject: skillMeta?.subject ?? undefined,
        skillId,
      };
    })
    .sort((a, b) => a.sequence - b.sequence);
};

const dedupeSkillIds = (rows: StudyPlanDayRow[]): string[] => {
  const ids = new Set<string>();
  rows.forEach((row) => {
    row.tasks_json?.forEach((task) => {
      if (task.skill_id) {
        ids.add(task.skill_id);
      }
    });
  });
  return Array.from(ids);
};

const fetchSkillMap = async (skillIds: string[]): Promise<Map<string, SkillMeta>> => {
  if (skillIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from('skills')
    .select('id, name, subject')
    .in('id', skillIds);

  if (error) {
    logger.error('Failed to load skills for study plan', { error });
    throw error;
  }

  const map = new Map<string, SkillMeta>();
  data?.forEach((skill) => {
    map.set(skill.id, skill);
  });
  return map;
};

export const fetchPlanDayRaw = async (userId: string, date: string): Promise<PlanTaskJson[]> => {
  const { data, error } = await supabase
    .from('study_plan_days')
    .select('tasks_json')
    .eq('user_id', userId)
    .eq('the_date', date)
    .maybeSingle();

  if (error) {
    if (error.code === 'PGRST116') {
      logger.debug('No study plan day found', { userId, date });
      return [];
    }
    logger.error('Failed to fetch study plan day', { userId, date, error });
    throw error;
  }

  if (!data?.tasks_json || !Array.isArray(data.tasks_json)) {
    return [];
  }

  return data.tasks_json as PlanTaskJson[];
};

export const fetchPlanRangeRaw = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<StudyPlanDayRow[]> => {
  const { data, error } = await supabase
    .from('study_plan_days')
    .select('the_date, tasks_json')
    .eq('user_id', userId)
    .gte('the_date', startDate)
    .lte('the_date', endDate)
    .order('the_date');

  if (error) {
    logger.error('Failed to fetch study plan range', { userId, startDate, endDate, error });
    throw error;
  }

  return data ?? [];
};

export const fetchNormalizedPlanDay = async (
  userId: string,
  date: string
): Promise<NormalizedStudyPlanTask[]> => {
  const rows = await fetchPlanRangeRaw(userId, date, date);
  if (rows.length === 0) {
    return [];
  }

  const [row] = rows;
  const skillsMap = await fetchSkillMap(dedupeSkillIds(rows));
  return normalizeTasks(row.tasks_json, skillsMap);
};

export const fetchNormalizedPlanRange = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<NormalizedStudyPlanDay[]> => {
  const rows = await fetchPlanRangeRaw(userId, startDate, endDate);
  if (rows.length === 0) {
    return [];
  }

  const skillsMap = await fetchSkillMap(dedupeSkillIds(rows));
  return rows.map((row) => ({
    date: row.the_date,
    tasks: normalizeTasks(row.tasks_json, skillsMap),
  }));
};

export const regeneratePlan = async (force = true): Promise<void> => {
  logger.info('Triggering study plan regeneration', { force });
  const { error } = await supabase.functions.invoke('generate-study-plan', {
    body: { force },
  });

  if (error) {
    logger.error('Study plan regeneration failed', { error });
    throw error;
  }
};
