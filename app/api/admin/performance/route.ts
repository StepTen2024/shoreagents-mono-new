import { NextRequest, NextResponse } from "next/server"
import { getAdminUser } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

// GET /api/admin/performance - Get ALL performance metrics (admin view)
export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get("staffId")
    const clientId = searchParams.get("clientId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: any = {}

    // Filter by specific staff
    if (staffId) {
      where.staffUserId = staffId
    }

    // Filter by client/company
    if (clientId) {
      const staffUsers = await prisma.staff_users.findMany({
        where: { companyId: clientId },
        select: { id: true }
      })
      where.staffUserId = { in: staffUsers.map(s => s.id) }
    }

    // Filter by date range
    if (startDate) {
      where.date = {
        gte: new Date(startDate)
      }
    }

    if (endDate) {
      const endDateTime = new Date(endDate)
      endDateTime.setHours(23, 59, 59, 999)
      
      if (where.date) {
        where.date.lte = endDateTime
      } else {
        where.date = { lte: endDateTime }
      }
    }

    const metrics = await prisma.performance_metrics.findMany({
      where,
      include: {
        staff_users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      },
      orderBy: { date: "desc" },
    })

    // Calculate average productivity
    const avgProductivity = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.productivityScore, 0) / metrics.length
      : 0

    return NextResponse.json({
      metrics,
      count: metrics.length,
      avgProductivity: Math.round(avgProductivity)
    })
  } catch (error) {
    console.error("Error fetching admin performance:", error)
    return NextResponse.json({ error: "Failed to fetch performance metrics" }, { status: 500 })
  }
}

