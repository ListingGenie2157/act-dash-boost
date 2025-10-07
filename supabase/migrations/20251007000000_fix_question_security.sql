-- Fix security vulnerability: prevent users from seeing answers before submission

-- Drop the insecure policy that exposes answers
DROP POLICY IF EXISTS "Questions are viewable by authenticated users" ON public.questions;

-- Create a secure view that excludes answers and explanations
CREATE OR REPLACE VIEW public.questions_secure AS
SELECT 
    id,
    skill_id,
    stem,
    choice_a,
    choice_b,
    choice_c,
    choice_d,
    difficulty,
    time_limit_secs,
    created_at
FROM public.questions;

-- Grant access to the secure view
GRANT SELECT ON public.questions_secure TO authenticated;

-- Block direct access to questions table (no policy = no access)
-- Keep RLS enabled but remove the SELECT policy

-- Create server-side function to check answers and return explanation
CREATE OR REPLACE FUNCTION public.check_answer(
    p_question_id UUID,
    p_user_answer CHAR(1)
)
RETURNS TABLE (
    is_correct BOOLEAN,
    correct_answer CHAR(1),
    explanation TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (q.answer = p_user_answer) as is_correct,
        q.answer as correct_answer,
        q.explanation
    FROM public.questions q
    WHERE q.id = p_question_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_answer TO authenticated;
