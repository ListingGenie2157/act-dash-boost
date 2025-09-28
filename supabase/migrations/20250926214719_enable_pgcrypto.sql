-- Enable pgcrypto extension for gen_random_uuid()
-- This must be the first migration to ensure UUID generation works
CREATE EXTENSION IF NOT EXISTS pgcrypto;