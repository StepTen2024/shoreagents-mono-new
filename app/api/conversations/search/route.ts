import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateEmbedding } from '@/lib/embeddings'

// POST - Search conversations semantically
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get StaffUser
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
    })

    if (!staffUser) {
      return NextResponse.json({ error: 'Not a staff user' }, { status: 403 })
    }

    const body = await request.json()
    const { query, limit = 10 } = body

    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    console.log(`🔍 [CONVERSATION-SEARCH] ${staffUser.name} searching for: "${query}"`)

    // Generate embedding for search query
    const queryEmbedding = await generateEmbedding(query)

    console.log(`✅ [CONVERSATION-SEARCH] Generated query embedding`)

    // Perform vector similarity search
    // Note: This uses pgvector's cosine distance operator (<=>)
    const results = await prisma.$queryRaw<Array<{
      id: string
      message: string
      role: string
      isPinned: boolean | null
      createdAt: Date | null
      similarity: number
    }>>`
      SELECT 
        id,
        message,
        role,
        "isPinned",
        "createdAt",
        1 - (embedding <=> ${queryEmbedding}::vector) as similarity
      FROM ai_conversations
      WHERE "staffUserId" = ${staffUser.id}
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${queryEmbedding}::vector
      LIMIT ${limit}
    `

    console.log(`✅ [CONVERSATION-SEARCH] Found ${results.length} matches`)

    // Filter results with similarity > 0.5 (reasonably relevant)
    const relevantResults = results.filter(r => r.similarity > 0.5)

    console.log(`📊 [CONVERSATION-SEARCH] ${relevantResults.length} results above 0.5 similarity`)

    return NextResponse.json({
      results: relevantResults,
      total: relevantResults.length,
      query,
    })
  } catch (error) {
    console.error('❌ [CONVERSATION-SEARCH] Error:', error)
    return NextResponse.json(
      { error: 'Failed to search conversations' },
      { status: 500 }
    )
  }
}

