import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// POST /api/client/tickets/[ticketId]/responses - Add response/comment to ticket
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { ticketId } = await params
    const body = await request.json()
    const { message, attachments } = body

    if (!message && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ error: "Message or attachments are required" }, { status: 400 })
    }

    // Check if ticket exists
    const ticket = await prisma.tickets.findUnique({
      where: { id: ticketId },
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Get client user
    const clientUser = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id },
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Client user not found" }, { status: 404 })
    }

    // Verify client owns this ticket
    if (ticket.clientUserId !== clientUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Create response
    const response = await prisma.ticket_responses.create({
      data: {
        ticketId,
        message,
        createdByType: "CLIENT",
        clientUserId: clientUser.id,
        attachments: attachments || [],
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

    return NextResponse.json({ success: true, response }, { status: 201 })
  } catch (error) {
    console.error("Error creating client ticket response:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

