-- ============================================
-- 🎯 UNIFIED ENGAGEMENT SYSTEM
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    "commentableType" TEXT NOT NULL,
    "commentableId" TEXT NOT NULL,
    content TEXT NOT NULL,
    attachments TEXT[] DEFAULT '{}',
    "authorType" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" TIMESTAMP(3),
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    FOREIGN KEY ("parentId") REFERENCES comments(id) ON DELETE CASCADE
);

-- Create indexes for comments
CREATE INDEX IF NOT EXISTS "comments_commentableType_commentableId_idx" ON comments("commentableType", "commentableId");
CREATE INDEX IF NOT EXISTS "comments_authorType_authorId_idx" ON comments("authorType", "authorId");
CREATE INDEX IF NOT EXISTS "comments_parentId_idx" ON comments("parentId");
CREATE INDEX IF NOT EXISTS "comments_createdAt_idx" ON comments("createdAt");

-- Create reactions table
CREATE TABLE IF NOT EXISTS reactions (
    id TEXT PRIMARY KEY,
    "reactableType" TEXT NOT NULL,
    "reactableId" TEXT NOT NULL,
    emoji TEXT NOT NULL,
    "authorType" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("reactableType", "reactableId", "authorType", "authorId", emoji)
);

-- Create indexes for reactions
CREATE INDEX IF NOT EXISTS "reactions_reactableType_reactableId_idx" ON reactions("reactableType", "reactableId");
CREATE INDEX IF NOT EXISTS "reactions_authorType_authorId_idx" ON reactions("authorType", "authorId");

-- Create shares table
CREATE TABLE IF NOT EXISTS shares (
    id TEXT PRIMARY KEY,
    "shareableType" TEXT NOT NULL,
    "shareableId" TEXT NOT NULL,
    message TEXT,
    "authorType" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "sharedTo" TEXT NOT NULL,
    "targetUserId" TEXT,
    "targetType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for shares
CREATE INDEX IF NOT EXISTS "shares_shareableType_shareableId_idx" ON shares("shareableType", "shareableId");
CREATE INDEX IF NOT EXISTS "shares_authorType_authorId_idx" ON shares("authorType", "authorId");
CREATE INDEX IF NOT EXISTS "shares_sharedTo_idx" ON shares("sharedTo");
CREATE INDEX IF NOT EXISTS "shares_targetUserId_idx" ON shares("targetUserId");
CREATE INDEX IF NOT EXISTS "shares_createdAt_idx" ON shares("createdAt");

-- ============================================
-- ✅ DONE! Tables created successfully
-- ============================================

