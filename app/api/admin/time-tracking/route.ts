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
    console.log("🔍 [ADMIN] Fetching time entries with complex query...")
    const entries = await prisma.time_entries.findMany({
      where: dateFilter,
      include: {
        staff_users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            company: true,
          },
        },
        work_schedules: true,
        breaks: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        clockIn: 'desc',
      },
      take: 100,
    })
    
    console.log(`✅ [ADMIN] Found ${entries.length} time entries`)

    // ✨ NEW: Add real-time calculations for active entries
    const now = new Date()
    const enrichedEntries = entries.map((entry: any) => {
      const isActive = !entry.clockOut
      let currentHours = 0
      let liveOvertimeMinutes = 0
      let isCurrentlyOvertime = false

      if (isActive) {
        // Calculate current hours worked (excluding breaks)
        const clockInTime = new Date(entry.clockIn).getTime()
        const nowTime = now.getTime()
        const totalMs = nowTime - clockInTime
        
        // Subtract completed break time
        const breakTimeMs = entry.breaks
          .filter((b: any) => b.actualStart && b.actualEnd)
          .reduce((sum: number, b: any) => {
            const breakDuration = new Date(b.actualEnd).getTime() - new Date(b.actualStart).getTime()
            return sum + breakDuration
          }, 0)
        
        currentHours = Math.round(((totalMs - breakTimeMs) / (1000 * 60 * 60)) * 100) / 100

        // ✨ Calculate LIVE overtime if past expected clock-out
        if (entry.expectedClockOut) {
          const expectedClockOutTime = new Date(entry.expectedClockOut).getTime()
          if (nowTime > expectedClockOutTime) {
            isCurrentlyOvertime = true
            liveOvertimeMinutes = Math.floor((nowTime - expectedClockOutTime) / (1000 * 60))
          }
        }
      }

      return {
        ...entry,
        // Add calculated real-time fields
        currentHours: isActive ? currentHours : null,
        isCurrentlyOvertime: isActive ? isCurrentlyOvertime : false,
        liveOvertimeMinutes: isActive ? liveOvertimeMinutes : 0,
      }
    })

    console.log(`📊 [ADMIN] Enriched with real-time data. Active entries: ${enrichedEntries.filter((e: any) => !e.clockOut).length}`)

    return NextResponse.json({ success: true, entries: enrichedEntries })
  } catch (error) {
    console.error("❌ [ADMIN TIME TRACKING] Error fetching time entries:", error)
    console.error("❌ [ADMIN TIME TRACKING] Stack:", error instanceof Error ? error.stack : 'No stack')
    console.error("❌ [ADMIN TIME TRACKING] Message:", error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
