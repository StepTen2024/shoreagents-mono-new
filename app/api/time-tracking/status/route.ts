import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getStaffUser } from "@/lib/auth-helpers"

export async function GET(request: NextRequest) {
  try {
    const staffUser = await getStaffUser()

    if (!staffUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find active time entry
    const activeEntry = await prisma.time_entries.findFirst({
      where: {
        staffUserId: staffUser.id,
        clockOut: null,
      },
    })
    
    // Get work schedules (same as profile API)
    const staffUserWithProfile = await prisma.staff_users.findUnique({
      where: { id: staffUser.id },
      include: {
        staff_profiles: {
          include: {
            work_schedules: true
          }
        }
      }
    })
    
    const workSchedules = (() => {
      const schedules = staffUserWithProfile?.staff_profiles?.work_schedules || []
      // Sort by day of week: Monday to Sunday
      const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      return schedules.sort((a, b) => dayOrder.indexOf(a.dayOfWeek) - dayOrder.indexOf(b.dayOfWeek))
    })()

    if (activeEntry) {
      const clockIn = new Date(activeEntry.clockIn)
      const now = new Date()
      const diffMs = now.getTime() - clockIn.getTime()
      const hoursWorked = diffMs / (1000 * 60 * 60) // Return as number, not string

      // Find active break for this time entry (only breaks that have been started but not ended)
      const activeBreak = await prisma.breaks.findFirst({
        where: {
          timeEntryId: activeEntry.id,
          actualStart: { not: null }, // Must have been started
          actualEnd: null, // Not ended yet
        },
        orderBy: {
          actualStart: 'desc' // Get the most recent break
        }
      })

      return NextResponse.json({
        isClockedIn: true,
        clockInTime: activeEntry.clockIn.toISOString(),
        hoursWorked,
        isOnBreak: !!activeBreak,
        currentBreakType: activeBreak?.type || null,
        schedule: null, // TODO: Parse work schedules if needed
        nextBreak: null, // TODO: Calculate next break if needed
        // Legacy fields for compatibility
        activeEntry,
        clockedInAt: activeEntry.clockIn,
        workSchedules,
        activeBreak,
      })
    }

    return NextResponse.json({
      isClockedIn: false,
      clockInTime: null,
      hoursWorked: 0,
      isOnBreak: false,
      currentBreakType: null,
      schedule: null,
      nextBreak: null,
      // Legacy fields for compatibility
      activeEntry: null,
      workSchedules,
    })
  } catch (error) {
    console.error("Error getting clock status:", error)
    return NextResponse.json({ error: "Failed to get status" }, { status: 500 })
  }
}



