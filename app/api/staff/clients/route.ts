import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/staff/clients - Get clients assigned to this staff member's company
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the staff user's company
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
      select: { companyId: true }
    })

    if (!staffUser?.companyId) {
      return NextResponse.json({ error: "Staff user not assigned to a company" }, { status: 400 })
    }

    // Get all clients from the same company
    const clients = await prisma.client_users.findMany({
      where: { companyId: staffUser.companyId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        company: {
          select: {
            companyName: true
          }
        }
      },
      orderBy: { name: "asc" }
    })

    return NextResponse.json({ clients })
  } catch (error) {
    console.error("Error fetching clients:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

