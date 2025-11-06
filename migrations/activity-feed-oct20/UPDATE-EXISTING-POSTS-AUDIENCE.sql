-- 🔄 UPDATE EXISTING POSTS TO HAVE 'ALL' AUDIENCE
-- Run this in Supabase SQL Editor

-- Update all existing posts that have NULL audience to 'ALL'
UPDATE activity_posts
SET "audience" = 'ALL'
WHERE "audience" IS NULL;

-- Verify the update
SELECT 
  COUNT(*) as total_posts,
  "audience",
  COUNT(*) FILTER (WHERE "audience" = 'ALL') as all_posts,
  COUNT(*) FILTER (WHERE "audience" = 'STAFF') as staff_posts,
  COUNT(*) FILTER (WHERE "audience" = 'CLIENT') as client_posts,
  COUNT(*) FILTER (WHERE "audience" = 'MANAGEMENT') as management_posts
FROM activity_posts
GROUP BY "audience";

