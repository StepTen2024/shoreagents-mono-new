-- =============================================
-- UNIVERSAL MENTIONS SYSTEM
-- =============================================
-- Just like comments and reactions, this table handles mentions
-- across ALL entities: Posts, Tickets, Tasks, Comments, Documents
-- =============================================

CREATE TABLE IF NOT EXISTS mentions (
  id TEXT PRIMARY KEY,
  
  -- 🎯 What is being mentioned in (polymorphic)
  "mentionableType" TEXT NOT NULL CHECK ("mentionableType" IN ('POST', 'TICKET', 'TASK', 'COMMENT', 'DOCUMENT', 'REVIEW')),
  "mentionableId" TEXT NOT NULL,
  
  -- 👤 Who is mentioned
  "mentionedUserId" TEXT NOT NULL,
  "mentionedUserType" TEXT NOT NULL CHECK ("mentionedUserType" IN ('STAFF', 'CLIENT', 'MANAGEMENT')),
  
  -- ✍️ Who created the mention
  "mentionerUserId" TEXT NOT NULL,
  "mentionerUserType" TEXT NOT NULL CHECK ("mentionerUserType" IN ('STAFF', 'CLIENT', 'MANAGEMENT')),
  
  -- 📅 Metadata
  "createdAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notificationSent" BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- 🔗 Foreign Keys (optional - for referential integrity)
  CONSTRAINT mentions_staff_mentioned_fkey 
    FOREIGN KEY ("mentionedUserId") 
    REFERENCES staff_users(id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
    DEFERRABLE INITIALLY DEFERRED,
  
  CONSTRAINT mentions_client_mentioned_fkey 
    FOREIGN KEY ("mentionedUserId") 
    REFERENCES client_users(id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
    DEFERRABLE INITIALLY DEFERRED,
  
  CONSTRAINT mentions_management_mentioned_fkey 
    FOREIGN KEY ("mentionedUserId") 
    REFERENCES management_users(id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
    DEFERRABLE INITIALLY DEFERRED
) TABLESPACE pg_default;

-- ⚡ Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_mentions_mentionable 
  ON mentions ("mentionableType", "mentionableId");

CREATE INDEX IF NOT EXISTS idx_mentions_mentioned_user 
  ON mentions ("mentionedUserId", "mentionedUserType");

CREATE INDEX IF NOT EXISTS idx_mentions_mentioner_user 
  ON mentions ("mentionerUserId", "mentionerUserType");

CREATE INDEX IF NOT EXISTS idx_mentions_created_at 
  ON mentions ("createdAt" DESC);

-- 📊 Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_mentions_user_type_created 
  ON mentions ("mentionedUserId", "mentionableType", "createdAt" DESC);

-- ✅ Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Universal Mentions table created successfully!';
  RAISE NOTICE '✅ Can mention in: POST, TICKET, TASK, COMMENT, DOCUMENT, REVIEW';
  RAISE NOTICE '✅ Can mention: STAFF, CLIENT, MANAGEMENT';
  RAISE NOTICE '✅ Indexes created for fast queries';
END $$;
