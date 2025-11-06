import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/admin/time-tracking - Get all time entries for staff
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

    // Get all time entries with staff and company info
    const entries = await prisma.time_entries.findMany({
      select: {
        id: true,
        clockIn: true,
        clockOut: true,
        totalHours: true,
        notes: true,
        wasLate: true,
        lateBy: true,
        createdAt: true,
        staff_users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            company: {
              select: {
                id: true,
                companyName: true,
                tradingName: true,
                logo: true,
              },
            },
          },
        },
        breaks: {
          select: {
            id: true,
            type: true,
            actualStart: true,
            actualEnd: true,
            duration: true,
          },
          orderBy: {
            actualStart: 'asc',
          },
        },
      },
      orderBy: {
        clockIn: 'desc',
      },
      take: 100,
    })

    return NextResponse.json({ success: true, entries })
  } catch (error) {
    console.error("Error fetching time entries:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
