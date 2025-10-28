import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHash } from 'https://deno.land/std@0.168.0/hash/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ImportRow {
  subject: string
  form_id: string
  section: string
  ord: string
  passage_title?: string
  passage_body?: string
  stem: string
  choice_a: string
  choice_b: string
  choice_c: string
  choice_d: string
  correct_label: string
  difficulty: string
  topics?: string
  explanation: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the user is an admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse the TSV data
    const { tsv } = await req.json()
    if (!tsv) {
      return new Response(
        JSON.stringify({ error: 'No TSV data provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const lines = tsv.trim().split('\n')
    const headers = lines[0].split('\t').map((h: string) => h.trim())
    
    const stats = {
      formsCreated: 0,
      questionsCreated: 0,
      questionsSkipped: 0,
      passagesCreated: 0,
      errors: [] as string[]
    }

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t')
      const row: any = {}
      
      headers.forEach((header: string, index: number) => {
        row[header] = values[index]?.trim() || ''
      })

      try {
        // Create form if it doesn't exist
        const { data: existingForm } = await supabase
          .from('forms')
          .select('id')
          .eq('label', row.form_id)
          .single()

        let formId = existingForm?.id

        if (!formId) {
          const { data: newForm, error: formError } = await supabase
            .from('forms')
            .insert({ label: row.form_id })
            .select('id')
            .single()

          if (formError) throw formError
          formId = newForm.id
          stats.formsCreated++
        }

        // Generate stem hash for idempotency
        const encoder = new TextEncoder()
        const data = encoder.encode(row.stem.toLowerCase())
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const stemHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

        // Check if question already exists
        const { data: existingQuestion } = await supabase
          .from('questions')
          .select('id')
          .eq('stem_hash', stemHash)
          .single()

        if (existingQuestion) {
          stats.questionsSkipped++
          continue
        }

        // Create skill if provided
        let skillId = null
        if (row.topics) {
          const { data: skill } = await supabase
            .from('skills')
            .select('id')
            .eq('name', row.topics)
            .eq('section', row.section)
            .single()

          if (skill) {
            skillId = skill.id
          } else {
            const { data: newSkill } = await supabase
              .from('skills')
              .insert({
                section: row.section,
                name: row.topics
              })
              .select('id')
              .single()
            
            if (newSkill) skillId = newSkill.id
          }
        }

        // Create question
        const { data: question, error: questionError } = await supabase
          .from('questions')
          .insert({
            stem: row.stem,
            answer: row.correct_label.toUpperCase(),
            choice_a: row.choice_a,
            choice_b: row.choice_b,
            choice_c: row.choice_c,
            choice_d: row.choice_d,
            difficulty: parseInt(row.difficulty) || 3,
            explanation: row.explanation,
            skill_id: skillId,
            stem_hash: stemHash
          })
          .select('id')
          .single()

        if (questionError) throw questionError
        stats.questionsCreated++

        // Create passage if provided
        let passageId = null
        if (row.passage_title && row.passage_body) {
          const { data: existingPassage } = await supabase
            .from('passages')
            .select('id')
            .eq('form_id', formId)
            .eq('title', row.passage_title)
            .single()

          if (existingPassage) {
            passageId = existingPassage.id
          } else {
            const { data: newPassage } = await supabase
              .from('passages')
              .insert({
                form_id: formId,
                section: row.section,
                passage_type: 'standard',
                title: row.passage_title,
                passage_text: row.passage_body
              })
              .select('id')
              .single()

            if (newPassage) {
              passageId = newPassage.id
              stats.passagesCreated++
            }
          }
        }

        // Link question to form
        const { error: linkError } = await supabase
          .from('form_questions')
          .insert({
            form_id: formId,
            section: row.section,
            ord: parseInt(row.ord),
            question_id: question.id,
            passage_id: passageId
          })

        if (linkError && !linkError.message.includes('duplicate')) {
          throw linkError
        }

      } catch (rowError: any) {
        stats.errors.push(`Row ${i}: ${rowError.message}`)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        stats 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})