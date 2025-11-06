-- 🎯 ADD STAFF TAGGING TO ACTIVITY POSTS
-- Run this in Supabase SQL Editor

-- Add taggedUserIds column to store array of tagged staff user IDs
ALTER TABLE activity_posts 
ADD COLUMN IF NOT EXISTS "taggedUserIds" TEXT[] DEFAULT '{}';

-- Create index for faster querying of tagged posts
CREATE INDEX IF NOT EXISTS activity_posts_tagged_users_idx 
ON activity_posts USING GIN ("taggedUserIds");

-- Verify the change
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns 
WHERE table_name = 'activity_posts' 
AND column_name = 'taggedUserIds';

