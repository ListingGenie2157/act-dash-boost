begin;

-- Normalize difficulties
with normalized as (
  select
    s.*,
    case s.difficulty
      when 'Easy' then 2
      when 'Medium' then 3
      when 'Hard' then 4
      else 3
    end::smallint as diff_num,
    case s.section
      when 'EN' then 'English'
      when 'MATH' then 'Math'
      when 'RD' then 'Reading'
      when 'SCI' then 'Science'
    end as subject_norm
  from public.staging_items s
)

-- 1) ensure skills exist (create new skills with UUID ids)
insert into public.skills (subject, name, cluster, description, order_index)
select distinct n.subject_norm, n.skill_code, n.subject_norm || ' Skills', 'Skill: ' || n.skill_code, 1000 + row_number() over (order by n.skill_code)
from normalized n
where not exists (
  select 1 from public.skills sk where sk.name = n.skill_code
);

-- 2) upsert passages (RD/SCI only)
insert into public.passages (id, form_id, section, passage_type, title, passage_text)
select distinct n.passage_id, n.form_id, n.section, n.passage_type, coalesce(n.passage_title, n.passage_id), n.passage_text
from normalized n
where n.section in ('RD','SCI') and n.passage_id is not null
on conflict (id) do update set
  form_id = excluded.form_id,
  section = excluded.section,
  passage_type = excluded.passage_type,
  title = excluded.title,
  passage_text = excluded.passage_text;

-- 3) insert questions (joining with skills by name to get UUID)
insert into public.questions (skill_id, stem, choice_a, choice_b, choice_c, choice_d, answer, explanation, difficulty)
select sk.id, n.question, n.choice_a, n.choice_b, n.choice_c, n.choice_d, n.answer, n.explanation, n.diff_num
from normalized n
join public.skills sk on sk.name = n.skill_code
on conflict do nothing;

-- 4) map into form_questions by joining on content
insert into public.form_questions (form_id, section, ord, question_id, passage_id)
select n.form_id, n.section, n.ord, q.id, n.passage_id
from normalized n
join public.skills sk on sk.name = n.skill_code
join public.questions q on q.skill_id = sk.id 
  and q.stem = n.question
  and q.choice_a = n.choice_a
  and q.choice_b = n.choice_b
  and q.choice_c = n.choice_c
  and q.choice_d = n.choice_d
  and q.answer = n.answer
on conflict (form_id, section, ord) do update
  set question_id = excluded.question_id,
      passage_id  = excluded.passage_id;

-- Add unique index to prevent duplicate questions by content
create unique index if not exists questions_unique_content_idx
on public.questions (stem, choice_a, choice_b, choice_c, choice_d, answer);

commit;