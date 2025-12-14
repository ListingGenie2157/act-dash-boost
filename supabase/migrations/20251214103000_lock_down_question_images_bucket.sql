-- SECURITY: Question images are content assets and must be admin-managed.
-- Previous policies allowed any authenticated user to upload/update/delete any object in the bucket.

-- Remove overly-broad authenticated write policies
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;

-- Allow only admins to manage objects in the bucket
CREATE POLICY "Admins can manage question images"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'question-images' AND public.is_admin())
WITH CHECK (bucket_id = 'question-images' AND public.is_admin());

