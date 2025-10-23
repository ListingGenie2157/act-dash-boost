-- Populate checkpoint quiz questions for E3.A and E3.C

UPDATE lesson_content
SET 
  checkpoint_quiz_questions = '[
    {
      "question_id": "E3A_Q1",
      "prompt": "Running across the yard, the fence tripped the boy.",
      "options": ["Correct as is", "The boy tripped over the fence while running across the yard.", "Running across the yard, the boy tripped over the fence.", "The fence, running across the yard, tripped the boy."],
      "answer": "Running across the yard, the boy tripped over the fence.",
      "answer_key": "C",
      "explanation": "Option C corrects the misplaced modifier so \"running\" clearly refers to \"the boy.\"",
      "difficulty": "medium"
    },
    {
      "question_id": "E3A_Q2",
      "prompt": "While reading the article, the power went out.",
      "options": ["Correct as is", "The power went out while reading the article.", "While reading the article, I lost power.", "Reading the article, the power went out suddenly."],
      "answer": "While reading the article, I lost power.",
      "answer_key": "C",
      "explanation": "Option C fixes the dangling modifier by adding a logical subject (\"I\").",
      "difficulty": "medium"
    },
    {
      "question_id": "E3A_Q3",
      "prompt": "To complete the project, planning is essential by the students.",
      "options": ["Correct as is", "The students must plan to complete the project.", "To complete the project, essential planning is required.", "Planning is essential to the students completing the project."],
      "answer": "The students must plan to complete the project.",
      "answer_key": "B",
      "explanation": "Option B provides a clear subject performing the action (\"students\").",
      "difficulty": "medium"
    },
    {
      "question_id": "E3A_Q4",
      "prompt": "Covered in snow, the hikers admired the mountains.",
      "options": ["Correct as is", "The mountains, covered in snow, were admired by the hikers.", "The hikers covered in snow admired the mountains.", "Both B and C are correct."],
      "answer": "Both B and C are correct.",
      "answer_key": "D",
      "explanation": "Both B and C correctly clarify the relationship between modifier and noun.",
      "difficulty": "medium"
    },
    {
      "question_id": "E3A_Q5",
      "prompt": "Hoping to finish early, the assignment took all night.",
      "options": ["Correct as is", "Hoping to finish early, I worked on the assignment all night.", "The assignment, hoping to finish early, took all night.", "To finish early, the assignment took all night."],
      "answer": "Hoping to finish early, I worked on the assignment all night.",
      "answer_key": "B",
      "explanation": "Option B corrects the dangling modifier by adding the subject \"I.\"",
      "difficulty": "medium"
    },
    {
      "question_id": "E3A_Q6",
      "prompt": "The student nearly completed every assignment.",
      "options": ["Correct as is", "The student completed nearly every assignment.", "Nearly every assignment was completed by the student.", "Both B and C are acceptable."],
      "answer": "Both B and C are acceptable.",
      "answer_key": "D",
      "explanation": "Both B and C fix the misplaced adverb \"nearly.\"",
      "difficulty": "medium"
    },
    {
      "question_id": "E3A_Q7",
      "prompt": "To pass the test, studying must happen every day.",
      "options": ["Correct as is", "You must study every day to pass the test.", "To pass the test, every day you study.", "Studying to pass the test must happen daily."],
      "answer": "You must study every day to pass the test.",
      "answer_key": "B",
      "explanation": "Option B adds a logical subject and natural phrasing.",
      "difficulty": "medium"
    },
    {
      "question_id": "E3A_Q8",
      "prompt": "Walking to school, the backpack broke its strap.",
      "options": ["Correct as is", "The backpack, walking to school, broke its strap.", "While walking to school, I broke my backpack strap.", "While I walked, the backpack broke its strap."],
      "answer": "While walking to school, I broke my backpack strap.",
      "answer_key": "C",
      "explanation": "Option C removes the dangling modifier and assigns a subject.",
      "difficulty": "medium"
    },
    {
      "question_id": "E3A_Q9",
      "prompt": "Covered in frosting, the baker decorated the cake.",
      "options": ["Correct as is", "The cake, covered in frosting, was decorated by the baker.", "Covered in frosting, the cake was decorated by the baker.", "The baker covered in frosting decorated the cake."],
      "answer": "The baker covered in frosting decorated the cake.",
      "answer_key": "D",
      "explanation": "Option D makes sense—the baker is the one covered in frosting, not the cake.",
      "difficulty": "medium"
    },
    {
      "question_id": "E3A_Q10",
      "prompt": "To get better results, regular practice is needed by the athlete.",
      "options": ["Correct as is", "To get better results, the athlete must practice regularly.", "Regular practice by the athlete to get better results is needed.", "The athlete, to get better results, needs regular practice."],
      "answer": "To get better results, the athlete must practice regularly.",
      "answer_key": "B",
      "explanation": "Option B clarifies subject and improves modifier placement.",
      "difficulty": "medium"
    }
  ]'::jsonb,
  objectives = ARRAY['Recognize and correct misplaced and dangling modifiers', 'Maintain logical sentence structure', 'Identify ACT modifier placement traps'],
  estimated_minutes = 20,
  difficulty = 'medium'
