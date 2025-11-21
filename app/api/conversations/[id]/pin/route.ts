import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/conversations/[id]/pin
 * Pin an important AI conversation message (makes it persist beyond 30 days)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get staff user
    const staff = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
      select: { id: true, name: true },
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff user not found' }, { status: 404 })
    }

    console.log(`📌 [PIN] ${staff.name} pinning conversation ${id}`)

    // Update conversation to pinned (ensure ownership)
    const updated = await prisma.ai_conversations.updateMany({
      where: {
        id,
        staffUserId: staff.id, // Ensure they own this conversation
      },
      data: {
        isPinned: true,
      },
    })

    if (updated.count === 0) {
      return NextResponse.json(
        { error: 'Conversation not found or unauthorized' },
        { status: 404 }
      )
    }

    console.log(`✅ [PIN] Conversation ${id} pinned successfully`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`❌ [PIN] Error:`, error)
    return NextResponse.json(
      { error: 'Failed to pin conversation', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/conversations/[id]/pin
 * Unpin a conversation message (will be subject to 30-day cleanup)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get staff user
    const staff = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
      select: { id: true, name: true },
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff user not found' }, { status: 404 })
    }

    console.log(`📍 [UNPIN] ${staff.name} unpinning conversation ${id}`)

    // Update conversation to unpinned (ensure ownership)
    const updated = await prisma.ai_conversations.updateMany({
      where: {
        id,
        staffUserId: staff.id, // Ensure they own this conversation
      },
      data: {
        isPinned: false,
      },
    })

    if (updated.count === 0) {
      return NextResponse.json(
        { error: 'Conversation not found or unauthorized' },
        { status: 404 }
      )
    }

    console.log(`✅ [UNPIN] Conversation ${id} unpinned successfully`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`❌ [UNPIN] Error:`, error)
    return NextResponse.json(
      { error: 'Failed to unpin conversation', details: String(error) },
      { status: 500 }
    )
  }
}

