import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * 🎯 CURRENT USER INFO API
 * 
 * Returns the current user's information including:
 * - User type (STAFF, CLIENT, MANAGEMENT)
 * - Company ID (if applicable)
 * - Basic profile info
 */

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check staff
    const staffUser = await prisma.staff_users.findUnique({
      where: { authUserId: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        companyId: true
      }
    })

    if (staffUser) {
      return NextResponse.json({
        userId: staffUser.id,
        userType: 'STAFF',
        name: staffUser.name,
        email: staffUser.email,
        avatar: staffUser.avatar,
        companyId: staffUser.companyId
      })
    }

    // Check client
    const clientUser = await prisma.client_users.findUnique({
      where: { authUserId: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        companyId: true
      }
    })

    if (clientUser) {
      return NextResponse.json({
        userId: clientUser.id,
        userType: 'CLIENT',
        name: clientUser.name,
        email: clientUser.email,
        avatar: clientUser.avatar,
        companyId: clientUser.companyId
      })
    }

    // Check management
    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true
      }
    })

    if (managementUser) {
      return NextResponse.json({
        userId: managementUser.id,
        userType: 'MANAGEMENT',
        name: managementUser.name,
        email: managementUser.email,
        avatar: managementUser.avatar,
        companyId: null
      })
    }

    return NextResponse.json({ error: "User not found" }, { status: 404 })
  } catch (error) {
    console.error("❌ [USER ME API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

