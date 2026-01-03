import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GeneratedQuestion {
  question: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  answer: "A" | "B" | "C" | "D";
  explanation: string;
  skill_code: string;
  difficulty: "Easy" | "Medium" | "Hard";
  passage_text?: string;
  passage_title?: string;
  passage_id?: string;
}

const SECTION_PROMPTS: Record<string, string> = {
  english: `You are an expert ACT English test writer. Generate authentic ACT English questions that test grammar, punctuation, sentence structure, and rhetorical skills.

Key characteristics of ACT English questions:
- Questions are passage-based with underlined portions
- Test grammar rules: subject-verb agreement, pronoun usage, punctuation, sentence structure
- Test rhetorical skills: organization, style, strategy
- Wrong answers are plausible but grammatically or stylistically incorrect
- Correct answers are the most clear, concise, and grammatically correct option

For each question:
- Create a sentence or short passage with an underlined portion
- The question stem should reference the underlined portion
- Include "NO CHANGE" as one option when testing if original is correct
- Make distractors represent common student errors`,

  math: `You are an expert ACT Math test writer. Generate authentic ACT Math questions covering pre-algebra, algebra, geometry, and trigonometry.

Key characteristics of ACT Math questions:
- Range from basic computation to multi-step problem solving
- Include word problems with real-world contexts
- Cover: number properties, equations, functions, geometry, statistics, trigonometry
- Wrong answers often result from common computational errors
- Questions should be solvable without a calculator (though calculator is allowed)

Difficulty guidelines:
- Easy: Single-step, direct application of formulas
- Medium: Multi-step problems, requires setting up equations
- Hard: Complex reasoning, combining multiple concepts

For each question:
- Write clear, unambiguous problem statements
- Ensure all necessary information is provided
- Make distractors based on common errors (sign errors, formula mistakes, etc.)`,

  reading: `You are an expert ACT Reading test writer. Generate authentic ACT Reading questions with accompanying passages.

Key characteristics of ACT Reading:
- Questions test comprehension, inference, vocabulary in context, and main idea
- Passages are from literary fiction, social science, humanities, or natural science
- Questions reference specific lines or ask about passage structure
- Wrong answers are often partially correct or misrepresent passage content

For each question:
- Include a short passage (100-200 words) appropriate for the skill being tested
- Ask questions that require careful reading and analysis
- Test: main idea, supporting details, inferences, vocabulary, author's purpose
- Make distractors that could seem correct without careful reading`,

  science: `You are an expert ACT Science test writer. Generate authentic ACT Science questions with data representations.

Key characteristics of ACT Science:
- Questions are based on passages describing experiments, data, or scientific viewpoints
- Test interpretation of graphs, tables, and experimental design
- DO NOT require prior scientific knowledge - all information should be in the passage
- Question types: Data Representation, Research Summaries, Conflicting Viewpoints

For each question:
- Include a passage describing an experiment, data table, or scientific scenario
- For Data Representation: include descriptions of graphs/tables
- For Research Summaries: describe 2-3 experiments and their results
- For Conflicting Viewpoints: present 2 opposing scientific hypotheses
- Questions should be answerable from the passage alone
- Test: reading data, identifying trends, understanding experimental design, drawing conclusions`
};

