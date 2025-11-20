import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/management/available
 * Get list of all management users available for ticket assignment
 * Grouped by department for easy selection
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the user is management (only they can reassign)
    const managementUser = await prisma.management_users.findUnique({
      where: { authUserId: session.user.id }
    })

    if (!managementUser) {
      return NextResponse.json(
        { error: "Only management can access this" },
        { status: 403 }
      )
    }

    // Get all management users grouped by department
    const allManagers = await prisma.management_users.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        department: true,
        role: true
      },
      orderBy: [
        { department: 'asc' },
        { name: 'asc' }
      ]
    })

    // Group by department for easier UI display
    const byDepartment: Record<string, typeof allManagers> = {}
    
    allManagers.forEach(manager => {
      if (!byDepartment[manager.department]) {
        byDepartment[manager.department] = []
      }
      byDepartment[manager.department].push(manager)
    })

    return NextResponse.json({
      managers: allManagers,
      byDepartment,
      total: allManagers.length
    })
  } catch (error) {
    console.error("Error fetching available managers:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

