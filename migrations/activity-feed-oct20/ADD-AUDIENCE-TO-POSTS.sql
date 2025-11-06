-- 🎯 ADD AUDIENCE TARGETING TO ACTIVITY POSTS
-- Run this in Supabase SQL Editor

-- Create enum for post audience types
DO $$ BEGIN
    CREATE TYPE "PostAudience" AS ENUM ('STAFF', 'CLIENT', 'MANAGEMENT', 'ALL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add audience column to activity_posts
ALTER TABLE activity_posts 
ADD COLUMN IF NOT EXISTS "audience" "PostAudience" DEFAULT 'ALL';

-- Create index for faster filtering by audience
CREATE INDEX IF NOT EXISTS activity_posts_audience_idx 
ON activity_posts ("audience");

-- Verify the change
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns 
WHERE table_name = 'activity_posts' 
AND column_name = 'audience';

