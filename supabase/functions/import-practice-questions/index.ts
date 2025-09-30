import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PracticeRow {
  subject: string;
  skill_code: string;
  difficulty: string;
  question: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  answer: string;
  explanation?: string;
}

interface ImportReport {
  success: boolean;
  validRows: number;
  invalidRows: number;
  errors: string[];
  questionsCreated: number;
  skillsCreated: number;
}

function parseTSV(tsvContent: string): PracticeRow[] {
  const lines = tsvContent.trim().split('\n');
  const headers = lines[0].split('\t');
  
  return lines.slice(1).map(line => {
    const values = line.split('\t');
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || '';
    });
    return row as unknown as PracticeRow;
  });
}

function validatePracticeRow(row: PracticeRow): string[] {
  const errors: string[] = [];
  
  if (!row.subject || !['English', 'Math', 'Reading', 'Science'].includes(row.subject)) {
    errors.push('Invalid subject. Must be: English, Math, Reading, or Science');
  }
  
  if (!row.skill_code) {
    errors.push('Missing skill_code');
  }
  
  if (!row.difficulty || !['1', '2', '3', '4', '5', 'Easy', 'Medium', 'Hard'].includes(row.difficulty)) {
    errors.push('Invalid difficulty. Must be 1-5 or Easy/Medium/Hard');
  }
  
  if (!row.question) {
    errors.push('Missing question');
  }
  
  if (!row.choice_a || !row.choice_b || !row.choice_c || !row.choice_d) {
    errors.push('Missing answer choices');
  }
  
  if (!row.answer || !['A', 'B', 'C', 'D'].includes(row.answer.toUpperCase())) {
    errors.push('Invalid answer. Must be A, B, C, or D');
  }
  
  return errors;
}

function mapDifficulty(difficulty: string): number {
  const difficultyMap: { [key: string]: number } = {
    'Easy': 2,
    'Medium': 3,
    'Hard': 4,
    '1': 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5
  };
  
  return difficultyMap[difficulty] || 3;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { 
        status: 401,
        headers: corsHeaders 
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response('Unauthorized', { 
        status: 401,
        headers: corsHeaders 
      });
    }

    const requestBody = await req.json();
    const { tsvContent, dryRun = false } = requestBody;

    if (!tsvContent) {
      return new Response('TSV content is required', { 
        status: 400,
        headers: corsHeaders 
      });
    }

    console.warn('Parsing TSV content...');
    const rows = parseTSV(tsvContent);
    console.warn(`Parsed ${rows.length} rows`);

    const report: ImportReport = {
      success: true,
      validRows: 0,
      invalidRows: 0,
      errors: [],
      questionsCreated: 0,
      skillsCreated: 0
    };

    // Validate all rows
    const validRows: PracticeRow[] = [];
    rows.forEach((row, index) => {
      const errors = validatePracticeRow(row);
      if (errors.length > 0) {
        report.invalidRows++;
        report.errors.push(`Row ${index + 2}: ${errors.join(', ')}`);
      } else {
        validRows.push(row);
        report.validRows++;
      }
    });

    if (report.invalidRows > 0) {
      report.success = false;
    }

    if (dryRun || validRows.length === 0) {
      return new Response(JSON.stringify(report), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.warn(`Processing ${validRows.length} valid rows...`);

    // Get unique skill codes to create missing skills
    const uniqueSkillCodes = [...new Set(validRows.map(row => row.skill_code))];
    const skillsToCreate: Array<{ name: string; subject: string; cluster: string; description: string }> = [];

    for (const skillCode of uniqueSkillCodes) {
      const existingSkill = await supabase
        .from('skills')
        .select('id')
        .ilike('name', `%${skillCode}%`)
        .single();

      if (existingSkill.error) {
        // Create new skill
        const row = validRows.find(r => r.skill_code === skillCode)!;
        skillsToCreate.push({
          name: skillCode,
          subject: row.subject.toLowerCase(),
          cluster: `${row.subject} Practice`,
          description: `Practice questions for ${skillCode}`
        } as any);
      }
    }

    // Insert new skills
    if (skillsToCreate.length > 0) {
      const { error: skillsError } = await supabase
        .from('skills')
        .insert(skillsToCreate);

      if (skillsError) {
        console.error('Error creating skills:', skillsError);
        report.errors.push(`Failed to create skills: ${skillsError.message}`);
        report.success = false;
      } else {
        report.skillsCreated = skillsToCreate.length;
        console.warn(`Created ${skillsToCreate.length} new skills`);
      }
    }

    // Get skill IDs for questions
    const { data: skills, error: skillsQueryError } = await supabase
      .from('skills')
      .select('id, name');

    if (skillsQueryError) {
      console.error('Error fetching skills:', skillsQueryError);
      report.errors.push(`Failed to fetch skills: ${skillsQueryError.message}`);
      report.success = false;
      return new Response(JSON.stringify(report), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create questions
    const questionsToInsert = validRows.map(row => {
      const skill = skills?.find(s => s.name.includes(row.skill_code));
      if (!skill) {
        console.error(`Skill not found for code: ${row.skill_code}`);
        return null;
      }

      return {
        skill_id: skill.id,
        difficulty: mapDifficulty(row.difficulty),
        stem: row.question,
        choice_a: row.choice_a,
        choice_b: row.choice_b,
        choice_c: row.choice_c,
        choice_d: row.choice_d,
        answer: row.answer.toUpperCase(),
        explanation: row.explanation || null
      };
    }).filter(Boolean);

    if (questionsToInsert.length > 0) {
      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) {
        console.error('Error creating questions:', questionsError);
        report.errors.push(`Failed to create questions: ${questionsError.message}`);
        report.success = false;
      } else {
        report.questionsCreated = questionsToInsert.length;
        console.warn(`Created ${questionsToInsert.length} questions`);
      }
    }

    return new Response(JSON.stringify(report), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing practice questions:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        validRows: 0,
        invalidRows: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        questionsCreated: 0,
        skillsCreated: 0
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});