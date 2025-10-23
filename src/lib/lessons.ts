import { supabase } from '@/integrations/supabase/client';

export interface CheckpointQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ParsedRule {
  number: number;
  title: string;
  content: string;
}

export interface ParsedExample {
  number: number;
  content: string;
}

export interface ParsedIndependentQuestion {
  number: number;
  question: string;
  answer?: string;
}

export interface EnhancedLesson {
  skill_code: string;
  skill_name: string;
  subject: string;
  section: string;
  topic: string | null;
  
  // Rich content from lesson_content table
  overview: string;
  objectives?: string[] | null;
  concept_explanation?: string | null;
  guided_practice?: string | null;
  error_analysis?: string | null;
  common_traps?: string | null;
  independent_practice?: string | null;
  independent_practice_answers?: string | null;
  checkpoint_quiz_questions?: CheckpointQuestion[];
  recap?: string | null;
  
  // Metadata
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedMinutes: number;
}

/**
 * Get enhanced lesson from lesson_content table only
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

    // Get rich lesson content
    const { data: richContent, error: contentError } = await supabase
      .from('lesson_content')
      .select('*')
      .eq('skill_code', skillCode)
      .maybeSingle();

    if (contentError || !richContent) {
      return { data: null, error: contentError || new Error('Lesson content not found') };
    }

    const lesson: EnhancedLesson = {
      skill_code: skillCode,
      skill_name: skill.name,
      subject: skill.subject,
      section: skill.subject, // Use subject as section
      topic: skill.name,
      
      // Rich content from lesson_content table
      overview: richContent.overview_html || `<p>This lesson covers ${skill.name}.</p>`,
      objectives: richContent.objectives || null,
      concept_explanation: richContent.concept_explanation || null,
      guided_practice: richContent.guided_practice || null,
      error_analysis: richContent.error_analysis || null,
      common_traps: richContent.common_traps || null,
      independent_practice: richContent.independent_practice || null,
      independent_practice_answers: richContent.independent_practice_answers || null,
      checkpoint_quiz_questions: (richContent.checkpoint_quiz_questions as unknown as CheckpointQuestion[]) || [],
      recap: richContent.recap || null,
      
      // Metadata
      difficulty: (richContent.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
      estimatedMinutes: richContent.estimated_minutes || 15,
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
 * Parse concept explanation into individual rule cards
 */
export function parseConceptRules(html: string): ParsedRule[] {
  if (!html) return [];
  
  const rules: ParsedRule[] = [];
  // Split by "Rule X –" or "Rule X-" pattern
  const sections = html.split(/Rule\s+(\d+)\s*[–-]\s*/i);
  
  // Pattern creates [intro, num1, content1, num2, content2...]
  for (let i = 1; i < sections.length; i += 2) {
    const ruleNum = parseInt(sections[i]);
    const content = sections[i + 1]?.trim();
    if (content) {
      rules.push({
        number: ruleNum,
        title: `Rule ${ruleNum}`,
        content: content,
      });
    }
  }
  
  return rules;
}

/**
 * Parse guided practice into individual example cards
 */
export function parseGuidedPractice(html: string): ParsedExample[] {
  if (!html) return [];
  
  const examples: ParsedExample[] = [];
  // Split by "Example X:" pattern
  const sections = html.split(/Example\s+(\d+):\s*/i);
  
  // Pattern creates [intro, num1, content1, num2, content2...]
  for (let i = 1; i < sections.length; i += 2) {
    const exampleNum = parseInt(sections[i]);
    const content = sections[i + 1]?.trim();
    if (content) {
      examples.push({
        number: exampleNum,
        content: content,
      });
    }
  }
  
  return examples;
}

/**
 * Parse common traps into an array of trap descriptions
 */
