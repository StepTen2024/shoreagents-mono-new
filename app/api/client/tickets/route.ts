import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { randomUUID } from "crypto"

// GET /api/client/tickets - Get client's own tickets
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get client user
    const clientUser = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id },
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Client user not found" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const category = searchParams.get("category")

    // Get client's company to find their account manager
    const clientWithCompany = await prisma.client_users.findUnique({
      where: { id: clientUser.id },
      include: {
        company: {
          include: {
            management_users: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
              },
            },
          },
        },
      },
    })

    const tickets = await prisma.tickets.findMany({
      where: {
        clientUserId: clientUser.id,
        ...(status && { status: status as any }),
        ...(category && { category: category as any }),
      },
      include: {
        client_users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            company: {
              select: {
                management_users: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    console.log(`✅ [CLIENT TICKETS API] Fetched ${tickets.length} tickets for client ${clientUser.name}`)

    // Add account manager info, comment counts, and reactions to response
    const ticketsWithData = await Promise.all(tickets.map(async (ticket) => {
      // Fetch real comment count
      const commentCount = await prisma.comments.count({
        where: {
          commentableType: "TICKET",
          commentableId: ticket.id,
        },
      })

      // Fetch top reactions
      const reactions = await prisma.reactions.findMany({
        where: {
          reactableType: "TICKET",
          reactableId: ticket.id,
        },
        take: 10,
        orderBy: { createdAt: "desc" },
      })

      // Map reaction types to emojis
      const reactionEmojis = reactions.map(r => {
        const emojiMap: Record<string, string> = {
          LIKE: "👍",
          LOVE: "❤️",
          CELEBRATE: "🎉",
          LAUGH: "😂",
          FIRE: "🔥",
          ROCKET: "🚀"
        }
        return { emoji: emojiMap[r.type] || "👍", type: r.type }
      })

      return {
        ...ticket,
        accountManager: clientWithCompany?.company?.management_users || null,
        responses: new Array(commentCount).fill(null), // Fake array for count
        reactions: reactionEmojis,
      }
    }))

    return NextResponse.json({ tickets: ticketsWithData })
  } catch (error) {
    console.error("Error fetching client tickets:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/client/tickets - Create ticket as client
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get client user with company and account manager
    const clientUser = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id },
      include: {
        company: {
          include: {
            management_users: true,
          },
        },
      },
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Client user not found" }, { status: 404 })
    }

    const body = await request.json()
    const { title, description, category, priority, attachments } = body

    if (!title || !description || !category) {
      return NextResponse.json(
        { error: "Title, description, and category are required" },
        { status: 400 }
      )
    }

    // Generate ticket ID (safe from race conditions)
    const lastTicket = await prisma.tickets.findFirst({
      orderBy: { createdAt: "desc" },
      select: { ticketId: true },
    })

    let ticketNumber = 1
    if (lastTicket?.ticketId) {
      const match = lastTicket.ticketId.match(/TKT-(\d+)/)
      if (match) {
        ticketNumber = parseInt(match[1]) + 1
      }
    }

    // Keep trying until we find a unique ticketId (handles race conditions)
    let ticketId = `TKT-${ticketNumber.toString().padStart(4, "0")}`
    let attempts = 0
    while (attempts < 10) {
      const existing = await prisma.tickets.findUnique({
        where: { ticketId },
        select: { id: true }
      })
      if (!existing) break
      ticketNumber++
      ticketId = `TKT-${ticketNumber.toString().padStart(4, "0")}`
      attempts++
    }

    if (attempts >= 10) {
      return NextResponse.json(
        { error: "Failed to generate unique ticket ID" },
        { status: 500 }
      )
    }

    // Create ticket - auto-assign to account manager
    const accountManagerId = clientUser.company?.accountManagerId || null
    const now = new Date()
    const ticket = await prisma.tickets.create({
      data: {
        id: randomUUID(),
        ticketId,
        clientUserId: clientUser.id,
        title,
        description,
        category,
        priority: priority || "MEDIUM",
        status: "OPEN",
        attachments: attachments || [],
        createdByType: "CLIENT",
        assignedTo: accountManagerId,
        managementUserId: accountManagerId, // Also set the FK for relation
        createdAt: now,
        updatedAt: now,
      },
      include: {
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

    console.log(`✅ [CLIENT TICKETS API] Created ticket ${ticketId} by client ${clientUser.name}`)

    return NextResponse.json({ success: true, ticket }, { status: 201 })
  } catch (error) {
    console.error("Error creating client ticket:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

