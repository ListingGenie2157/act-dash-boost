-- Add atomic increment function for error_bank to prevent race conditions
-- This ensures miss_count is properly incremented even with concurrent requests

CREATE OR REPLACE FUNCTION public.increment_error_bank(
  p_user_id UUID,
  p_question_id TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO error_bank (user_id, question_id, miss_count, last_missed_at)
  VALUES (p_user_id, p_question_id, 1, now())
  ON CONFLICT (user_id, question_id) 
  DO UPDATE SET 
    miss_count = error_bank.miss_count + 1,
    last_missed_at = now();
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_error_bank(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_error_bank(UUID, TEXT) TO service_role;