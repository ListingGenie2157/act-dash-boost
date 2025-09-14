-- Fix function search path security issue by recreating function and trigger
DROP TRIGGER IF EXISTS update_mastery_trigger ON responses;
DROP FUNCTION IF EXISTS update_mastery_on_response();

CREATE OR REPLACE FUNCTION update_mastery_on_response()
RETURNS TRIGGER AS $$
DECLARE
  question_skill_id UUID;
  session_user_id UUID;
BEGIN
  -- Get skill_id from question and user_id from session
  SELECT q.skill_id, s.user_id INTO question_skill_id, session_user_id
  FROM questions q
  JOIN sessions s ON s.id = NEW.session_id
  WHERE q.id = NEW.question_id;
  
  -- Skip if no skill_id found
  IF question_skill_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Upsert mastery record
  INSERT INTO mastery (user_id, skill_id, total, correct, avg_time_ms, last_updated)
  VALUES (
    session_user_id,
    question_skill_id,
    1,
    CASE WHEN NEW.correct THEN 1 ELSE 0 END,
    NEW.time_ms,
    now()
  )
  ON CONFLICT (user_id, skill_id) DO UPDATE SET
    total = mastery.total + 1,
    correct = mastery.correct + CASE WHEN NEW.correct THEN 1 ELSE 0 END,
    avg_time_ms = ((mastery.avg_time_ms * mastery.total) + NEW.time_ms) / (mastery.total + 1),
    last_updated = now();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger
CREATE TRIGGER update_mastery_trigger
  AFTER INSERT OR UPDATE ON responses
  FOR EACH ROW
  EXECUTE FUNCTION update_mastery_on_response();