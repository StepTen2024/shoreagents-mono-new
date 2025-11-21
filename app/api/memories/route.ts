import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch all memories for authenticated staff user
export async function GET(request: NextRequest) {
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

    console.log(`🧠 [MEMORIES] Fetching memories for ${staffUser.name}`)

    // Fetch all memories ordered by importance then date
    const memories = await prisma.staff_memories.findMany({
      where: {
        staffUserId: staffUser.id,
      },
      orderBy: [
        { importance: 'desc' }, // Most important first
        { createdAt: 'desc' },  // Then most recent
      ],
    })

    console.log(`✅ [MEMORIES] Found ${memories.length} memories`)

    return NextResponse.json({
      memories,
      total: memories.length,
    })
  } catch (error) {
    console.error('❌ [MEMORIES] Error fetching memories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch memories' },
      { status: 500 }
    )
  }
}

// POST - Create a new memory
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
    const { memory, category = 'FACT', importance = 5 } = body

    if (!memory || !memory.trim()) {
      return NextResponse.json(
        { error: 'Memory content is required' },
        { status: 400 }
      )
    }

    console.log(`🧠 [MEMORIES] Creating memory for ${staffUser.name}:`, {
      memory: memory.substring(0, 50),
      category,
      importance,
    })

    // Create memory
    const newMemory = await prisma.staff_memories.create({
      data: {
        staffUserId: staffUser.id,
        memory: memory.trim(),
        category,
        importance: Math.max(1, Math.min(10, importance)), // Clamp 1-10
        updatedAt: new Date(),
      },
    })

    console.log(`✅ [MEMORIES] Memory created: ${newMemory.id}`)

    return NextResponse.json({
      success: true,
      memory: newMemory,
    })
  } catch (error) {
    console.error('❌ [MEMORIES] Error creating memory:', error)
    return NextResponse.json(
      { error: 'Failed to create memory' },
      { status: 500 }
    )
  }
}

