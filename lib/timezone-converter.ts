/**
 * Timezone Conversion Utilities
 * 
 * Converts work schedule times from client timezone to Manila timezone (Asia/Manila)
 * for staff work schedules.
 */

/**
 * Convert a time string from one timezone to another
 * @param timeStr - Time string like "9:00 AM" or "18:00"
 * @param fromTimezone - Source timezone (e.g., "Australia/Brisbane")
 * @param toTimezone - Target timezone (default: "Asia/Manila")
 * @returns Converted time string in same format
 */
export function convertTime(
  timeStr: string,
  fromTimezone: string,
  toTimezone: string = "Asia/Manila"
): string {
  if (!timeStr || timeStr.trim() === "") {
    return ""
  }

  try {
    // Parse time string (handles both 12-hour and 24-hour formats)
    const is12Hour = timeStr.includes("AM") || timeStr.includes("PM")
    const cleanTime = timeStr.trim()
    
    let hour: number
    let minute: number
    
    if (is12Hour) {
      // Parse 12-hour format (e.g., "9:00 AM", "6:00 PM")
      const timeParts = cleanTime.replace(/\s*(AM|PM)\s*/i, '').split(':')
      hour = parseInt(timeParts[0])
      minute = parseInt(timeParts[1] || '0')
      
      const isPM = cleanTime.toUpperCase().includes('PM')
      if (isPM && hour !== 12) {
        hour += 12
      } else if (!isPM && hour === 12) {
        hour = 0
      }
    } else {
      // Parse 24-hour format (e.g., "09:00", "18:00")
      const timeParts = cleanTime.split(':')
      hour = parseInt(timeParts[0])
      minute = parseInt(timeParts[1] || '0')
    }
    
    console.log(`🕐 Parsing "${timeStr}": hour=${hour}, minute=${minute}, is12Hour=${is12Hour}`)
    
    // Create a fixed date string in ISO format (YYYY-MM-DDTHH:MM:SS)
    // We'll use a fixed date to avoid any issues with current date/time
    const isoString = `2025-06-15T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`
    console.log(`📅 ISO String: ${isoString}`)
    
    // Create localized string for source timezone
    // Format: "6/15/2025, HH:MM:SS"
    const localizedString = isoString.replace('T', ' ').replace('-', '/').replace('-', '/')
    
    // Parse this time as if it's in the source timezone
    // by creating a Date and then using toLocaleString to get it in that timezone
    const baseDate = new Date(isoString + 'Z') // Treat as UTC first
    
    // Get what this UTC time looks like in the source timezone
    const sourceFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: fromTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    
    const sourceTimeStr = sourceFormatter.format(baseDate)
    console.log(`🌏 ${isoString}Z formatted in ${fromTimezone}: ${sourceTimeStr}`)
    
    // Now we need to find the UTC time that, when formatted in source timezone, shows our desired time
    // We'll use trial and error with the offset
    const [, sourceTime] = sourceTimeStr.split(', ')
    const [sourceHour, sourceMin] = sourceTime.split(':').map(Number)
    
    // Calculate offset needed
    let offsetHours = sourceHour - hour
    let offsetMinutes = sourceMin - minute
    
    // Handle day wrap-around
    if (offsetHours > 12) offsetHours -= 24
    if (offsetHours < -12) offsetHours += 24
    
    console.log(`⚙️ Calculated offset: ${offsetHours} hours, ${offsetMinutes} minutes`)
    
    // Apply inverse offset to get the correct UTC time
    const utcDate = new Date(Date.UTC(
      2025, 5, 15, // June 15, 2025 (month is 0-indexed)
      hour - offsetHours,
      minute - offsetMinutes,
      0
    ))
    
    console.log(`🌍 Adjusted UTC time: ${utcDate.toISOString()}`)
    
    // Format in target timezone
    const targetFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: toTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: is12Hour
    })
    
    const convertedTime = targetFormatter.format(utcDate)
    
    console.log(`✅ Final conversion: "${timeStr}" (${fromTimezone}) → "${convertedTime}" (${toTimezone})`)
    
    return convertedTime
  } catch (error) {
    console.error(`❌ Time conversion failed for "${timeStr}" from ${fromTimezone} to ${toTimezone}:`, error)
    return timeStr // Return original if conversion fails
  }
}

/**
 * Get timezone offset difference in hours
 * @param timezone1 - First timezone
 * @param timezone2 - Second timezone
 * @returns Offset difference in hours
 */
export function getTimezoneOffset(timezone1: string, timezone2: string): number {
  const now = new Date()
  
  const formatter1 = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone1,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  
  const formatter2 = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone2,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  
  const time1 = formatter1.format(now)
  const time2 = formatter2.format(now)
  
  const [hour1, min1] = time1.split(':').map(Number)
  const [hour2, min2] = time2.split(':').map(Number)
  
  const totalMin1 = hour1 * 60 + min1
  const totalMin2 = hour2 * 60 + min2
  
  return (totalMin2 - totalMin1) / 60
}

/**
 * Format timezone for display
 * @param timezone - Timezone string (e.g., "Australia/Brisbane")
 * @returns Formatted display string (e.g., "Brisbane (UTC+10)")
 */
export function formatTimezoneDisplay(timezone: string): string {
  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short'
    })
    
    const parts = formatter.formatToParts(now)
    const tzName = parts.find(p => p.type === 'timeZoneName')?.value || timezone
    
    return `${timezone.split('/')[1] || timezone} (${tzName})`
  } catch (error) {
    return timezone
  }
}