export function parseCommonTraps(html: string): string[] {
  if (!html) return [];
  
  const traps: string[] = [];
  // Split by "X –" or "X-" where X is a number
  const sections = html.split(/(\d+)\s*[–-]\s*/);
  
  // Pattern creates [intro, num1, content1, num2, content2...]
  for (let i = 2; i < sections.length; i += 2) {
    const text = sections[i]?.trim();
    if (text) {
      traps.push(text);
    }
  }
  
  return traps;
}

/**
 * Parse independent practice into questions with answers
 */
export function parseIndependentPractice(
  practiceHtml: string, 
  answersHtml: string | null
): ParsedIndependentQuestion[] {
  if (!practiceHtml) return [];
  
  const questions: ParsedIndependentQuestion[] = [];
  
  // Split by "X. " pattern to handle single-line format: "1. Question. 2. Another question."
  const parts = practiceHtml.split(/(\d+)\.\s+/);
  
  // Pattern creates [intro, num1, question1, num2, question2...]
  for (let i = 1; i < parts.length; i += 2) {
    const number = parseInt(parts[i]);
    const text = parts[i + 1]?.trim();
    if (text) {
      questions.push({
        number,
        question: text,
      });
    }
  }
  
  // Parse answers if available
  // Format can be: "1 answer; 2 answer; 3 answer" or "1. answer\n2. answer"
  if (answersHtml) {
    // Try semicolon-separated format first
    const semicolonPattern = /(\d+)\s+([^;]+)/g;
    let match;
    let foundAny = false;
    while ((match = semicolonPattern.exec(answersHtml)) !== null) {
      const questionNum = parseInt(match[1]);
      const question = questions.find(q => q.number === questionNum);
      if (question) {
        question.answer = match[2].trim();
        foundAny = true;
      }
    }
    
    // If no semicolon format, try numbered newline format
    if (!foundAny) {
      const answerPattern = /(?:^|\n)\s*(\d+)\.\s*([^\n]+)/g;
      while ((match = answerPattern.exec(answersHtml)) !== null) {
        const questionNum = parseInt(match[1]);
        const question = questions.find(q => q.number === questionNum);
        if (question) {
          question.answer = match[2].trim();
        }
      }
    }
  }
  
  return questions;
}

/**
 * Get all available lessons (from both lesson_content and staging_items)
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
    // Get all lessons from lesson_content
    const { data: lessonContent, error: contentError } = await supabase
      .from('lesson_content')
      .select('skill_code');

    if (contentError) {
      console.error('Error fetching lesson_content:', contentError);
    }

    // Get all skills that have content in staging_items
    const { data: items, error: itemsError } = await supabase
      .from('staging_items')
      .select('skill_code, section');

    if (itemsError) {
      console.error('Error fetching staging_items:', itemsError);
    }

    // Group by skill_code and count questions from staging_items
    const skillMap = new Map<string, { section: string; count: number }>();
    
    (items || []).forEach(item => {
      const current = skillMap.get(item.skill_code);
      if (current) {
        current.count++;
      } else {
        skillMap.set(item.skill_code, { section: item.section, count: 1 });
      }
    });

    // Add lesson_content skill codes (with 0 questions if not in staging_items)
    (lessonContent || []).forEach(lesson => {
      if (!skillMap.has(lesson.skill_code)) {
        skillMap.set(lesson.skill_code, { section: 'English', count: 0 });
      }
    });

    // Get skill details for all unique skill codes
    const skillCodes = Array.from(skillMap.keys());
    
    if (skillCodes.length === 0) {
      return { data: [], error: null };
    }

    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('id, name, subject, cluster')
      .in('id', skillCodes)
      .order('order_index', { ascending: true });

    if (skillsError) {
      return { data: [], error: skillsError };
    }

    const lessons = (skills || []).map(skill => {
      const meta = skillMap.get(skill.id)!;
      // Derive section from subject if not available
      const section = meta.section || skill.subject;
      
      return {
        skill_code: skill.id,
        skill_name: skill.name,
        subject: skill.subject,
        section,
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
