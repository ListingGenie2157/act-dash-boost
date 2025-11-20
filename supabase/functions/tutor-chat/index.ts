import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TutorChatRequest {
  user_id?: string;
  subject: string;
  topic: string;
  mode: 'practice' | 'quiz' | 'test';
  problem: {
    id: string | null;
    text: string;
    choices?: string[];
    user_answer?: string;
    user_work?: string;
  };
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: string;
  }>;
  session_id?: string;
}

const BASE_SYSTEM_PROMPT = `You are a patient, strict homework tutor helping a high school student.

GLOBAL RULES:
- Your job is to help the student UNDERSTAND and solve problems, not do their homework for them.
- Always ask what they have tried or what they think before revealing the next step.
- Work step-by-step, explaining the WHY, not just the HOW.
- Use clear, concise language. Avoid unnecessary jargon.
- Prefer shorter, focused answers over long lectures.
- End replies with a concrete next step or question for the student.
- If the student is on a test/quiz, DO NOT give final answers. Give hints, point out errors, or propose similar practice problems.

REMEMBER: You are a TUTOR, not an answer key.`;

const SUBJECT_PROMPTS: Record<string, string> = {
  AP_CHEM: `
CHEMISTRY TUTORING:
- Use dimensional analysis and units in EVERY step.
- Emphasize setup: balanced equations, given data, what is being solved for.
- Remind about limiting reactants, sig figs, and state assumptions.
- Show units at every step so they see what cancels.
- Always ask: "What information do you have?" and "What are you solving for?"`,

  SCIENCE: `
SCIENCE TUTORING:
- Use dimensional analysis and units in EVERY step.
- Emphasize the scientific method: observation, hypothesis, experiment, conclusion.
- Break down complex concepts into simple analogies.
- Always connect theory to real-world examples.`,

  ACT_MATH: `
MATH TUTORING:
- Show algebraic steps one line at a time.
- Encourage mental shortcuts only AFTER understanding the long version.
- Focus on problem types: word problems, functions, algebra, stats, etc.
- Name the problem type explicitly (e.g., "This is a systems of equations problem").
- If stuck, identify the smallest missing concept and explain that first.`,

  MATH: `
MATH TUTORING:
- Show algebraic steps one line at a time.
- Encourage mental shortcuts only AFTER understanding the long version.
- Always check work by substituting back into the original equation.
- Name the problem type explicitly.
- If stuck, identify the smallest missing concept and explain that first.`,

  ENGLISH: `
ENGLISH TUTORING:
- Focus on grammar rules and punctuation rules first, then apply them.
- When correcting, EXPLAIN which rule is being applied (e.g., "This is a comma splice, so you must...").
- Prefer examples: show wrong vs right with 1-2 sentence explanations.
- Common issues: subject-verb agreement, comma splices, misplaced modifiers, pronoun agreement.`,

  READING: `
READING COMPREHENSION TUTORING:
- Focus on identifying main ideas, supporting details, and author's purpose.
- Teach active reading strategies: underlining, annotating, summarizing.
- When analyzing passages, always refer back to specific lines or phrases as evidence.
- Help students distinguish between what the text says vs what they think it means.`,
};

