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
    
    const workSchedules = staffUserWithProfile?.staff_profiles?.work_schedules || []

    if (activeEntry) {
      const clockIn = new Date(activeEntry.clockIn)
      const now = new Date()
      const diffMs = now.getTime() - clockIn.getTime()
      const hoursElapsed = (diffMs / (1000 * 60 * 60)).toFixed(2)

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
        activeEntry,
        clockedInAt: activeEntry.clockIn,
        hoursElapsed,
        workSchedules,
        activeBreak,
      })
    }

    return NextResponse.json({
      isClockedIn: false,
      activeEntry: null,
      workSchedules,
    })
  } catch (error) {
    console.error("Error getting clock status:", error)
    return NextResponse.json({ error: "Failed to get status" }, { status: 500 })
  }
}



