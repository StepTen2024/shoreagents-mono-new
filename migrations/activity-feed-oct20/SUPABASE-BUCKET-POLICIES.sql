-- ====================================================================
-- SUPABASE STORAGE BUCKET POLICIES
-- For Activity Feed System (staff_social, management_social, client_social)
-- Created: October 20, 2025
-- ====================================================================

-- ====================================================================
-- 1. STAFF BUCKET POLICIES
-- ====================================================================

-- Allow staff users to upload to staff bucket
CREATE POLICY "Staff can upload to staff bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'staff' 
  AND (storage.foldername(name))[1] = 'staff_social'
  AND auth.jwt() ->> 'role' = 'staff'
);

-- Allow staff users to read from staff bucket
CREATE POLICY "Staff can read from staff bucket"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'staff' 
  AND (storage.foldername(name))[1] = 'staff_social'
  AND auth.jwt() ->> 'role' = 'staff'
);

-- Allow staff users to update their own uploads
CREATE POLICY "Staff can update own files in staff bucket"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'staff' 
  AND (storage.foldername(name))[1] = 'staff_social'
  AND auth.jwt() ->> 'role' = 'staff'
  AND owner = auth.uid()
)
WITH CHECK (
  bucket_id = 'staff' 
  AND (storage.foldername(name))[1] = 'staff_social'
  AND auth.jwt() ->> 'role' = 'staff'
);

-- Allow staff users to delete their own uploads
CREATE POLICY "Staff can delete own files in staff bucket"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'staff' 
  AND (storage.foldername(name))[1] = 'staff_social'
  AND auth.jwt() ->> 'role' = 'staff'
  AND owner = auth.uid()
);

-- ====================================================================
-- 2. MANAGEMENT BUCKET POLICIES
-- ====================================================================

-- Allow management users to upload to management bucket
CREATE POLICY "Management can upload to management bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'management' 
  AND (storage.foldername(name))[1] = 'management_social'
  AND auth.jwt() ->> 'role' = 'management'
);

-- Allow management users to read from management bucket
CREATE POLICY "Management can read from management bucket"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'management' 
  AND (storage.foldername(name))[1] = 'management_social'
  AND auth.jwt() ->> 'role' = 'management'
);

-- Allow staff to read management posts (optional - remove if not needed)
CREATE POLICY "Staff can read from management bucket"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'management' 
  AND (storage.foldername(name))[1] = 'management_social'
  AND auth.jwt() ->> 'role' = 'staff'
);

-- Allow management users to update their own uploads
CREATE POLICY "Management can update own files in management bucket"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'management' 
  AND (storage.foldername(name))[1] = 'management_social'
  AND auth.jwt() ->> 'role' = 'management'
  AND owner = auth.uid()
)
WITH CHECK (
  bucket_id = 'management' 
  AND (storage.foldername(name))[1] = 'management_social'
  AND auth.jwt() ->> 'role' = 'management'
);

-- Allow management users to delete their own uploads
CREATE POLICY "Management can delete own files in management bucket"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'management' 
  AND (storage.foldername(name))[1] = 'management_social'
  AND auth.jwt() ->> 'role' = 'management'
  AND owner = auth.uid()
);

-- ====================================================================
-- 3. CLIENT BUCKET POLICIES
-- ====================================================================

-- Allow client users to upload to client bucket
CREATE POLICY "Clients can upload to client bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client' 
  AND (storage.foldername(name))[1] = 'client_social'
  AND auth.jwt() ->> 'role' = 'client'
);

-- Allow client users to read from client bucket
CREATE POLICY "Clients can read from client bucket"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'client' 
  AND (storage.foldername(name))[1] = 'client_social'
  AND auth.jwt() ->> 'role' = 'client'
);

-- Allow staff to read client posts
CREATE POLICY "Staff can read from client bucket"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'client' 
  AND (storage.foldername(name))[1] = 'client_social'
  AND auth.jwt() ->> 'role' = 'staff'
);

