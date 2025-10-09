-- Fix critical RLS security vulnerabilities
-- PART 1: Drop all existing policies first

-- Parents table policies
DROP POLICY IF EXISTS "parents own" ON public.parents;
DROP POLICY IF EXISTS "Parents can insert their own profile" ON public.parents;
DROP POLICY IF EXISTS "Parents can view their own profile" ON public.parents;
DROP POLICY IF EXISTS "Parents can view own profile" ON public.parents;
DROP POLICY IF EXISTS "Parents can insert own profile" ON public.parents;
DROP POLICY IF EXISTS "Parents can update own profile" ON public.parents;

-- Staging items policies
DROP POLICY IF EXISTS "Admin can manage staging items" ON public.staging_items;
DROP POLICY IF EXISTS "staging_items_delete" ON public.staging_items;
DROP POLICY IF EXISTS "staging_items_insert" ON public.staging_items;
DROP POLICY IF EXISTS "staging_items_read" ON public.staging_items;
DROP POLICY IF EXISTS "staging_items_update" ON public.staging_items;
DROP POLICY IF EXISTS "Only admins can view staging items" ON public.staging_items;
DROP POLICY IF EXISTS "Only admins can insert staging items" ON public.staging_items;
DROP POLICY IF EXISTS "Only admins can update staging items" ON public.staging_items;
DROP POLICY IF EXISTS "Only admins can delete staging items" ON public.staging_items;

-- Rewards rules policies
DROP POLICY IF EXISTS "rules parent" ON public.rewards_rules;
DROP POLICY IF EXISTS "Parents can manage their rules" ON public.rewards_rules;
DROP POLICY IF EXISTS "Parents can manage their own rules" ON public.rewards_rules;
DROP POLICY IF EXISTS "Students can view applicable rules" ON public.rewards_rules;
DROP POLICY IF EXISTS "Students can view applicable reward rules" ON public.rewards_rules;

-- Rewards ledger policies
DROP POLICY IF EXISTS "ledger student" ON public.rewards_ledger;
DROP POLICY IF EXISTS "Students can insert their earnings" ON public.rewards_ledger;
DROP POLICY IF EXISTS "Students can insert their own earnings" ON public.rewards_ledger;
DROP POLICY IF EXISTS "Students can view their earnings" ON public.rewards_ledger;
DROP POLICY IF EXISTS "Students can view their own earnings" ON public.rewards_ledger;
DROP POLICY IF EXISTS "Parents can update earnings status" ON public.rewards_ledger;
DROP POLICY IF EXISTS "Parents can update their students earnings status" ON public.rewards_ledger;
DROP POLICY IF EXISTS "Parents can view their students' earnings" ON public.rewards_ledger;
DROP POLICY IF EXISTS "Parents can view their students earnings" ON public.rewards_ledger;

-- Diagnostics policies
DROP POLICY IF EXISTS "Users can update their own diagnostics" ON public.diagnostics;
DROP POLICY IF EXISTS "Users can update their own diagnostics (limited)" ON public.diagnostics;

-- Mastery policies
DROP POLICY IF EXISTS "Users can update their own mastery" ON public.mastery;
DROP POLICY IF EXISTS "Users can insert their own mastery" ON public.mastery;
DROP POLICY IF EXISTS "Users can view their own mastery" ON public.mastery;

-- Sim results policies
DROP POLICY IF EXISTS "Users can update their own sim results" ON public.sim_results;
DROP POLICY IF EXISTS "Users can update their own sim results (limited)" ON public.sim_results;

-- Study tasks policies
DROP POLICY IF EXISTS "Users can update their own study tasks" ON public.study_tasks;
DROP POLICY IF EXISTS "Users can update their own study tasks (limited)" ON public.study_tasks;

-- PART 2: Create new secure policies

-- Parents table - restrict to own records only
CREATE POLICY "parents_select_own"
ON public.parents
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "parents_insert_own"
ON public.parents
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "parents_update_own"
ON public.parents
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Staging items - admin only access
ALTER TABLE public.staging_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staging_admin_select"
ON public.staging_items
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "staging_admin_insert"
ON public.staging_items
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "staging_admin_update"
ON public.staging_items
FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "staging_admin_delete"
ON public.staging_items
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Rewards rules - parents own, students view
CREATE POLICY "rewards_rules_parent_all"
ON public.rewards_rules
FOR ALL
TO authenticated
USING (parent_id = auth.uid())
WITH CHECK (parent_id = auth.uid());

CREATE POLICY "rewards_rules_student_select"
ON public.rewards_rules
FOR SELECT
TO authenticated
USING (parent_id IN (
  SELECT parent_id FROM public.parent_links WHERE student_id = auth.uid()
));

-- Rewards ledger - students insert only, parents manage
CREATE POLICY "rewards_ledger_student_insert"
ON public.rewards_ledger
FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid());

CREATE POLICY "rewards_ledger_student_select"
ON public.rewards_ledger
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "rewards_ledger_parent_update"
ON public.rewards_ledger
FOR UPDATE
TO authenticated
USING (student_id IN (
  SELECT student_id FROM public.parent_links WHERE parent_id = auth.uid()
));

CREATE POLICY "rewards_ledger_parent_select"
ON public.rewards_ledger
FOR SELECT
TO authenticated
USING (student_id IN (
  SELECT student_id FROM public.parent_links WHERE parent_id = auth.uid()
));

-- Diagnostics - prevent score manipulation
CREATE POLICY "diagnostics_update_no_score_change"
ON public.diagnostics
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() AND
  (score IS NULL OR score = (SELECT score FROM public.diagnostics WHERE id = diagnostics.id))
);

-- Mastery - read only for users (updated by trigger)
CREATE POLICY "mastery_select_own"
ON public.mastery
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Sim results - prevent score manipulation
CREATE POLICY "sim_results_update_no_score_change"
ON public.sim_results
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() AND
  (raw_score IS NULL OR raw_score = (SELECT raw_score FROM public.sim_results WHERE id = sim_results.id))
);

-- Study tasks - prevent accuracy/reward manipulation
CREATE POLICY "study_tasks_update_no_score_change"
ON public.study_tasks
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() AND
  (accuracy IS NULL OR accuracy = (SELECT accuracy FROM public.study_tasks WHERE id = study_tasks.id)) AND
  (reward_cents IS NULL OR reward_cents = (SELECT reward_cents FROM public.study_tasks WHERE id = study_tasks.id))
);