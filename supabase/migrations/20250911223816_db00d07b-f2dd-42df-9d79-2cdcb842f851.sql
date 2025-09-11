-- Create diagnostics table
CREATE TABLE public.diagnostics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  section TEXT NOT NULL CHECK (section IN ('English', 'Math', 'Reading', 'Science')),
  block INTEGER NOT NULL CHECK (block >= 1 AND block <= 2),
  responses JSONB,
  score NUMERIC,
  CONSTRAINT diagnostics_user_id_not_null CHECK (user_id IS NOT NULL)
);

-- Enable RLS
ALTER TABLE public.diagnostics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for owner-only access
CREATE POLICY "Users can view their own diagnostics" 
ON public.diagnostics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own diagnostics" 
ON public.diagnostics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diagnostics" 
ON public.diagnostics 
FOR UPDATE 
USING (auth.uid() = user_id);