import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// POST /api/tickets/[ticketId]/responses - Add response/comment to ticket
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
    
    console.log("Received response data:", { message, attachments, ticketId })

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

    // Determine if user is staff, management, or client
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
    })

    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id },
    })

    const clientUser = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id },
    })

    if (!staffUser && !managementUser && !clientUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Determine user type
    let createdByType = "STAFF"
    if (managementUser) createdByType = "MANAGEMENT"
    if (clientUser) createdByType = "CLIENT"

    // Create response
    console.log("Creating response with data:", {
      ticketId,
      message,
      createdByType,
      attachments: attachments || []
    })
    
    const response = await prisma.ticket_responses.create({
      data: {
        ticketId,
        message,
        createdByType,
        staffUserId: staffUser?.id || null,
        managementUserId: managementUser?.id || null,
        clientUserId: clientUser?.id || null,
        attachments: attachments || [],
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

    return NextResponse.json({ success: true, response }, { status: 201 })
  } catch (error) {
    console.error("Error creating ticket response:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

