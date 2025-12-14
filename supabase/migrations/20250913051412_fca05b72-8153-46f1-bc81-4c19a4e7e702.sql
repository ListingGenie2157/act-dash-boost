alter table public.staging_items enable row level security;

-- Create a policy to allow admin access for data import
create policy "Admin can manage staging items" 
on public.staging_items 
for all 
using (true) 
with check (true);