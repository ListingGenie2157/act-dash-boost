-- Fix infinite recursion in parent_links policies
DROP POLICY IF EXISTS "links parent" ON parent_links;
DROP POLICY IF EXISTS "Parent links can be managed" ON parent_links;

-- Create proper parent_links policies without recursion
CREATE POLICY "Parents can manage their own links" 
ON parent_links 
FOR ALL 
USING (auth.uid() = parent_id)
WITH CHECK (auth.uid() = parent_id);

-- Add attempts table for diagnostic choice shuffling
CREATE TABLE IF NOT EXISTS public.attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  form_id TEXT NOT NULL,
  question_id UUID NOT NULL,
  choice_order INTEGER[4] NOT NULL,
  correct_idx SMALLINT NOT NULL,
  selected_idx SMALLINT,
  question_ord INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on attempts
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;

-- Create policies for attempts
CREATE POLICY "Users can insert their own attempts" 
ON public.attempts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own attempts" 
ON public.attempts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own attempts" 
ON public.attempts 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_attempts_user_form ON attempts(user_id, form_id);

-- Add trigger for updated_at
CREATE TRIGGER update_attempts_updated_at
  BEFORE UPDATE ON public.attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();