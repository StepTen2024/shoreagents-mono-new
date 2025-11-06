-- 🎯 ADD MANAGEMENT USER SUPPORT TO REACTIONS & COMMENTS
-- Run this in Supabase SQL Editor

-- Add managementUserId to post_reactions
ALTER TABLE post_reactions 
ADD COLUMN IF NOT EXISTS "managementUserId" TEXT;

-- Add foreign key constraint for reactions
ALTER TABLE post_reactions
ADD CONSTRAINT post_reactions_managementUserId_fkey 
FOREIGN KEY ("managementUserId") 
REFERENCES management_users(id) 
ON DELETE CASCADE;

-- Add managementUserId to post_comments
ALTER TABLE post_comments 
ADD COLUMN IF NOT EXISTS "managementUserId" TEXT;

-- Add foreign key constraint for comments
ALTER TABLE post_comments
ADD CONSTRAINT post_comments_managementUserId_fkey 
FOREIGN KEY ("managementUserId") 
REFERENCES management_users(id) 
ON DELETE CASCADE;

-- Verify the changes
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('post_reactions', 'post_comments')
AND column_name = 'managementUserId';

