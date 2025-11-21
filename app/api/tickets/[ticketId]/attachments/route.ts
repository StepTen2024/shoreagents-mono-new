import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PATCH /api/tickets/[ticketId]/attachments - Add attachments to a ticket
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params
    const { ticketId } = resolvedParams
    const { attachments } = await request.json()

    if (!attachments || !Array.isArray(attachments)) {
      return NextResponse.json(
        { error: "Attachments must be an array" },
        { status: 400 }
      )
    }

    // Verify ticket exists and user has access
    const ticket = await prisma.tickets.findUnique({
      where: { id: ticketId },
      include: {
        staff_users: true,
        management_users: true,
        client_users: true,
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Check if user has permission (staff who created it, client who owns it, assigned manager, or admin)
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id }
    })
    
    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id }
    })

    const clientUser = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id }
    })

    // Check if user is management/admin with broad permissions
    const isManagement = managementUser && [
      'ADMIN',
      'SUPER_ADMIN', 
      'CEO_EXECUTIVE',
      'MANAGEMENT'
    ].includes(managementUser.role as string)

    const isAuthorized = 
      (staffUser && ticket.staffUserId === staffUser.id) ||
      (clientUser && ticket.clientUserId === clientUser.id) ||  // CLIENT CAN ADD TO THEIR OWN TICKET!
      (managementUser && ticket.managementUserId === managementUser.id) ||
      isManagement  // MANAGEMENT/ADMIN CAN ADD TO ANY TICKET

    if (!isAuthorized) {
      console.log(`❌ [TICKET ATTACHMENTS] Unauthorized: staffUser=${!!staffUser}, clientUser=${!!clientUser}, managementUser=${!!managementUser}, role=${managementUser?.role}`)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Update ticket with new attachments
    const updatedTicket = await prisma.tickets.update({
      where: { id: ticketId },
      data: { attachments },
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
            department: true,
          },
        },
        client_users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    })

    console.log(`✅ [TICKET ATTACHMENTS] Updated ticket ${ticketId} with ${attachments.length} attachments`)

    return NextResponse.json({ ticket: updatedTicket })
  } catch (error) {
    console.error("Error updating ticket attachments:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
