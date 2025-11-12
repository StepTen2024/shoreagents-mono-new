/**
 * Get all management users for assignment
 * GET /api/admin/management-users
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin/manager (allow both ADMIN and MANAGER)
    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!managementUser || (managementUser.role !== "ADMIN" && managementUser.role !== "MANAGER")) {
      return NextResponse.json({ error: "Forbidden. Admin or Manager role required." }, { status: 403 })
    }

    // Get all management users
    const users = await prisma.management_users.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        role: true,
        avatar: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ users })

  } catch (error) {
    console.error('Error fetching management users:', error)
    return NextResponse.json(
      { error: "Failed to fetch management users" },
      { status: 500 }
    )
  }
}

