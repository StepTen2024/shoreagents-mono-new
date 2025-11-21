-- Check if the SEO guide document was processed for RAG
-- Run this in Supabase SQL Editor

-- 1. Check document details
SELECT 
  id,
  title,
  status,
  LENGTH(content) as content_length,
  "createdAt",
  "approvedAt"
FROM documents 
WHERE title LIKE '%SEO%'
LIMIT 1;

-- 2. Check if embeddings were created
SELECT 
  COUNT(*) as total_chunks,
  MIN("chunkIndex") as first_chunk,
  MAX("chunkIndex") as last_chunk,
  MIN("createdAt") as first_processed,
  MAX("createdAt") as last_processed
FROM document_embeddings
WHERE "documentId" = 'bd38b441-392a-4d1b-b71f-6d023bd94ce6';

-- 3. Preview first 5 chunks
SELECT 
  "chunkIndex",
  LEFT("chunkText", 100) as preview,
  array_length(embedding::float[], 1) as vector_size
FROM document_embeddings
WHERE "documentId" = 'bd38b441-392a-4d1b-b71f-6d023bd94ce6'
ORDER BY "chunkIndex"
LIMIT 5;

