-- Fix corrupted Task status field data
-- Tasks have UUIDs in status field instead of proper enum values
-- Run this in your database (Supabase SQL Editor)

-- First, let's see what the bad data looks like
-- SELECT id, title, status FROM "Task" WHERE status NOT IN ('TODO', 'IN_PROGRESS', 'STUCK', 'FOR_REVIEW', 'COMPLETED');

-- Fix: Set all tasks with UUID status to TODO (default)
UPDATE "Task"
SET status = 'TODO'
WHERE status NOT IN ('TODO', 'IN_PROGRESS', 'STUCK', 'FOR_REVIEW', 'COMPLETED');

-- Or if you want to be more specific, you can set based on patterns:
-- If it looks like a UUID (contains hyphens in UUID pattern), set to TODO
UPDATE "Task"
SET status = 'TODO'
WHERE status ~ '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

-- Verify the fix
SELECT id, title, status, priority FROM "Task";

