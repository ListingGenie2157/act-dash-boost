begin;

create table if not exists public.forms (
  id text primary key,
  label text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.passages (
  id text primary key,
  form_id text not null references public.forms(id) on delete cascade,
  section text not null check (section in ('EN','MATH','RD','SCI')),
  passage_type text not null, -- RD: Literary/Social/Humanities/Natural ; SCI: DR/RS/CV
  title text,
  passage_text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.form_questions (
  form_id text not null references public.forms(id) on delete cascade,
  section text not null check (section in ('EN','MATH','RD','SCI')),
  ord int not null check (ord > 0),
  question_id uuid not null references public.questions(id) on delete cascade,
  passage_id text null references public.passages(id) on delete set null,
  primary key (form_id, section, ord)
);

alter table public.forms enable row level security;
alter table public.passages enable row level security;
alter table public.form_questions enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename='forms' and policyname='forms_public_read')
  then create policy forms_public_read on public.forms for select using (true); end if;

  if not exists (select 1 from pg_policies where tablename='passages' and policyname='passages_public_read')
  then create policy passages_public_read on public.passages for select using (true); end if;

  if not exists (select 1 from pg_policies where tablename='form_questions' and policyname='form_questions_public_read')
  then create policy form_questions_public_read on public.form_questions for select using (true); end if;
end$$;

create or replace view public.v_form_section as
select
  fq.form_id, fq.section, fq.ord,
  q.id as question_id, q.stem as question,
  q.choice_a, q.choice_b, q.choice_c, q.choice_d, q.answer, q.explanation,
  p.id as passage_id, p.title as passage_title, p.passage_text
from public.form_questions fq
join public.questions q on q.id = fq.question_id
left join public.passages p on p.id = fq.passage_id;

commit;