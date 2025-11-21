# 🐛 RAG Implementation - Bugs Fixed & Testing Required

## ❌ Bugs Found & Fixed

### Bug #1: OpenAI Client Initialization ✅ FIXED
**Problem:** OpenAI client was being instantiated at module import time, which fails during `npm run build` if `OPENAI_API_KEY` is not set.

**Error:**
```
eN [Error]: Missing credentials. Please pass an `apiKey`, or set the `OPENAI_API_KEY` environment variable.
```

**Fix:** Changed to lazy initialization:
```typescript
// Before (BROKEN)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// After (FIXED)
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set')
  return new Open AI({ apiKey })
}
```

**File:** `lib/embeddings.ts`

---

### Bug #2: Next.js 15 params Handling ✅ FIXED
**Problem:** Pin/unpin API routes were using synchronous `params` object instead of awaiting the Promise.

**Error:** Would fail at runtime with `params.then is not a function` or similar.

**Fix:** Updated to Next.js 15 pattern:
```typescript
// Before (BROKEN)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id // ❌ Wrong!
}

// After (FIXED)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params // ✅ Correct!
}
```

**Files:** 
- `app/api/conversations/[id]/pin/route.ts` (POST and DELETE handlers)

---

## ⚠️ CRITICAL: You MUST Run SQL First!

**Prisma CANNOT create the pgvector extension!** Only raw SQL can do this.

### Step 1: Enable pgvector in Supabase

1. Go to https://supabase.com/dashboard
2. Select your project
3. SQL Editor → New Query
4. Run this:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
5. Verify:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'vector';
   ```

### Step 2: THEN Run Prisma

After pgvector is enabled:
```bash
cd /Users/stephenatcheler/Documents/GitHub/shoreagents-mono-new
npx prisma db push
```

This will create:
- `ai_conversations` table
- `document_embeddings` table (with vector column)

---

## 🧪 Manual Testing Checklist

### Test 1: Prisma Schema Push ✅
```bash
npx prisma db push
```

**Expected Result:**
- ✅ No errors about `type "vector" does not exist`
- ✅ Tables `ai_conversations` and `document_embeddings` created
- ✅ Indexes created on `document_embeddings.embedding`

**If this fails:**
- Did you run the SQL to enable pgvector?
- Check: `SELECT * FROM pg_extension WHERE extname = 'vector';`

---

### Test 2: Document Upload & Processing ✅

1. Go to `http://localhost:3000/ai-assistant` (as staff user)
2. Upload a document with text content (NOT just a file URL)
3. Check console logs:

**Expected Console Output:**
```
🤖 [RAG] Queueing document "Document Name" for embedding generation
🔄 [DOC-PROCESSOR] Processing document abc123 for RAG...
📄 [DOC-PROCESSOR] Processing "Document Name" (TRAINING)
✂️  [DOC-PROCESSOR] Generated 5 chunks
🔢 [DOC-PROCESSOR] Processing chunk 1/5
✅ [DOC-PROCESSOR] Chunk 1 embedded successfully
...
🎉 [DOC-PROCESSOR] Successfully processed 5 chunks for "Document Name"
```

**Check Database:**
```sql
SELECT * FROM document_embeddings WHERE "documentId" = 'your-doc-id';
```

Should see:
- Multiple rows (one per chunk)
- `chunkText` has actual content
- `embedding` has vector data (array of 1536 numbers)
- `metadata` has JSON with title, category, etc.

---

### Test 3: RAG Vector Search ✅

1. Upload a document about SEO (or any topic)
2. Wait for processing to complete (check console)
3. Ask AI: "What are the best practices for SEO?"
4. Check console logs:

**Expected Console Output:**
```
🔍 [VECTOR-SEARCH] Searching for: "What are the best practices for SEO?"
✅ [VECTOR-SEARCH] Query embedding generated
📚 [VECTOR-SEARCH] Staff can access 10 documents
✅ [VECTOR-SEARCH] Found 5 relevant chunks
  1. "SEO Best Practices" (similarity: 0.876)
  2. "On-Page SEO Guide" (similarity: 0.743)
  3. "Technical SEO Checklist" (similarity: 0.681)
  ...
```

**Expected AI Response:**
- Should cite specific document excerpts
- Should mention similarity scores (if you add them to UI)
- Should answer based on YOUR documents, not general knowledge

---

### Test 4: Staff Context Loading ✅

1. Make sure your staff user has:
   - Interests filled in (hobbies, favorite game, etc.)
   - At least one task assigned
   - A performance review
   - Recent time entries

2. Chat with AI (ask anything)
3. Check console logs:

**Expected Console Output:**
```
🧠 [RAG] Building enhanced context for staff John Doe
🔍 [STAFF-CONTEXT] Building context for staff abc123
✅ [STAFF-CONTEXT] Context built successfully
  - Staff: John Doe
  - Recent tasks: 5
  - Reviews: 2
  - Time entries (7d): 12
```

4. Ask AI: "What are my tasks?"

**Expected AI Response:**
- Should list YOUR actual tasks
- Should mention deadlines
- Should reference your interests if relevant
- Should be personalized, not generic

---

### Test 5: Conversation Storage ✅

1. Chat with AI (send 2-3 messages)
2. Check database:

