-- Remove the remaining recursive policy on parent_links
DROP POLICY IF EXISTS "Parents can view their student links" ON public.parent_links;