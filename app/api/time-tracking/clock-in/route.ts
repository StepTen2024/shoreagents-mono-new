import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getStaffUser } from "@/lib/auth-helpers"
import { logClockedIn } from "@/lib/activity-generator"
import { randomUUID } from "crypto"

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Clock-in API called")
    const staffUser = await getStaffUser()
    console.log("👤 Staff user:", staffUser ? "Found" : "Not found")

    if (!staffUser) {
      console.log("❌ Unauthorized - no staff user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    
    // Calculate time ranges once
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)
    const today = now.toLocaleDateString('en-US', { weekday: 'long' })
    
    // Get profile ID first (staffUser already includes staff_profiles from getStaffUser)
    const profileId = staffUser.staff_profiles?.id
    
    // Run all checks in parallel to speed up the process
    const [activeEntry, todaysEntries, workSchedule] = await Promise.all([
      // Check if user is already clocked in
      prisma.time_entries.findFirst({
        where: {
          staffUserId: staffUser.id,
          clockOut: null,
        },
      }),
      // Get all today's entries including breaks
      prisma.time_entries.findMany({
        where: {
          staffUserId: staffUser.id,
          clockIn: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        select: { 
          id: true,
          breaks: {
            select: { id: true }
          }
        }
      }),
      // Get today's work schedule (use profileId directly to avoid JOIN) - FULL record including ID!
      profileId ? prisma.work_schedules.findFirst({
        where: {
          profileId: profileId,
          dayOfWeek: today
        },
        select: {
          id: true,           // ← NEED THIS to save relationship!
          startTime: true,
          endTime: true
        }
      }) : null
    ])

    if (activeEntry) {
      return NextResponse.json(
        { error: "You are already clocked in", activeEntry },
        { status: 400 }
      )
    }
    
    if (todaysEntries.length > 0) {
      return NextResponse.json(
        { error: "You have already clocked in today. Only one session per day is allowed." },
        { status: 400 }
      )
    }
    
    let wasLate = false
    let lateBy = 0
    let wasEarly = false
    let earlyBy = 0
    let expectedClockIn = null
    
    // Check if work schedule exists and has a valid startTime
    if (workSchedule && workSchedule.startTime && workSchedule.startTime.trim() !== '') {
      try {
        // Parse shift start time - supports both "09:00 AM" and "09:00" (24-hour)
        const timeStr = workSchedule.startTime.trim()
        const parts = timeStr.split(' ')
        
        let hour: number
        let minute: number
        
        if (parts.length >= 2) {
          // Format: "09:00 AM" or "9:00 PM"
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
          // Format: "09:00" or "03:00" (24-hour format)
          const [hours, minutes] = timeStr.split(':')
          hour = parseInt(hours)
          minute = parseInt(minutes || '0')
        }
        
        // Create expected clock-in time
        expectedClockIn = new Date(now)
        expectedClockIn.setHours(hour, minute, 0, 0)
        
        // Check if user is LATE or EARLY
        const diffMs = now.getTime() - expectedClockIn.getTime()
        const diffMinutes = Math.floor(Math.abs(diffMs) / 60000)
        
        if (diffMs > 0) {
          // Clocked in AFTER shift start = LATE
          wasLate = true
          lateBy = diffMinutes
        } else if (diffMs < 0) {
          // Clocked in BEFORE shift start = EARLY
          wasEarly = true
          earlyBy = diffMinutes
        }
        // If diffMs === 0, they're exactly on time!
        
      } catch (error) {
        console.error('[Clock-In] Error parsing start time:', workSchedule.startTime, error)
        // If parsing fails, don't mark as late/early
        wasLate = false
        lateBy = 0
        wasEarly = false
        earlyBy = 0
        expectedClockIn = null
      }
    }

    // Create new time entry with shift tracking
    const timeEntry = await prisma.time_entries.create({
      data: {
        id: randomUUID(),
        staffUserId: staffUser.id,
        workScheduleId: workSchedule?.id || null,  // ← SAVE THE SCHEDULE LINK!
        clockIn: now,
        updatedAt: now,
        expectedClockIn,
        wasLate,
        lateBy: wasLate ? lateBy : null,
        wasEarly,
        earlyBy: wasEarly ? earlyBy : null,
        lateReason: null,  // Will be set by UI if user is late
        workedFullShift: false  // Will be calculated on clock-out
      },
    })
    
    // Check if any breaks exist for today (we already fetched this data above)
    const existingBreaksToday = todaysEntries.some(entry => entry.breaks && entry.breaks.length > 0)
    
    // Only show break scheduler if no breaks have been scheduled today at all
    const shouldShowBreakScheduler = !existingBreaksToday
    
    console.log(`[Clock-In] Breaks today: ${existingBreaksToday ? 'YES' : 'NO'}, Show scheduler: ${shouldShowBreakScheduler}`)

    // ✨ Auto-generate activity post
    await logClockedIn(staffUser.id, staffUser.name)

    return NextResponse.json({
      success: true,
      timeEntry: {
        ...timeEntry,
        breaksScheduled: !!existingBreaksToday // Mark as scheduled if breaks exist today
      },
      wasLate,
      lateBy,
      wasEarly,
      earlyBy,
      showBreakScheduler: shouldShowBreakScheduler,
      // Message for logging, popup will be handled by UI based on wasLate/wasEarly flags
      message: wasLate 
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



