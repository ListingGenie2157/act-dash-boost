-- Remove Pre-Calculus skills (PC-series)
-- These are not part of core ACT curriculum and cause ordering conflicts
DELETE FROM skills WHERE id LIKE 'PC%';