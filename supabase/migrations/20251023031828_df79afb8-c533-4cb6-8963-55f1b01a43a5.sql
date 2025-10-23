-- Populate checkpoint quiz questions for E1.A, E1.B, and E2.G

UPDATE lesson_content
SET 
  checkpoint_quiz_questions = '[
    {
      "question_id": "E1A_Q1",
      "prompt": "The list of books (is/are) missing.",
      "options": ["is", "are", "was", "be"],
      "answer": "is",
      "answer_key": "A",
      "explanation": "\"is\" is correct because the subject list is singular.",
      "difficulty": "medium"
    },
    {
      "question_id": "E1A_Q2",
      "prompt": "Neither of the boys (was/were) late.",
      "options": ["was", "were", "is", "are"],
      "answer": "was",
      "answer_key": "A",
      "explanation": "\"was\" is correct because \"neither\" is singular.",
      "difficulty": "medium"
    },
    {
      "question_id": "E1A_Q3",
      "prompt": "The committee (decide/decides) on the policy.",
      "options": ["decide", "decides", "deciding", "decided"],
      "answer": "decides",
      "answer_key": "B",
      "explanation": "\"decides\" is correct since \"committee\" is a singular collective noun.",
      "difficulty": "medium"
    },
    {
      "question_id": "E1A_Q4",
      "prompt": "The players or the coach (run/runs) practice today.",
      "options": ["run", "runs", "running", "ran"],
      "answer": "runs",
      "answer_key": "B",
      "explanation": "Verb agrees with closest subject (\"coach,\" singular).",
      "difficulty": "medium"
    },
    {
      "question_id": "E1A_Q5",
      "prompt": "Either the teacher or the students (has/have) the answers.",
      "options": ["has", "have", "having", "had"],
      "answer": "have",
      "answer_key": "B",
      "explanation": "\"have\" is correct because closest subject \"students\" is plural.",
      "difficulty": "medium"
    },
    {
      "question_id": "E1A_Q6",
      "prompt": "Each of the employees (give/gives) their best.",
      "options": ["give", "gives", "giving", "gave"],
      "answer": "gives",
      "answer_key": "B",
      "explanation": "\"Each\" is singular so use \"gives.\"",
      "difficulty": "medium"
    },
    {
      "question_id": "E1A_Q7",
      "prompt": "The team (is/are) planning a trip.",
      "options": ["is", "are", "was", "were"],
      "answer": "is",
      "answer_key": "A",
      "explanation": "\"Team\" is a collective noun acting as one unit.",
      "difficulty": "medium"
    },
    {
      "question_id": "E1A_Q8",
      "prompt": "The bouquet of roses (smell/smells) fresh.",
      "options": ["smell", "smells", "smelled", "smelling"],
      "answer": "smells",
      "answer_key": "B",
      "explanation": "Subject \"bouquet\" is singular.",
      "difficulty": "medium"
    },
    {
      "question_id": "E1A_Q9",
      "prompt": "Many of the students (was/were) excited.",
      "options": ["was", "were", "is", "are"],
      "answer": "were",
      "answer_key": "B",
      "explanation": "\"Many\" is plural so use \"were.\"",
      "difficulty": "medium"
    },
    {
      "question_id": "E1A_Q10",
      "prompt": "Either the dogs or the cat (need/needs) to eat.",
      "options": ["need", "needs", "needed", "needing"],
      "answer": "needs",
      "answer_key": "B",
      "explanation": "Verb matches closest subject \"cat\" (singular).",
      "difficulty": "medium"
    }
  ]'::jsonb,
  objectives = ARRAY['Master subject-verb agreement', 'Identify and correct common ACT agreement traps', 'Apply rules with compound and indefinite subjects'],
  estimated_minutes = 20,
  difficulty = 'medium'
WHERE skill_code = 'E1.A';

