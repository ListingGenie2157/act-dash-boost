-- Process staging data into curriculum tables
-- Step 1: First fix missing skill codes
-- Step 2: Then process into main tables

begin;

-- Step 1: Generate skill codes from topics where missing
update public.staging_items si
set skill_code = case lower(si.section)
  when 'english' then coalesce(nullif('en_' || lower(regexp_replace(topic, '[^a-z0-9]+', '_', 'g')), 'en_'), 'en_general')
  when 'math'    then coalesce(nullif('ma_' || lower(regexp_replace(topic, '[^a-z0-9]+', '_', 'g')), 'ma_'), 'ma_general')
  when 'reading' then coalesce(nullif('rd_' || lower(regexp_replace(topic, '[^a-z0-9]+', '_', 'g')), 'rd_'), 'rd_general')
  when 'science' then coalesce(nullif('sc_' || lower(regexp_replace(topic, '[^a-z0-9]+', '_', 'g')), 'sc_'), 'sc_general')
  else si.skill_code
end
where (si.skill_code is null or si.skill_code = '')
  and lower(si.section) in ('english','math','reading','science');

-- Step 2: Process staging data
with normalized as (
  select
    s.*,
    -- Extract form letter (FA_MA -> A) and section code
    substring(s.form_id from 2 for 1) as form_letter, -- FA_MA -> A
    case lower(s.section)
      when 'english' then 'EN'
      when 'math' then 'MATH'
      when 'reading' then 'RD'
      when 'science' then 'SCI'
    end as section_code,
    -- Normalize difficulty to numbers
    case lower(s.difficulty)
      when 'easy' then 2
      when 'medium' then 3
      when 'hard' then 4
      else 3
    end::smallint as diff_num,
    -- Keep original section name for subject
    initcap(s.section) as subject_norm
  from public.staging_items s
  where s.skill_code is not null and s.skill_code != ''
)

-- 1) Ensure skills exist
insert into public.skills (id, subject, name, cluster, order_index, created_at)
select distinct
  n.skill_code,
  n.subject_norm,
  n.skill_code,
  n.subject_norm,
  0,
  now()
from normalized n
on conflict (id) do nothing;

-- 2) Upsert passages (RD/SCI only)
insert into public.passages (id, form_id, section, passage_type, title, passage_text, created_at)
select distinct
  n.passage_id,
  n.form_letter,
  n.section_code,
  coalesce(n.passage_type, 'General'),
  coalesce(n.passage_title, n.passage_id),
  n.passage_text,
  now()
from normalized n
where n.section_code in ('RD','SCI')
  and n.passage_id is not null
  and n.passage_text is not null
on conflict (id) do update set
  form_id = excluded.form_id,
  section = excluded.section,
  passage_type = excluded.passage_type,
  title = excluded.title,
  passage_text = excluded.passage_text;

-- 3) Insert questions
insert into public.questions (skill_id, subject, stem, choice_a, choice_b, choice_c, choice_d, answer, explanation, difficulty, created_at)
select
  n.skill_code,
  n.subject_norm,
  n.question,
  n.choice_a,
  n.choice_b,
  n.choice_c,
  n.choice_d,
  n.answer,
  n.explanation,
  n.diff_num,
  now()
from normalized n
on conflict do nothing;

-- 4) Map into form_questions by joining on content to find question IDs
insert into public.form_questions (form_id, section, ord, question_id, passage_id)
select
  n.form_letter,
  n.section_code,
  n.ord,
  q.id,
  n.passage_id
from normalized n
join public.questions q
  on q.stem = n.question
 and q.choice_a = n.choice_a
 and q.choice_b = n.choice_b
 and q.choice_c = n.choice_c
 and q.choice_d = n.choice_d
 and q.answer = n.answer
on conflict (form_id, section, ord) do update
  set question_id = excluded.question_id,
      passage_id = excluded.passage_id;

commit;