```sql
SELECT * FROM ai_conversations 
WHERE "staffUserId" = 'your-staff-id' 
ORDER BY "createdAt" DESC;
```

**Expected Result:**
- Should see BOTH user and assistant messages
- `role` = 'user' for your messages, 'assistant' for AI
- `message` contains actual text
- `isPinned` = false by default
- `contextUsed` has JSON with `documentIds`, `taskIds`, `ragChunksUsed`

---

### Test 6: Conversation History / Memory ✅

1. Chat with AI about a specific topic (e.g., "I need help with SEO")
2. Close the browser tab
3. Reopen AI Assistant
4. Ask: "What did we just talk about?"

**Expected AI Response:**
- Should reference the previous conversation
- Should remember the topic (SEO)
- Should provide continuity

**Check Console:**
```
✅ [RAG] Loaded 10 conversation messages
```

---

### Test 7: 30-Day Cleanup ✅

**Manual Test** (simulate old messages):

```sql
-- Create a fake old message (>30 days ago)
INSERT INTO ai_conversations (id, "staffUserId", message, role, "isPinned", "createdAt")
VALUES (
  gen_random_uuid(),
  'your-staff-id',
  'This is an old message',
  'user',
  false,
  NOW() - INTERVAL '31 days'
);
```

Then send a new chat message.

**Expected Result:**
- Old unpinned message should be deleted
- Check console: `🗑️ [CONVERSATION] Cleaned up 1 old messages`

**Pinned messages should remain:**
```sql
-- Update message to pinned
UPDATE ai_conversations 
SET "isPinned" = true 
WHERE message = 'This is an old message';
```

Send another chat. Old message should NOT be deleted.

---

### Test 8: Pin/Unpin API ✅

**Test Pin:**
```bash
curl -X POST http://localhost:3000/api/conversations/{conversation-id}/pin \
  -H "Cookie: your-session-cookie"
```

**Expected:**
- `{ "success": true }`
- Database: `isPinned = true` for that conversation

**Test Unpin:**
```bash
curl -X DELETE http://localhost:3000/api/conversations/{conversation-id}/pin \
  -H "Cookie: your-session-cookie"
```

**Expected:**
- `{ "success": true }`
- Database: `isPinned = false` for that conversation

---

### Test 9: Auto-Processing on All Upload Types ✅

Test each document upload endpoint:

**Staff Upload:**
- Upload via `http://localhost:3000/ai-assistant`
- Check console for RAG processing

**Client Upload:**
- Login as client
- Upload doc via `http://localhost:3000/client/documents`
- Check console for RAG processing

**Admin Upload:**
- Login as admin
- Upload doc via `http://localhost:3000/admin/documents`
- Check console for RAG processing

**Staff Doc Approval:**
- Staff uploads doc (pending)
- Client approves it
- Check console: `🤖 [RAG] Queueing approved document...`

---

### Test 10: Error Handling (Negative Tests) ✅

**Test 1: Missing OpenAI Key**
```bash
# Temporarily remove key
unset OPENAI_API_KEY
# Try to chat with AI
```

**Expected:**
- AI chat still works (RAG fails gracefully)
- Console: `❌ [EMBEDDINGS] Failed to generate embedding: OPENAI_API_KEY is not set`
- User gets response (without RAG context)

**Test 2: Document with No Content**
- Upload a document with only `fileUrl` (no `content` field)

**Expected:**
- No RAG processing
- Console: `ℹ️ [RAG] Document "Name" has no content, skipping RAG processing`

**Test 3: pgvector Not Enabled**
- Try without running the SQL extension

**Expected:**
- `npx prisma db push` fails
- Error: `type "vector" does not exist`

**Test 4: Unauthorized Pin/Unpin**
- Try to pin another staff's conversation

**Expected:**
- 404 error: `Conversation not found or unauthorized`

---

## 📊 Success Criteria

### ✅ System is Working If:

1. **Documents are processed:**
   - `document_embeddings` table has rows
   - Each chunk has a 1536-dimensional vector

2. **RAG search works:**
   - AI cites specific document excerpts
   - Console shows similarity scores > 0.5 for relevant docs

3. **Conversations are saved:**
   - `ai_conversations` table grows with each chat
   - Both user and AI messages are stored

4. **Staff context is loaded:**
   - AI knows staff's tasks, interests, reviews
   - AI personalizes responses

5. **Memory works:**
   - AI remembers recent conversations
   - Pinned messages persist beyond 30 days

---

## 🚨 Known Limitations

1. **pgvector MUST be enabled manually** - Prisma can't do this
2. **Pin button UI not implemented** - API works, but no button in UI yet
3. **OpenAI API key required** - No fallback embedding model
4. **CloudConvert required** - For PDF text extraction
5. **Only staff get RAG** - Clients/admins don't have conversation storage (by design)

---

## 🐛 If You Find More Bugs

**Report with:**
1. Error message (full stack trace)
2. Console logs (both browser and server)
3. Steps to reproduce
4. Which test from this document failed

**Common Fixes:**
- Clear `.next` folder: `rm -rf .next`
- Regenerate Prisma: `npx prisma generate`
- Restart dev server: `npm run dev`
- Check env vars: `echo $OPENAI_API_KEY`

---

**Status:** 2 bugs fixed, pushed to `stepten-deployed`  
**Date:** November 21, 2025  
**Ready for:** Manual testing after pgvector setup

