import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * PATCH /api/tickets/[id]/reassign
 * Reassign a ticket to a different management user
 * Only accessible by management users
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
        { error: "Only management can reassign tickets" },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { newAssigneeId, reason } = body

    if (!newAssigneeId) {
      return NextResponse.json(
        { error: "newAssigneeId is required" },
        { status: 400 }
      )
    }

    // Verify the new assignee exists and is management
    const newAssignee = await prisma.management_users.findUnique({
      where: { id: newAssigneeId },
      select: { id: true, name: true, department: true }
    })

    if (!newAssignee) {
      return NextResponse.json(
        { error: "New assignee not found" },
        { status: 404 }
      )
    }

    // Get the ticket
    const ticket = await prisma.tickets.findUnique({
      where: { id },
      include: {
        management_users: {
          select: { name: true }
        }
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Update the ticket assignment
    const updatedTicket = await prisma.tickets.update({
      where: { id },
      data: {
        managementUserId: newAssigneeId,
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

    // Log the reassignment for audit trail
    console.log(`🔄 [TICKET REASSIGN] ${managementUser.name} reassigned ticket ${ticket.ticketId}`)
    console.log(`   From: ${ticket.management_users?.name || 'Unassigned'}`)
    console.log(`   To: ${newAssignee.name} (${newAssignee.department})`)
    if (reason) {
      console.log(`   Reason: ${reason}`)
    }

    // TODO: Create a comment/activity log entry for the reassignment
    // This helps with transparency and audit trail

    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
      message: `Ticket reassigned to ${newAssignee.name}`
    })
  } catch (error) {
    console.error("Error reassigning ticket:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