// Simulation-specific prompts for passage generation
const SIMULATION_PASSAGE_PROMPTS: Record<string, Record<string, string>> = {
  reading: {
    "Literary Fiction": `Generate a literary fiction passage (700-900 words) for ACT Reading. The passage should:
- Feature compelling characters and narrative tension
- Include descriptive language and literary devices
- Have a clear beginning, development, and conclusion
- Be from a novel, short story, or memoir`,
    "Social Science": `Generate a social science passage (700-900 words) for ACT Reading. The passage should:
- Discuss sociology, psychology, economics, or political science topics
- Present data, studies, or expert opinions
- Have a clear thesis and supporting arguments
- Include specific examples and evidence`,
    "Humanities": `Generate a humanities passage (700-900 words) for ACT Reading. The passage should:
- Cover art, music, literature, philosophy, or cultural studies
- Analyze a work, movement, or historical period
- Include specific references and examples
- Present an argument or interpretation`,
    "Natural Science": `Generate a natural science passage (700-900 words) for ACT Reading. The passage should:
- Explain a scientific concept, discovery, or phenomenon
- Include technical vocabulary with context clues
- Present research findings or scientific debates
- Be accessible to non-specialists`
  },
  science: {
    "Data Representation": `Generate a Data Representation passage for ACT Science. The passage should:
- Present a scientific phenomenon with data in tables or graphs
- Describe the experimental setup clearly
- Include 2-3 data tables/graphs (describe them in detail as text)
- Variables and units should be clearly labeled`,
    "Research Summary": `Generate a Research Summary passage for ACT Science. The passage should:
- Describe 2-3 related experiments by scientists
- Explain the hypothesis, methods, and results of each experiment
- Show how experiments build on or relate to each other
- Include specific numerical data and observations`,
    "Conflicting Viewpoints": `Generate a Conflicting Viewpoints passage for ACT Science. The passage should:
- Present 2-3 scientists or students with different hypotheses about the same phenomenon
- Each viewpoint should have supporting evidence and reasoning
- The viewpoints should be clearly distinguishable
- Do not indicate which viewpoint is correct`
  },
  english: {
    "Narrative Essay": `Generate a narrative essay passage (300-400 words) for ACT English. The passage should:
- Tell a personal story with a clear narrative arc
- Use first-person perspective
- Include dialogue and descriptive details
- Have 15 numbered sentence portions that can be tested for grammar/style`,
    "Argumentative Essay": `Generate an argumentative essay passage (300-400 words) for ACT English. The passage should:
- Present a clear argument with thesis and supporting points
- Use persuasive language and rhetorical devices
- Include counterarguments and rebuttals
- Have 15 numbered sentence portions that can be tested for grammar/style`,
    "Informative Essay": `Generate an informative essay passage (300-400 words) for ACT English. The passage should:
- Explain a topic, process, or concept clearly
- Use transitions and organized structure
- Include specific facts and examples
- Have 15 numbered sentence portions that can be tested for grammar/style`,
    "Expository Essay": `Generate an expository essay passage (300-400 words) for ACT English. The passage should:
- Investigate and explain an idea or theme
- Present balanced information and analysis
- Use cause-and-effect or compare-contrast structures
- Have 15 numbered sentence portions that can be tested for grammar/style`,
    "Personal Essay": `Generate a personal reflection essay passage (300-400 words) for ACT English. The passage should:
- Reflect on an experience, idea, or cultural topic
- Balance personal voice with broader significance
- Use descriptive and reflective language
- Have 15 numbered sentence portions that can be tested for grammar/style`
  }
};

