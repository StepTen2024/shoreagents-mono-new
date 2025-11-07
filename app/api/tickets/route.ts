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
            targetType: "TICKET",
            targetId: ticket.id,
          },
          take: 5,
          orderBy: { createdAt: "desc" },
        })

        return {
          ...ticket,
          commentCount,
          reactions: reactions.map(r => ({ emoji: r.reactionType })),
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
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, category, priority, attachments } = body

    if (!title || !description || !category) {
      return NextResponse.json(
        { error: "Title, description, and category are required" },
        { status: 400 }
      )
    }

    // Get staff user first
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!staffUser) {
      return NextResponse.json({ error: "Staff user not found" }, { status: 404 })
    }

    // Generate unique ticket ID
    const ticketCount = await prisma.tickets.count()
    const ticketId = `TKT-${String(ticketCount + 1).padStart(4, "0")}`

    // 🎯 AUTO-ASSIGN: Map category to department and find manager
    const department = mapCategoryToDepartment(category)
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
  } catch (error) {
    console.error("Error creating ticket:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
