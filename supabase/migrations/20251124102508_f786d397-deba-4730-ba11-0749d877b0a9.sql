-- Add image support columns to questions table
ALTER TABLE questions 
ADD COLUMN image_url TEXT NULL,
ADD COLUMN image_caption TEXT NULL,
ADD COLUMN image_position TEXT DEFAULT 'above_question' CHECK (image_position IN ('above_question', 'inline', 'between'));

-- Add image support columns to staging_items table
ALTER TABLE staging_items 
ADD COLUMN image_url TEXT NULL,
ADD COLUMN image_caption TEXT NULL,
ADD COLUMN image_position TEXT DEFAULT 'above_question' CHECK (image_position IN ('above_question', 'inline', 'between'));

-- Create storage bucket for question images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'question-images',
  'question-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
);

-- Allow public read access to question images
CREATE POLICY "Public can view question images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'question-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'question-images');

-- Allow authenticated users to update images
CREATE POLICY "Authenticated users can update images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'question-images');

-- Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'question-images');