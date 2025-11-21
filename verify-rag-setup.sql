-- ============================================
-- RAG SETUP VERIFICATION SCRIPT
-- Run this in Supabase SQL Editor to verify everything is working
-- ============================================

-- 1. Check pgvector extension is enabled
SELECT 
  '✅ pgvector extension' as check_name,
  extname, 
  extversion 
FROM pg_extension 
WHERE extname = 'vector';

-- 2. Check document_embeddings table exists
SELECT 
  '✅ document_embeddings table' as check_name,
  COUNT(*) as total_embeddings,
  COUNT(DISTINCT "documentId") as total_documents
FROM document_embeddings;

-- 3. Check ai_conversations table exists
SELECT 
  '✅ ai_conversations table' as check_name,
  COUNT(*) as total_conversations,
  COUNT(DISTINCT "staffUserId") as unique_staff_members
FROM ai_conversations;

-- 4. Check vector column structure
SELECT 
  '✅ Vector column structure' as check_name,
  column_name, 
  data_type,
  udt_name
FROM information_schema.columns 
WHERE table_name = 'document_embeddings' 
  AND column_name = 'embedding';

-- 5. Check indexes exist
SELECT 
  '✅ Indexes' as check_name,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('document_embeddings', 'ai_conversations')
ORDER BY tablename, indexname;

-- 6. Check foreign key constraints
SELECT 
  '✅ Foreign Keys' as check_name,
  tc.table_name, 
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('document_embeddings', 'ai_conversations');

-- ============================================
-- SAMPLE QUERIES (These should return 0 on fresh install)
-- ============================================

-- Show recent embeddings (if any)
SELECT 
  '📊 Recent Embeddings' as info,
  "documentId",
  "chunkIndex",
  LEFT("chunkText", 100) as text_preview,
  array_length(embedding::float[], 1) as vector_dimensions,
  "createdAt"
FROM document_embeddings
ORDER BY "createdAt" DESC
LIMIT 5;

-- Show recent conversations (if any)
SELECT 
  '💬 Recent Conversations' as info,
  "staffUserId",
  role,
  LEFT(message, 100) as message_preview,
  "isPinned",
  "createdAt"
FROM ai_conversations
ORDER BY "createdAt" DESC
LIMIT 5;

-- ============================================
-- SUCCESS CRITERIA
-- ============================================
-- If you see all ✅ checks above, your RAG system is ready!
-- 
-- Expected results on fresh install:
-- - pgvector extension: version 0.7.0 or higher
-- - document_embeddings: 0 rows
-- - ai_conversations: 0 rows
-- - embedding column: data_type = USER-DEFINED, udt_name = vector
-- - Multiple indexes created
-- - Foreign keys to documents and staff_users tables

