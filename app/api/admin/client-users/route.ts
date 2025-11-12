import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/admin/client-users - Get all client users for management
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is management
    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id },
    })

    if (!managementUser) {
      return NextResponse.json(
        { error: "Management user not found" },
        { status: 404 }
      )
    }

    const clientUsers = await prisma.client_users.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            companyName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ clientUsers })
  } catch (error) {
    console.error("Error fetching client users:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

