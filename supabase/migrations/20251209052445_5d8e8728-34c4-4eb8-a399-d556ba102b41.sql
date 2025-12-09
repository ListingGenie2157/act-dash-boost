-- Add task_id column to attempts table to link attempts to study_tasks
ALTER TABLE public.attempts 
ADD COLUMN task_id UUID REFERENCES public.study_tasks(id);

-- Create index for efficient queries
CREATE INDEX idx_attempts_task_id ON public.attempts(task_id);