import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * PATCH /api/tickets/[ticketId]/cancel
 * Cancel a ticket
 * Staff: Can cancel their own tickets (if OPEN or IN_PROGRESS)
 * Admin: Can cancel any ticket
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

    const { ticketId } = await params
    const body = await request.json()
    const { reason } = body

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: "Cancellation reason is required" },
        { status: 400 }
      )
    }

    // Get the ticket
    const ticket = await prisma.tickets.findUnique({
      where: { id: ticketId },
      include: {
        staff_users: {
          select: { id: true, name: true, authUserId: true }
        },
        management_users: {
          select: { name: true }
        }
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Check permissions
    const isManagement = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id }
    })

    const isStaffOwner = ticket.staff_users?.authUserId === session.user.id

    if (!isManagement && !isStaffOwner) {
      return NextResponse.json(
        { error: "You can only cancel your own tickets" },
        { status: 403 }
      )
    }

    // Staff can only cancel OPEN or IN_PROGRESS tickets
    if (isStaffOwner && !isManagement) {
      if (ticket.status !== "OPEN" && ticket.status !== "IN_PROGRESS") {
        return NextResponse.json(
          { error: "You can only cancel tickets that are OPEN or IN_PROGRESS" },
          { status: 400 }
        )
      }
    }

    // Check if already cancelled
    if (ticket.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Ticket is already cancelled" },
        { status: 400 }
      )
    }

    // Cancel the ticket
    const updatedTicket = await prisma.tickets.update({
      where: { id: ticketId },
      data: {
        status: "CANCELLED",
        cancelledReason: reason,
        cancelledBy: isManagement ? isManagement.id : ticket.staffUserId!,
        cancelledAt: new Date(),
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
    const cancelledByName = isManagement ? isManagement.name : ticket.staff_users?.name
    console.log(`❌ [TICKET CANCELLED] ${cancelledByName} cancelled ticket ${ticket.ticketId}`)
    console.log(`   Reason: ${reason}`)
    console.log(`   Status: ${ticket.status} → CANCELLED`)

    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
      message: "Ticket cancelled successfully"
    })
  } catch (error) {
    console.error("Error cancelling ticket:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

