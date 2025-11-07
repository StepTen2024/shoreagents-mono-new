import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { randomUUID } from "crypto"

// GET /api/admin/tickets - Get all tickets for management view
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is management
    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!managementUser) {
      return NextResponse.json({ error: "Management user not found" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const category = searchParams.get("category")
    const staffId = searchParams.get("staffId")
    const creatorType = searchParams.get("creatorType") // "staff", "client", or "management"

    const tickets = await prisma.tickets.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(category && { category: category as any }),
        ...(staffId && { staffUserId: staffId }),
        ...(creatorType && { createdByType: creatorType.toUpperCase() }),
      },
      include: {
        staff_users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        management_users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            department: true,
          },
        },
        client_users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Fetch comments and reactions for each ticket
    const ticketsWithEngagement = await Promise.all(
      tickets.map(async (ticket) => {
        // Get comment count
        const commentCount = await prisma.comments.count({
          where: {
            commentableType: 'TICKET',
            commentableId: ticket.id
          }
        })

        // Get reactions (top 3 for display)
        const reactions = await prisma.reactions.findMany({
          where: {
            targetType: 'TICKET',
            targetId: ticket.id
          },
          take: 10 // Get top 10 to show variety
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
          reactions: reactions.map(r => ({ emoji: reactionEmojis[r.reactionType] || r.reactionType }))
        }
      })
    )

    console.log(`✅ [ADMIN TICKETS API] Fetched ${tickets.length} tickets with engagement data`)

    return NextResponse.json({ tickets: ticketsWithEngagement })
  } catch (error) {
    console.error("Error fetching admin tickets:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/admin/tickets - Create a new ticket as management
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is management
    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!managementUser) {
      return NextResponse.json({ error: "Management user not found" }, { status: 404 })
    }

    const body = await request.json()
    const { title, description, category, priority, attachments, staffUserId, managementUserId: targetManagementUserId, clientUserId } = body

    if (!title || !description || !category) {
      return NextResponse.json(
        { error: "Title, description, and category are required" },
        { status: 400 }
      )
    }

    // Validate that at least one user ID is provided
    if (!staffUserId && !targetManagementUserId && !clientUserId) {
      return NextResponse.json(
        { error: "At least one of staffUserId, managementUserId, or clientUserId is required" },
        { status: 400 }
      )
    }

    // Generate unique ticket ID
    const ticketCount = await prisma.tickets.count()
    const ticketId = `TKT-${String(ticketCount + 1).padStart(4, "0")}`

    const ticket = await prisma.tickets.create({
      data: {
        id: randomUUID(),
        staffUserId: staffUserId || null,
        clientUserId: clientUserId || null,
        ticketId,
        title,
        description,
        category,
        priority: priority || "MEDIUM",
        status: "OPEN",
        attachments: attachments || [],
        createdByType: "MANAGEMENT",
        managementUserId: targetManagementUserId || managementUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        staff_users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        management_users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        client_users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    })

    console.log(`✅ [ADMIN TICKETS API] Created ticket ${ticket.ticketId} by admin`)

    return NextResponse.json({ success: true, ticket }, { status: 201 })
  } catch (error) {
    console.error("Error creating admin ticket:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
