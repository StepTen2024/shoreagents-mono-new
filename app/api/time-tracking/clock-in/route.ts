import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getStaffUser } from "@/lib/auth-helpers"
import { logClockedIn } from "@/lib/activity-generator"
import { randomUUID } from "crypto"
import { getStaffLocalTime, detectShiftDay, createExpectedClockIn } from "@/lib/timezone-helpers"

// Helper function to format minutes into readable hours/minutes
function formatLateTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes`
  }
  
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (mins === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`
  }
  
  return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${mins} minutes`
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Clock-in API called")
    const staffUser = await getStaffUser()
    console.log("👤 Staff user:", staffUser ? "Found" : "Not found")

    if (!staffUser) {
      console.log("❌ Unauthorized - no staff user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // ✅ FIX #1: Get staff timezone (default to Asia/Manila for Filipino staff)
    const staffTimezone = staffUser.staff_profiles?.timezone || 'Asia/Manila'
    
    // ✅ FIX #2: Get current time in STAFF timezone (not server time!)
    const nowInStaffTz = getStaffLocalTime(staffTimezone)
    
    console.log(`⏰ Current time in ${staffTimezone}:`, nowInStaffTz.toISOString())
    
    // ✅ FIX #3: Detect if this is a night shift from yesterday
    const { isNightShift, shiftDayOfWeek, shiftDate } = await detectShiftDay(
      staffUser.id,
      staffTimezone
    )
    
    console.log(`🕐 Shift detection:`, {
      isNightShift,
      shiftDayOfWeek,
      shiftDate: shiftDate.toISOString()
    })
    
    // Get profile ID first (staffUser already includes staff_profiles from getStaffUser)
    const profileId = staffUser.staff_profiles?.id
    
    // ✅ FIX #4: Check for existing entries for THIS SHIFT DATE (not calendar date)
    // shiftDate is already at midnight from detectShiftDay(), so we can use it directly
    const startOfShiftDate = new Date(shiftDate.getTime())  // Copy timestamp
    const endOfShiftDate = new Date(shiftDate.getTime() + 24 * 60 * 60 * 1000 - 1)  // Add 1 day minus 1ms
    
    // Run all checks in parallel to speed up the process
    const [activeEntry, existingShiftEntry, workSchedule] = await Promise.all([
      // Check if user is already clocked in
      prisma.time_entries.findFirst({
        where: {
          staffUserId: staffUser.id,
          clockOut: null,
        },
      }),
      // ✅ FIX #5: Check for existing entry for THIS SHIFT (not today's calendar date)
      prisma.time_entries.findFirst({
        where: {
          staffUserId: staffUser.id,
          shiftDate: {
            gte: startOfShiftDate,
            lte: endOfShiftDate
          }
        },
        select: { 
          id: true,
          shiftDayOfWeek: true,
          breaks: {
            select: { id: true }
          }
        }
      }),
      // ✅ FIX #6: Get work schedule for the SHIFT DAY (not current day)
      profileId ? prisma.work_schedules.findFirst({
        where: {
          profileId: profileId,
          dayOfWeek: shiftDayOfWeek  // ← Use detected shift day!
        },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          shiftType: true
        }
      }) : null
    ])

    if (activeEntry) {
      return NextResponse.json(
        { error: "You are already clocked in", activeEntry },
        { status: 400 }
      )
    }
    
    // ✅ FIX #7: Check for existing shift entry (not calendar day entry)
    if (existingShiftEntry) {
      return NextResponse.json(
        { error: `You have already clocked in for ${existingShiftEntry.shiftDayOfWeek || shiftDayOfWeek}'s shift. Only one session per shift is allowed.` },
        { status: 400 }
      )
    }
    
    // ✅ FIX #8: Validate work schedule exists for this shift
    if (!workSchedule) {
      return NextResponse.json(
        { error: `No work schedule found for ${shiftDayOfWeek}. Please contact admin.` },
        { status: 400 }
      )
    }
    
    let wasLate = false
    let lateBy = 0
    let wasEarly = false
    let earlyBy = 0
    let expectedClockIn: Date | null = null
    let expectedClockOut: Date | null = null
    
    // ✅ FIX #9: Calculate expected clock-in time for the SHIFT DATE
    if (workSchedule.startTime && workSchedule.startTime.trim() !== '') {
      try {
        // Create expected clock-in time using helper function
        expectedClockIn = createExpectedClockIn(shiftDate, workSchedule.startTime)
        
        // ✅ NEW: Calculate expected clock-out time from work schedule
        if (workSchedule.endTime && workSchedule.endTime.trim() !== '') {
          expectedClockOut = createExpectedClockIn(shiftDate, workSchedule.endTime)
          console.log(`⏰ Expected clock-out:`, {
            expectedTime: expectedClockOut.toISOString(),
            expectedTimeManila: expectedClockOut.toLocaleString('en-US', { timeZone: staffTimezone }),
            timezone: staffTimezone
          })
        }
        
        console.log(`⏰ Expected clock-in:`, {
          expectedTime: expectedClockIn.toISOString(),
          expectedTimeManila: expectedClockIn.toLocaleString('en-US', { timeZone: staffTimezone }),
          actualTime: nowInStaffTz.toISOString(),
          actualTimeManila: nowInStaffTz.toLocaleString('en-US', { timeZone: staffTimezone }),
          timezone: staffTimezone
        })
        
        // ✅ FIX #10: Normalize both times to minute precision (remove seconds/milliseconds)
        // This ensures clocking in at 6:00:00 to 6:00:59 is all considered "on time"
        const normalizedNow = new Date(nowInStaffTz)
        normalizedNow.setSeconds(0, 0)  // Reset seconds and milliseconds to 0
        
        const normalizedExpected = new Date(expectedClockIn)
        normalizedExpected.setSeconds(0, 0)  // Reset seconds and milliseconds to 0
        
        // ✅ FIX #11: Compare against STAFF TIMEZONE time at minute precision
        const diffMs = normalizedNow.getTime() - normalizedExpected.getTime()
        const diffMinutes = Math.floor(Math.abs(diffMs) / 60000)
        
        console.log(`⏰ Time difference calculation:`, {
          normalizedActual: normalizedNow.toISOString(),
          normalizedExpected: normalizedExpected.toISOString(),
          diffMs,
          diffMinutes,
          diffHours: (diffMinutes / 60).toFixed(2),
          wasLate: diffMs > 0,
          wasEarly: diffMs < 0
        })
        
        if (diffMs > 0) {
          // Clocked in AFTER shift start = LATE
          wasLate = true
          lateBy = diffMinutes
          console.log(`⏰ LATE by ${diffMinutes} minutes`)
        } else if (diffMs < 0) {
          // Clocked in BEFORE shift start = EARLY
          wasEarly = true
          earlyBy = diffMinutes
          console.log(`⏰ EARLY by ${diffMinutes} minutes`)
        } else {
          console.log(`⏰ ON TIME!`)
        }
        
      } catch (error) {
        console.error('[Clock-In] Error calculating late/early:', error)
        wasLate = false
        lateBy = 0
        wasEarly = false
        earlyBy = 0
        expectedClockIn = null
      }
    }

    // Get late reason if provided in request body
    const body = await request.json().catch(() => ({}))
    const lateReason = body.lateReason || null
    
    // ✅ FIX #11: Create time entry with SHIFT DATE and SHIFT DAY OF WEEK
    const timeEntry = await prisma.time_entries.create({
      data: {
        id: randomUUID(),
        staffUserId: staffUser.id,
        workScheduleId: workSchedule.id,
        clockIn: nowInStaffTz,        // ✅ Use staff timezone time
        shiftDate: shiftDate,          // ✅ NEW! Shift date (handles night shift crossover)
        shiftDayOfWeek: shiftDayOfWeek, // ✅ NEW! "Thursday", "Friday", etc.
        updatedAt: new Date(),
        expectedClockIn,
        expectedClockOut,              // ✅ NEW! Expected shift end time
        wasLate,
        lateBy: wasLate ? lateBy : null,
        wasEarly,
        earlyBy: wasEarly ? earlyBy : null,
        lateReason: wasLate ? lateReason : null,
        workedFullShift: false,
        overtimeMinutes: null          // ✅ NEW! Will be calculated at clock-out
      },
    })
    
    console.log(`✅ Time entry created:`, {
      id: timeEntry.id,
      clockIn: timeEntry.clockIn.toISOString(),
      clockInManila: timeEntry.clockIn.toLocaleString('en-US', { timeZone: staffTimezone }),
      shiftDate: timeEntry.shiftDate?.toISOString(),
      shiftDayOfWeek: timeEntry.shiftDayOfWeek,
      wasLate: timeEntry.wasLate,
      lateBy: timeEntry.lateBy,
      wasEarly: timeEntry.wasEarly,
      earlyBy: timeEntry.earlyBy,
      expectedClockIn: timeEntry.expectedClockIn?.toISOString(),
      expectedClockInManila: timeEntry.expectedClockIn?.toLocaleString('en-US', { timeZone: staffTimezone }),
      isNightShift,
      timezone: staffTimezone
    })
    
    // ✅ NEW: Create empty performance_metrics row for this shift
    // This allows Electron to immediately start populating data without creation logic
    await prisma.performance_metrics.create({
      data: {
        id: randomUUID(),
        staffUserId: staffUser.id,
        date: nowInStaffTz,  // ✅ FIX: Use actual clock-in time to match time_entries
        shiftDate: shiftDate,  // Keep this as midnight for day grouping
        shiftDayOfWeek: shiftDayOfWeek,
        mouseMovements: 0,
        mouseClicks: 0,
        keystrokes: 0,
        activeTime: 0,
        idleTime: 0,
        screenTime: 0,
        downloads: 0,
        uploads: 0,
        bandwidth: 0,
        clipboardActions: 0,
        filesAccessed: 0,
        urlsVisited: 0,
        tabsSwitched: 0,
        productivityScore: 0,
        applicationsused: [],
        visitedurls: [],
        updatedAt: new Date()
      } as any
    })
    
    console.log(`📊 Empty performance_metrics row created for shift:`, {
      'date (clock-in time)': nowInStaffTz.toISOString(),
      'shiftDate (midnight)': shiftDate.toISOString(),
      shiftDayOfWeek,
      'time_entries.shiftDate': timeEntry.shiftDate?.toISOString() || 'null',
      'performance_metrics.shiftDate': shiftDate.toISOString(),
      'ARE THEY EQUAL?': timeEntry.shiftDate ? (timeEntry.shiftDate.getTime() === shiftDate.getTime() ? '✅ YES' : '❌ NO - BUG!') : '⚠️ timeEntry.shiftDate is null'
    })
    
    // Check if any breaks exist for this shift (we already fetched this data above)
    const existingBreaksThisShift = existingShiftEntry?.breaks && existingShiftEntry.breaks.length > 0
    
    // Only show break scheduler if no breaks have been scheduled for this shift
    const shouldShowBreakScheduler = !existingBreaksThisShift
    
    console.log(`[Clock-In] Breaks for ${shiftDayOfWeek} shift: ${existingBreaksThisShift ? 'YES' : 'NO'}, Show scheduler: ${shouldShowBreakScheduler}`)

    // ✨ Auto-generate activity post
    await logClockedIn(staffUser.id, staffUser.name, wasLate, lateBy)

    return NextResponse.json({
      success: true,
      timeEntry: {
        ...timeEntry,
        breaksScheduled: !!existingBreaksThisShift
      },
      wasLate,
      lateBy,
      wasEarly,
      earlyBy,
      isNightShift,                    // ✅ NEW! Let UI know if this is a night shift
      shiftDayOfWeek,                  // ✅ NEW! Tell UI which day this shift belongs to
      showBreakScheduler: shouldShowBreakScheduler,
      message: isNightShift
        ? `Clocked in for ${shiftDayOfWeek}'s night shift` + (wasLate ? ` (${formatLateTime(lateBy)} late)` : '')
        : wasLate 
        ? `Clocked in ${formatLateTime(lateBy)} late`
        : wasEarly
        ? `Clocked in ${earlyBy} minutes early`
        : "Clocked in on time",
    })
  } catch (error) {
    console.error("❌ ERROR CLOCKING IN:", error)
    console.error("❌ ERROR DETAILS:", JSON.stringify(error, null, 2))
    console.error("❌ ERROR MESSAGE:", error instanceof Error ? error.message : "Unknown error")
    console.error("❌ ERROR STACK:", error instanceof Error ? error.stack : "No stack")
    return NextResponse.json({ 
      error: "Failed to clock in",
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}



