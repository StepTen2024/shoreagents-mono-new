/**
 * Timezone Helper Functions
 * Handles timezone conversion and night shift detection for Filipino staff
 */

import { prisma } from "@/lib/prisma"

/**
 * Get current time in staff's timezone (default: Asia/Manila)
 * Returns the ACTUAL current UTC time (not a fake offset time!)
 * 
 * NOTE: Date objects always store UTC internally. This function returns
 * the actual current time, which is the same in all timezones!
 */
export function getStaffLocalTime(timezone: string = 'Asia/Manila'): Date {
  // Current UTC time is the same regardless of timezone!
  // The timezone parameter is kept for API consistency but isn't needed here.
  return new Date()
}

/**
 * Get start of day (midnight) in staff's timezone
 * ✅ SIMPLE & RELIABLE: Works the same locally and deployed
 * 
 * Returns a Date object representing midnight in the staff's timezone.
 * Example: Nov 13, 2025 00:00:00 Manila = Nov 12, 2025 16:00:00 UTC
 */
export function getStaffDayStart(timezone: string = 'Asia/Manila', daysOffset: number = 0): Date {
  const now = new Date()
  
  // Get the date string in staff timezone
  const dateInTz = now.toLocaleString('en-US', { 
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false
  })
  
  // Parse "MM/DD/YYYY" or "11/13/2025, HH:MM:SS"
  const datePart = dateInTz.split(',')[0]
  const [month, day, year] = datePart.split('/').map(Number)
  
  // Calculate midnight in the target timezone
  // We create a date string that will be interpreted correctly
  const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T00:00:00`
  
  // Create two dates: one interpreted as local, one as target timezone
  const localMidnight = new Date(dateStr)
  const targetTzMidnight = new Date(localMidnight.toLocaleString('en-US', { timeZone: timezone }))
  
  // Calculate the offset between them
  const offset = localMidnight.getTime() - targetTzMidnight.getTime()
  
  // Apply offset to get the UTC time that represents midnight in target timezone
  let result = new Date(Date.UTC(year, month - 1, day + daysOffset, 0, 0, 0, 0) - offset)
  
  return result
}

/**
 * Get day of week in staff's timezone
 */
export function getStaffDayOfWeek(timezone: string = 'Asia/Manila'): string {
  const staffTime = getStaffLocalTime(timezone)
  return staffTime.toLocaleDateString('en-US', { weekday: 'long', timeZone: timezone })
}

/**
 * Parse time string (supports "09:00 AM", "21:00", etc.)
 */
export function parseTimeString(timeStr: string): { hour: number; minute: number } {
  const parts = timeStr.trim().split(' ')
  
  if (parts.length >= 2) {
    // Format: "09:00 AM" or "9:00 PM"
    const time = parts[0]
    const period = parts[1].toUpperCase()
    const [hours, minutes] = time.split(':')
    
    let hour = parseInt(hours)
    const minute = parseInt(minutes || '0')
    
    // Convert to 24-hour format
    if (period === 'PM' && hour !== 12) {
      hour += 12
    } else if (period === 'AM' && hour === 12) {
      hour = 0
    }
    
    return { hour, minute }
  } else {
    // Format: "09:00" or "21:00" (24-hour format)
    const [hours, minutes] = timeStr.split(':')
    return {
      hour: parseInt(hours),
      minute: parseInt(minutes || '0')
    }
  }
}

/**
 * Detect if current time is within a night shift from yesterday
 * 
 * Logic:
 * - If it's before 6 AM, check if yesterday had a night shift
 * - Night shift = starts after 6 PM (18:00)
 * - If yes, this clock-in belongs to yesterday's shift
 * 
 * Returns: { isNightShift: boolean, shiftDayOfWeek: string, shiftDate: Date }
 */
export async function detectShiftDay(
  staffUserId: string,
  timezone: string = 'Asia/Manila'
): Promise<{ isNightShift: boolean; shiftDayOfWeek: string; shiftDate: Date }> {
  const now = new Date()
  
  // Get current hour in staff timezone
  const nowStr = now.toLocaleString('en-US', { 
    timeZone: timezone,
    hour: '2-digit',
    hour12: false
  })
  const currentHour = parseInt(nowStr.replace(/^0/, ''))  // Remove leading zero and parse
  
  const SHIFT_BOUNDARY_HOUR = 6  // 6 AM cutoff
  
  console.log(`🕐 [detectShiftDay] Current time in ${timezone}:`, {
    time: now.toISOString(),
    hour: currentHour
  })
  
  // If it's between midnight and 6 AM, check if this is yesterday's night shift
  if (currentHour < SHIFT_BOUNDARY_HOUR) {
    console.log(`⏰ [detectShiftDay] Before ${SHIFT_BOUNDARY_HOUR} AM - checking for yesterday's night shift...`)
    
    // Get yesterday's date in staff timezone using getStaffDayStart with -1 offset
    const yesterday = getStaffDayStart(timezone, -1)  // Yesterday at midnight
    
    // Get yesterday's day of week in staff timezone
    const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)  // Subtract 1 day
    const yesterdayDayOfWeek = yesterdayDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      timeZone: timezone 
    })
    
    console.log(`📅 [detectShiftDay] Yesterday:`, {
      date: yesterday.toISOString(),
      dayOfWeek: yesterdayDayOfWeek
    })
    
    // Check if yesterday's schedule exists and is a night shift
    const yesterdaySchedule = await prisma.work_schedules.findFirst({
      where: {
        staff_profiles: { staffUserId },
        dayOfWeek: yesterdayDayOfWeek,
        isWorkday: true
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        shiftType: true
      }
    })
    
    if (yesterdaySchedule) {
      console.log(`✅ [detectShiftDay] Found yesterday's schedule:`, yesterdaySchedule)
      
      // Parse yesterday's shift start time
      const startTime = parseTimeString(yesterdaySchedule.startTime)
      
      console.log(`⏰ [detectShiftDay] Yesterday's shift starts at:`, startTime)
      
      // ✅ FIX: If clocking in before 6 AM and yesterday had a shift, treat it as yesterday's shift
      // This handles:
      // 1. Night shifts (6 PM or later)
      // 2. Afternoon shifts where staff might clock in late after midnight
      // 3. Overtime situations
      console.log(`🌙 [detectShiftDay] Before 6 AM with yesterday's shift - treating as ${yesterdayDayOfWeek}'s shift`)
      console.log(`   (This could be late arrival, night shift, or overtime for yesterday's shift)`)
      
      return {
        isNightShift: true,  // Mark as night shift to indicate it crosses midnight
        shiftDayOfWeek: yesterdayDayOfWeek,
        shiftDate: yesterday
      }
    } else {
      console.log(`❌ [detectShiftDay] No schedule found for ${yesterdayDayOfWeek}`)
    }
  } else {
    console.log(`☀️ [detectShiftDay] After ${SHIFT_BOUNDARY_HOUR} AM - using today's shift`)
  }
  
  // Not a night shift crossover - use today
  const today = getStaffDayStart(timezone, 0)  // Today at midnight in staff timezone
  const todayDayOfWeek = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    timeZone: timezone 
  })
  
  console.log(`📅 [detectShiftDay] Using today's shift:`, {
    date: today.toISOString(),
    dayOfWeek: todayDayOfWeek
  })
  
  return {
    isNightShift: false,
    shiftDayOfWeek: todayDayOfWeek,
    shiftDate: today
  }
}

/**
 * Create expected clock-in time for a shift
 * Handles night shifts that cross midnight
 * 
 * ✅ CRITICAL: Uses milliseconds math to avoid server timezone issues!
 * .setHours() uses SERVER timezone, but shiftDate is timezone-aware!
 */
export function createExpectedClockIn(
  shiftDate: Date,
  startTimeStr: string
): Date {
  const { hour, minute } = parseTimeString(startTimeStr)
  
  // ✅ Add hours/minutes using milliseconds (timezone-independent!)
  // shiftDate = midnight Manila (e.g., Nov 14 00:00 Manila = Nov 13 16:00 UTC)
  // Add 9 hours = Nov 14 09:00 Manila = Nov 14 01:00 UTC ✅
  const hoursInMs = hour * 60 * 60 * 1000
  const minutesInMs = minute * 60 * 1000
  
  return new Date(shiftDate.getTime() + hoursInMs + minutesInMs)
}


