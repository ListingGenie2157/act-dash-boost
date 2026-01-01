-- Delete staging_items with encoding artifacts (corrupted data)
DELETE FROM staging_items
WHERE question LIKE '%â€%' OR question LIKE '%Â%'
   OR choice_a LIKE '%â€%' OR choice_a LIKE '%Â%'
   OR choice_b LIKE '%â€%' OR choice_b LIKE '%Â%'
   OR choice_c LIKE '%â€%' OR choice_c LIKE '%Â%'
   OR choice_d LIKE '%â€%' OR choice_d LIKE '%Â%'
   OR explanation LIKE '%â€%' OR explanation LIKE '%Â%';