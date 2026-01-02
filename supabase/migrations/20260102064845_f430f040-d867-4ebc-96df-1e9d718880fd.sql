-- Reset the staging_items sequence to the max existing staging_id
SELECT setval(
  'staging_items_staging_id_seq', 
  COALESCE((SELECT MAX(staging_id) FROM staging_items), 0) + 1, 
  false
);