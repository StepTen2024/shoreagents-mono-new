import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * PATCH /api/tickets/[ticketId]/edit
 * Edit ticket title and/or description
 * Staff: Can edit their own tickets (if not RESOLVED or CLOSED)
 * Admin: Can edit any ticket
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
    const { title, description } = body

    // At least one field must be provided
    if (!title && !description) {
      return NextResponse.json(
        { error: "At least one of title or description must be provided" },
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
        client_users: {
          select: { id: true, name: true, authUserId: true }
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
    const isClientOwner = ticket.client_users?.authUserId === session.user.id

    if (!isManagement && !isStaffOwner && !isClientOwner) {
      return NextResponse.json(
        { error: "You can only edit your own tickets" },
        { status: 403 }
      )
    }

    // Staff and Clients can't edit RESOLVED, CLOSED, or CANCELLED tickets
    if ((isStaffOwner || isClientOwner) && !isManagement) {
      if (ticket.status === "RESOLVED" || ticket.status === "CLOSED" || ticket.status === "CANCELLED") {
        return NextResponse.json(
          { error: "Cannot edit tickets that are RESOLVED, CLOSED, or CANCELLED" },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const lastEditedById = isManagement 
      ? isManagement.id 
      : isClientOwner 
        ? ticket.clientUserId! 
        : ticket.staffUserId!
    
    const updateData: any = {
      updatedAt: new Date(),
      lastEditedAt: new Date(),
      lastEditedBy: lastEditedById
    }

    if (title) {
      if (title.trim().length === 0) {
        return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 })
      }
      updateData.title = title.trim()
    }

    if (description) {
      if (description.trim().length === 0) {
        return NextResponse.json({ error: "Description cannot be empty" }, { status: 400 })
      }
      updateData.description = description.trim()
    }

    // Update the ticket
    const updatedTicket = await prisma.tickets.update({
      where: { id: ticketId },
      data: updateData,
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
    const editedByName = isManagement 
      ? isManagement.name 
      : isClientOwner 
        ? ticket.client_users?.name 
        : ticket.staff_users?.name
    console.log(`✏️ [TICKET EDITED] ${editedByName} edited ticket ${ticket.ticketId}`)
    console.log(`   User Type: ${isManagement ? 'MANAGEMENT' : isClientOwner ? 'CLIENT' : 'STAFF'}`)
    if (title) console.log(`   Title: "${ticket.title}" → "${title}"`)
    if (description) console.log(`   Description updated`)

    return NextResponse.json({
      success: true,
      ticket: updatedTicket,
      message: "Ticket updated successfully"
    })
  } catch (error) {
    console.error("Error editing ticket:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

