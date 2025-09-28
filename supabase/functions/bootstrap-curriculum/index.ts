import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting curriculum bootstrap...');

    // Check if questions table has data already
    const { data: existingQuestions, error: checkError } = await supabase
      .from('questions')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing questions:', checkError);
      throw checkError;
    }

    if (existingQuestions && existingQuestions.length > 0) {
      console.log('Questions already exist, skipping seed data insertion');
      return new Response(JSON.stringify({
        message: 'Curriculum already bootstrapped',
        tables_exist: true,
        data_seeded: false,
        existing_questions: existingQuestions.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert seed lessons
    const seedLessons = [
      {
        subject: 'English',
        title: 'Subject-Verb Agreement',
        body: `# Subject-Verb Agreement

## Key Rules
1. **Singular subjects** take singular verbs
2. **Plural subjects** take plural verbs
3. **Compound subjects** joined by "and" are usually plural
4. **Collective nouns** can be singular or plural depending on context

## Common Patterns on ACT
- Prepositional phrases between subject and verb
- Either/neither constructions
- Indefinite pronouns (everyone, somebody, etc.)

## Practice Strategy
Focus on identifying the true subject by crossing out prepositional phrases.`,
        skill_code: 'E1.A'
      },
      {
        subject: 'English',
        title: 'Pronoun Case and Agreement',
        body: `# Pronoun Case and Agreement

## Key Rules
1. **Subject pronouns**: I, you, he, she, it, we, they
2. **Object pronouns**: me, you, him, her, it, us, them
3. **Possessive pronouns**: my/mine, your/yours, his, her/hers, its, our/ours, their/theirs

## Who vs Whom
- **Who** = subject (Who is coming?)
- **Whom** = object (To whom are you speaking?)

## Common Errors
- Its vs it's (possessive vs contraction)
- Ambiguous pronoun reference`,
        skill_code: 'E2.A'
      },
      {
        subject: 'Math',
        title: 'Linear Equations and Inequalities',
        body: `# Linear Equations and Inequalities

## Standard Forms
- **Slope-intercept**: y = mx + b
- **Point-slope**: y - y₁ = m(x - x₁)
- **Standard**: Ax + By = C

## Solving Systems
1. **Substitution method**
2. **Elimination method**
3. **Graphing method**

## Inequalities
- Same rules as equations
- **Flip inequality sign** when multiplying/dividing by negative`,
        skill_code: 'M2.A'
      },
      {
        subject: 'Math',
        title: 'Quadratic Functions',
        body: `# Quadratic Functions

## Standard Form
f(x) = ax² + bx + c

## Key Features
- **Vertex**: (-b/2a, f(-b/2a))
- **Axis of symmetry**: x = -b/2a
- **Y-intercept**: (0, c)

## Factoring Methods
1. **Common factor**
2. **Difference of squares**
3. **Trinomials**: (x + p)(x + q) where pq = c and p + q = b

## Quadratic Formula
x = (-b ± √(b² - 4ac)) / 2a`,
        skill_code: 'M3.A'
      }
    ];

    const { data: insertedLessons, error: lessonsInsertError } = await supabase
      .from('lessons')
      .insert(seedLessons)
      .select('id');

    if (lessonsInsertError) {
      console.error('Error inserting seed lessons:', lessonsInsertError);
      throw lessonsInsertError;
    }

    // Insert seed questions
    const seedQuestions = [
      {
        subject: 'English',
        stem: 'The team of players (A) were (B) practicing (C) their defensive strategies (D) before the big game.',
        choices: ["were", "was", "have been", "are"],
        answer: 'was',
        explanation: 'The subject is "team," which is a collective noun treated as singular in this context. Therefore, the verb should be "was" not "were".',
        skill_code: 'E1.A'
      },
      {
        subject: 'English',
        stem: 'Sarah gave the book to Jake and (A) I (B) me (C) myself (D) mine.',
        choices: ["I", "me", "myself", "mine"],
        answer: 'me',
        explanation: 'The pronoun is the object of the preposition "to," so it should be the object pronoun "me".',
        skill_code: 'E2.A'
      },
      {
        subject: 'Math',
        stem: 'What is the slope of the line passing through points (2, 5) and (6, 13)?',
        choices: ["2", "4", "8", "1/2"],
        answer: '2',
        explanation: 'Using the slope formula: m = (y₂ - y₁)/(x₂ - x₁) = (13 - 5)/(6 - 2) = 8/4 = 2',
        skill_code: 'M2.A'
      },
      {
        subject: 'Math',
        stem: 'If f(x) = x² - 4x + 3, what is the x-coordinate of the vertex?',
        choices: ["1", "2", "3", "4"],
        answer: '2',
        explanation: 'For a quadratic in standard form, the x-coordinate of the vertex is -b/2a = -(-4)/2(1) = 4/2 = 2',
        skill_code: 'M3.A'
      }
    ];

    const { data: insertedQuestions, error: questionsInsertError } = await supabase
      .from('questions')
      .insert(seedQuestions)
      .select('id');

    if (questionsInsertError) {
      console.error('Error inserting seed questions:', questionsInsertError);
      throw questionsInsertError;
    }

    const result = {
      message: 'Curriculum successfully bootstrapped',
      tables_exist: true,
      data_seeded: true,
      lessons_inserted: insertedLessons?.length || 0,
      questions_inserted: insertedQuestions?.length || 0
    };

    console.log('Bootstrap completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in bootstrap-curriculum function:', error);
    return new Response(JSON.stringify({
      error: 'Bootstrap failed',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});