-- 🎯 ADD CLIENT SUPPORT TO ACTIVITY FEED
-- Run this in Supabase SQL Editor

-- 1. Add clientUserId to activity_posts table
ALTER TABLE activity_posts 
ADD COLUMN IF NOT EXISTS "clientUserId" TEXT,
ALTER COLUMN "staffUserId" DROP NOT NULL;

-- 2. Add foreign key constraint for clientUserId
ALTER TABLE activity_posts 
ADD CONSTRAINT activity_posts_clientUserId_fkey 
FOREIGN KEY ("clientUserId") 
REFERENCES client_users(id) 
ON DELETE CASCADE;

-- 3. Add clientUserId to post_reactions table
ALTER TABLE post_reactions 
ADD COLUMN IF NOT EXISTS "clientUserId" TEXT,
ALTER COLUMN "staffUserId" DROP NOT NULL;

-- 4. Add foreign key constraint for post_reactions
ALTER TABLE post_reactions 
ADD CONSTRAINT post_reactions_clientUserId_fkey 
FOREIGN KEY ("clientUserId") 
REFERENCES client_users(id) 
ON DELETE CASCADE;

-- 5. Drop the old unique constraint on post_reactions (it was for staffUserId only)
ALTER TABLE post_reactions 
DROP CONSTRAINT IF EXISTS post_reactions_postId_staffUserId_type_key;

-- 6. Add clientUserId to post_comments table
ALTER TABLE post_comments 
ADD COLUMN IF NOT EXISTS "clientUserId" TEXT,
ALTER COLUMN "staffUserId" DROP NOT NULL;

-- 7. Add foreign key constraint for post_comments
ALTER TABLE post_comments 
ADD CONSTRAINT post_comments_clientUserId_fkey 
FOREIGN KEY ("clientUserId") 
REFERENCES client_users(id) 
ON DELETE CASCADE;

-- ✅ Verify the changes
SELECT 
  'activity_posts' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'activity_posts' 
AND column_name IN ('staffUserId', 'clientUserId')
UNION ALL
SELECT 
  'post_reactions' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'post_reactions' 
AND column_name IN ('staffUserId', 'clientUserId')
UNION ALL
SELECT 
  'post_comments' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'post_comments' 
AND column_name IN ('staffUserId', 'clientUserId');

