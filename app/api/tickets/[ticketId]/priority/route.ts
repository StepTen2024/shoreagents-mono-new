import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * PATCH /api/tickets/[ticketId]/priority
 * Update ticket priority (Admin only)
 * Prevents staff from marking everything as URGENT
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the user is management
    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!managementUser) {
      return NextResponse.json(
        { error: "Only management can change ticket priority" },
        { status: 403 }
      )
    }

    const { ticketId } = await params
    const body = await request.json()
    const { priority } = body

    const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"]
    if (!priority || !validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: "Invalid priority. Must be: LOW, MEDIUM, HIGH, or URGENT" },
        { status: 400 }
      )
    }

    // Get the current ticket
    const ticket = await prisma.tickets.findUnique({
      where: { id: ticketId },
      select: { priority: true, ticketId: true }
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Update the ticket priority
    const updatedTicket = await prisma.tickets.update({
      where: { id: ticketId },
      data: {
        priority,
        lastEditedAt: new Date(),
        lastEditedBy: managementUser.id,
        updatedAt: new Date()
      },
      include: {
        management_users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            department: true
          }
        },
        staff_users: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Log for audit trail
    console.log(`🎯 [TICKET PRIORITY] ${managementUser.name} changed priority`)
    console.log(`   Ticket: ${ticket.ticketId}`)
    console.log(`   ${ticket.priority} → ${priority}`)

    // TODO: Create activity log entry
    // await createActivityLog({
    //   ticketId,
    //   action: "PRIORITY_CHANGED",
    //   from: ticket.priority,
    //   to: priority,
    //   performedBy: managementUser.id
    // })

    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
      message: `Priority changed to ${priority}`
    })
  } catch (error) {
    console.error("Error updating ticket priority:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

