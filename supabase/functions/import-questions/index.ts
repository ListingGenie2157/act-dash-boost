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
  dryRun: boolean;
}

interface QuestionRow {
  skill_name: string;
  stem: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  answer: string;
  explanation?: string;
  difficulty: number;
  time_limit_secs: number;
}

function parseCSV(csvContent: string): QuestionRow[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows: QuestionRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    if (values.length === headers.length) {
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      
      // Convert numeric fields
      row.difficulty = parseInt(row.difficulty) || 1;
      row.time_limit_secs = parseInt(row.time_limit_secs) || 45;
      
      rows.push(row as QuestionRow);
    }
  }
  
  return rows;
}

function validateQuestionRow(row: QuestionRow): string[] {
  const errors: string[] = [];
  
  if (!row.skill_name?.trim()) errors.push('skill_name is required');
  if (!row.stem?.trim()) errors.push('stem is required');
  if (!row.choice_a?.trim()) errors.push('choice_a is required');
  if (!row.choice_b?.trim()) errors.push('choice_b is required');
  if (!row.choice_c?.trim()) errors.push('choice_c is required');
  if (!row.choice_d?.trim()) errors.push('choice_d is required');
  
  if (!['A', 'B', 'C', 'D'].includes(row.answer?.toUpperCase())) {
    errors.push('answer must be A, B, C, or D');
  }
  
  if (row.difficulty < 1 || row.difficulty > 5) {
    errors.push('difficulty must be between 1 and 5');
  }
  
  if (row.time_limit_secs < 1 || row.time_limit_secs > 300) {
    errors.push('time_limit_secs must be between 1 and 300');
  }
  
  return errors;
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
    const { storagePath, dryRun = true } = body;

    if (!storagePath) {
      return new Response(JSON.stringify({ error: 'storagePath is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('question-imports')
      .download(storagePath);

    if (downloadError || !fileData) {
      return new Response(JSON.stringify({ error: 'Failed to download file' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const csvContent = await fileData.text();
    const rows = parseCSV(csvContent);
    
    const report: ImportReport = {
      totalRows: rows.length,
      validRows: 0,
      invalidRows: 0,
      errors: [],
      dryRun
    };

    const validQuestions: any[] = [];

    // Validate each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowErrors = validateQuestionRow(row);
      
      if (rowErrors.length > 0) {
        report.invalidRows++;
        report.errors.push(`Row ${i + 2}: ${rowErrors.join(', ')}`);
      } else {
        report.validRows++;
        validQuestions.push(row);
      }
    }

    if (!dryRun && validQuestions.length > 0) {
      // Get all skills to resolve skill names to IDs
      const { data: skills, error: skillsError } = await supabase
        .from('skills')
        .select('id, name');

      if (skillsError) {
        return new Response(JSON.stringify({ error: 'Failed to fetch skills' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const skillMap = new Map(skills?.map(s => [s.name.toLowerCase(), s.id]) || []);
      const questionsToInsert: any[] = [];

      for (const question of validQuestions) {
        const skillId = skillMap.get(question.skill_name.toLowerCase());
        if (skillId) {
          questionsToInsert.push({
            skill_id: skillId,
            stem: question.stem,
            choice_a: question.choice_a,
            choice_b: question.choice_b,
            choice_c: question.choice_c,
            choice_d: question.choice_d,
            answer: question.answer.toUpperCase(),
            explanation: question.explanation || null,
            difficulty: question.difficulty,
            time_limit_secs: question.time_limit_secs
          });
        } else {
          report.errors.push(`Skill not found: ${question.skill_name}`);
          report.invalidRows++;
          report.validRows--;
        }
      }

      if (questionsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('questions')
          .insert(questionsToInsert);

        if (insertError) {
          return new Response(JSON.stringify({ 
            error: 'Failed to insert questions', 
            details: insertError.message 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        report.insertedQuestions = questionsToInsert.length;
      }
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