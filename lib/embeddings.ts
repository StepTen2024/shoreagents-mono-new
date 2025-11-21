import OpenAI from 'openai'

/**
 * Get OpenAI client (lazy initialization to avoid build-time errors)
 */
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set in environment variables')
  }
  
  return new OpenAI({ apiKey })
}

/**
 * Generate an embedding vector for the given text using OpenAI
 * @param text - The text to embed
 * @returns A 1536-dimensional vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const openai = getOpenAIClient()
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small', // Cheaper, 1536 dimensions
      input: text.substring(0, 8000), // Limit to ~8K chars to avoid token limits
    })
    return response.data[0].embedding
  } catch (error) {
    console.error('❌ [EMBEDDINGS] Failed to generate embedding:', error)
    throw error
  }
}

/**
 * Chunk text into smaller pieces for better embedding quality
 * Uses paragraph-based chunking for now (simple approach)
 * @param text - The full text to chunk
 * @param maxTokens - Maximum tokens per chunk (rough estimate)
 * @returns Array of text chunks
 */
export function chunkText(text: string, maxTokens: number = 500): string[] {
  if (!text || text.trim().length === 0) {
    return []
  }

  // Simple paragraph-based chunking
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0)
  const chunks: string[] = []
  let currentChunk = ''

  for (const para of paragraphs) {
    // Rough token estimate: 1 token ≈ 4 characters
    const currentTokens = currentChunk.length / 4
    const paraTokens = para.length / 4

    if (currentTokens + paraTokens > maxTokens && currentChunk) {
      // Current chunk is full, save it and start new one
      chunks.push(currentChunk.trim())
      currentChunk = para
    } else {
      // Add paragraph to current chunk
      currentChunk += (currentChunk ? '\n\n' : '') + para
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }

  // If no chunks were created (e.g., single long paragraph), split by sentences
  if (chunks.length === 0 && text.trim()) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    let sentenceChunk = ''

    for (const sentence of sentences) {
      const sentenceTokens = (sentenceChunk + sentence).length / 4

      if (sentenceTokens > maxTokens && sentenceChunk) {
        chunks.push(sentenceChunk.trim())
        sentenceChunk = sentence
      } else {
        sentenceChunk += (sentenceChunk ? '. ' : '') + sentence.trim()
      }
    }

    if (sentenceChunk.trim()) {
      chunks.push(sentenceChunk.trim())
    }
  }

  console.log(`📝 [EMBEDDINGS] Chunked text into ${chunks.length} pieces`)
  return chunks
}

/**
 * Calculate cosine similarity between two embedding vectors
 * @param a - First embedding vector
 * @param b - Second embedding vector
 * @returns Similarity score (0-1, higher is more similar)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

