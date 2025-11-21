-- Migration: Add AI Memory and Conversation Search Features
-- Date: November 21, 2025

-- 1. Add embedding column to ai_conversations for semantic search
ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 2. Create index for vector similarity search
CREATE INDEX IF NOT EXISTS ai_conversations_embedding_idx 
ON ai_conversations 
USING ivfflat (embedding vector_cosine_ops);

-- 3. Create MemoryCategory enum
DO $$ BEGIN
    CREATE TYPE "MemoryCategory" AS ENUM (
        'PREFERENCE',
        'FACT',
        'GOAL',
        'WORKFLOW',
        'CLIENT_INFO'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Create staff_memories table
CREATE TABLE IF NOT EXISTS staff_memories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "staffUserId" TEXT NOT NULL,
    memory TEXT NOT NULL,
    category "MemoryCategory" DEFAULT 'FACT',
    importance INTEGER DEFAULT 5,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT staff_memories_staffuserid_fkey 
        FOREIGN KEY ("staffUserId") 
        REFERENCES staff_users(id) 
        ON DELETE CASCADE 
        ON UPDATE NO ACTION
);

-- 5. Create indexes for staff_memories
CREATE INDEX IF NOT EXISTS staff_memories_staffuserid_createdat_idx 
ON staff_memories("staffUserId", "createdAt");

CREATE INDEX IF NOT EXISTS staff_memories_staffuserid_importance_idx 
ON staff_memories("staffUserId", importance);

-- 6. Add comment for documentation
COMMENT ON TABLE staff_memories IS 'Stores AI memories about staff members - preferences, facts, goals, workflows, and client info';
COMMENT ON COLUMN ai_conversations.embedding IS 'Vector embedding for semantic search of conversations using OpenAI text-embedding-3-small (1536 dimensions)';