const SKILL_DESCRIPTIONS: Record<string, string> = {
  // Math skills
  "M1.A": "Pre-Algebra: Basic operations and number properties",
  "M1.B": "Pre-Algebra: Fractions, decimals, and percents",
  "M1.C": "Pre-Algebra: Factors, multiples, and primes",
  "M2.A": "Algebra: Solving linear equations",
  "M2.B": "Algebra: Inequalities",
  "M2.C": "Algebra: Systems of equations",
  "M3.A": "Geometry: Lines and angles",
  "M3.B": "Geometry: Triangles and polygons",
  "M3.C": "Geometry: Circles",
  "M3.D": "Geometry: Area and perimeter",
  "M4.A": "Functions: Function notation and evaluation",
  "M4.B": "Functions: Graphs of functions",
  "M5.A": "Statistics: Mean, median, mode",
  "M5.B": "Statistics: Probability",
  "M6.A": "Trigonometry: Basic trig ratios",
  "M6.B": "Trigonometry: Trig identities and equations",
  // Science skills
  "S1.A": "Data Representation: Reading graphs and tables",
  "S1.B": "Data Representation: Identifying trends and patterns",
  "S1.C": "Data Representation: Interpolation and extrapolation",
  "S2.A": "Research Summaries: Understanding experimental design",
  "S2.B": "Research Summaries: Identifying variables",
  "S2.C": "Research Summaries: Drawing conclusions from experiments",
  "S3.A": "Conflicting Viewpoints: Comparing scientific hypotheses",
  "S3.B": "Conflicting Viewpoints: Identifying supporting evidence",
  "S4.A": "Scientific Reasoning: Cause and effect relationships",
  "S4.B": "Scientific Reasoning: Making predictions",
  "S5.A": "Applied Science: Biology concepts",
  "S5.B": "Applied Science: Chemistry concepts",
  "S5.C": "Applied Science: Physics concepts",
  "S5.D": "Applied Science: Earth science concepts",
  // Reading skills
  "R1.A": "Key Ideas: Main idea and central themes",
  "R1.B": "Key Ideas: Supporting details",
  "R1.C": "Key Ideas: Summarizing content",
  "R2.A": "Craft and Structure: Word meaning in context",
  "R2.B": "Craft and Structure: Author's purpose and perspective",
  "R2.C": "Craft and Structure: Text structure and organization",
  "R3.A": "Integration: Making inferences",
  "R3.B": "Integration: Comparing and contrasting",
  // English skills
  "E1.A": "Conventions: Punctuation",
  "E1.B": "Conventions: Sentence structure",
  "E1.C": "Conventions: Subject-verb agreement",
  "E2.A": "Production: Topic development",
  "E2.B": "Production: Organization and cohesion",
  "E3.A": "Knowledge: Word choice and style",
};

