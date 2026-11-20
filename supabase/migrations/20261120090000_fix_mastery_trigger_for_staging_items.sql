-- Practice-test answers failed to save since 2025-09: update_mastery_on_response() compared
-- questions.id (uuid) with responses.question_id (text) -> "operator does not exist: uuid = text",
-- which aborted every insert into responses. Questions now live in staging_items
-- (responses.question_id = staging_id as text); the legacy questions table is empty.
-- A changed answer (UPDATE) adjusts the correct count without counting a second attempt.
CREATE OR REPLACE FUNCTION public.update_mastery_on_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_skill text;
  v_user uuid;
BEGIN
  SELECT s.user_id INTO v_user FROM sessions s WHERE s.id = NEW.session_id;

  IF NEW.question_id ~ '^[0-9]+$' THEN
    SELECT si.skill_code INTO v_skill FROM staging_items si WHERE si.staging_id = NEW.question_id::bigint;
  ELSE
    SELECT q.skill_id::text INTO v_skill FROM questions q WHERE q.id::text = NEW.question_id;
  END IF;

  IF v_skill IS NULL OR v_user IS NULL OR NOT EXISTS (SELECT 1 FROM skills WHERE id = v_skill) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO mastery (user_id, skill_id, total, correct, avg_time_ms, last_updated)
    VALUES (v_user, v_skill, 1, CASE WHEN NEW.correct THEN 1 ELSE 0 END, NEW.time_ms, now())
    ON CONFLICT (user_id, skill_id) DO UPDATE SET
      total = mastery.total + 1,
      correct = mastery.correct + CASE WHEN NEW.correct THEN 1 ELSE 0 END,
      avg_time_ms = ((mastery.avg_time_ms * mastery.total) + NEW.time_ms) / (mastery.total + 1),
      last_updated = now();
  ELSIF NEW.correct IS DISTINCT FROM OLD.correct THEN
    UPDATE mastery
       SET correct = GREATEST(0, correct + CASE WHEN NEW.correct THEN 1 ELSE -1 END),
           last_updated = now()
     WHERE user_id = v_user AND skill_id = v_skill;
  END IF;

  RETURN NEW;
END;
$function$;
