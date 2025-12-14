-- Create profiles table if it doesn't exist
create table if not exists public.profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  test_date date,
  daily_time_cap_mins int not null default 30,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Create policies conditionally to avoid conflicts
do $$
begin
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='profiles sel own') then
    create policy "profiles sel own" on public.profiles for select using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='profiles ins self') then
    create policy "profiles ins self" on public.profiles for insert with check (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where tablename='profiles' and policyname='profiles upd own') then
    create policy "profiles upd own" on public.profiles for update using (auth.uid() = id);
  end if;
end $$;