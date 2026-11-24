-- Any signed-in user could upload, replace or delete question images.
-- 20251124102508 created open write policies; 20251215021513 added admin-only
-- ones but never dropped the originals. Permissive policies are OR'd, so the
-- open ones still applied. The admin-only write policies remain:
--   "Admins can upload/update/delete question images" (bucket + is_admin()).
-- No client code writes to this bucket; uploads are an admin task.
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;

-- Rollback (restores the vulnerable state; only if admin uploads break):
--   CREATE POLICY "Authenticated users can upload images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'question-images');
--   CREATE POLICY "Authenticated users can update images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'question-images');
--   CREATE POLICY "Authenticated users can delete images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'question-images');
