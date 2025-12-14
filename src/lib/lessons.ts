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
      // Parse objectives from pipe-separated text
      objectives: richContent.objectives 
        ? richContent.objectives.split('|').map(s => s.trim()).filter(Boolean)
        : null,
      concept_explanation: richContent.concept_explanation || null,
      guided_practice: richContent.guided_practice || null,
      error_analysis: richContent.error_analysis || null,
      common_traps: richContent.common_traps || null,
      independent_practice: richContent.independent_practice || null,
      independent_practice_answers: richContent.independent_practice_answers || null,
      // Collect checkpoint quiz questions from individual columns
      checkpoint_quiz_questions: (() => {
        const questions: CheckpointQuestion[] = [];
        const quizColumns = [
          richContent.checkpoint_quiz_q1,
          richContent.checkpoint_quiz_q2,
          richContent.checkpoint_quiz_q3,
          richContent.checkpoint_quiz_q4,
          richContent.checkpoint_quiz_q5,
          richContent.checkpoint_quiz_q6,
          richContent.checkpoint_quiz_q7,
          richContent.checkpoint_quiz_q8,
          richContent.checkpoint_quiz_q9,
          richContent.checkpoint_quiz_q10,
        ];
        quizColumns.forEach((rawQ, index) => {
          if (rawQ && Array.isArray(rawQ) && rawQ.length >= 8) {
            // Array format: [question, optA, optB, optC, optD, answerLetter, explanation, difficulty]
            const answerLetter = rawQ[5] as string;
            const answerIndex = answerLetter.toUpperCase().charCodeAt(0) - 65; // Convert A->0, B->1, etc.
            questions.push({
              id: `checkpoint_q${index + 1}`,
              question: rawQ[0] as string,
              options: [rawQ[1], rawQ[2], rawQ[3], rawQ[4]] as string[],
              correctAnswer: answerIndex,
              explanation: rawQ[6] as string,
              difficulty: (rawQ[7] as 'easy' | 'medium' | 'hard') || 'medium',
            });
          }
        });
        return questions;
      })(),
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
    // Strategy 1: Headers with "Core idea X", "Key concept X", etc.
    () => {
      const pattern = /<(h[2-6]|strong)[^>]*>\s*(?:Core idea|Key concept|Main point|Important point)\s+(\d+)[:\s]*([^<]*)<\/\1>([\s\S]+?)(?=<(?:h[2-6]|strong)[^>]*>(?:Core idea|Key concept|Main point|Important point)\s+\d+|$)/gi;
      const tempRules: ParsedRule[] = [];
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const content = match[4].trim();
        if (content.length > 10) {
          tempRules.push({
            number: parseInt(match[2]),
            title: (match[3]?.trim() || `Core Idea ${match[2]}`),
            content,
          });
        }
      }
      return tempRules;
    },
    
    // Strategy 2: Headers <h3>Rule X</h3> or <strong>Rule X</strong>
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
    },
    
    // Strategy 3: "Rule X –" or "Rule X:" pattern
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
    
    // Strategy 4: Numbered list "1. Title\nContent"
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
  
  // Fallback: if no strategies matched and content is substantial, treat as single rule
  if (rules.length === 0 && html.length > 100) {
    rules.push({
      number: 1,
      title: 'Concept Overview',
      content: html,
    });
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
  if (!html || html.trim() === '') return [];
  
  // Strip HTML tags and normalize whitespace
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return [];
  
  // Support both "1. text" and "1 – text" formats using regex
  const re = /(?:^|\s)(\d+)[\.\-–]\s*(.+?)(?=\s+\d+[\.\-–]\s+|$)/g;
  const traps: string[] = [];
  let match;
  
  while ((match = re.exec(text)) !== null) {
    const trap = match[2].trim();
    if (trap.length > 5) {
      traps.push(trap);
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
    // Strategy 0: "IPX " custom format (e.g., "IP1 question text. IP2 question text.")
    () => {
      const pattern = /IP(\d+)\s+(.+?)(?=IP\d+|$)/gs;
      const tempQuestions: ParsedIndependentQuestion[] = [];
      let match;
      while ((match = pattern.exec(practiceHtml)) !== null) {
        const number = parseInt(match[1]);
        const text = match[2].trim();
        if (text.length > 5) {
          tempQuestions.push({ number, question: text });
        }
      }
      return tempQuestions;
    },
    
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
    const answerStrategies = [
      // Strategy 0: <li> list items (handle HTML list format first, before stripping HTML)
      () => {
        const liPattern = /<li[^>]*>([\s\S]*?)<\/li>/gi;
        const answerTexts: string[] = [];
        let match;
        while ((match = liPattern.exec(answersHtml)) !== null) {
          // Strip HTML from individual li content
          const text = match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          if (text.length > 5) {
            answerTexts.push(text);
          }
        }
        // Match by position
        if (answerTexts.length > 0) {
          questions.forEach((q, idx) => {
            if (idx < answerTexts.length) {
              q.answer = answerTexts[idx];
            }
          });
          return true;
        }
        return false;
      },
      
      // Strategy 1: "IPX " custom format (e.g., "IP1 answer text. IP2 answer text.")
      () => {
        const cleanAnswers = answersHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const pattern = /IP(\d+)\s+(.+?)(?=IP\d+|$)/gs;
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
      
      // Strategy 2: Semicolon-separated "1 answer; 2 answer; 3 answer" (only if semicolons exist)
      () => {
        const cleanAnswers = answersHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (!cleanAnswers.includes(';')) return false;
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
      
      // Strategy 3: Numbered "1. answer\n2. answer"
      () => {
        const cleanAnswers = answersHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
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
      
      // Strategy 4: Split by sentences/lines and match by position
      () => {
        const cleanAnswers = answersHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
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

export async function getPracticeQuestions(
  skillCode: string, 
  count: number
): Promise<CheckpointQuestion[]> {
  const { data, error } = await supabase
    .from('staging_items')
    .select('*')
    .eq('skill_code', skillCode)
    .limit(count);

  if (error) throw error;

  return (data || []).map((item, idx) => ({
    id: `practice_${skillCode}_${idx}`,
    question: item.question,
    options: [item.choice_a, item.choice_b, item.choice_c, item.choice_d],
    correctAnswer: item.answer.charCodeAt(0) - 65, // 'A' → 0, 'B' → 1, etc.
    explanation: item.explanation || 'No explanation available.',
    difficulty: (item.difficulty || 'medium') as 'easy' | 'medium' | 'hard'
  }));
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
    cluster: string;
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

    // Get estimated_minutes from lesson_content for duration instead of question count
    const { data: lessonContentData } = await supabase
      .from('lesson_content')
      .select('skill_code, estimated_minutes')
      .in('skill_code', skillCodes);

    // Create duration map
    const durationMap = new Map<string, number>();
    (lessonContentData || []).forEach(lc => {
      durationMap.set(lc.skill_code, lc.estimated_minutes || 15);
    });

    const lessons = (skills || []).map(skill => ({
      skill_code: skill.id,
      skill_name: skill.name,
      subject: skill.subject,
      section: skill.subject,
      cluster: skill.cluster,
      questionCount: durationMap.get(skill.id) || 15, // Store duration in questionCount for now
    }));

    return { data: lessons, error: null };
  } catch (error) {
    return { 
      data: [], 
      error: error instanceof Error ? error : new Error('Failed to fetch lessons') 
    };
  }
}
