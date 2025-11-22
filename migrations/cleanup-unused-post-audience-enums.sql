-- =============================================
-- CLEANUP: Remove Unused PostAudience Enum Values
-- =============================================
-- These enum values are defined in Prisma schema but never used in the UI:
-- - STAFF
-- - CLIENT  
-- - MANAGEMENT
--
-- This migration is SAFE only if:
-- 1. No existing posts use these values
-- 2. No code references these values
-- =============================================

-- Step 1: Check if any posts use the unused values (SAFETY CHECK)
DO $$
DECLARE
  unused_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unused_count
  FROM activity_posts
  WHERE audience IN ('STAFF', 'CLIENT', 'MANAGEMENT');
  
  IF unused_count > 0 THEN
    RAISE EXCEPTION '❌ CANNOT REMOVE ENUMS: % posts still use STAFF, CLIENT, or MANAGEMENT audience', unused_count;
  ELSE
    RAISE NOTICE '✅ SAFE TO PROCEED: No posts use the unused enum values';
  END IF;
END $$;

-- Step 2: Remove unused enum values
-- Note: In PostgreSQL, you cannot directly remove enum values
-- You must create a new enum and migrate the column

-- Create new enum without unused values
CREATE TYPE "PostAudience_new" AS ENUM (
  'ALL',
  'ALL_STAFF',
  'MY_TEAM',
  'MY_CLIENT',
  'EVERYONE',
  'ALL_CLIENTS',
  'ALL_STAFF_MGMT',
  'MANAGEMENT_ONLY',
  'MY_TEAM_AND_MANAGEMENT'
);

-- Update the column to use the new enum
ALTER TABLE activity_posts 
  ALTER COLUMN audience TYPE "PostAudience_new" 
  USING audience::text::"PostAudience_new";

-- Drop the old enum
DROP TYPE "PostAudience";

-- Rename the new enum to the original name
ALTER TYPE "PostAudience_new" RENAME TO "PostAudience";

-- Verify the cleanup
SELECT 
  enumlabel as audience_value,
  enumsortorder as sort_order
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'PostAudience'
ORDER BY enumsortorder;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ PostAudience enum cleaned up successfully!';
  RAISE NOTICE '✅ Removed: STAFF, CLIENT, MANAGEMENT';
  RAISE NOTICE '✅ Remaining: ALL, ALL_STAFF, MY_TEAM, MY_CLIENT, EVERYONE, ALL_CLIENTS, ALL_STAFF_MGMT, MANAGEMENT_ONLY, MY_TEAM_AND_MANAGEMENT';
END $$;
