/**
 * Manual RAG Processing Trigger
 * Run this to process the SEO guide document
 */

import { processDocumentForRAG } from './lib/document-processor'

const DOCUMENT_ID = 'bd38b441-392a-4d1b-b71f-6d023bd94ce6'

async function main() {
  console.log('🚀 Starting manual RAG processing...')
  console.log(`📄 Document ID: ${DOCUMENT_ID}`)
  
  try {
    await processDocumentForRAG(DOCUMENT_ID)
    console.log('✅ Processing complete!')
    console.log('🔍 Check database: SELECT COUNT(*) FROM document_embeddings WHERE "documentId" = \'' + DOCUMENT_ID + '\';')
  } catch (error) {
    console.error('❌ Processing failed:', error)
    process.exit(1)
  }
}

main()

