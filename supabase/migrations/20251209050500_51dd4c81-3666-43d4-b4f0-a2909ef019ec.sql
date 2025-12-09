-- Change error_bank.question_id from UUID to TEXT to support staging_id values
-- First drop the foreign key constraint, then alter the column type

ALTER TABLE error_bank DROP CONSTRAINT IF EXISTS error_bank_question_id_fkey;

ALTER TABLE error_bank ALTER COLUMN question_id TYPE TEXT USING question_id::TEXT;