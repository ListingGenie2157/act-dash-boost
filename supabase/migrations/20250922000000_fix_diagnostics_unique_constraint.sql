-- Add unique constraint for diagnostics to support upsert operations
-- This allows only one diagnostic entry per user, per section, per source
ALTER TABLE public.diagnostics
ADD CONSTRAINT diagnostics_user_section_source_unique
UNIQUE (user_id, section, source);