import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// PATCH /api/tickets/[ticketId]/status - Update ticket status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      console.error(`[Status Update] Unauthorized attempt`)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { ticketId } = await params
    const body = await request.json()
    const { status } = body

    console.log(`[Status Update] Ticket: ${ticketId}, New Status: ${status}`)

    if (!status) {
      console.error(`[Status Update] Missing status in request body`)
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    // Validate status
    const validStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]
    if (!validStatuses.includes(status)) {
      console.error(`[Status Update] Invalid status: ${status}`)
      return NextResponse.json({ error: `Invalid status: ${status}. Must be one of: ${validStatuses.join(", ")}` }, { status: 400 })
    }

    // Check if ticket exists
    const ticket = await prisma.tickets.findUnique({
      where: { id: ticketId },
    })

    if (!ticket) {
      console.error(`[Status Update] Ticket not found: ${ticketId}`)
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    console.log(`[Status Update] Current status: ${ticket.status}, Requested: ${status}`)

    // Update ticket status
    const updatedTicket = await prisma.tickets.update({
      where: { id: ticketId },
      data: {
        status,
        updatedAt: new Date(),
        ...(status === "RESOLVED" || status === "CLOSED"
          ? { resolvedDate: new Date() }
          : {}),
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
            department: true, // Include department for admin display
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

    console.log(`[Status Update] ✅ Successfully updated ticket ${ticketId} to ${status}`)
    return NextResponse.json({ success: true, ticket: updatedTicket })
  } catch (error) {
    console.error(`[Status Update] ❌ Error:`, error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

