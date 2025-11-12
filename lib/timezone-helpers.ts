/**
 * Timezone Helper Functions
 * Handles timezone conversion and night shift detection for Filipino staff
 */

import { prisma } from "@/lib/prisma"

/**
 * Get current time in staff's timezone (default: Asia/Manila)
 */
export function getStaffLocalTime(timezone: string = 'Asia/Manila'): Date {
  // Get current time as string in staff timezone
  const nowStr = new Date().toLocaleString('en-US', { 
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  
  // Parse back to Date object
  // Format: "11/06/2025, 13:45:30"
  const [datePart, timePart] = nowStr.split(', ')
  const [month, day, year] = datePart.split('/').map(Number)
  const [hour, minute, second] = timePart.split(':').map(Number)
  
  return new Date(year, month - 1, day, hour, minute, second)
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
  const staffTime = getStaffLocalTime(timezone)
  const currentHour = staffTime.getHours()
  
  const SHIFT_BOUNDARY_HOUR = 6  // 6 AM cutoff
  
  console.log(`🕐 [detectShiftDay] Current time in ${timezone}:`, {
    time: staffTime.toISOString(),
    hour: currentHour
  })
  
  // If it's between midnight and 6 AM, check if this is yesterday's night shift
  if (currentHour < SHIFT_BOUNDARY_HOUR) {
    console.log(`⏰ [detectShiftDay] Before ${SHIFT_BOUNDARY_HOUR} AM - checking for yesterday's night shift...`)
    
    // Get yesterday in staff timezone
    const yesterday = new Date(staffTime)
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0) // Start of yesterday
    const yesterdayDayOfWeek = yesterday.toLocaleDateString('en-US', { weekday: 'long', timeZone: timezone })
    
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
      
      // Night shift = starts at 6 PM (18:00) or later
      if (startTime.hour >= 18) {
        console.log(`🌙 [detectShiftDay] NIGHT SHIFT DETECTED! This is ${yesterdayDayOfWeek}'s shift`)
        
        return {
          isNightShift: true,
          shiftDayOfWeek: yesterdayDayOfWeek,
          shiftDate: yesterday
        }
      } else {
        console.log(`☀️ [detectShiftDay] Yesterday's shift starts before 6 PM - not a night shift`)
      }
    } else {
      console.log(`❌ [detectShiftDay] No schedule found for ${yesterdayDayOfWeek}`)
    }
  } else {
    console.log(`☀️ [detectShiftDay] After ${SHIFT_BOUNDARY_HOUR} AM - using today's shift`)
  }
  
  // Not a night shift crossover - use today
  const todayDayOfWeek = getStaffDayOfWeek(timezone)
  const today = new Date(staffTime)
  today.setHours(0, 0, 0, 0) // Start of today
  
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
 */
export function createExpectedClockIn(
  shiftDate: Date,
  startTimeStr: string
): Date {
  const { hour, minute } = parseTimeString(startTimeStr)
  
  const expectedTime = new Date(shiftDate)
  expectedTime.setHours(hour, minute, 0, 0)
  
  return expectedTime
}


