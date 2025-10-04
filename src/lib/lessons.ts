import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type StagingItem = Database['public']['Tables']['staging_items']['Row'];

export interface EnhancedLesson {
  skill_code: string;
  skill_name: string;
  subject: string;
  section: string;
  topic: string | null;
  
  // Lesson content
  overview: string;
  examples: StagingItem[];
  practiceQuestions: StagingItem[];
  totalQuestions: number;
  
  // Metadata
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedMinutes: number;
}

/**
 * Get enhanced lesson with questions from staging_items
 */
export async function getEnhancedLesson(skillCode: string): Promise<{
  data: EnhancedLesson | null;
  error: Error | null;
}> {
  try {
    // Get skill info
    const { data: skill, error: skillError } = await supabase
      .from('skills')
      .select('id, name, description, subject, cluster')
      .eq('id', skillCode)
      .maybeSingle();

    if (skillError || !skill) {
      return { data: null, error: skillError || new Error('Skill not found') };
    }

    // Get questions from staging_items for this skill
    const { data: items, error: itemsError } = await supabase
      .from('staging_items')
      .select('*')
      .eq('skill_code', skillCode)
      .order('ord', { ascending: true });

    if (itemsError) {
      return { data: null, error: itemsError };
    }

    const questions = items || [];
    
    // Determine section from first question
    const section = questions[0]?.section || 'MATH';
    const topic = questions[0]?.topic || skill.name;

    // Split into examples (first 2-3) and practice (rest)
    const exampleCount = Math.min(3, Math.floor(questions.length * 0.3));
    const examples = questions.slice(0, exampleCount);
    const practiceQuestions = questions.slice(exampleCount);

    // Calculate difficulty based on question difficulty distribution
    const difficulties = questions.map(q => q.difficulty.toLowerCase());
    const avgDifficulty = difficulties.includes('hard') ? 'hard' 
      : difficulties.includes('medium') ? 'medium' 
      : 'easy';

    // Estimate time: 2 min per question
    const estimatedMinutes = Math.ceil(questions.length * 2);

    // Create enhanced overview from skill description + question analysis
    const overview = skill.description || createOverviewFromQuestions(questions, skill.name);

    const lesson: EnhancedLesson = {
      skill_code: skillCode,
      skill_name: skill.name,
      subject: skill.subject,
      section,
      topic,
      overview,
      examples,
      practiceQuestions,
      totalQuestions: questions.length,
      difficulty: avgDifficulty,
      estimatedMinutes,
    };

    return { data: lesson, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Failed to fetch lesson') 
    };
  }
}

/**
 * Create a basic overview from question content
 */
function createOverviewFromQuestions(questions: StagingItem[], skillName: string): string {
  if (questions.length === 0) {
    return `This lesson covers ${skillName}. Complete the practice questions to build mastery.`;
  }

  const topic = questions[0].topic || skillName;
  const hasPassages = questions.some(q => q.passage_text);
  
  let overview = `<h2>${skillName}</h2>\n\n`;
  overview += `<p>This lesson focuses on <strong>${topic}</strong>.</p>\n\n`;
  
  if (hasPassages) {
    overview += `<p>You'll work with reading passages and answer comprehension questions.</p>\n\n`;
  }
  
  overview += `<h3>What You'll Learn:</h3>\n`;
  overview += `<ul>\n`;
  overview += `  <li>Master ${skillName.toLowerCase()} concepts</li>\n`;
  overview += `  <li>Practice with ${questions.length} questions</li>\n`;
  overview += `  <li>Build confidence through repetition</li>\n`;
  overview += `</ul>\n\n`;
  
  overview += `<h3>Study Tips:</h3>\n`;
  overview += `<ul>\n`;
  overview += `  <li>Read each question carefully</li>\n`;
  overview += `  <li>Review explanations for any you get wrong</li>\n`;
  overview += `  <li>Try to understand the concept, not just memorize</li>\n`;
  overview += `</ul>\n`;
  
  return overview;
}

/**
 * Get all available lessons (grouped from staging_items)
 */
export async function getAllLessons(): Promise<{
  data: Array<{
    skill_code: string;
    skill_name: string;
    subject: string;
    section: string;
    questionCount: number;
  }>;
  error: Error | null;
}> {
  try {
    // Get all skills that have content in staging_items
    const { data: items, error: itemsError } = await supabase
      .from('staging_items')
      .select('skill_code, section');

    if (itemsError) {
      return { data: [], error: itemsError };
    }

    // Group by skill_code and count questions
    const skillMap = new Map<string, { section: string; count: number }>();
    
    (items || []).forEach(item => {
      const current = skillMap.get(item.skill_code);
      if (current) {
        current.count++;
      } else {
        skillMap.set(item.skill_code, { section: item.section, count: 1 });
      }
    });

    // Get skill details
    const skillCodes = Array.from(skillMap.keys());
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('id, name, subject')
      .in('id', skillCodes)
      .order('order_index', { ascending: true });

    if (skillsError) {
      return { data: [], error: skillsError };
    }

    const lessons = (skills || []).map(skill => {
      const meta = skillMap.get(skill.id)!;
      return {
        skill_code: skill.id,
        skill_name: skill.name,
        subject: skill.subject,
        section: meta.section,
        questionCount: meta.count,
      };
    });

    return { data: lessons, error: null };
  } catch (error) {
    return { 
      data: [], 
      error: error instanceof Error ? error : new Error('Failed to fetch lessons') 
    };
  }
}
