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
  
  // Try multiple parsing strategies
  const strategies = [
    // Strategy 1: "Rule X –" or "Rule X:" pattern
    () => {
      const sections = html.split(/Rule\s+(\d+)\s*[–:-]\s*/i);
      const tempRules: ParsedRule[] = [];
      for (let i = 1; i < sections.length; i += 2) {
        const ruleNum = parseInt(sections[i]);
        const content = sections[i + 1]?.trim();
        if (content && content.length > 10) {
          // Extract title from first line if present
          const lines = content.split(/\n/);
          const firstLine = lines[0].replace(/<[^>]+>/g, '').trim();
          const title = firstLine.length < 100 ? firstLine : `Rule ${ruleNum}`;
          tempRules.push({ number: ruleNum, title, content });
        }
      }
      return tempRules;
    },
    
    // Strategy 2: Numbered list "1. Title\nContent"
    () => {
      const pattern = /(\d+)\.\s+([A-Z][^\n]{10,100})\n([\s\S]+?)(?=\d+\.|$)/g;
      const tempRules: ParsedRule[] = [];
      let match;
      while ((match = pattern.exec(html)) !== null) {
        tempRules.push({
          number: parseInt(match[1]),
          title: match[2].trim(),
          content: match[3].trim(),
        });
      }
      return tempRules;
    },
    
    // Strategy 3: Headers <h3>Rule X</h3> or <strong>Rule X</strong>
    () => {
      const pattern = /<(?:h\d|strong)[^>]*>\s*Rule\s+(\d+)[^<]*<\/(?:h\d|strong)>([\s\S]+?)(?=<(?:h\d|strong)[^>]*>Rule\s+\d+|$)/gi;
      const tempRules: ParsedRule[] = [];
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const content = match[2].trim();
        if (content.length > 10) {
          tempRules.push({
            number: parseInt(match[1]),
            title: `Rule ${match[1]}`,
            content,
          });
        }
      }
      return tempRules;
    }
  ];
  
  // Try each strategy until one returns results
  for (const strategy of strategies) {
    const result = strategy();
    if (result.length > 0) {
      rules.push(...result);
      break;
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
  
  // Try multiple question parsing strategies
  const questionStrategies = [
    // Strategy 1: "X. " numbered format
    () => {
      const parts = practiceHtml.split(/(\d+)\.\s+/);
      const tempQuestions: ParsedIndependentQuestion[] = [];
      for (let i = 1; i < parts.length; i += 2) {
        const number = parseInt(parts[i]);
        let text = parts[i + 1]?.trim();
        // Remove trailing number from next question
        text = text?.replace(/\s*\d+$/, '');
        if (text && text.length > 5) {
          tempQuestions.push({ number, question: text });
        }
      }
      return tempQuestions;
    },
    
    // Strategy 2: <li> list items
    () => {
      const pattern = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      const tempQuestions: ParsedIndependentQuestion[] = [];
      let match;
      let number = 1;
      while ((match = pattern.exec(practiceHtml)) !== null) {
        const text = match[1].replace(/<[^>]+>/g, '').trim();
        if (text.length > 5) {
          tempQuestions.push({ number: number++, question: text });
        }
      }
      return tempQuestions;
    },
    
    // Strategy 3: <p> paragraphs with numbers
    () => {
      const pattern = /<p[^>]*>\s*(\d+)\.\s*([\s\S]*?)<\/p>/gi;
      const tempQuestions: ParsedIndependentQuestion[] = [];
      let match;
      while ((match = pattern.exec(practiceHtml)) !== null) {
        const number = parseInt(match[1]);
        const text = match[2].replace(/<[^>]+>/g, '').trim();
        if (text.length > 5) {
          tempQuestions.push({ number, question: text });
        }
      }
      return tempQuestions;
    }
  ];
  
  // Try each strategy until one returns results
  for (const strategy of questionStrategies) {
    const result = strategy();
    if (result.length > 0) {
      questions.push(...result);
      break;
    }
  }
  
  // Parse answers if available
  if (answersHtml && questions.length > 0) {
    const cleanAnswers = answersHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    
    const answerStrategies = [
      // Strategy 1: Semicolon-separated "1 answer; 2 answer; 3 answer"
      () => {
        const parts = cleanAnswers.split(';');
        let foundAny = false;
        parts.forEach((part, idx) => {
          const match = part.match(/(\d+)\s+(.+)/);
          if (match) {
            const questionNum = parseInt(match[1]);
            const question = questions.find(q => q.number === questionNum);
            if (question) {
              question.answer = match[2].trim();
              foundAny = true;
            }
          } else if (idx < questions.length) {
            // Try direct mapping if no number
            questions[idx].answer = part.trim();
            foundAny = true;
          }
        });
        return foundAny;
      },
      
      // Strategy 2: Numbered "1. answer\n2. answer"
      () => {
        const pattern = /(\d+)\.\s*(.+?)(?=\s*\d+\.\s+|$)/gs;
        const answerMap = new Map<number, string>();
        let match;
        while ((match = pattern.exec(cleanAnswers)) !== null) {
          answerMap.set(parseInt(match[1]), match[2].trim());
        }
        if (answerMap.size > 0) {
          questions.forEach(q => {
            const answer = answerMap.get(q.number);
            if (answer) q.answer = answer;
          });
          return true;
        }
        return false;
      },
      
      // Strategy 3: Split by sentences/lines and match by position
      () => {
        const sentences = cleanAnswers.split(/[;\n]/).map(s => s.trim()).filter(s => s.length > 5);
        if (sentences.length >= questions.length) {
          questions.forEach((q, idx) => {
            if (idx < sentences.length) {
              q.answer = sentences[idx].replace(/^\d+\.?\s*/, '').trim();
            }
          });
          return true;
        }
        return false;
      }
    ];
    
    // Try each answer strategy until one works
    answerStrategies.some(strategy => strategy());
  }
  
  return questions;
}

/**
 * Get all available lessons (only from lesson_content)
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
    // Get all lessons from lesson_content only
    const { data: lessonContent, error: contentError } = await supabase
      .from('lesson_content')
      .select('skill_code');

    if (contentError) {
      return { data: [], error: contentError };
    }

    if (!lessonContent || lessonContent.length === 0) {
      return { data: [], error: null };
    }

    // Get skill codes that have lesson content
    const skillCodes = lessonContent.map(lc => lc.skill_code);

    // Get skill details for these skill codes
    const { data: skills, error: skillsError } = await supabase
      .from('skills')
      .select('id, name, subject, cluster')
      .in('id', skillCodes)
      .order('order_index', { ascending: true });

    if (skillsError) {
      return { data: [], error: skillsError };
    }

    // Count practice questions in staging_items for these skills
    const { data: items } = await supabase
      .from('staging_items')
      .select('skill_code')
      .in('skill_code', skillCodes);

    // Create question count map
    const questionCounts = new Map<string, number>();
    (items || []).forEach(item => {
      questionCounts.set(item.skill_code, (questionCounts.get(item.skill_code) || 0) + 1);
    });

    const lessons = (skills || []).map(skill => ({
      skill_code: skill.id,
      skill_name: skill.name,
      subject: skill.subject,
      section: skill.subject,
      questionCount: questionCounts.get(skill.id) || 0,
    }));

    return { data: lessons, error: null };
  } catch (error) {
    return { 
      data: [], 
      error: error instanceof Error ? error : new Error('Failed to fetch lessons') 
    };
  }
}
