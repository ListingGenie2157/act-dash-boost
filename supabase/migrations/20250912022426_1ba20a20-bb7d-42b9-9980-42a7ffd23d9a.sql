-- Add source and notes columns to diagnostics table
ALTER TABLE public.diagnostics 
ADD COLUMN source text DEFAULT 'diagnostic',
ADD COLUMN notes text;

-- Add check constraint for source column
ALTER TABLE public.diagnostics 
ADD CONSTRAINT diagnostics_source_check CHECK (source IN ('self', 'diagnostic'));