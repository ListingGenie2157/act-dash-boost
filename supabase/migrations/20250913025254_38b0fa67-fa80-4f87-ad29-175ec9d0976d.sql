create table if not exists public.staging_items (
  staging_id bigserial primary key,
  form_id text not null,
  section text not null check (section in ('EN','MATH','RD','SCI')),
  ord int not null,
  passage_id text null,
  passage_type text null,
  passage_title text null,
  passage_text text null,
  topic text null,
  skill_code text not null,
  difficulty text not null, -- 'Easy'|'Medium'|'Hard'
  question text not null,
  choice_a text not null,
  choice_b text not null,
  choice_c text not null,
  choice_d text not null,
  answer text not null check (answer in ('A','B','C','D')),
  explanation text null
);