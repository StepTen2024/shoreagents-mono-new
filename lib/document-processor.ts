import { prisma } from './prisma'
import { generateEmbedding, chunkText } from './embeddings'

/**
 * Process a document for RAG by chunking and generating embeddings
 * @param documentId - The ID of the document to process
 */
export async function processDocumentForRAG(documentId: string) {
  console.log(`🔄 [DOC-PROCESSOR] Processing document ${documentId} for RAG...`)

  try {
    // Fetch the document
    const doc = await prisma.documents.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        uploadedBy: true,
        source: true,
      },
    })

    if (!doc) {
      console.error(`❌ [DOC-PROCESSOR] Document ${documentId} not found`)
      return
    }

    if (!doc.content || doc.content.trim().length === 0) {
      console.log(
        `⚠️  [DOC-PROCESSOR] Document ${doc.title} has no content to process`
      )
      return
    }

    console.log(`📄 [DOC-PROCESSOR] Processing "${doc.title}" (${doc.category})`)

    // Chunk the document content
    const chunks = chunkText(doc.content, 500) // ~500 tokens per chunk

    if (chunks.length === 0) {
      console.log(`⚠️  [DOC-PROCESSOR] No chunks generated for ${doc.title}`)
      return
    }

    console.log(`✂️  [DOC-PROCESSOR] Generated ${chunks.length} chunks`)

    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      console.log(`🔢 [DOC-PROCESSOR] Processing chunk ${i + 1}/${chunks.length}`)

      try {
        // Generate embedding for this chunk
        const embedding = await generateEmbedding(chunks[i])

        // Prepare metadata
        const metadata = {
          title: doc.title,
          category: doc.category,
          uploadedBy: doc.uploadedBy,
          source: doc.source,
          chunkIndex: i,
          totalChunks: chunks.length,
        }

        // Store in database using raw SQL (because Prisma doesn't support vector type natively)
        await prisma.$executeRaw`
          INSERT INTO document_embeddings (id, "documentId", "chunkIndex", "chunkText", embedding, metadata, "createdAt")
          VALUES (
            gen_random_uuid(),
            ${doc.id}::text,
            ${i}::int,
            ${chunks[i]}::text,
            ${JSON.stringify(embedding)}::vector,
            ${JSON.stringify(metadata)}::jsonb,
            NOW()
          )
          ON CONFLICT ("documentId", "chunkIndex") 
          DO UPDATE SET 
            "chunkText" = EXCLUDED."chunkText",
            embedding = EXCLUDED.embedding,
            metadata = EXCLUDED.metadata,
            "createdAt" = NOW()
        `

        console.log(`✅ [DOC-PROCESSOR] Chunk ${i + 1} embedded successfully`)
      } catch (chunkError) {
        console.error(
          `❌ [DOC-PROCESSOR] Failed to process chunk ${i + 1}:`,
          chunkError
        )
        // Continue with next chunk even if one fails
      }
    }

    console.log(
      `🎉 [DOC-PROCESSOR] Successfully processed ${chunks.length} chunks for "${doc.title}"`
    )
  } catch (error) {
    console.error(`❌ [DOC-PROCESSOR] Failed to process document:`, error)
    throw error
  }
}

/**
 * Reprocess all approved documents (useful for bulk operations)
 */
export async function reprocessAllDocuments() {
  console.log(`🔄 [DOC-PROCESSOR] Starting bulk reprocessing...`)

  const approvedDocs = await prisma.documents.findMany({
    where: {
      status: 'APPROVED',
      content: { not: null },
    },
    select: { id: true, title: true },
  })

  console.log(
    `📚 [DOC-PROCESSOR] Found ${approvedDocs.length} approved documents with content`
  )

  for (const doc of approvedDocs) {
    try {
      console.log(`\n🔄 [DOC-PROCESSOR] Processing: ${doc.title}`)
      await processDocumentForRAG(doc.id)
    } catch (error) {
      console.error(`❌ [DOC-PROCESSOR] Failed to process ${doc.title}:`, error)
      // Continue with next document
    }
  }

  console.log(`\n🎉 [DOC-PROCESSOR] Bulk reprocessing complete!`)
}