const MODE_RULES: Record<string, string> = {
  practice: `
MODE: PRACTICE
- It is acceptable to eventually show the full worked solution, but only AFTER the student has attempted at least one step.
- Ask them to do the next step whenever possible.
- If they're completely stuck after 2-3 attempts, guide them through the solution step-by-step.`,

  quiz: `
MODE: QUIZ
- Do NOT reveal the final answer to the current problem.
- You may:
  - Check their work and point out where a step went wrong.
  - Offer general strategies.
  - Create a DIFFERENT but structurally similar practice problem and solve that in detail.
- Always remind: "I can't give you the direct answer while you're on a quiz, but I can help you think it through."`,

  test: `
MODE: TEST
- Do NOT reveal the final answer to the current problem under ANY circumstances.
- You may:
  - Explain the general concept or rule.
  - Create a simpler analogous problem and solve that.
  - Point out common mistakes for this type of problem.
- Always remind: "I can't give you the answer during a test, but I can teach you the concept with a different example."`,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: TutorChatRequest = await req.json();

    // Validate required fields
    if (!body.subject || !body.topic || !body.mode || !body.messages) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build system prompt
    const subjectPrompt = SUBJECT_PROMPTS[body.subject] || SUBJECT_PROMPTS['MATH'];
    const modePrompt = MODE_RULES[body.mode] || MODE_RULES['practice'];

    const systemPrompt = `${BASE_SYSTEM_PROMPT}

${subjectPrompt}

${modePrompt}`;

    // Build context message
    const contextMessage = `
Current Context:
- Subject: ${body.subject}
- Topic: ${body.topic}
- Mode: ${body.mode}
- Problem Text: ${body.problem.text}
${body.problem.choices ? `- Choices: ${body.problem.choices.map((c, i) => `${String.fromCharCode(65 + i)}. ${c}`).join(', ')}` : ''}
${body.problem.user_answer ? `- Student's Answer: ${body.problem.user_answer}` : ''}
${body.problem.user_work ? `- Student's Work: ${body.problem.user_work}` : ''}`;

    // Prepare messages for AI
    const aiMessages = [
      { role: 'system', content: systemPrompt },
      { role: 'assistant', content: contextMessage },
      ...body.messages.slice(-10).map(msg => ({
        role: msg.role === 'system' ? 'assistant' : msg.role,
        content: msg.content,
      })),
    ];

    // Call Lovable AI Gateway
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: aiMessages,
        max_tokens: 1000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API Error:', aiResponse.status, errorText);
      
      // Try to parse error details
      let errorDetail = errorText;
      try {
        const parsed = JSON.parse(errorText);
        errorDetail = parsed.message || parsed.error || errorText;
      } catch {
        // Keep raw text if not JSON
      }
      
      throw new Error(`AI API error ${aiResponse.status}: ${errorDetail}`);
    }

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Optional: Log to database (non-blocking)
    let sessionId = body.session_id;
    try {
      if (body.user_id) {
        if (!sessionId) {
          // Create new session
          const { data: newSession, error: sessionError } = await supabase
            .from('tutor_sessions')
            .insert({
              user_id: body.user_id,
              subject: body.subject,
              topic: body.topic,
              mode: body.mode,
            })
            .select()
            .single();

          if (!sessionError && newSession) {
            sessionId = newSession.id;
          }
        } else {
          // Update existing session
          await supabase
            .from('tutor_sessions')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', sessionId);
        }

        // Log messages
        if (sessionId) {
          const lastUserMessage = body.messages[body.messages.length - 1];
          await supabase.from('tutor_messages').insert([
            {
              session_id: sessionId,
              role: lastUserMessage.role,
              content: lastUserMessage.content,
            },
            {
              session_id: sessionId,
              role: 'assistant',
              content: assistantMessage,
            },
          ]);
        }
      }
    } catch (loggingError) {
      console.error('Logging error (non-fatal):', loggingError);
    }

    return new Response(
      JSON.stringify({
        assistant_message: assistantMessage,
        session_id: sessionId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in tutor-chat:', error);

    let statusCode = 500;
    let errorMessage = 'Internal server error';

    if (error.message?.includes('LOVABLE_API_KEY not configured')) {
      statusCode = 500;
      errorMessage = 'Tutor is not configured on the server (missing AI key). Please contact support.';
    } else if (error.message?.includes('429')) {
      statusCode = 429;
      errorMessage = 'Rate limit exceeded. Please try again later.';
    } else if (error.message?.includes('402')) {
      statusCode = 402;
      errorMessage = 'AI credits exhausted. Please contact support.';
    } else if (error.message && error.message.length < 200) {
      // If error message is reasonably short, include it for better debugging
      errorMessage = error.message;
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
