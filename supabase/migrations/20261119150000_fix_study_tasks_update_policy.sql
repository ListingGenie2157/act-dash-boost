-- study_tasks UPDATE: the two existing policies compared every row in the table
-- (study_tasks_1.id = study_tasks_1.id), so any student update that sets accuracy or
-- reward_cents failed with "more than one row returned by a subquery".
-- Intent kept: students update their own tasks but cannot change accuracy or reward_cents;
-- the server (service role, e.g. complete-task) still can.

DROP POLICY IF EXISTS "Users update own study tasks limited" ON public.study_tasks;
DROP POLICY IF EXISTS "study_tasks_update_no_score_change" ON public.study_tasks;

CREATE POLICY "Users update own study tasks"
  ON public.study_tasks FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.study_tasks_protect_scores()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role'
     AND (NEW.accuracy IS DISTINCT FROM OLD.accuracy
          OR NEW.reward_cents IS DISTINCT FROM OLD.reward_cents) THEN
    RAISE EXCEPTION 'accuracy and reward_cents are set by the server'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS study_tasks_protect_scores ON public.study_tasks;
CREATE TRIGGER study_tasks_protect_scores
  BEFORE UPDATE ON public.study_tasks
  FOR EACH ROW EXECUTE FUNCTION public.study_tasks_protect_scores();
