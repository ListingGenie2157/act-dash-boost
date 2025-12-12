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
  passage_title?: string;
  passage_text?: string;
  skill_code: string;
  difficulty: string;
  question: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  answer: string;
  explanation?: string;
  image_url?: string;
  image_caption?: string;
  image_position?: string;
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
    // Initialize Supabase client with proper env validation
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required environment variables: SUPABASE_URL or SUPABASE_ANON_KEY');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

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
        passage_title: item.passage_title,
        passage_text: item.passage_text,
        skill_code: item.skill_code,
        difficulty: item.difficulty,
        question: item.question,
        choice_a: item.choice_a,
        choice_b: item.choice_b,
        choice_c: item.choice_c,
        choice_d: item.choice_d,
        answer: item.answer,
        explanation: item.explanation,
        image_url: item.image_url,
        image_caption: item.image_caption,
        image_position: item.image_position || 'above_question'
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
            passage_type: 'General',
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

      // BATCH UPSERT: Create all skills in one operation
      const skillsBatch = Array.from(skillsToCreate).map(skillCode => {
        const subject = getSubjectFromSection(validRows.find(r => r.skill_code === skillCode)?.section || '');
        return {
          name: skillCode,
          subject: subject,
          cluster: 'General',
          description: `Auto-created skill for ${skillCode}`,
          order_index: 1
        };
      });

      const { error: skillBatchError } = await supabase
        .from('skills')
        .upsert(skillsBatch, { onConflict: 'name' });
      
      if (skillBatchError) {
        report.errors.push(`Failed to batch insert skills: ${skillBatchError.message}`);
      } else {
        insertedSkills = skillsBatch.length;
      }

      // Get skill IDs
      const { data: skills } = await supabase
        .from('skills')
        .select('id, name')
        .in('name', Array.from(skillsToCreate));

      const skillMap = new Map(skills?.map(s => [s.name, s.id]) || []);

      // BATCH INSERT: Prepare all questions at once
      const questionsBatch = validRows
        .filter(row => skillMap.has(row.skill_code))
        .map(row => ({
          skill_id: skillMap.get(row.skill_code)!,
          stem: row.question,
          choice_a: row.choice_a,
          choice_b: row.choice_b,
          choice_c: row.choice_c,
          choice_d: row.choice_d,
          answer: row.answer.toUpperCase(),
          explanation: row.explanation || null,
          difficulty: mapDifficulty(row.difficulty),
          time_limit_secs: 45,
          image_url: row.image_url || null,
          image_caption: row.image_caption || null,
          image_position: row.image_position || 'above_question',
          // Track original row data for form_questions linkage
          _form_id: row.form_id,
          _section: row.section,
          _ord: row.ord,
          _passage_id: row.passage_id
        }));

      // Report missing skills
      validRows.filter(row => !skillMap.has(row.skill_code)).forEach(row => {
        report.errors.push(`Skill not found: ${row.skill_code}`);
      });

      // Batch insert questions (chunk to avoid payload limits)
      const BATCH_SIZE = 100;
      const insertedQuestionIds: Array<{ id: string; _form_id: string; _section: string; _ord: number; _passage_id?: string }> = [];

      for (let i = 0; i < questionsBatch.length; i += BATCH_SIZE) {
        const chunk = questionsBatch.slice(i, i + BATCH_SIZE);
        const insertData = chunk.map(({ _form_id, _section, _ord, _passage_id, ...q }) => q);
        
        const { data: insertedChunk, error: chunkError } = await supabase
          .from('questions')
          .insert(insertData)
          .select('id');

        if (chunkError) {
          report.errors.push(`Failed to batch insert questions (chunk ${i / BATCH_SIZE}): ${chunkError.message}`);
        } else if (insertedChunk) {
          insertedQuestions += insertedChunk.length;
          // Map back to original row metadata
          insertedChunk.forEach((q, idx) => {
            const original = chunk[idx];
            insertedQuestionIds.push({
              id: q.id,
              _form_id: original._form_id,
              _section: original._section,
              _ord: original._ord,
              _passage_id: original._passage_id
            });
          });
        }
      }

      // BATCH INSERT: form_questions
      if (insertedQuestionIds.length > 0) {
        const formQuestionsBatch = insertedQuestionIds.map(q => ({
          form_id: q._form_id,
          section: q._section,
          ord: q._ord,
          question_id: q.id,
          passage_id: q._passage_id || null
        }));

        for (let i = 0; i < formQuestionsBatch.length; i += BATCH_SIZE) {
          const chunk = formQuestionsBatch.slice(i, i + BATCH_SIZE);
          const { error: formChunkError } = await supabase
            .from('form_questions')
            .insert(chunk);

          if (formChunkError) {
            report.errors.push(`Failed to batch insert form_questions (chunk ${i / BATCH_SIZE}): ${formChunkError.message}`);
          } else {
            insertedFormQuestions += chunk.length;
          }
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