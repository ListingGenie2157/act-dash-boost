-- Seed 5 lessons into lesson_content (basic content, quizzes can be added later)
BEGIN;

DELETE FROM lesson_content 
WHERE skill_code IN ('E1.A','E1.B','E2.G','E3.A','E3.C');

INSERT INTO lesson_content (
  skill_code,
  overview_html,
  concept_explanation,
  guided_practice,
  common_traps,
  independent_practice,
  independent_practice_answers,
  objectives,
  estimated_minutes,
  difficulty
) VALUES
-- E1.A Subject–Verb Agreement
('E1.A',
$$By the end of this lesson, you’ll correctly identify sentence subjects and select verbs that agree in number, even in ACT questions with intervening phrases or misleading nouns.$$,
$$Rule 1 – Singular subjects take singular verbs: The cat runs fast.  Rule 2 – Plural subjects take plural verbs: The cats run fast.  Rule 3 – Ignore prepositional phrases: The bouquet of roses is lovely.  Rule 4 – Compound subjects joined by “and” are plural: Tom and Lisa are friends.  Rule 5 – “Or/Nor” constructions agree with the closer subject: Neither the boys nor the girl runs.  Rule 6 – Indefinite pronouns: singular (each, everyone, anybody); plural (few, many, several).  Rule 7 – Collective nouns (team, committee) are usually singular.$$,
$$Example 1: The list of items (is/are) on the desk → Subject = list → Correct: is.  Example 2: Neither of the players (was/were) late → Subject = neither → Correct: was.  Example 3: The committee (decide/decides) the schedule → Subject = committee → Correct: decides.$$,
$$1 – Prepositional phrases between subject and verb confuse number. 2 – Words ending in “s” that are singular (news, mathematics). 3 – “Or/Nor” proximity errors. 4 – Collective nouns misread as plural. 5 – Indefinite pronouns incorrectly treated as plural.$$,
$$1. The bouquet of flowers (is/are) on the table. 2. Each of the students (was/were) ready. 3. The dogs or the cat (need/needs) to eat first. 4. The team (win/wins) every season. 5. Neither of the answers (was/were) correct. 6. The list of items (is/are) complete. 7. The players and the coach (was/were) celebrating. 8. Either the teacher or the students (has/have) the key. 9. The data (is/are) accurate. 10. Mathematics (is/are) challenging.$$,
$$1 is; 2 was; 3 needs; 4 wins; 5 was; 6 is; 7 were; 8 have; 9 are; 10 is.$$,
ARRAY['Master subject-verb agreement','Identify and correct common ACT agreement traps','Apply rules with compound and indefinite subjects'],
20,
'medium'
),
-- E2.G Pronoun Usage (Agreement)
('E2.G',
$$By the end of this lesson, you’ll correctly use pronouns that agree with their antecedents, avoid ambiguous references, and apply ACT rules for singular, plural, and collective pronouns.$$,
$$Rule 1: Agreement in Number – Singular antecedent → singular pronoun (Each student brought his pencil). Plural antecedent → plural pronoun (All students brought their pencils). Rule 2: Collective Nouns – Usually singular (The committee gave its decision). Rule 3: Indefinite Pronouns – Always singular: each, everyone, anybody, neither. Always plural: both, few, many, several. Rule 4: Avoid Ambiguity – A pronoun must clearly refer to one noun only. Bad: When Sam met Alex, he smiled. Fixed: When Sam met Alex, Sam smiled. Rule 5: Case – Subject pronouns: I, he, she, they, we. Object pronouns: me, him, her, them, us.$$,
$$Example 1: Each of the students brought (his/their) homework. Antecedent = each (singular) → Correct: his. Example 2: The company announced (its/their) decision. Antecedent = company (singular) → Correct: its. Example 3: Both of the runners improved (his/their) times. Antecedent = both (plural) → Correct: their.$$,
$$1. Ambiguous references – Avoid unclear “he/she/they.” 2. Singular pronouns that sound plural – everyone, each, somebody. 3. Collective nouns – company, family, team take singular pronouns. 4. Pronoun case errors – use subject pronouns as subjects, object pronouns as objects.$$,
$$1. Neither of the teachers brought (his/their) notes. 2. Every student opened (his/their) book. 3. The committee presented (its/their) final report. 4. If anyone calls, tell (him/their) I’ll return soon. 5. Both of the cars lost (its/their) wheels. 6. Each of the boys brought (his/their) lunch. 7. The company gave (its/their) employees bonuses. 8. Everyone should check (his/their) answers twice. 9. Somebody left (his/their) phone on the desk. 10. The family celebrated (its/their) holiday together.$$,
$$1. his – neither is singular. 2. his – every student is singular. 3. its – committee is singular. 4. him – anyone is singular. 5. their – both is plural. 6. his – each is singular. 7. its – company is singular. 8. his – everyone is singular. 9. his – somebody is singular. 10. its – family is singular collective.$$,
ARRAY['Master pronoun-antecedent agreement','Eliminate ambiguous pronoun references','Apply ACT pronoun case and agreement rules'],
20,
'medium'
),
-- E1.B Verb Tense Consistency
('E1.B',
$$By the end of this lesson, you’ll maintain consistent verb tense within and across sentences, recognize context cues for time shifts, and correct ACT-style verb consistency errors.$$,
$$Rule 1: Maintain a consistent tense within a sentence unless a time change is indicated. Example: Incorrect – She runs to the store and bought milk. Correct – She runs to the store and buys milk. Rule 2: Use context clues (time indicators such as yesterday, now, tomorrow) to determine tense. Example: Yesterday → past tense, Now → present, Tomorrow → future. Rule 3: Match tense to narrative context: ACT passages often use consistent past tense unless otherwise specified. Rule 4: Be cautious with participles and helping verbs: “has walked” vs “walked” differ in aspect.$$,
$$Example 1: Incorrect – The dog barked loudly and chases the mailman. Correct – The dog barked loudly and chased the mailman. Example 2: Incorrect – She studies for the exam and passed easily. Correct – She studied for the exam and passed easily. Example 3: Incorrect – He was running when he trips. Correct – He was running when he tripped.$$,
$$1. Mixed tenses in compound predicates (e.g., walked and eats). 2. Time-shift words causing unnecessary changes (e.g., yesterday + present tense). 3. Misuse of helping verbs (has/had/have). 4. Tense inconsistency across dependent clauses.$$,
$$1. She ran to the store and (buys/bought) milk. 2. They (were/are) playing soccer yesterday. 3. He (writes/wrote) the essay last week. 4. I (am/were) happy when I saw the result. 5. We (study/studied) for the test and passed. 6. The teacher (explains/explained) the rules before the quiz. 7. While I (walked/walk) to school, it started to rain. 8. By the time they arrived, the movie (has/had) started. 9. He (plays/played) basketball when he was a child. 10. The bird (flew/flies) away when the door opened.$$,
$$1. bought – consistent past tense. 2. were – “yesterday” requires past tense. 3. wrote – “last week” requires past tense. 4. was – past event needs past tense verb. 5. studied – consistent past tense. 6. explained – “before the quiz” indicates past. 7. walked – past tense aligns with “started to rain.” 8. had – past perfect indicates earlier event. 9. played – past action from “when he was a child.” 10. flew – action already completed in past.$$,
ARRAY['Maintain consistent verb tense in context','Identify ACT verb consistency traps','Use time cues to choose correct tense'],
20,
'medium'
),
-- E3.A Modifier Placement
('E3.A',
$$By the end of this lesson, you’ll correctly place modifiers—words, phrases, or clauses that describe other parts of a sentence—so that sentences are clear and free from misplaced or dangling modifiers.$$,
$$Rule 1 – Place modifiers next to the word they modify. Example: Incorrect: She almost drove her kids to school every day. → Correct: She drove her kids to school almost every day.  Rule 2 – Avoid misplaced modifiers: a modifier too far from its target causes confusion. Example: Running down the hall, the backpack fell off. → Correct: Running down the hall, the student dropped the backpack.  Rule 3 – Avoid dangling modifiers: ensure the modifier has a clear subject. Example: While reading the book, the phone rang. → While I was reading the book, the phone rang.  Rule 4 – Keep descriptive phrases near what they describe. Example: Covered in mud, the dog barked loudly.$$,
$$Misuse Example: Covered in sprinkles, the girl ate the cupcake. → Implies the girl is covered in sprinkles. Fix: The girl ate the cupcake covered in sprinkles.  Example 2: To finish on time, the project must be worked on daily. → Fix: To finish on time, we must work on the project daily.  Example 3: Walking through the park, the flowers smelled lovely. → Fix: Walking through the park, I noticed the flowers smelled lovely.$$,
$$1. Misplaced modifiers that seem to describe the wrong noun. 2. Dangling modifiers missing a subject. 3. Adverbs placed incorrectly (e.g., “She almost failed every test” vs “She failed almost every test”). 4. Long modifying phrases too far from target noun.$$,
$$1. Running down the street, the dog chased the ball. 2. To improve your grades, effort must be made daily. 3. Covered in paint, the artist admired his work. 4. After finishing the book, the movie was disappointing. 5. Eager to please, the cookies were baked by the children. 6. While eating lunch, the storm began suddenly. 7. Covered in mud, the car sparkled after washing. 8. To earn a promotion, hard work and teamwork are essential. 9. Hoping to win, the trophy gleamed on the shelf. 10. Walking home, the lights of the city amazed her.$$,
$$1. Correct – dog is logical subject. 2. Incorrect – dangling; revise: “you must make effort daily.” 3. Correct – artist is subject. 4. Incorrect – revise: “After finishing the book, I found the movie disappointing.” 5. Incorrect – revise: “Eager to please, the children baked cookies.” 6. Incorrect – revise: “While we were eating lunch, the storm began.” 7. Correct – car is logical subject. 8. Correct – clear purpose modifier. 9. Incorrect – revise: “Hoping to win, she admired the trophy.” 10. Correct – logical subject.$$,
ARRAY['Recognize and correct misplaced and dangling modifiers','Maintain logical sentence structure','Identify ACT modifier placement traps'],
20,
'medium'
),
-- E3.C Parallel Structure
('E3.C',
$$By the end of this lesson, you’ll write and recognize grammatically parallel structures, ensuring all elements in a list or comparison match in grammatical form.$$,
$$Rule 1 – Items in a series must have the same grammatical form. Example: She likes running, hiking, and swimming. not She likes running, hiking, and to swim.  Rule 2 – With paired conjunctions (both…and, either…or, not only…but also), balance the elements. Example: He is not only smart but also hardworking.  Rule 3 – In comparisons (than, as), keep structures consistent. Example: She would rather read than write.  Rule 4 – Maintain parallel infinitives or gerunds: to read, to write, and to think or reading, writing, and thinking.$$,
$$Misuse Example: The job requires honesty, to work hard, and being on time. → Fix: The job requires honesty, hard work, and punctuality.  Example 2: He wanted to learn French, Spanish, and how to speak Italian. → Fix: He wanted to learn French, Spanish, and Italian.  Example 3: Either you start now or to wait until later. → Fix: Either start now or wait until later.$$,
$$1. Mixing gerunds and infinitives in lists. 2. Forgetting to repeat “to” or “that” in a series when needed. 3. Unequal structures in comparisons (e.g., “better than to cook”). 4. Paired conjunction imbalance: “both X as well as Y” (wrong). Correct: “both X and Y.”$$,
$$1. She likes (to run, running) and (to swim, swimming). 2. The coach told players to warm up, (stretching/stretch), and (to hydrate/hydrate). 3. The policy demands honesty, integrity, and (being punctual/punctuality). 4. He’s not only tall but also (quick/quickly). 5. Either (study/studying) now or (to relax/relax) later. 6. The teacher asked us to read, to annotate, and (writing/to write) essays. 7. The manager values employees who are honest, efficient, and (creativity/creative). 8. We should save energy by turning off lights, unplugging chargers, and (close/closing) windows. 9. She would rather (cook/to cook) than (to clean/clean). 10. The car is designed for speed, comfort, and (safe/safety).$$,
$$1. to run / to swim  2. stretch / hydrate  3. punctuality  4. quick  5. study / relax  6. to write  7. creative  8. closing  9. cook / clean  10. safety$$,
ARRAY['Recognize and apply parallel grammatical structure','Correct faulty parallelism in lists and comparisons','Identify ACT-style parallelism traps'],
20,
'medium'
);

COMMIT;