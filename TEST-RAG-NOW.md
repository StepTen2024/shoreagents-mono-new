# 🧪 Test RAG System NOW

## ✅ Setup Complete!

Everything is ready:
- ✅ pgvector extension enabled
- ✅ Tables created in Supabase
- ✅ Prisma schema synced
- ✅ Dev server running on http://localhost:3000

---

## 🚀 Quick Test (5 minutes)

### Test 1: Upload a Document with Text

1. **Go to:** http://localhost:3000/ai-assistant
2. **Login as:** Staff user (not client/admin)
3. **Upload a document** (must have text content)
4. **Watch the terminal** where `npm run dev` is running

**Expected Console Output:**
```
🤖 [RAG] Queueing document "Your Document" for embedding generation
🔄 [DOC-PROCESSOR] Processing document abc-123 for RAG...
📄 [DOC-PROCESSOR] Processing "Your Document" (TRAINING)
📝 [EMBEDDINGS] Chunked text into 3 pieces
🔢 [DOC-PROCESSOR] Processing chunk 1/3
✅ [DOC-PROCESSOR] Chunk 1 embedded successfully
🔢 [DOC-PROCESSOR] Processing chunk 2/3
✅ [DOC-PROCESSOR] Chunk 2 embedded successfully
🔢 [DOC-PROCESSOR] Processing chunk 3/3
✅ [DOC-PROCESSOR] Chunk 3 embedded successfully
🎉 [DOC-PROCESSOR] Successfully processed 3 chunks for "Your Document"
```

**✅ If you see this = RAG IS WORKING!**

---

### Test 2: Verify Embeddings in Database

**Go to Supabase SQL Editor and run:**
```sql
SELECT 
  "documentId",
  "chunkIndex",
  LEFT("chunkText", 80) as preview,
  array_length(embedding::float[], 1) as vector_size,
  "createdAt"
FROM document_embeddings
ORDER BY "createdAt" DESC
LIMIT 5;
```

**Expected Result:**
- You see rows with your document chunks
- `vector_size` = 1536 (OpenAI embedding dimension)
- `preview` shows actual text from your document

**✅ If you see this = Embeddings are stored correctly!**

---

### Test 3: Ask AI About the Document

1. **In AI Assistant chat**, ask: "What is this document about?"
2. **Watch the console**

**Expected Console Output:**
```
🔍 [VECTOR-SEARCH] Searching for: "What is this document about?"
✅ [VECTOR-SEARCH] Query embedding generated
📚 [VECTOR-SEARCH] Staff can access 1 documents
✅ [VECTOR-SEARCH] Found 3 relevant chunks
  1. "Your Document" (similarity: 0.876)
  2. "Your Document" (similarity: 0.743)
  3. "Your Document" (similarity: 0.681)
```

**Expected AI Response:**
- AI should cite specific parts of YOUR document
- AI should answer based on the document you uploaded
- NOT generic knowledge!

**✅ If AI cites your document = RAG Search is working!**

---

### Test 4: Check Conversation Storage

**In Supabase SQL Editor:**
```sql
SELECT 
  role,
  LEFT(message, 100) as message_preview,
  "isPinned",
  "createdAt"
FROM ai_conversations
ORDER BY "createdAt" DESC
LIMIT 10;
```

**Expected Result:**
- You see both 'user' and 'assistant' messages
- Your question and AI's response are stored
- `isPinned` = false (by default)

**✅ If you see messages = Conversation storage working!**

---

## 🐛 If Something Fails

### No console logs appear?
**Problem:** Document has no `content` field (only fileUrl)
**Solution:** Upload a document with actual text content, not just a file link

### Error: "OPENAI_API_KEY is not set"
**Problem:** Missing OpenAI API key
**Solution:** 
```bash
# Add to .env.local:
OPENAI_API_KEY=sk-your-actual-key-here
```
Then restart server: `npm run dev`

### Error: "type vector does not exist"
**Problem:** pgvector not enabled (but you said it worked?)
**Solution:** Run the SQL again in Supabase, make sure you're on the correct database

### No embeddings in database?
**Problem:** Processing failed silently
**Solution:** Check console for errors with ❌ emoji, share the error with me

### AI doesn't cite the document?
**Problem:** Query might not be relevant to document content
**Solution:** Ask a more specific question about what's IN the document

---

## 📊 Full Verification (Optional)

Run this in Supabase SQL Editor:
```sql
-- Run the verification script
\i verify-rag-setup.sql
```

Or just copy/paste the contents of `verify-rag-setup.sql`

---

## 🎉 Success Criteria

Your RAG system is **100% working** if:

1. ✅ Console shows document processing logs
2. ✅ `document_embeddings` table has rows with vector_size = 1536
3. ✅ AI cites YOUR document in responses
4. ✅ `ai_conversations` table stores your chat messages

---

**Status:** Ready for testing!  
**Server:** Running on http://localhost:3000  
**Next:** Upload a doc and watch it work! 🚀