WHERE skill_code = 'E3.A';

UPDATE lesson_content
SET 
  checkpoint_quiz_questions = '[
    {
      "question_id": "E3C_Q1",
      "prompt": "The company values employees who are hardworking, creative, and (dedication/dedicated).",
      "options": ["dedication", "dedicated", "dedicationly", "dedicate"],
      "answer": "dedicated",
      "answer_key": "B",
      "explanation": "\"dedicated\" is correct; it matches the adjective forms \"hardworking\" and \"creative.\"",
      "difficulty": "medium"
    },
    {
      "question_id": "E3C_Q2",
      "prompt": "She enjoys reading, writing, and (to paint/painting).",
      "options": ["to paint", "painting", "paints", "painted"],
      "answer": "painting",
      "answer_key": "B",
      "explanation": "\"painting\" is correct; all items must be gerunds (-ing forms).",
      "difficulty": "medium"
    },
    {
      "question_id": "E3C_Q3",
      "prompt": "He wanted to learn to code, to design, and (build/to build) websites.",
      "options": ["build", "to build", "building", "built"],
      "answer": "to build",
      "answer_key": "B",
      "explanation": "\"to build\" is correct; all items should be infinitives.",
      "difficulty": "medium"
    },
    {
      "question_id": "E3C_Q4",
      "prompt": "The manager is responsible for planning, organizing, and (to lead/leading) meetings.",
      "options": ["to lead", "leading", "lead", "led"],
      "answer": "leading",
      "answer_key": "B",
      "explanation": "\"leading\" is correct; keeps gerund form consistent.",
      "difficulty": "medium"
    },
    {
      "question_id": "E3C_Q5",
      "prompt": "Either start now or (to wait/wait) later.",
      "options": ["to wait", "wait", "waiting", "waits"],
      "answer": "wait",
      "answer_key": "B",
      "explanation": "\"wait\" is correct because both verbs share the same base form.",
      "difficulty": "medium"
    },
    {
      "question_id": "E3C_Q6",
      "prompt": "He is both intelligent and (ambition/ambitious).",
      "options": ["ambition", "ambitious", "ambitioned", "ambitiously"],
      "answer": "ambitious",
      "answer_key": "B",
      "explanation": "\"ambitious\" is correct; matches adjective form \"intelligent.\"",
      "difficulty": "medium"
    },
    {
      "question_id": "E3C_Q7",
      "prompt": "The company expects employees to arrive on time, dress professionally, and (to behave/behaving) respectfully.",
      "options": ["to behave", "behaving", "behaves", "behavior"],
      "answer": "to behave",
      "answer_key": "A",
      "explanation": "\"to behave\" is correct; keeps infinitive form consistent.",
      "difficulty": "medium"
    },
    {
      "question_id": "E3C_Q8",
      "prompt": "We should either take the bus or (drive/driving) ourselves.",
      "options": ["drive", "driving", "drove", "drives"],
      "answer": "drive",
      "answer_key": "A",
      "explanation": "\"drive\" matches \"take\" in base form.",
      "difficulty": "medium"
    },
    {
      "question_id": "E3C_Q9",
      "prompt": "She would rather sing than (to dance/dance).",
      "options": ["to dance", "dance", "dancing", "dances"],
      "answer": "dance",
      "answer_key": "B",
      "explanation": "\"dance\" matches \"sing\" as a base verb.",
      "difficulty": "medium"
    },
    {
      "question_id": "E3C_Q10",
      "prompt": "The proposal aims to improve efficiency, reduce waste, and (creating/create) new jobs.",
      "options": ["creating", "create", "created", "creates"],
      "answer": "create",
      "answer_key": "B",
      "explanation": "\"create\" is correct; maintains infinitive phrase consistency (\"to improve,\" \"to reduce,\" \"to create\").",
      "difficulty": "medium"
    }
  ]'::jsonb,
  objectives = ARRAY['Recognize and apply parallel grammatical structure', 'Correct faulty parallelism in lists and comparisons', 'Identify ACT-style parallelism traps'],
  estimated_minutes = 20,
  difficulty = 'medium'
WHERE skill_code = 'E3.C';