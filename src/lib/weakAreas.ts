import { supabase } from '@/integrations/supabase/client';
import { getAllUserMastery } from './mastery';

export interface WeakArea {
  skill_id: string;
  skill_name: string;
  subject: string;
  accuracy: number;
  total_attempts: number;
  mastery_level: string;
  priority: 'critical' | 'high' | 'medium';
}

/**
 * Identify weak areas based on mastery data
 */
export async function getWeakAreas(userId: string, limit: number = 10): Promise<WeakArea[]> {
  // Get all mastery data
  const masteryMap = await getAllUserMastery(userId);
  
  if (masteryMap.size === 0) return [];

  // Fetch skill details
  const skillIds = Array.from(masteryMap.keys());
  const { data: skills } = await supabase
    .from('skills')
    .select('id, name, subject')
    .in('id', skillIds);

  if (!skills) return [];

  // Build weak areas list
  const weakAreas: WeakArea[] = [];

  skills.forEach((skill) => {
    const mastery = masteryMap.get(skill.id);
    if (!mastery) return;

    // Only include if attempted (total > 0) and not mastered
    if (mastery.total > 0 && mastery.accuracy < 90) {
      let priority: 'critical' | 'high' | 'medium' = 'medium';
      
      // Critical: < 60% accuracy
      if (mastery.accuracy < 60) {
        priority = 'critical';
      }
      // High: 60-74% accuracy
      else if (mastery.accuracy < 75) {
        priority = 'high';
      }
      // Medium: 75-89% accuracy
      else {
        priority = 'medium';
      }

      weakAreas.push({
        skill_id: skill.id,
        skill_name: skill.name,
        subject: skill.subject,
        accuracy: mastery.accuracy,
        total_attempts: mastery.total,
        mastery_level: mastery.level,
        priority,
      });
    }
  });

  // Sort by priority (critical first) then by accuracy (lowest first)
  weakAreas.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.accuracy - b.accuracy;
  });

  return weakAreas.slice(0, limit);
}

/**
 * Get weak area statistics for dashboard
 */
export async function getWeakAreaStats(userId: string) {
  const masteryMap = await getAllUserMastery(userId);
  
  let critical = 0;
  let high = 0;
  let medium = 0;

  masteryMap.forEach((mastery) => {
    if (mastery.total > 0 && mastery.accuracy < 90) {
      if (mastery.accuracy < 60) critical++;
      else if (mastery.accuracy < 75) high++;
      else medium++;
    }
  });

  return { critical, high, medium, total: critical + high + medium };
}

/**
 * Get priority color scheme
 */
export function getPriorityColor(priority: 'critical' | 'high' | 'medium'): {
  bg: string;
  text: string;
  border: string;
  badge: string;
} {
  switch (priority) {
    case 'critical':
      return {
        bg: 'bg-card border-l-4 border-l-coral',
        text: 'text-coral',
        border: 'border-white/[0.06]',
        badge: 'bg-coral/10 text-coral',
      };
    case 'high':
      return {
        bg: 'bg-card border-l-4 border-l-primary',
        text: 'text-primary',
        border: 'border-white/[0.06]',
        badge: 'bg-primary/10 text-primary',
      };
    case 'medium':
      return {
        bg: 'bg-card border-l-4 border-l-white/10',
        text: 'text-muted-foreground',
        border: 'border-white/[0.06]',
        badge: 'bg-secondary text-muted-foreground',
      };
  }
}

/**
 * Get priority label
 */
export function getPriorityLabel(priority: 'critical' | 'high' | 'medium'): string {
  switch (priority) {
    case 'critical': return 'Needs Focus';
    case 'high': return 'Practice More';
    case 'medium': return 'Almost There';
  }
}

/**
 * Calculate recommended study time for weak areas (in minutes)
 */
export function calculateRecommendedTime(
  priority: 'critical' | 'high' | 'medium',
  totalStudyMinutes: number
): number {
  // Allocate more time to critical areas
  switch (priority) {
    case 'critical': return Math.round(totalStudyMinutes * 0.5); // 50% of time
    case 'high': return Math.round(totalStudyMinutes * 0.3); // 30% of time
    case 'medium': return Math.round(totalStudyMinutes * 0.2); // 20% of time
  }
}
