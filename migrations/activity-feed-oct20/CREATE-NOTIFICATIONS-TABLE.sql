-- 🔔 CREATE NOTIFICATIONS TABLE
-- Run this in Supabase SQL Editor
-- This enables tag notifications for activity feed posts

-- Create notification types enum
CREATE TYPE "NotificationType" AS ENUM ('TAG', 'MENTION', 'COMMENT', 'REACTION', 'SYSTEM');

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL,
  type "NotificationType" NOT NULL DEFAULT 'TAG',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  "postId" TEXT,
  "actionUrl" TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "readAt" TIMESTAMP(3),
  
  -- Foreign keys
  CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES staff_users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "notifications_postId_fkey" FOREIGN KEY ("postId") REFERENCES activity_posts(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications("userId", read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_post ON notifications("postId");

-- Add comments for documentation
COMMENT ON TABLE notifications IS 'Stores user notifications for tags, mentions, comments, etc.';
COMMENT ON COLUMN notifications.type IS 'Type of notification: TAG (tagged in post), MENTION (mentioned in comment), COMMENT (comment on your post), REACTION (reaction to your post), SYSTEM (system notification)';
COMMENT ON COLUMN notifications.read IS 'Whether the notification has been read by the user';
COMMENT ON COLUMN notifications."readAt" IS 'Timestamp when the notification was marked as read';

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE '✅ Notifications table created successfully!';
  RAISE NOTICE '📊 Indexes created for optimal query performance.';
  RAISE NOTICE '🔔 Tag notifications are ready to use!';
END $$;

-- Verification query
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

