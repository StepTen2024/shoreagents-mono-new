import { processDocumentForRAG } from './lib/document-processor'

// This will be the document ID after we upload it
const documentId = 'REPLACE_WITH_ACTUAL_ID'

console.log('🚀 Starting RAG processing for Facebook Ads Guide...')
processDocumentForRAG(documentId)
  .then(() => {
    console.log('✅ RAG processing complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ RAG processing failed:', error)
    process.exit(1)
  })
