-- Add public SELECT policy for lesson_content table
-- This allows all authenticated users to read lesson content
CREATE POLICY "lesson_content_read_all" 
ON public.lesson_content 
FOR SELECT 
USING (true);