import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch conversation history for authenticated staff user
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get StaffUser (only staff have AI conversations)
    const staffUser = await prisma.staff_users.findUnique({
      where: { id: session.user.id },
    })

    if (!staffUser) {
      return NextResponse.json({ error: 'Not a staff user' }, { status: 403 })
    }

    console.log(`💬 [CONVERSATIONS] Fetching history for ${staffUser.name}`)

    // Fetch recent conversations (last 30 days OR pinned)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const conversations = await prisma.ai_conversations.findMany({
      where: {
        staffUserId: staffUser.id,
        OR: [
          { isPinned: true }, // Always include pinned messages
          { createdAt: { gte: thirtyDaysAgo } }, // Include messages from last 30 days
        ],
      },
      orderBy: {
        createdAt: 'asc', // Chronological order
      },
    })

    console.log(`✅ [CONVERSATIONS] Found ${conversations.length} messages (${conversations.filter(c => c.isPinned).length} pinned)`)

    return NextResponse.json({
      conversations,
      total: conversations.length,
      pinned: conversations.filter(c => c.isPinned).length,
    })
  } catch (error) {
    console.error('❌ [CONVERSATIONS] Error fetching conversation history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversation history' },
      { status: 500 }
    )
  }
}

