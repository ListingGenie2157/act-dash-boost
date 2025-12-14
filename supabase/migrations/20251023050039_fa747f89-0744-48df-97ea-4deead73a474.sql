-- Fix infinite recursion in parent_links RLS policies
-- Drop all existing policies on parent_links
DROP POLICY IF EXISTS "links parent" ON public.parent_links;
DROP POLICY IF EXISTS "Parent links can be managed" ON public.parent_links;
DROP POLICY IF EXISTS "Students can view their parent links" ON public.parent_links;
DROP POLICY IF EXISTS "Parents can view their student links" ON public.parent_links;
DROP POLICY IF EXISTS "Parents can manage their own links" ON public.parent_links;

-- Create simple, non-recursive policies
-- Students can view links where they are the student
CREATE POLICY "Students view own links"
ON public.parent_links
FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

-- Parents can view links where they are the parent
CREATE POLICY "Parents view own links"
ON public.parent_links
FOR SELECT
TO authenticated
USING (auth.uid() = parent_id);

-- Parents can insert links for themselves
CREATE POLICY "Parents insert own links"
ON public.parent_links
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = parent_id);

-- Parents can delete their own links
CREATE POLICY "Parents delete own links"
ON public.parent_links
FOR DELETE
TO authenticated
USING (auth.uid() = parent_id);