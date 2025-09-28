-- Apply curriculum schema and seed data manually

-- Create lessons table if not exists
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL CHECK (subject IN ('English', 'Math', 'Reading', 'Science')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  skill_code TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create questions table if not exists
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL CHECK (subject IN ('English', 'Math', 'Reading', 'Science')),
  stem TEXT NOT NULL,
  choices JSONB NOT NULL,
  answer TEXT NOT NULL,
  explanation TEXT,
  skill_code TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert seed lessons (only if table is empty)
INSERT INTO lessons (subject, title, body, skill_code)
SELECT * FROM (VALUES
  ('English', 'Subject-Verb Agreement',
   '# Subject-Verb Agreement

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
Focus on identifying the true subject by crossing out prepositional phrases.', 'E1.A'),

  ('English', 'Pronoun Case and Agreement',
   '# Pronoun Case and Agreement

## Key Rules
1. **Subject pronouns**: I, you, he, she, it, we, they
2. **Object pronouns**: me, you, him, her, it, us, them
3. **Possessive pronouns**: my/mine, your/yours, his, her/hers, its, our/ours, their/theirs

## Who vs Whom
- **Who** = subject (Who is coming?)
- **Whom** = object (To whom are you speaking?)

## Common Errors
- Its vs it''s (possessive vs contraction)
- Ambiguous pronoun reference', 'E2.A'),

  ('Math', 'Linear Equations and Inequalities',
   '# Linear Equations and Inequalities

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
- **Flip inequality sign** when multiplying/dividing by negative', 'M2.A'),

  ('Math', 'Quadratic Functions',
   '# Quadratic Functions

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
x = (-b ± √(b² - 4ac)) / 2a', 'M3.A')
) AS seed_data(subject, title, body, skill_code)
WHERE NOT EXISTS (SELECT 1 FROM lessons LIMIT 1);

-- Insert seed questions (only if table is empty)
INSERT INTO questions (subject, stem, choices, answer, explanation, skill_code)
SELECT * FROM (VALUES
  ('English', 'The team of players (A) were (B) practicing (C) their defensive strategies (D) before the big game.',
   '["were", "was", "have been", "are"]'::jsonb, 'was',
   'The subject is "team," which is a collective noun treated as singular in this context. Therefore, the verb should be "was" not "were".', 'E1.A'),

  ('English', 'Sarah gave the book to Jake and (A) I (B) me (C) myself (D) mine.',
   '["I", "me", "myself", "mine"]'::jsonb, 'me',
   'The pronoun is the object of the preposition "to," so it should be the object pronoun "me".', 'E2.A'),

  ('Math', 'What is the slope of the line passing through points (2, 5) and (6, 13)?',
   '["2", "4", "8", "1/2"]'::jsonb, '2',
   'Using the slope formula: m = (y₂ - y₁)/(x₂ - x₁) = (13 - 5)/(6 - 2) = 8/4 = 2', 'M2.A'),

  ('Math', 'If f(x) = x² - 4x + 3, what is the x-coordinate of the vertex?',
   '["1", "2", "3", "4"]'::jsonb, '2',
   'For a quadratic in standard form, the x-coordinate of the vertex is -b/2a = -(-4)/2(1) = 4/2 = 2', 'M3.A')
) AS seed_data(subject, stem, choices, answer, explanation, skill_code)
WHERE NOT EXISTS (SELECT 1 FROM questions LIMIT 1);