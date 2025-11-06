-- 🚀 ACTIVITY FEED PERFORMANCE INDEXES (SAFE VERSION)
-- Run this in Supabase SQL Editor
-- Expected impact: 2-3x faster queries on posts, reactions, and comments
-- This version will NOT fail if constraints don't exist

-- =====================================================
-- POST INDEXES
-- =====================================================

-- Speed up post fetching with audience filter + sorting by date
-- This is the most common query: GET /api/posts?audience=STAFF
CREATE INDEX IF NOT EXISTS idx_posts_audience_created 
ON activity_posts(audience, "createdAt" DESC);

-- Speed up fetching a user's posts (staff)
CREATE INDEX IF NOT EXISTS idx_posts_staff_user_created 
ON activity_posts("staffUserId", "createdAt" DESC) 
WHERE "staffUserId" IS NOT NULL;

-- Speed up fetching a user's posts (client)
CREATE INDEX IF NOT EXISTS idx_posts_client_user_created 
ON activity_posts("clientUserId", "createdAt" DESC) 
WHERE "clientUserId" IS NOT NULL;

-- Speed up fetching a user's posts (management)
CREATE INDEX IF NOT EXISTS idx_posts_management_user_created 
ON activity_posts("managementUserId", "createdAt" DESC) 
WHERE "managementUserId" IS NOT NULL;

-- Speed up finding posts by type
CREATE INDEX IF NOT EXISTS idx_posts_type_created 
ON activity_posts(type, "createdAt" DESC);

-- =====================================================
-- REACTION INDEXES
-- =====================================================

-- Speed up reaction lookups by post
-- Used when displaying reactions on a post
CREATE INDEX IF NOT EXISTS idx_reactions_post 
ON post_reactions("postId");

-- Speed up checking if user already reacted
-- Used when toggling reactions
CREATE INDEX IF NOT EXISTS idx_reactions_post_staff 
ON post_reactions("postId", "staffUserId") 
WHERE "staffUserId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reactions_post_client 
ON post_reactions("postId", "clientUserId") 
WHERE "clientUserId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reactions_post_management 
ON post_reactions("postId", "managementUserId") 
WHERE "managementUserId" IS NOT NULL;

-- Speed up reaction counts by type
CREATE INDEX IF NOT EXISTS idx_reactions_post_type 
ON post_reactions("postId", type);

-- =====================================================
-- COMMENT INDEXES
-- =====================================================

-- Speed up comment fetches per post (most common query)
CREATE INDEX IF NOT EXISTS idx_comments_post_created 
ON post_comments("postId", "createdAt" ASC);

-- Speed up finding a user's comments (staff)
CREATE INDEX IF NOT EXISTS idx_comments_staff_user 
ON post_comments("staffUserId") 
WHERE "staffUserId" IS NOT NULL;

-- Speed up finding a user's comments (client)
CREATE INDEX IF NOT EXISTS idx_comments_client_user 
ON post_comments("clientUserId") 
WHERE "clientUserId" IS NOT NULL;

-- Speed up finding a user's comments (management)
CREATE INDEX IF NOT EXISTS idx_comments_management_user 
ON post_comments("managementUserId") 
WHERE "managementUserId" IS NOT NULL;

-- =====================================================
-- TAGGED USERS INDEX (for future tag search)
-- =====================================================

-- Speed up finding posts where a user is tagged
-- Uses GIN index for array containment
CREATE INDEX IF NOT EXISTS idx_posts_tagged_users 
ON activity_posts USING gin("taggedUserIds");

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$ 
BEGIN
  RAISE NOTICE '✅ All indexes created successfully!';
  RAISE NOTICE '📊 Run the verification queries below to confirm.';
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify all indexes were created
SELECT 
  tablename,
  indexname,
  substring(indexdef from 'ON (.+?) USING') as indexed_columns
FROM pg_indexes 
WHERE tablename IN ('activity_posts', 'post_reactions', 'post_comments')
  AND schemaname = 'public'
ORDER BY tablename, indexname;

-- Check index sizes (should be reasonable)
SELECT 
  schemaname || '.' || relname as table_name,
  indexrelname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND relname IN ('activity_posts', 'post_reactions', 'post_comments')
ORDER BY pg_relation_size(indexrelid) DESC;

