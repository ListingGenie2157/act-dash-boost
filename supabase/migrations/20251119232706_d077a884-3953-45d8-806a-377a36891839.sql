-- Delete FA_RD duplicates, keeping only the first occurrence of each ord
DELETE FROM staging_items
WHERE form_id = 'FA_RD'
  AND staging_id NOT IN (
    SELECT MIN(staging_id)
    FROM staging_items
    WHERE form_id = 'FA_RD'
    GROUP BY ord
  );