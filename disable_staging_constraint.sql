-- Temporarily disable the check constraint on staging_items.answer
-- to allow uploads, then we can re-enable it after

-- Find and drop the constraint
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Get the constraint name
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.staging_items'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%answer%';

    -- Drop it if it exists
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.staging_items DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END IF;
END$$;