-- Fix staging_items table to allow uploads

-- First, let's check if RLS is enabled and add proper policies
alter table public.staging_items enable row level security;

-- Create policies to allow authenticated users to insert/read staging items
do $$
begin
  if not exists (select 1 from pg_policies where tablename='staging_items' and policyname='staging_items_insert')
  then create policy staging_items_insert on public.staging_items for insert with check (true); end if;

  if not exists (select 1 from pg_policies where tablename='staging_items' and policyname='staging_items_read')
  then create policy staging_items_read on public.staging_items for select using (true); end if;

  if not exists (select 1 from pg_policies where tablename='staging_items' and policyname='staging_items_update')
  then create policy staging_items_update on public.staging_items for update using (true); end if;

  if not exists (select 1 from pg_policies where tablename='staging_items' and policyname='staging_items_delete')
  then create policy staging_items_delete on public.staging_items for delete using (true); end if;
end$$;

-- Also make sure the answer constraint allows the right values
-- In case there's an issue with the check constraint, let's see what it is
-- and potentially relax it temporarily for uploads