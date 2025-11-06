import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/admin/management - Get all management users
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is management
    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id },
    })

    if (!managementUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get all management users with full info
    const management = await prisma.management_users.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        department: true,
        createdAt: true,
        phone: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json({ success: true, management })
  } catch (error) {
    console.error("Error fetching management users:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


