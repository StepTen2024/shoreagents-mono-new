import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * PATCH /api/tickets/[ticketId]/due-date
 * Set or update ticket due date (Admin only)
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
        { error: "Only management can set due dates" },
        { status: 403 }
      )
    }

    const { ticketId } = await params
    const body = await request.json()
    const { dueDate } = body

    if (!dueDate) {
      return NextResponse.json(
        { error: "dueDate is required (ISO 8601 format)" },
        { status: 400 }
      )
    }

    // Validate date
    const dueDateObj = new Date(dueDate)
    if (isNaN(dueDateObj.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      )
    }

    // Get the ticket
    const ticket = await prisma.tickets.findUnique({
      where: { id: ticketId },
      select: { ticketId: true, dueDate: true }
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Update the ticket due date
    const updatedTicket = await prisma.tickets.update({
      where: { id: ticketId },
      data: {
        dueDate: dueDateObj,
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
    console.log(`📅 [TICKET DUE DATE] ${managementUser.name} set due date`)
    console.log(`   Ticket: ${ticket.ticketId}`)
    console.log(`   Due: ${dueDateObj.toLocaleString()}`)

    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
      message: `Due date set to ${dueDateObj.toLocaleString()}`
    })
  } catch (error) {
    console.error("Error setting ticket due date:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tickets/[ticketId]/due-date
 * Remove due date from ticket (Admin only)
 */
export async function DELETE(
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
        { error: "Only management can remove due dates" },
        { status: 403 }
      )
    }

    const { ticketId } = await params

    // Get the ticket
    const ticket = await prisma.tickets.findUnique({
      where: { id: ticketId },
      select: { ticketId: true }
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Remove the due date
    const updatedTicket = await prisma.tickets.update({
      where: { id: ticketId },
      data: {
        dueDate: null,
        lastEditedAt: new Date(),
        lastEditedBy: managementUser.id,
        updatedAt: new Date()
      },
      include: {
        management_users: true,
        staff_users: true
      }
    })

    console.log(`🗑️ [TICKET DUE DATE] ${managementUser.name} removed due date from ${ticket.ticketId}`)

    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
      message: "Due date removed"
    })
  } catch (error) {
    console.error("Error removing ticket due date:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

