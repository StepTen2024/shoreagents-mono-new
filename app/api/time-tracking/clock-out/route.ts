import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getStaffUser } from "@/lib/auth-helpers"
import { logClockedOut } from "@/lib/activity-generator"
import { getStaffLocalTime, parseTimeString } from "@/lib/timezone-helpers"

export async function POST(request: NextRequest) {
  try {
    const staffUser = await getStaffUser()

    if (!staffUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { reason, notes } = body

    if (!reason) {
      return NextResponse.json({ error: "Clock-out reason is required" }, { status: 400 })
    }

    // Find active time entry with breaks AND work_schedule in one query
    const activeEntry = await prisma.time_entries.findFirst({
      where: {
        staffUserId: staffUser.id,
        clockOut: null,
      },
      include: {
        breaks: true,
        work_schedule: {
          select: {
            startTime: true,
            endTime: true
          }
        }
      }
    })

    if (!activeEntry) {
      return NextResponse.json(
        { error: "You are not currently clocked in" },
        { status: 400 }
      )
    }

    // Check for active breaks (breaks that have been STARTED but not ended)
    const activeBreak = activeEntry.breaks.find(b => b.actualStart && !b.actualEnd)
    
    if (activeBreak) {
      return NextResponse.json({ 
        error: "Please end your active break before clocking out" 
      }, { status: 400 })
    }

    // ✅ Use staff timezone for clock-out
    const staffTimezone = staffUser.staff_profiles?.timezone || 'Asia/Manila'
    const clockOut = getStaffLocalTime(staffTimezone)
    const totalHours = (clockOut.getTime() - activeEntry.clockIn.getTime()) / (1000 * 60 * 60)
    
    // Calculate break time from the breaks we already fetched
    const breaks = activeEntry.breaks
    const totalBreakTime = breaks.reduce((sum, b) => sum + (b.duration || 0), 0) / 60
    const netWorkHours = totalHours - totalBreakTime

    // ✅ Check if user is clocking out EARLY (using shift date and staff timezone)
    let wasEarlyClockOut = false
    let earlyClockOutBy = 0
    let expectedClockOut: Date | null = null
    
    if (activeEntry.work_schedule && activeEntry.work_schedule.endTime && activeEntry.work_schedule.endTime.trim() !== '') {
      try {
        // Parse shift end time using helper function
        const { hour, minute } = parseTimeString(activeEntry.work_schedule.endTime)
        
        // ✅ Use shift date for expected clock-out (handles night shifts crossing midnight)
        const shiftDate = activeEntry.shiftDate || activeEntry.clockIn
        expectedClockOut = new Date(shiftDate)
        expectedClockOut.setHours(hour, minute, 0, 0)
        
        // For night shifts, if end time is earlier than start time (e.g., 8 AM < 11 PM),
        // the shift ends the next day
        if (activeEntry.work_schedule.startTime) {
          const startTime = parseTimeString(activeEntry.work_schedule.startTime)
          if (hour < startTime.hour) {
            // End time is next day (e.g., shift ends at 8 AM but started at 11 PM)
            expectedClockOut.setDate(expectedClockOut.getDate() + 1)
          }
        }
        
        console.log(`⏰ Clock-out check:`, {
          expectedClockOut: expectedClockOut.toISOString(),
          actualClockOut: clockOut.toISOString()
        })
        
        // Check if user is clocking out EARLY
        const diffMs = expectedClockOut.getTime() - clockOut.getTime()
        const diffMinutes = Math.floor(Math.abs(diffMs) / 60000)
        
        if (diffMs > 0) {
          // Clocking out BEFORE shift end = EARLY
          wasEarlyClockOut = true
          earlyClockOutBy = diffMinutes
          console.log(`⏰ EARLY CLOCK-OUT by ${diffMinutes} minutes`)
        } else {
          console.log(`⏰ ON TIME or STAYED LATE (worked full shift)`)
        }
        
      } catch (error) {
        console.error('[Clock-Out] Error calculating early clock-out:', error)
        wasEarlyClockOut = false
        earlyClockOutBy = 0
        expectedClockOut = null
      }
    }
    
    // Calculate if staff worked FULL SHIFT
    const workedFullShift = !activeEntry.wasLate && !wasEarlyClockOut

    // Update time entry
    const timeEntry = await prisma.time_entries.update({
      where: {
        id: activeEntry.id,
      },
      data: {
        clockOut,
        totalHours: Number(netWorkHours.toFixed(2)),
        clockOutReason: reason,
        notes: notes || null,
        wasEarlyClockOut,
        earlyClockOutBy: wasEarlyClockOut ? earlyClockOutBy : null,
        workedFullShift  // ← ACCOUNTABILITY METRIC!
      },
    })

    // ✨ Auto-generate activity post
    await logClockedOut(staffUser.id, staffUser.name, netWorkHours)

    return NextResponse.json({
      success: true,
      timeEntry,
      totalHours: netWorkHours.toFixed(2),
      breakTime: totalBreakTime.toFixed(2),
      wasEarlyClockOut,
      earlyClockOutBy,
      workedFullShift,
      message: wasEarlyClockOut
        ? `Clocked out ${earlyClockOutBy} minutes early. Net work hours: ${netWorkHours.toFixed(2)}`
        : `Clocked out successfully. Net work hours: ${netWorkHours.toFixed(2)}`,
    })
  } catch (error) {
    console.error("Error clocking out:", error)
    return NextResponse.json({ error: "Failed to clock out" }, { status: 500 })
  }
}



