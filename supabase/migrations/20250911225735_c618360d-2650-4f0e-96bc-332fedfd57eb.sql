-- Create sim_results table for simulation test results
CREATE TABLE public.sim_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  section TEXT NOT NULL,
  raw_score INTEGER NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  time_stats_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sim_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own sim results" 
ON public.sim_results 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sim results" 
ON public.sim_results 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sim results" 
ON public.sim_results 
FOR UPDATE 
USING (auth.uid() = user_id);