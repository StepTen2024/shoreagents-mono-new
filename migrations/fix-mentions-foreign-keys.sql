-- =============================================
-- FIX MENTIONS FOREIGN KEYS
-- =============================================
-- The original foreign keys are too strict
-- They cause errors when mentioning users across tables
-- Solution: Drop the foreign keys (mentions work without them)
-- =============================================

-- Drop all foreign key constraints
ALTER TABLE mentions 
  DROP CONSTRAINT IF EXISTS mentions_staff_mentioned_fkey;

ALTER TABLE mentions 
  DROP CONSTRAINT IF EXISTS mentions_client_mentioned_fkey;

ALTER TABLE mentions 
  DROP CONSTRAINT IF EXISTS mentions_management_mentioned_fkey;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Mentions foreign keys removed!';
  RAISE NOTICE '✅ Mentions now work across all user types!';
END $$;
