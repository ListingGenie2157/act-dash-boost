-- Fix 2: Add RLS policies for mastery table and unique constraint

-- Add unique index for upsert to work correctly
CREATE UNIQUE INDEX IF NOT EXISTS ux_mastery_user_skill 
ON public.mastery (user_id, skill_id);

-- Add INSERT policy: users can insert their own mastery records
CREATE POLICY "Users can insert own mastery"
ON public.mastery
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add UPDATE policy: users can update their own mastery records
CREATE POLICY "Users can update own mastery"
ON public.mastery
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);