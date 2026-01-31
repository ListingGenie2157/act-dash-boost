-- Drop the overly restrictive unique constraint that prevents multiple tasks of the same type per day
DROP INDEX IF EXISTS study_tasks_user_date_type_unique;