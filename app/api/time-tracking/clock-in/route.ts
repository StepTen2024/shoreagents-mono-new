import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getStaffUser } from "@/lib/auth-helpers"
import { logClockedIn } from "@/lib/activity-generator"
import { randomUUID } from "crypto"
import { getStaffLocalTime, detectShiftDay, createExpectedClockIn } from "@/lib/timezone-helpers"

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
    const startOfShiftDate = new Date(shiftDate)
    startOfShiftDate.setHours(0, 0, 0, 0)
    const endOfShiftDate = new Date(shiftDate)
    endOfShiftDate.setHours(23, 59, 59, 999)
    
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
    
    // ✅ FIX #9: Calculate expected clock-in time for the SHIFT DATE
    if (workSchedule.startTime && workSchedule.startTime.trim() !== '') {
      try {
        // Create expected clock-in time using helper function
        expectedClockIn = createExpectedClockIn(shiftDate, workSchedule.startTime)
        
        console.log(`⏰ Expected clock-in:`, {
          expectedTime: expectedClockIn.toISOString(),
          actualTime: nowInStaffTz.toISOString()
        })
        
        // ✅ FIX #10: Compare against STAFF TIMEZONE time (not server time)
        const diffMs = nowInStaffTz.getTime() - expectedClockIn.getTime()
        const diffMinutes = Math.floor(Math.abs(diffMs) / 60000)
        
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
        wasLate,
        lateBy: wasLate ? lateBy : null,
        wasEarly,
        earlyBy: wasEarly ? earlyBy : null,
        lateReason: wasLate ? lateReason : null,
        workedFullShift: false
      },
    })
    
    console.log(`✅ Time entry created:`, {
      id: timeEntry.id,
      clockIn: timeEntry.clockIn,
      shiftDate: timeEntry.shiftDate,
      shiftDayOfWeek: timeEntry.shiftDayOfWeek,
      isNightShift
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
        ? `Clocked in for ${shiftDayOfWeek}'s night shift` + (wasLate ? ` (${lateBy} min late)` : '')
        : wasLate 
        ? `Clocked in ${lateBy} minutes late`
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