// Get skill codes for a section
function getSkillsForSection(section: string): string[] {
  const prefix = section.charAt(0).toUpperCase();
  return Object.keys(SKILL_DESCRIPTIONS).filter(k => k.startsWith(prefix));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role using has_role with the verified user's ID
    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin"
    });
    
    if (roleError) {
      console.error("Role check error:", roleError);
      return new Response(JSON.stringify({ error: "Failed to verify admin status" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action = "generate", section, skill_codes, count = 5, difficulty_distribution, questions: questionsToInsert } = body;

    // Handle diagnostic insert action
    if (action === "insert") {
      if (!section || !questionsToInsert || questionsToInsert.length === 0) {
        return new Response(JSON.stringify({ error: "section and questions are required for insert" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const formIds: Record<string, string> = {
        math: "D2MA",
        science: "D2SC",
        reading: "D2RD",
        english: "D2EN",
      };
      
      const sectionMap: Record<string, string> = {
        math: "Math",
        science: "Science",
        reading: "Reading",
        english: "English",
      };

      const formId = formIds[section.toLowerCase()];
      if (!formId) {
        return new Response(JSON.stringify({ error: `Invalid section: ${section}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get the current max ord for this form
      const { data: existingItems, error: fetchError } = await supabase
        .from("staging_items")
        .select("ord")
        .eq("form_id", formId)
        .order("ord", { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error("Error fetching existing items:", fetchError);
        return new Response(JSON.stringify({ error: "Failed to fetch existing items" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const startOrd = existingItems && existingItems.length > 0 
        ? existingItems[0].ord + 1 
        : 1;

      // Prepare items for insertion
      const items = questionsToInsert.map((q: GeneratedQuestion, idx: number) => ({
        form_id: formId,
        section: sectionMap[section.toLowerCase()],
        ord: startOrd + idx,
        question: q.question,
        choice_a: q.choice_a,
        choice_b: q.choice_b,
        choice_c: q.choice_c,
        choice_d: q.choice_d,
        answer: q.answer,
        explanation: q.explanation,
        skill_code: q.skill_code,
        difficulty: q.difficulty,
        passage_text: q.passage_text || null,
        passage_title: q.passage_title || null,
      }));

      console.log(`Inserting ${items.length} questions into ${formId} starting at ord ${startOrd}`);

      const { error: insertError } = await supabase
        .from("staging_items")
        .insert(items);

      if (insertError) {
        console.error("Insert error:", insertError);
        return new Response(JSON.stringify({ error: insertError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Successfully inserted ${items.length} questions`);
      return new Response(JSON.stringify({ 
        success: true, 
        inserted: items.length,
        form_id: formId 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle simulation insert action
    if (action === "insert-simulation") {
      const { form_id, questions: questionsToInsert } = body;
      
      if (!form_id || !questionsToInsert || questionsToInsert.length === 0) {
        return new Response(JSON.stringify({ error: "form_id and questions are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const sectionMap: Record<string, string> = {
        math: "Math",
        science: "Science",
        reading: "Reading",
        english: "English",
      };

      // Get the current max ord for this form
      const { data: existingItems, error: fetchError } = await supabase
        .from("staging_items")
        .select("ord")
        .eq("form_id", form_id)
        .order("ord", { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error("Error fetching existing items:", fetchError);
        return new Response(JSON.stringify({ error: "Failed to fetch existing items" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const startOrd = existingItems && existingItems.length > 0 
        ? existingItems[0].ord + 1 
        : 1;

      // Prepare items for insertion
      const items = questionsToInsert.map((q: GeneratedQuestion, idx: number) => ({
        form_id: form_id,
        section: sectionMap[section.toLowerCase()] || section,
        ord: startOrd + idx,
        question: q.question,
        choice_a: q.choice_a,
        choice_b: q.choice_b,
        choice_c: q.choice_c,
        choice_d: q.choice_d,
        answer: q.answer,
        explanation: q.explanation,
        skill_code: q.skill_code,
        difficulty: q.difficulty,
        passage_text: q.passage_text || null,
        passage_title: q.passage_title || null,
        passage_id: q.passage_id || null,
      }));

      console.log(`Inserting ${items.length} simulation questions into ${form_id} starting at ord ${startOrd}`);

      const { error: insertError } = await supabase
        .from("staging_items")
        .insert(items);

      if (insertError) {
        console.error("Insert error:", insertError);
        return new Response(JSON.stringify({ error: insertError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Successfully inserted ${items.length} simulation questions`);
      return new Response(JSON.stringify({ 
        success: true, 
        inserted: items.length,
        form_id: form_id 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle simulation generation action
    if (action === "generate-simulation") {
      const { form_id, passage_index, passage_type, questions_per_passage, batch_index, count: batchCount } = body;
      const sectionLower = section.toLowerCase();
      
      // For passage-based sections
      if (passage_type && questions_per_passage) {
        const passagePrompt = SIMULATION_PASSAGE_PROMPTS[sectionLower]?.[passage_type];
        if (!passagePrompt) {
          return new Response(JSON.stringify({ error: `Invalid passage type: ${passage_type}` }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const skills = getSkillsForSection(sectionLower);
        const skillDescriptions = skills.map(code => {
          const desc = SKILL_DESCRIPTIONS[code] || code;
          return `- ${code}: ${desc}`;
        }).join("\n");

        const systemPrompt = SECTION_PROMPTS[sectionLower];
        const userPrompt = `${passagePrompt}

After generating the passage, create exactly ${questions_per_passage} questions based on this passage.

Skills to distribute across questions:
${skillDescriptions}

CRITICAL - ANSWER DISTRIBUTION:
- Distribute correct answers EVENLY across A, B, C, and D
- Randomize where you place the correct answer for each question
- Real ACT tests have roughly 25% of answers for each letter

Difficulty distribution:
- 30% Easy, 50% Medium, 20% Hard

Each question must:
- Be directly answerable from the passage
- Have exactly 4 answer choices
- Include a detailed explanation
- Be tagged with an appropriate skill code`;

        console.log(`Generating ${passage_type} passage with ${questions_per_passage} questions for ${form_id}`);

        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "generate_passage_with_questions",
                  description: "Generate a passage with associated questions",
                  parameters: {
                    type: "object",
                    properties: {
                      passage_title: { 
                        type: "string", 
                        description: "Title of the passage" 
                      },
                      passage_text: { 
                        type: "string", 
                        description: "The full passage text" 
                      },
                      questions: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            question: { type: "string" },
                            choice_a: { type: "string" },
                            choice_b: { type: "string" },
                            choice_c: { type: "string" },
                            choice_d: { type: "string" },
                            answer: { type: "string", enum: ["A", "B", "C", "D"] },
                            explanation: { type: "string" },
                            skill_code: { type: "string" },
                            difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] }
                          },
                          required: ["question", "choice_a", "choice_b", "choice_c", "choice_d", "answer", "explanation", "skill_code", "difficulty"]
                        }
                      }
                    },
                    required: ["passage_title", "passage_text", "questions"]
                  }
                }
              }
            ],
            tool_choice: { type: "function", function: { name: "generate_passage_with_questions" } }
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("AI Gateway error:", response.status, errorText);
          
          if (response.status === 429) {
            return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
              status: 429,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          if (response.status === 402) {
            return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
              status: 402,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          
          return new Response(JSON.stringify({ error: "AI generation failed" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const data = await response.json();
        const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
        
        if (!toolCall || toolCall.function.name !== "generate_passage_with_questions") {
          console.error("No valid tool call in response");
          return new Response(JSON.stringify({ error: "AI did not return structured passage" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const args = JSON.parse(toolCall.function.arguments);
        
        console.log(`Generated passage "${args.passage_title}" with ${args.questions.length} questions`);
        
        return new Response(JSON.stringify({
          passage_title: args.passage_title,
          passage_text: args.passage_text,
          questions: args.questions,
          count: args.questions.length
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // For non-passage sections (Math)
      const skills = getSkillsForSection(sectionLower);
      const skillDescriptions = skills.map(code => {
        const desc = SKILL_DESCRIPTIONS[code] || code;
        return `- ${code}: ${desc}`;
      }).join("\n");

      const questionCount = batchCount || 10;
      const systemPrompt = SECTION_PROMPTS[sectionLower];
      const userPrompt = `Generate exactly ${questionCount} ACT ${section} questions for a full simulation test.

Skills to distribute across:
${skillDescriptions}

CRITICAL - ANSWER DISTRIBUTION:
- Distribute correct answers EVENLY across A, B, C, and D
- For ${questionCount} questions, aim for approximately ${Math.ceil(questionCount/4)} correct answers per letter
- Randomize where you place the correct answer for each question

Difficulty distribution:
- 30% Easy (questions 1-18 typically)
- 50% Medium (questions 19-45 typically)
- 20% Hard (questions 46-60 typically)

Each question must have:
- Clear, unambiguous problem statement
- Exactly 4 answer choices
- Detailed explanation
- Appropriate skill code tag`;

      console.log(`Generating ${questionCount} ${section} questions for simulation batch ${batch_index}`);

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "generate_act_questions",
                description: "Generate structured ACT test questions",
                parameters: {
                  type: "object",
                  properties: {
                    questions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          question: { type: "string" },
                          choice_a: { type: "string" },
                          choice_b: { type: "string" },
                          choice_c: { type: "string" },
                          choice_d: { type: "string" },
                          answer: { type: "string", enum: ["A", "B", "C", "D"] },
                          explanation: { type: "string" },
                          skill_code: { type: "string" },
                          difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] }
                        },
                        required: ["question", "choice_a", "choice_b", "choice_c", "choice_d", "answer", "explanation", "skill_code", "difficulty"]
                      }
                    }
                  },
                  required: ["questions"]
                }
              }
            }
          ],
          tool_choice: { type: "function", function: { name: "generate_act_questions" } }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI Gateway error:", response.status, errorText);
        
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        return new Response(JSON.stringify({ error: "AI generation failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      
      if (!toolCall || toolCall.function.name !== "generate_act_questions") {
        console.error("No valid tool call in response");
        return new Response(JSON.stringify({ error: "AI did not return structured questions" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const args = JSON.parse(toolCall.function.arguments);
      
      console.log(`Generated ${args.questions.length} questions for simulation`);
      
      return new Response(JSON.stringify({
        questions: args.questions,
        count: args.questions.length
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate action (default - for diagnostic questions)
    if (!section || !skill_codes || skill_codes.length === 0) {
      return new Response(JSON.stringify({ error: "section and skill_codes are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sectionLower = section.toLowerCase();
    const systemPrompt = SECTION_PROMPTS[sectionLower];
    if (!systemPrompt) {
      return new Response(JSON.stringify({ error: `Invalid section: ${section}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build skill descriptions for the prompt
    const skillDescriptions = skill_codes.map((code: string) => {
      const desc = SKILL_DESCRIPTIONS[code] || code;
      return `- ${code}: ${desc}`;
    }).join("\n");

    const difficultyInstructions = difficulty_distribution 
      ? `Difficulty distribution: ${JSON.stringify(difficulty_distribution)}`
      : "Mix difficulties: approximately 30% Easy, 50% Medium, 20% Hard";

    const userPrompt = `Generate exactly ${count} ACT ${section} questions.

Skills to target:
${skillDescriptions}

${difficultyInstructions}

CRITICAL - ANSWER DISTRIBUTION:
- Distribute correct answers EVENLY across A, B, C, and D
- For ${count} questions, aim for approximately ${Math.ceil(count/4)} correct answers per letter
- Do NOT cluster correct answers on A or B - this is a common AI bias you must avoid
- Real ACT tests have roughly 25% of answers for each letter
- Randomize where you place the correct answer for each question

IMPORTANT:
- Each question must have exactly 4 answer choices (A, B, C, D)
- Each question must have a clear correct answer with a detailed explanation
- Each question must be tagged with one of the provided skill codes
- For Reading and Science questions, include appropriate passage_text
- Make questions authentic to the ACT test format and difficulty
- Explanations should teach WHY the answer is correct and why others are wrong`;

    console.log(`Generating ${count} ${section} questions for skills: ${skill_codes.join(", ")}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_act_questions",
              description: "Generate structured ACT test questions",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { 
                          type: "string", 
                          description: "The question stem. For English, include the sentence with underlined portion marked." 
                        },
                        choice_a: { type: "string" },
                        choice_b: { type: "string" },
                        choice_c: { type: "string" },
                        choice_d: { type: "string" },
                        answer: { 
                          type: "string", 
                          enum: ["A", "B", "C", "D"],
                          description: "The correct answer letter"
                        },
                        explanation: { 
                          type: "string",
                          description: "Detailed explanation of why the answer is correct and why other options are wrong"
                        },
                        skill_code: { 
                          type: "string",
                          description: "The skill code this question tests"
                        },
                        difficulty: { 
                          type: "string", 
                          enum: ["Easy", "Medium", "Hard"]
                        },
                        passage_text: { 
                          type: "string",
                          description: "For Reading/Science: the passage text. For English: the full sentence/paragraph with context."
                        },
                        passage_title: { 
                          type: "string",
                          description: "Optional title for the passage"
                        }
                      },
                      required: ["question", "choice_a", "choice_b", "choice_c", "choice_d", "answer", "explanation", "skill_code", "difficulty"]
                    }
                  }
                },
                required: ["questions"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_act_questions" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    console.log("AI response:", JSON.stringify(data, null, 2));

    // Extract questions from tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "generate_act_questions") {
      console.error("No valid tool call in response");
      return new Response(JSON.stringify({ error: "AI did not return structured questions" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const args = JSON.parse(toolCall.function.arguments);
    const questions: GeneratedQuestion[] = args.questions;

    console.log(`Generated ${questions.length} questions`);

    return new Response(JSON.stringify({ 
      questions,
      count: questions.length 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-questions:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
