# 🔍 CLIENT DOCUMENT UPLOAD VERIFICATION

## What We're Checking

### 1. Document Record
- ✅ `source` = `CLIENT` (not STAFF or ADMIN)
- ✅ `uploadedByRole` = `CLIENT` (confirms who uploaded it)
- ✅ `uploadedBy` = Company name (shows which client uploaded it)
- ✅ `status` = `APPROVED` (auto-approved for client uploads)
- ✅ `approvedBy` = Client name (self-approval)

### 2. Embeddings Relationship
- ✅ `document_embeddings` table has records with matching `documentId`
- ✅ Each embedding has a `chunkIndex` (0, 1, 2, etc.)
- ✅ Each embedding has `chunkText` (actual content from the document)
- ✅ Each embedding has a `vector(1536)` (OpenAI embedding)
- ✅ Metadata shows which document it came from

### 3. RAG Functionality
- ✅ When staff asks a question, the AI can search these embeddings
- ✅ The similarity score ranks which chunks are most relevant
- ✅ The AI includes this context in its response

## SQL Verification Query

Run this in your Supabase SQL Editor to verify:

```sql
-- 1. Check the latest CLIENT document
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

-- 2. Check embeddings for the latest CLIENT document
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
```

## Expected Results

### Document Record (Example)
```
id: "abc-123-def-456"
title: "TEST-CLIENT-VAULTRE-LISTING-GUIDE"
source: "CLIENT"
uploadedBy: "Shore Agents Australia"  ← Company name
uploadedByRole: "CLIENT"
status: "APPROVED"
approvedBy: "Emma Wilson"  ← Client user name
createdAt: "2025-11-21 10:30:00"
embedding_count: 15  ← Number of chunks
```

### Embeddings Records (Example)
```
Chunk 0: "# VAULTRE Real Estate Software - Listing Processing Guide\n\nThis guide will walk you through..."
Chunk 1: "## Step 1: Log into VAULTRE\n\n1. Navigate to https://vaultre.com.au\n2. Enter your..."
Chunk 2: "## Step 2: Create New Listing\n\nOnce logged in, follow these steps..."
... (continues for all chunks)
```

## What This Means

1. **100% Client Upload**: The document is clearly marked as uploaded by a CLIENT user from a specific company
2. **Auto-Approved**: No admin approval needed, immediately available for RAG
3. **Properly Chunked**: The document has been split into semantic chunks
4. **Embeddings Generated**: Each chunk has a vector embedding for similarity search
5. **RAG-Ready**: The AI can now search and retrieve relevant information from this document

## Visual Confirmation in UI

### In Client Portal (`/client/knowledge-base`)
- The document should appear in the list with a "CLIENT" badge
- Status should show "Approved" (green checkmark)
- Uploaded by should show the company name

### In Staff AI Assistant (`/ai-assistant`)
- Staff can use `@documentName` to reference this document
- The AI will automatically search this document when relevant questions are asked
- The AI response will include "Sources:" showing this document was used

## No Confusion Possible

- **source**: `CLIENT` (not `STAFF` or `ADMIN`)
- **uploadedByRole**: `CLIENT` (not `STAFF` or `ADMIN`)
- **uploadedBy**: Company name (not staff name)

This triple-marker system ensures there's zero chance of confusion about who uploaded the document! 🎯

## Next Steps

1. Run the SQL query in Supabase SQL Editor
2. Verify the `embedding_count` > 0
3. Check the first few chunk previews make sense
4. Test the AI Assistant by asking a question related to the document content

