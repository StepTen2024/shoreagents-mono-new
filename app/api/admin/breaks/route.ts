import { NextRequest, NextResponse } from "next/server"
import { getAdminUser } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

// GET /api/admin/breaks - Get ALL breaks (admin view)
export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get("staffId")
    const clientId = searchParams.get("clientId")
    const date = searchParams.get("date")

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

    // Filter by date
    if (date) {
      const targetDate = new Date(date)
      const startOfDay = new Date(targetDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(targetDate)
      endOfDay.setHours(23, 59, 59, 999)

      where.actualStart = {
        gte: startOfDay,
        lte: endOfDay,
      }
    }

    const breaks = await prisma.breaks.findMany({
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
      orderBy: { actualStart: "desc" },
    })

    return NextResponse.json({ breaks, count: breaks.length })
  } catch (error) {
    console.error("Error fetching admin breaks:", error)
    return NextResponse.json({ error: "Failed to fetch breaks" }, { status: 500 })
  }
}

