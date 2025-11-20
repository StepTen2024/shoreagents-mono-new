import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { mapCategoryToDepartment } from "@/lib/category-department-map"
import { randomUUID } from "crypto"

// GET /api/tickets - Get all tickets for current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    // Get staff user first
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    const tickets = await prisma.tickets.findMany({
      where: {
        staffUserId: staffUser.id,
        ...(status && { status: status as any }),
      },
      include: {
        staff_users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
        management_users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
            department: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Fetch comment counts and reactions for each ticket
    const ticketsWithEngagement = await Promise.all(
      tickets.map(async (ticket) => {
        // Get comment count
        const commentCount = await prisma.comments.count({
          where: {
            commentableType: "TICKET",
            commentableId: ticket.id,
          },
        })

        // Get reactions (top 5 for display)
        const reactions = await prisma.reactions.findMany({
          where: {
            reactableType: "TICKET",
            reactableId: ticket.id,
          },
          take: 5,
          orderBy: { createdAt: "desc" },
        })

        // Map reaction types to emojis
        const reactionEmojis: Record<string, string> = {
          LIKE: "👍",
          LOVE: "❤️",
          FIRE: "🔥",
          CELEBRATE: "🎉",
          CLAP: "👏",
          LAUGH: "😂",
          POO: "💩",
          ROCKET: "🚀",
          SHOCKED: "😱",
          MIND_BLOWN: "🤯"
        }

        return {
          ...ticket,
          responses: Array(commentCount).fill({}), // Fake array for count
          reactions: reactions.map(r => ({ emoji: reactionEmojis[r.reactionType] || r.reactionType })),
        }
      })
    )

    console.log(`✅ [TICKETS API] Fetched ${tickets.length} tickets for staff ${staffUser.name}`)

    return NextResponse.json({ tickets: ticketsWithEngagement })
  } catch (error) {
    console.error("Error fetching tickets:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/tickets - Create a new ticket
export async function POST(request: NextRequest) {
  try {
    console.log('🎫 [TICKETS API] Starting ticket creation...')
    
    const session = await auth()
    console.log('🔐 Session:', session?.user?.id ? 'Authenticated' : 'Not authenticated')

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    console.log('📝 Request body:', { title: body.title, category: body.category, priority: body.priority, attachments: body.attachments?.length })
    const { title, description, category, priority, attachments } = body

    if (!title || !description || !category) {
      console.log('❌ Missing required fields')
      return NextResponse.json(
        { error: "Title, description, and category are required" },
        { status: 400 }
      )
    }

    // Get staff user first
    console.log('🔍 Looking for staff user with authUserId:', session.user.id)
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!staffUser) {
      console.log('❌ Staff user not found')
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }
    console.log('✅ Found staff user:', staffUser.name)

    // Generate unique ticket ID - Find the highest existing ticket number
    const lastTicket = await prisma.tickets.findFirst({
      orderBy: { ticketId: 'desc' },
      select: { ticketId: true }
    })

    let ticketNumber = 1
    if (lastTicket) {
      // Extract number from "TKT-0014" -> 14
      const match = lastTicket.ticketId.match(/TKT-(\d+)/)
      if (match) {
        ticketNumber = parseInt(match[1], 10) + 1
      }
    }

    const ticketId = `TKT-${String(ticketNumber).padStart(4, "0")}`
    console.log('🎫 Generated ticket ID:', ticketId, '(Last ticket:', lastTicket?.ticketId || 'none', ')')

    // 🎯 AUTO-ASSIGN: Map category to department and find manager
    const department = mapCategoryToDepartment(category)
    console.log('🏢 Mapped department:', department)
    let managementUserId: string | null = null

    if (department) {
      // Find a management user with matching department
      const manager = await prisma.management_users.findFirst({
        where: { department },
      })

      if (manager) {
        managementUserId = manager.id
        console.log(`✅ Auto-assigned ticket to ${manager.name} (${department})`)
      } else {
        console.log(`⚠️  No manager found for department: ${department}`)
      }
    }

    console.log('💾 Creating ticket in database...')
    const ticket = await prisma.tickets.create({
      data: {
        id: randomUUID(),
        staffUserId: staffUser.id,
        managementUserId, // Auto-assigned manager
        ticketId,
        title,
        description,
        category,
        priority: priority || "MEDIUM",
        status: "OPEN",
        attachments: attachments || [],
        createdByType: "STAFF",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        staff_users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
        management_users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
            department: true, // Include department for display
          },
        },
      },
    })

    console.log(`✅ [TICKETS API] Created ticket ${ticketId} for staff ${staffUser.name}`)

    return NextResponse.json({ success: true, ticket }, { status: 201 })
  } catch (error: any) {
    console.error('❌ [TICKETS API] ERROR CREATING TICKET:')
    console.error('Error name:', error?.name)
    console.error('Error message:', error?.message)
    console.error('Error code:', error?.code)
    console.error('Full error:', error)
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error?.message || 'Unknown error',
        code: error?.code || 'UNKNOWN'
      },
      { status: 500 }
    )
  }
}
