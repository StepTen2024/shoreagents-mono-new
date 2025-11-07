import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// PATCH /api/tickets/[ticketId]/assign - Assign/reassign ticket to management user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is management
    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!managementUser) {
      return NextResponse.json({ error: "Only management can assign tickets" }, { status: 403 })
    }

    const { ticketId } = await params
    const body = await request.json()
    const { managementUserId } = body // Can be null to unassign

    console.log(`🎯 [Ticket Assign] Ticket: ${ticketId}, Assigning to: ${managementUserId || 'Unassigned'}`)

    // Check if ticket exists
    const ticket = await prisma.tickets.findUnique({
      where: { id: ticketId },
    })

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // If assigning to someone, verify they exist
    if (managementUserId) {
      const targetManager = await prisma.management_users.findUnique({
        where: { id: managementUserId }
      })

      if (!targetManager) {
        return NextResponse.json({ error: "Target manager not found" }, { status: 404 })
      }

      console.log(`✅ [Ticket Assign] Assigning to: ${targetManager.name} (${targetManager.department})`)
    } else {
      console.log(`🔄 [Ticket Assign] Unassigning ticket`)
    }

    // Update ticket assignment
    const updatedTicket = await prisma.tickets.update({
      where: { id: ticketId },
      data: {
        managementUserId: managementUserId || null,
        assignedTo: managementUserId || null, // Also update assignedTo field if it exists
        updatedAt: new Date()
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
            department: true,
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
        ticket_responses: {
          orderBy: { createdAt: "asc" },
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
        },
      },
    })

    console.log(`✅ [Ticket Assign] Successfully updated ticket ${ticketId}`)
    return NextResponse.json({ success: true, ticket: updatedTicket })
  } catch (error) {
    console.error(`❌ [Ticket Assign] Error:`, error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

