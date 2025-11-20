import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/admin/time-tracking - Get all time entries for staff
export async function GET(req: NextRequest) {
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

    // Optional date filtering
    const url = new URL(req.url)
    const days = parseInt(url.searchParams.get('days') || '0') // 0 = all entries
    
    let dateFilter = {}
    
    if (days > 0) {
      // ✅ Calculate date range based on Philippines timezone (UTC+8)
      const nowUTC = new Date()
      const nowInPH = new Date(nowUTC.toLocaleString('en-US', { timeZone: 'Asia/Manila' }))
      
      // Get midnight today in PH time, then convert to UTC
      const startOfTodayPH = new Date(nowInPH)
      startOfTodayPH.setHours(0, 0, 0, 0)
      
      const startDate = new Date(startOfTodayPH.getTime() - (8 * 60 * 60 * 1000))
      startDate.setDate(startDate.getDate() - (days - 1))
      
      const endDate = new Date(nowUTC.getTime() + (60 * 60 * 1000)) // Current time + 1hr buffer
      
      dateFilter = {
        clockIn: {
          gte: startDate,
          lte: endDate
        }
      }
      
      console.log(`[Time Tracking] Filtering for ${days} days (PH timezone):`, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        startDatePH: new Date(startDate).toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
        endDatePH: new Date(endDate).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })
      })
    }

    // Get time entries with staff and company info
    const entries = await prisma.time_entries.findMany({
      where: dateFilter,
      select: {
        id: true,
        clockIn: true,
        clockOut: true,
        totalHours: true,
        notes: true,
        wasLate: true,
        lateBy: true,
        wasEarly: true,
        earlyBy: true,
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
