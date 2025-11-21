import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE - Remove a specific memory
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const session = await auth()

    if (!session?.user?.email) {
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

    console.log(`🗑️ [MEMORIES] ${staff.name} deleting memory ${id}`)

    // Delete memory (ensure ownership)
    const deleted = await prisma.staff_memories.deleteMany({
      where: {
        id,
        staffUserId: staff.id, // Ensure they own this memory
      },
    })

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'Memory not found or unauthorized' },
        { status: 404 }
      )
    }

    console.log(`✅ [MEMORIES] Memory ${id} deleted successfully`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`❌ [MEMORIES] Error:`, error)
    return NextResponse.json(
      { error: 'Failed to delete memory', details: String(error) },
      { status: 500 }
    )
  }
}

// PUT - Update a memory
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const session = await auth()

    if (!session?.user?.email) {
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

    const body = await request.json()
    const { memory, category, importance } = body

    console.log(`✏️ [MEMORIES] ${staff.name} updating memory ${id}`)

    // Update memory (ensure ownership)
    const updated = await prisma.staff_memories.updateMany({
      where: {
        id,
        staffUserId: staff.id, // Ensure they own this memory
      },
      data: {
        ...(memory && { memory: memory.trim() }),
        ...(category && { category }),
        ...(importance && { importance: Math.max(1, Math.min(10, importance)) }),
        updatedAt: new Date(),
      },
    })

    if (updated.count === 0) {
      return NextResponse.json(
        { error: 'Memory not found or unauthorized' },
        { status: 404 }
      )
    }

    console.log(`✅ [MEMORIES] Memory ${id} updated successfully`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`❌ [MEMORIES] Error:`, error)
    return NextResponse.json(
      { error: 'Failed to update memory', details: String(error) },
      { status: 500 }
    )
  }
}

