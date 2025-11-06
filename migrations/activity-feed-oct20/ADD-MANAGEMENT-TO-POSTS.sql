-- 🎯 ADD MANAGEMENT USER SUPPORT TO ACTIVITY POSTS
-- Run this in Supabase SQL Editor

-- Add managementUserId column to activity_posts
ALTER TABLE activity_posts 
ADD COLUMN IF NOT EXISTS "managementUserId" TEXT;

-- Add foreign key constraint
ALTER TABLE activity_posts
ADD CONSTRAINT activity_posts_managementUserId_fkey 
FOREIGN KEY ("managementUserId") 
REFERENCES management_users(id) 
ON DELETE CASCADE;

-- Verify the change
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'activity_posts' 
AND column_name = 'managementUserId';

