import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/auth/current-user
 * Returns the current logged-in user's ID, name, email, avatar, and type
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is a client
    const clientUser = await prisma.client_users.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
    })

    if (clientUser) {
      return NextResponse.json({
        user: {
          id: clientUser.id,
          name: clientUser.name,
          email: clientUser.email,
          avatar: clientUser.avatar,
          type: "CLIENT",
        },
      })
    }

    // Check if user is staff
    const staffUser = await prisma.staff_users.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
    })

    if (staffUser) {
      return NextResponse.json({
        user: {
          id: staffUser.id,
          name: staffUser.name,
          email: staffUser.email,
          avatar: staffUser.avatar,
          type: "STAFF",
        },
      })
    }

    // Check if user is management
    const managementUser = await prisma.management_users.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
      },
    })

    if (managementUser) {
      return NextResponse.json({
        user: {
          id: managementUser.id,
          name: managementUser.name,
          email: managementUser.email,
          avatar: managementUser.avatar,
          type: "MANAGEMENT",
        },
      })
    }

    return NextResponse.json({ error: "User not found" }, { status: 404 })
  } catch (error) {
    console.error("Error fetching current user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

