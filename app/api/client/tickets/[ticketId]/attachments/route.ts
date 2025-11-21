import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// PATCH /api/client/tickets/[ticketId]/attachments - Add attachments to ticket
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const clientUser = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id },
    })

    if (!clientUser) {
      return NextResponse.json({ error: "Client user not found" }, { status: 404 })
    }
    const body = await request.json()
    const { attachmentUrls } = body

    if (!attachmentUrls || !Array.isArray(attachmentUrls)) {
      return NextResponse.json(
        { error: "Invalid attachment URLs" },
        { status: 400 }
      )
    }

    // Verify ticket belongs to this client
    const ticket = await prisma.tickets.findUnique({
      where: { id: ticketId },
      select: { 
        clientUserId: true,
        attachments: true,
      },
    })

    if (!ticket || ticket.clientUserId !== clientUser.id) {
      return NextResponse.json(
        { error: "Ticket not found or unauthorized" },
        { status: 404 }
      )
    }

    // Add new attachments to existing ones
    const updatedAttachments = [...ticket.attachments, ...attachmentUrls]

    // Update ticket with new attachments
    const updatedTicket = await prisma.tickets.update({
      where: { id: ticketId },
      data: {
        attachments: updatedAttachments,
      },
    })

    return NextResponse.json({ 
      success: true,
      attachments: updatedTicket.attachments 
    })
  } catch (error) {
    console.error("Error adding attachments to ticket:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


