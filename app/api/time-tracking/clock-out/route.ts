import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getStaffUser } from "@/lib/auth-helpers"
import { logClockedOut } from "@/lib/activity-generator"

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
        work_schedule: {  // ← FETCH THE SCHEDULE to know shift end time!
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

    const clockOut = new Date()
    const totalHours = (clockOut.getTime() - activeEntry.clockIn.getTime()) / (1000 * 60 * 60)
    
    // Calculate break time from the breaks we already fetched
    const breaks = activeEntry.breaks
    const totalBreakTime = breaks.reduce((sum, b) => sum + (b.duration || 0), 0) / 60
    const netWorkHours = totalHours - totalBreakTime

    // Check if user is clocking out EARLY
    let wasEarlyClockOut = false
    let earlyClockOutBy = 0
    let expectedClockOut = null
    
    if (activeEntry.work_schedule && activeEntry.work_schedule.endTime && activeEntry.work_schedule.endTime.trim() !== '') {
      try {
        // Parse shift end time - supports both "05:00 PM" and "17:00" (24-hour)
        const timeStr = activeEntry.work_schedule.endTime.trim()
        const parts = timeStr.split(' ')
        
        let hour: number
        let minute: number
        
        if (parts.length >= 2) {
          // Format: "05:00 PM" or "5:00 PM"
          const time = parts[0]
          const period = parts[1].toUpperCase()
          const [hours, minutes] = time.split(':')
          
          hour = parseInt(hours)
          minute = parseInt(minutes || '0')
          
          // Convert to 24-hour format
          if (period === 'PM' && hour !== 12) {
            hour += 12
          } else if (period === 'AM' && hour === 12) {
            hour = 0
          }
        } else {
          // Format: "17:00" or "12:00" (24-hour format)
          const [hours, minutes] = timeStr.split(':')
          hour = parseInt(hours)
          minute = parseInt(minutes || '0')
        }
        
        // Create expected clock-out time
        expectedClockOut = new Date(clockOut)
        expectedClockOut.setHours(hour, minute, 0, 0)
        
        // Check if user is clocking out EARLY
        const diffMs = expectedClockOut.getTime() - clockOut.getTime()
        const diffMinutes = Math.floor(Math.abs(diffMs) / 60000)
        
        if (diffMs > 0) {
          // Clocking out BEFORE shift end = EARLY
          wasEarlyClockOut = true
          earlyClockOutBy = diffMinutes
        }
        // If diffMs <= 0, they stayed until or past shift end (on-time or late leaving)
        
      } catch (error) {
        console.error('[Clock-Out] Error parsing end time:', activeEntry.work_schedule.endTime, error)
        // If parsing fails, don't mark as early
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



