import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImportReport {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: string[];
  insertedQuestions?: number;
  insertedSkills?: number;
  insertedFormQuestions?: number;
  insertedPassages?: number;
  dryRun: boolean;
}

interface StagingRow {
  form_id: string;
  section: string;
  ord: number;
  passage_id?: string;
  passage_type?: string;
  passage_title?: string;
  passage_text?: string;
  topic?: string;
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

function parseTSV(tsvContent: string): StagingRow[] {
  const lines = tsvContent.trim().split('\n');
  if (lines.length === 0) return [];
  
  const headers = lines[0].split('\t').map(h => h.trim().replace(/"/g, ''));
  const rows: StagingRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t').map(v => v.trim().replace(/"/g, ''));
    if (values.length === headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      
      // Convert numeric fields
      (row as any).ord = parseInt(row.ord as string) || 0;
      
      rows.push(row as unknown as StagingRow);
    }
  }
  
  return rows;
}

function validateStagingRow(row: StagingRow): string[] {
  const errors: string[] = [];
  
  if (!row.form_id?.trim()) errors.push('form_id is required');
  if (!row.section?.trim()) errors.push('section is required');
  if (!['EN', 'MATH', 'RD', 'SCI'].includes(row.section)) {
    errors.push('section must be EN, MATH, RD, or SCI');
  }
  if (!row.ord || row.ord < 1) errors.push('ord must be >= 1');
  if (!row.skill_code?.trim()) errors.push('skill_code is required');
  if (!row.difficulty?.trim()) errors.push('difficulty is required');
  if (!['Easy', 'Medium', 'Hard'].includes(row.difficulty)) {
    errors.push('difficulty must be Easy, Medium, or Hard');
  }
  if (!row.question?.trim()) errors.push('question is required');
  if (!row.choice_a?.trim()) errors.push('choice_a is required');
  if (!row.choice_b?.trim()) errors.push('choice_b is required');
  if (!row.choice_c?.trim()) errors.push('choice_c is required');
  if (!row.choice_d?.trim()) errors.push('choice_d is required');
  
  if (!['A', 'B', 'C', 'D'].includes(row.answer?.toUpperCase())) {
    errors.push('answer must be A, B, C, or D');
  }
  
  return errors;
}

function mapDifficulty(difficulty: string): number {
  switch (difficulty) {
    case 'Easy': return 2;
    case 'Medium': return 3;
    case 'Hard': return 4;
    default: return 3;
  }
}

function getSubjectFromSection(section: string): string {
  switch (section) {
    case 'EN': return 'English';
    case 'MATH': return 'Math';
    case 'RD': return 'Reading';
    case 'SCI': return 'Science';
    default: return 'Other';
  }
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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { dryRun = true, useStaging = false } = body;

    let rows: StagingRow[] = [];

    if (useStaging) {
      // Read from staging_items table
      const { data: stagingData, error: stagingError } = await supabase
        .from('staging_items')
        .select('*')
        .order('staging_id');

      if (stagingError) {
        return new Response(JSON.stringify({ error: 'Failed to read staging data' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      rows = stagingData?.map(item => ({
        form_id: item.form_id,
        section: item.section,
        ord: item.ord,
        passage_id: item.passage_id,
        passage_type: item.passage_type,
        passage_title: item.passage_title,
        passage_text: item.passage_text,
        topic: item.topic,
        skill_code: item.skill_code,
        difficulty: item.difficulty,
        question: item.question,
        choice_a: item.choice_a,
        choice_b: item.choice_b,
        choice_c: item.choice_c,
        choice_d: item.choice_d,
        answer: item.answer,
        explanation: item.explanation
      })) || [];
    } else {
      return new Response(JSON.stringify({ error: 'TSV file upload not implemented in this function. Use staging table.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const report: ImportReport = {
      totalRows: rows.length,
      validRows: 0,
      invalidRows: 0,
      errors: [],
      dryRun
    };

    const validRows: StagingRow[] = [];

    // Validate each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowErrors = validateStagingRow(row);
      
      if (rowErrors.length > 0) {
        report.invalidRows++;
        report.errors.push(`Row ${i + 1}: ${rowErrors.join(', ')}`);
      } else {
        report.validRows++;
        validRows.push(row);
      }
    }

    if (!dryRun && validRows.length > 0) {
      let insertedSkills = 0;
      let insertedQuestions = 0;
      let insertedPassages = 0;
      let insertedFormQuestions = 0;

      // Group by unique passages
      const passages = new Map();
      for (const row of validRows) {
        if (row.passage_id && row.passage_text) {
          passages.set(row.passage_id, {
            id: row.passage_id,
            form_id: row.form_id,
            section: row.section,
            passage_type: row.passage_type || 'General',
            title: row.passage_title,
            passage_text: row.passage_text
          });
        }
      }

      // Insert passages
      if (passages.size > 0) {
        const { error: passageError } = await supabase
          .from('passages')
          .upsert(Array.from(passages.values()), { onConflict: 'id' });

        if (passageError) {
          console.error('Passage insert error:', passageError);
          report.errors.push(`Failed to insert passages: ${passageError.message}`);
        } else {
          insertedPassages = passages.size;
        }
      }

      // Create skills on the fly
      const skillsToCreate = new Set();
      for (const row of validRows) {
        skillsToCreate.add(row.skill_code);
      }

      for (const skillCode of skillsToCreate) {
        const subject = getSubjectFromSection(validRows.find(r => r.skill_code === skillCode)?.section || '');
        
        const { error: skillError } = await supabase
          .from('skills')
          .upsert({
            name: skillCode,
            subject: subject,
            cluster: 'General',
            description: `Auto-created skill for ${skillCode}`,
            order_index: 1
          }, { onConflict: 'name' });

        if (!skillError) {
          insertedSkills++;
        }
      }

      // Get skill IDs
      const { data: skills } = await supabase
        .from('skills')
        .select('id, name')
        .in('name', Array.from(skillsToCreate));

      const skillMap = new Map(skills?.map(s => [s.name, s.id]) || []);

      // Insert questions and form_questions
      for (const row of validRows) {
        const skillId = skillMap.get(row.skill_code);
        if (!skillId) {
          report.errors.push(`Skill not found: ${row.skill_code}`);
          continue;
        }

        // Insert question
        const { data: question, error: questionError } = await supabase
          .from('questions')
          .insert({
            skill_id: skillId,
            stem: row.question,
            choice_a: row.choice_a,
            choice_b: row.choice_b,
            choice_c: row.choice_c,
            choice_d: row.choice_d,
            answer: row.answer.toUpperCase(),
            explanation: row.explanation || null,
            difficulty: mapDifficulty(row.difficulty),
            time_limit_secs: 45
          })
          .select('id')
          .single();

        if (questionError) {
          report.errors.push(`Failed to insert question: ${questionError.message}`);
          continue;
        }

        insertedQuestions++;

        // Insert form_question
        const { error: formQuestionError } = await supabase
          .from('form_questions')
          .insert({
            form_id: row.form_id,
            section: row.section,
            ord: row.ord,
            question_id: question.id,
            passage_id: row.passage_id || null
          });

        if (formQuestionError) {
          report.errors.push(`Failed to insert form question: ${formQuestionError.message}`);
        } else {
          insertedFormQuestions++;
        }
      }

      report.insertedSkills = insertedSkills;
      report.insertedQuestions = insertedQuestions;
      report.insertedPassages = insertedPassages;
      report.insertedFormQuestions = insertedFormQuestions;
    }

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in import-questions function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});