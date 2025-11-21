# pgvector Extension Setup for Supabase

## Error Encountered
```
Error: ERROR: type "vector" does not exist
```

## Solution Required

You need to enable the pgvector extension in your Supabase database before running `prisma db push`.

### Steps:

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run This SQL Command**
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

4. **Verify Installation**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'vector';
   ```
   
   You should see a row with `extname = 'vector'` if successful.

5. **Then Return Here and Run**
   ```bash
   npx prisma db push
   ```

## Why This Is Needed

The `document_embeddings` table uses PostgreSQL's `vector` type (provided by pgvector extension) to store OpenAI embeddings as 1536-dimensional vectors for semantic search.

## Alternative: Comment Out Vector Tables Temporarily

If you want to continue development without vector search for now, you can:
1. Comment out `document_embeddings` and `ai_conversations` models in `prisma/schema.prisma`
2. Run `npx prisma db push`
3. Uncomment them later when you're ready to enable pgvector

