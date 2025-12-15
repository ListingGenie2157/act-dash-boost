-- Lock down question-images bucket to admin-only write access
-- Keep public read access for displaying images

-- First, drop any existing policies on the bucket
DROP POLICY IF EXISTS "Admin users can delete question images" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can update question images" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can upload question images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete question images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update question images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload question images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for question images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view question images" ON storage.objects;

-- Create admin-only INSERT policy
CREATE POLICY "Admins can upload question images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'question-images' 
  AND public.is_admin()
);

-- Create admin-only UPDATE policy
CREATE POLICY "Admins can update question images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'question-images' 
  AND public.is_admin()
);

-- Create admin-only DELETE policy
CREATE POLICY "Admins can delete question images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'question-images' 
  AND public.is_admin()
);

-- Create public SELECT policy (bucket is already public, but explicit policy for clarity)
CREATE POLICY "Anyone can view question images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'question-images');