UPDATE lesson_content
SET 
  checkpoint_quiz_questions = '[
    {
      "question_id": "E1B_Q1",
      "prompt": "She runs down the hill and (falls/fell) into the stream.",
      "options": ["falls", "fell", "falling", "fallen"],
      "answer": "falls",
      "answer_key": "A",
      "explanation": "\"falls\" is correct because both verbs describe actions happening in the present.",
      "difficulty": "medium"
    },
    {
      "question_id": "E1B_Q2",
      "prompt": "Yesterday, Maria (drives/drove) to the airport and parked her car.",
      "options": ["drives", "drove", "driving", "driven"],
      "answer": "drove",
      "answer_key": "B",
      "explanation": "\"drove\" matches the past-time cue \"yesterday.\"",
      "difficulty": "medium"
    },
    {
      "question_id": "E1B_Q3",
      "prompt": "He (has/had) finished dinner before the guests arrived.",
      "options": ["has", "had", "having", "have"],
      "answer": "had",
      "answer_key": "B",
      "explanation": "\"had\" shows an earlier past event before another past event.",
      "difficulty": "medium"
    },
    {
      "question_id": "E1B_Q4",
      "prompt": "When I was young, I (play/played) guitar every day.",
      "options": ["play", "played", "playing", "plays"],
      "answer": "played",
      "answer_key": "B",
      "explanation": "\"played\" is correct because the sentence describes a habitual past action.",
      "difficulty": "medium"
    },
    {
      "question_id": "E1B_Q5",
      "prompt": "The team (celebrates/celebrated) their victory last night.",
      "options": ["celebrates", "celebrated", "celebrating", "celebrate"],
      "answer": "celebrated",
      "answer_key": "B",
      "explanation": "\"celebrated\" is correct because \"last night\" signals past tense.",
      "difficulty": "medium"
    },
    {
      "question_id": "E1B_Q6",
      "prompt": "If she (studies/studied) harder, she would have passed.",
      "options": ["studies", "studied", "studying", "study"],
      "answer": "studied",
      "answer_key": "B",
      "explanation": "\"studied\" maintains the past hypothetical condition required by \"would have passed.\"",
      "difficulty": "medium"
    },
    {
      "question_id": "E1B_Q7",
      "prompt": "He said he (is/was) tired.",
      "options": ["is", "was", "were", "been"],
      "answer": "was",
      "answer_key": "B",
      "explanation": "\"was\" is correct because reported speech after \"said\" uses past tense.",
      "difficulty": "medium"
    },
    {
      "question_id": "E1B_Q8",
      "prompt": "By the time I arrived, she (has/had) left.",
      "options": ["has", "had", "have", "having"],
      "answer": "had",
      "answer_key": "B",
      "explanation": "\"had\" indicates her departure happened before my arrival.",
      "difficulty": "medium"
    },
    {
      "question_id": "E1B_Q9",
      "prompt": "We (watch/watched) the movie and enjoyed it.",
      "options": ["watch", "watched", "watching", "watches"],
      "answer": "watched",
      "answer_key": "B",
      "explanation": "\"watched\" is consistent past tense with \"enjoyed.\"",
      "difficulty": "medium"
    },
    {
      "question_id": "E1B_Q10",
      "prompt": "He (thinks/thought) about his trip while packing yesterday.",
      "options": ["thinks", "thought", "thinking", "think"],
      "answer": "thought",
      "answer_key": "B",
      "explanation": "\"thought\" aligns with the past-time cue \"yesterday.\"",
      "difficulty": "medium"
    }
  ]'::jsonb,
  objectives = ARRAY['Maintain consistent verb tense in context', 'Identify ACT verb consistency traps', 'Use time cues to choose correct tense'],
  estimated_minutes = 20,
  difficulty = 'medium'
WHERE skill_code = 'E1.B';

UPDATE lesson_content
SET 
  checkpoint_quiz_questions = '[
    {
      "question_id": "E2G_Q1",
      "prompt": "Each of the employees gave (his/their) best effort.",
      "options": ["his", "their", "him", "them"],
      "answer": "his",
      "answer_key": "A",
      "explanation": "\"his\" is correct because \"each\" is singular",
      "difficulty": "medium"
    },
    {
      "question_id": "E2G_Q2",
      "prompt": "The group submitted (its/their) proposal.",
      "options": ["its", "their", "it", "they"],
      "answer": "its",
      "answer_key": "A",
      "explanation": "\"its\" is correct because \"group\" is a singular collective noun",
      "difficulty": "medium"
    },
    {
      "question_id": "E2G_Q3",
      "prompt": "Both of the musicians tuned (his/their) instruments.",
      "options": ["his", "their", "them", "it"],
      "answer": "their",
      "answer_key": "B",
      "explanation": "\"their\" is correct because \"both\" is plural",
      "difficulty": "medium"
    },
    {
      "question_id": "E2G_Q4",
      "prompt": "If anyone arrives early, give (him/their) a seat.",
      "options": ["him", "their", "them", "his"],
      "answer": "him",
      "answer_key": "A",
      "explanation": "\"him\" is correct because \"anyone\" is singular",
      "difficulty": "medium"
    },
    {
      "question_id": "E2G_Q5",
      "prompt": "Neither of the candidates shared (his/their) ideas clearly.",
      "options": ["his", "their", "them", "its"],
      "answer": "his",
      "answer_key": "A",
      "explanation": "\"his\" is correct because \"neither\" is singular",
      "difficulty": "medium"
    },
    {
      "question_id": "E2G_Q6",
      "prompt": "The company and its partners announced (its/their) plan.",
      "options": ["its", "their", "them", "his"],
      "answer": "their",
      "answer_key": "B",
      "explanation": "\"their\" is correct because compound subject requires plural pronoun",
      "difficulty": "medium"
    },
    {
      "question_id": "E2G_Q7",
      "prompt": "Everybody loves (his/their) family.",
      "options": ["his", "their", "them", "it"],
      "answer": "his",
      "answer_key": "A",
      "explanation": "\"his\" is correct because \"everybody\" is singular",
      "difficulty": "medium"
    },
    {
      "question_id": "E2G_Q8",
      "prompt": "The jury reached (its/their) decision.",
      "options": ["its", "their", "it", "they"],
      "answer": "its",
      "answer_key": "A",
      "explanation": "\"its\" is correct because \"jury\" is singular collective noun",
      "difficulty": "medium"
    },
    {
      "question_id": "E2G_Q9",
      "prompt": "Several of the students forgot (his/their) ID cards.",
      "options": ["his", "their", "them", "it"],
      "answer": "their",
      "answer_key": "B",
      "explanation": "\"their\" is correct because \"several\" is plural",
      "difficulty": "medium"
    },
    {
      "question_id": "E2G_Q10",
      "prompt": "When Jane met Sarah, she hugged (her/she).",
      "options": ["her", "she", "them", "him"],
      "answer": "her",
      "answer_key": "A",
      "explanation": "\"her\" is correct because \"she\" is the subject pronoun and cannot function as the object",
      "difficulty": "medium"
    }
  ]'::jsonb,
  objectives = ARRAY['Master pronoun-antecedent agreement', 'Eliminate ambiguous pronoun references', 'Apply ACT pronoun case and agreement rules'],
  estimated_minutes = 20,
  difficulty = 'medium'
WHERE skill_code = 'E2.G';