-- Allow management to read client posts
CREATE POLICY "Management can read from client bucket"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'client' 
  AND (storage.foldername(name))[1] = 'client_social'
  AND auth.jwt() ->> 'role' = 'management'
);

-- Allow client users to update their own uploads
CREATE POLICY "Clients can update own files in client bucket"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'client' 
  AND (storage.foldername(name))[1] = 'client_social'
  AND auth.jwt() ->> 'role' = 'client'
  AND owner = auth.uid()
)
WITH CHECK (
  bucket_id = 'client' 
  AND (storage.foldername(name))[1] = 'client_social'
  AND auth.jwt() ->> 'role' = 'client'
);

-- Allow client users to delete their own uploads
CREATE POLICY "Clients can delete own files in client bucket"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'client' 
  AND (storage.foldername(name))[1] = 'client_social'
  AND auth.jwt() ->> 'role' = 'client'
  AND owner = auth.uid()
);

-- ====================================================================
-- ALTERNATIVE: If using user_role from a custom table instead of JWT
-- ====================================================================

-- If you're storing roles in staff_users/client_users tables, use this pattern instead:
-- Replace auth.jwt() ->> 'role' = 'staff' with:
-- EXISTS (
--   SELECT 1 FROM staff_users 
--   WHERE staff_users.user_id = auth.uid()
-- )

-- Example for staff bucket with table lookup:
/*
CREATE POLICY "Staff can upload to staff bucket (table-based)"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'staff' 
  AND (storage.foldername(name))[1] = 'staff_social'
  AND EXISTS (
    SELECT 1 FROM staff_users 
    WHERE staff_users.user_id = auth.uid()
  )
);
*/

-- ====================================================================
-- BUCKET CONFIGURATION (Run these if buckets don't exist yet)
-- ====================================================================

-- If you need to CREATE the buckets (skip if they already exist):
/*
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('staff', 'staff', false),
  ('management', 'management', false),
  ('client', 'client', false)
ON CONFLICT (id) DO NOTHING;
*/

-- Enable RLS on storage.objects (should already be enabled):
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- TESTING THE POLICIES
-- ====================================================================

/*
-- Test as staff user:
-- 1. Login as staff
-- 2. Try to upload file to: staff/staff_social/post-123/image.jpg
-- 3. Should succeed

-- Test as management user:
-- 1. Login as management
-- 2. Try to upload file to: management/management_social/announcement-456/doc.pdf
-- 3. Should succeed

-- Test as client user:
-- 1. Login as client
-- 2. Try to upload file to: client/client_social/update-789/file.png
-- 3. Should succeed

-- Test cross-bucket access (should fail):
-- 1. Login as staff
-- 2. Try to upload to management bucket
-- 3. Should be denied
*/

-- ====================================================================
-- NOTES
-- ====================================================================

-- 1. The policies check for folder structure like: bucket/folder/subfolder/file.jpg
-- 2. (storage.foldername(name))[1] gets the first folder level (staff_social, etc.)
-- 3. All policies check auth.jwt() ->> 'role' - adjust if using different role system
-- 4. Policies allow users to only modify/delete their own files (owner = auth.uid())
-- 5. Read policies are more permissive - adjust based on your privacy needs
-- 6. Management and staff can read client posts (for transparency)
-- 7. Staff can read management posts (can disable if needed)

-- ====================================================================
-- TROUBLESHOOTING
-- ====================================================================

-- If uploads fail, check:
-- 1. Is the bucket public or private? (Set in Supabase dashboard)
-- 2. Is RLS enabled on storage.objects?
-- 3. Does your JWT contain the 'role' claim?
-- 4. Is the folder structure correct? (bucket/staff_social/...)
-- 5. Check Supabase logs for specific policy violations

-- To view all existing policies:
-- SELECT * FROM pg_policies WHERE tablename = 'objects';

-- To drop all policies and start fresh (DANGER):
-- DROP POLICY IF EXISTS "Staff can upload to staff bucket" ON storage.objects;
-- (repeat for each policy)

-- ====================================================================

