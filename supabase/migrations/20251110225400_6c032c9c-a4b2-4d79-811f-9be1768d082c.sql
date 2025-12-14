-- Step 1: Delete duplicate study tasks, keeping only the oldest one per (user_id, the_date, type)
-- This prepares the database for adding a unique constraint

DELETE FROM study_tasks
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY user_id, the_date, type 
             ORDER BY created_at ASC, id ASC
           ) as rn
    FROM study_tasks
  ) t
  WHERE rn > 1
);

-- Step 2: Add unique constraint to prevent future duplicates
CREATE UNIQUE INDEX study_tasks_user_date_type_unique 
ON study_tasks (user_id, the_date, type);

-- Add comment explaining the constraint
COMMENT ON INDEX study_tasks_user_date_type_unique IS 
'Ensures only one task of each type per user per day, enabling safe upsert operations in generate-study-plan';