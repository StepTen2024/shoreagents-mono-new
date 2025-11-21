-- First, find the most recent CLIENT document upload
SELECT 
  d.id,
  d.title,
  d.source,
  d.uploadedBy,
  d.uploadedByRole,
  d.status,
  d.approvedBy,
  d.createdAt,
  COUNT(de.id) as embedding_count
FROM documents d
LEFT JOIN document_embeddings de ON d.id = de."documentId"
WHERE d.source = 'CLIENT'
GROUP BY d.id, d.title, d.source, d.uploadedBy, d.uploadedByRole, d.status, d.approvedBy, d.createdAt
ORDER BY d.createdAt DESC
LIMIT 3;

-- Then check if embeddings exist for the latest one
SELECT 
  de.id,
  de."documentId",
  de."chunkIndex",
  LEFT(de."chunkText", 100) as chunk_preview,
  de.metadata,
  de."createdAt"
FROM document_embeddings de
JOIN documents d ON d.id = de."documentId"
WHERE d.source = 'CLIENT'
ORDER BY d."createdAt" DESC, de."chunkIndex" ASC
LIMIT 10;
