-- Phase 1.1: Fix RLS Policy on staging_items to allow authenticated users to read
DROP POLICY IF EXISTS "staging_public_read" ON staging_items;
CREATE POLICY "staging_public_read" 
ON staging_items 
FOR SELECT 
USING (true);

-- Phase 1.2: Standardize Section Names in staging_items
UPDATE staging_items 
SET section = CASE 
  WHEN section ILIKE '%english%' OR section = 'EN' THEN 'EN'
  WHEN section ILIKE '%math%' THEN 'MATH'
  WHEN section ILIKE '%read%' THEN 'RD'
  WHEN section ILIKE '%science%' OR section ILIKE '%sci%' THEN 'SCI'
  ELSE section
END
WHERE section != CASE 
  WHEN section ILIKE '%english%' OR section = 'EN' THEN 'EN'
  WHEN section ILIKE '%math%' THEN 'MATH'
  WHEN section ILIKE '%read%' THEN 'RD'
  WHEN section ILIKE '%science%' OR section ILIKE '%sci%' THEN 'SCI'
  ELSE section
END;