-- Milestone 1 metadata columns for study planning tasks
alter table if exists public.study_tasks
  add column if not exists phase integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'study_tasks_phase_check'
      and conrelid = 'public.study_tasks'::regclass
  ) then
    alter table public.study_tasks
      add constraint study_tasks_phase_check
      check (phase is null or phase in (0, 1, 2, 3));
  end if;
end $$;

alter table if exists public.study_tasks
  add column if not exists time_limit_seconds integer;

alter table if exists public.study_tasks
  add column if not exists is_critical boolean default true;

alter table if exists public.study_plan_days
  add column if not exists is_light_day boolean default false;
