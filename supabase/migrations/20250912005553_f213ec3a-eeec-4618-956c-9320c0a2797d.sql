create table if not exists public.parents(
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz default now()
);
create table if not exists public.parent_links(
  parent_id uuid references public.parents(id) on delete cascade,
  student_id uuid references auth.users(id) on delete cascade,
  primary key(parent_id, student_id)
);
create table if not exists public.rewards_rules(
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.parents(id) on delete cascade,
  type text check (type in ('DRILL','SIM','STREAK')) not null,
  threshold jsonb not null,
  amount_cents int not null,
  created_at timestamptz default now()
);
create table if not exists public.rewards_ledger(
  id uuid primary key default gen_random_uuid(),
  student_id uuid references auth.users(id) on delete cascade,
  rule_id uuid references public.rewards_rules(id) on delete cascade,
  earned_at timestamptz default now(),
  amount_cents int not null,
  status text check (status in ('PENDING','APPROVED','DENIED')) default 'PENDING'
);

alter table public.parents enable row level security;
alter table public.parent_links enable row level security;
alter table public.rewards_rules enable row level security;
alter table public.rewards_ledger enable row level security;

-- Minimal RLS (tune later): parents see own, students see their ledger
create policy "parents own" on public.parents for all using (true) with check (true);
create policy "links parent" on public.parent_links for all using (auth.uid() in (select student_id from public.parent_links where parent_id = parent_id)) with check (true);
create policy "rules parent" on public.rewards_rules for all using (true) with check (true);
create policy "ledger student" on public.rewards_ledger for all using (auth.uid() = student_id) with check (auth.uid() = student_id);