-- Fix critical RLS security vulnerabilities
-- Issue 1: Parents table exposes all parent emails to authenticated users
DROP POLICY IF EXISTS "parents own" ON public.parents;
DROP POLICY IF EXISTS "Parents can insert their own profile" ON public.parents;
DROP POLICY IF EXISTS "Parents can view their own profile" ON public.parents;

CREATE POLICY "Parents can view own profile"
ON public.parents
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Parents can insert own profile"
ON public.parents
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Parents can update own profile"
ON public.parents
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Issue 2: Staging items table has no RLS - test questions exposed
ALTER TABLE public.staging_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage staging items" ON public.staging_items;
DROP POLICY IF EXISTS "staging_items_delete" ON public.staging_items;
DROP POLICY IF EXISTS "staging_items_insert" ON public.staging_items;
DROP POLICY IF EXISTS "staging_items_read" ON public.staging_items;
DROP POLICY IF EXISTS "staging_items_update" ON public.staging_items;

-- Only admins can access staging items
CREATE POLICY "Only admins can view staging items"
ON public.staging_items
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Only admins can insert staging items"
ON public.staging_items
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update staging items"
ON public.staging_items
FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Only admins can delete staging items"
ON public.staging_items
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Issue 3: Rewards rules overly permissive
DROP POLICY IF EXISTS "rules parent" ON public.rewards_rules;
DROP POLICY IF EXISTS "Parents can manage their rules" ON public.rewards_rules;

CREATE POLICY "Parents can manage their own rules"
ON public.rewards_rules
FOR ALL
TO authenticated
USING (parent_id = auth.uid())
WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Students can view applicable reward rules"
ON public.rewards_rules
FOR SELECT
TO authenticated
USING (parent_id IN (
  SELECT parent_id FROM public.parent_links WHERE student_id = auth.uid()
));

-- Issue 4: Students can manipulate their own reward balances
DROP POLICY IF EXISTS "ledger student" ON public.rewards_ledger;
DROP POLICY IF EXISTS "Students can insert their earnings" ON public.rewards_ledger;
DROP POLICY IF EXISTS "Students can view their earnings" ON public.rewards_ledger;

-- Students can only INSERT their earnings, not update or delete
CREATE POLICY "Students can insert own earnings"
ON public.rewards_ledger
FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can view own earnings"
ON public.rewards_ledger
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Only parents can update reward status
CREATE POLICY "Parents can update students earnings status"
ON public.rewards_ledger
FOR UPDATE
TO authenticated
USING (student_id IN (
  SELECT student_id FROM public.parent_links WHERE parent_id = auth.uid()
));

CREATE POLICY "Parents can view students earnings"
ON public.rewards_ledger
FOR SELECT
TO authenticated
USING (student_id IN (
  SELECT student_id FROM public.parent_links WHERE parent_id = auth.uid()
));

-- Issue 5: Prevent users from updating their diagnostic scores
DROP POLICY IF EXISTS "Users can update their own diagnostics" ON public.diagnostics;

CREATE POLICY "Users can update own diagnostics limited"
ON public.diagnostics
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() AND
  (score IS NULL OR score = (SELECT score FROM public.diagnostics WHERE id = diagnostics.id))
);

-- Issue 6: Prevent users from updating mastery scores directly
DROP POLICY IF EXISTS "Users can update their own mastery" ON public.mastery;
DROP POLICY IF EXISTS "Users can view their own mastery" ON public.mastery;
DROP POLICY IF EXISTS "Users can insert their own mastery" ON public.mastery;

-- Only allow viewing mastery, not updating
CREATE POLICY "Users view own mastery"
ON public.mastery
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Issue 7: Prevent users from manipulating sim_results scores
DROP POLICY IF EXISTS "Users can update their own sim results" ON public.sim_results;

CREATE POLICY "Users update own sim results limited"
ON public.sim_results
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() AND
  (raw_score IS NULL OR raw_score = (SELECT raw_score FROM public.sim_results WHERE id = sim_results.id))
);

-- Issue 8: Prevent users from manipulating study task accuracy/rewards
DROP POLICY IF EXISTS "Users can update their own study tasks" ON public.study_tasks;

CREATE POLICY "Users update own study tasks limited"
ON public.study_tasks
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() AND
  (accuracy IS NULL OR accuracy = (SELECT accuracy FROM public.study_tasks WHERE id = study_tasks.id)) AND
  (reward_cents IS NULL OR reward_cents = (SELECT reward_cents FROM public.study_tasks WHERE id = study_tasks.id))
);