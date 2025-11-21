import { prisma } from './prisma'
import { generateEmbedding } from './embeddings'

export interface SearchResult {
  chunkText: string
  metadata: {
    title: string
    category: string
    uploadedBy: string
    source: string
    chunkIndex: number
    totalChunks: number
  }
  similarity: number
  documentId: string
}

/**
 * Search for relevant document chunks using vector similarity
 * @param query - The user's question/query
 * @param staffUserId - The staff member making the query
 * @param limit - Maximum number of chunks to return (default 5)
 * @returns Array of relevant chunks with metadata
 */
export async function searchRelevantChunks(
  query: string,
  staffUserId: string,
  limit: number = 5
): Promise<SearchResult[]> {
  try {
    console.log(`🔍 [VECTOR-SEARCH] Searching for: "${query.substring(0, 100)}..."`)

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query)
    console.log(`✅ [VECTOR-SEARCH] Query embedding generated`)

    // Find documents this staff can access
    // Staff can see:
    // 1. APPROVED documents (from any source)
    // 2. Their own documents (any status)
    // 3. Documents shared with them
    const accessibleDocs = await prisma.documents.findMany({
      where: {
        OR: [
          { status: 'APPROVED' }, // All approved docs
          { staffUserId }, // Their own docs
          {
            // Docs shared with them explicitly
            sharedWith: {
              has: staffUserId,
            },
          },
          {
            // Docs shared with everyone
            sharedWithAll: true,
          },
        ],
      },
      select: { id: true, title: true },
    })

    const docIds = accessibleDocs.map((d) => d.id)

    console.log(`📚 [VECTOR-SEARCH] Staff can access ${docIds.length} documents`)

    if (docIds.length === 0) {
      console.log(`⚠️  [VECTOR-SEARCH] No accessible documents found`)
      return []
    }

    // Vector similarity search using pgvector
    // Using cosine distance operator (<=>)
    // Similarity = 1 - distance (so higher is better)
    const results = await prisma.$queryRaw<SearchResult[]>`
      SELECT 
        "chunkText",
        metadata,
        "documentId",
        1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity
      FROM document_embeddings
      WHERE "documentId" = ANY(${docIds}::text[])
      ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
      LIMIT ${limit}
    `

    console.log(`✅ [VECTOR-SEARCH] Found ${results.length} relevant chunks`)

    // Log top results for debugging
    results.forEach((result, i) => {
      console.log(
        `  ${i + 1}. "${result.metadata.title}" (similarity: ${result.similarity.toFixed(3)})`
      )
    })

    return results
  } catch (error) {
    console.error(`❌ [VECTOR-SEARCH] Search failed:`, error)
    // Return empty array instead of throwing - AI can still respond without RAG
    return []
  }
}

/**
 * Search conversation history using vector similarity
 * This allows AI to remember similar past conversations
 * @param query - The current user query
 * @param staffUserId - The staff member
 * @param limit - Max number of similar conversations to return
 * @returns Array of similar past conversations
 */
export async function searchConversationHistory(
  query: string,
  staffUserId: string,
  limit: number = 3
): Promise<
  Array<{
    message: string
    role: string
    createdAt: Date
    isPinned: boolean
  }>
> {
  try {
    // For now, just return recent + pinned messages
    // In the future, we could embed conversation history too
    const recentConversations = await prisma.ai_conversations.findMany({
      where: {
        staffUserId,
        OR: [
          { isPinned: true }, // Always include pinned
          {
            // Or recent messages
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        ],
      },
      orderBy: [
        { isPinned: 'desc' }, // Pinned first
        { createdAt: 'desc' }, // Then by recency
      ],
      take: limit * 2, // Get more for better context
      select: {
        message: true,
        role: true,
        createdAt: true,
        isPinned: true,
      },
    })

    return recentConversations
  } catch (error) {
    console.error(`❌ [VECTOR-SEARCH] Conversation history search failed:`, error)
    return []
  }
}

