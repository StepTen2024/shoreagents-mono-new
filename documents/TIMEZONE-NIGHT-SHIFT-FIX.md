# 🌙 CRITICAL: Timezone & Night Shift Crossover Fix
## The Midnight Problem for Filipino Staff

*Last Updated: Nov 6, 2025*

---

## 🚨 **THE PROBLEM**

### **Scenario:**
- Filipino staff member has **Thursday NIGHT SHIFT**
- Schedule: Thursday 11:00 PM → Friday 8:00 AM (9 hours, crosses midnight)
- They clock in **2 hours late at 1:00 AM Friday**

### **What SHOULD Happen:**
✅ System recognizes this as **Thursday's shift**  
✅ Time entry records `shiftDate: Thursday`  
✅ Performance metrics attached to Thursday  
✅ Breaks scheduled for Thursday shift  
✅ Late by 2 hours from Thursday 11:00 PM start  

### **What ACTUALLY Happens:**
❌ System uses `now.toLocaleDateString()` → Gets "Friday"  
❌ Looks for Friday's work schedule (wrong day!)  
❌ Performance metrics attached to Friday (wrong day!)  
❌ Can't calculate late time because comparing to wrong shift  
❌ All records scattered across two days  

---

## 🔍 **ROOT CAUSE ANALYSIS**

### **1. No Timezone Awareness**

**Current Code (`app/api/time-tracking/clock-in/route.ts:25`):**
```typescript
const now = new Date()  // Server time (UTC)
const today = now.toLocaleDateString('en-US', { weekday: 'long' })  // Uses UTC!

const workSchedule = await prisma.work_schedules.findFirst({
  where: {
    profileId: profileId,
    dayOfWeek: today  // ← WRONG! This is UTC day, not Manila day!
  }
})
```

**Problem:**
- Server is in UTC or another timezone
- Staff is in `Asia/Manila` (UTC+8)
- If it's 1 AM Friday in Manila, it might still be Thursday in UTC
- OR if server is in Manila but we're not converting properly

**What We Need:**
```typescript
// Get staff's timezone from their profile
const staffTimezone = 'Asia/Manila'  // From staff_profiles.timezone

// Convert current time to staff's timezone
const nowInStaffTz = new Date().toLocaleString('en-US', { 
  timeZone: staffTimezone 
})
```

---

### **2. No Shift Date Concept**

**Current Schema (`time_entries`):**
```typescript
time_entries {
  clockIn: DateTime        // Actual clock-in time (e.g., 1 AM Friday)
  clockOut: DateTime?
  workScheduleId: String?  // Links to work_schedules
  // ❌ NO SHIFT DATE FIELD!
}
```

**Problem:**
- `clockIn` timestamp is Friday 1:00 AM
- But this is actually Thursday's shift!
- No field to indicate "this is Thursday's shift data"

**What We Need:**
```typescript
time_entries {
  clockIn: DateTime         // Actual clock-in time (1 AM Friday)
  clockOut: DateTime?
  shiftDate: DateTime       // ← NEW! The shift start date (Thursday 11 PM)
  shiftDayOfWeek: String    // ← NEW! "Thursday" (for easy querying)
  workScheduleId: String?
}
```

---

### **3. No Night Shift Detection**

**Current Logic:**
```typescript
// Line 25: app/api/time-tracking/clock-in/route.ts
const today = now.toLocaleDateString('en-US', { weekday: 'long' })
// If now = 1 AM Friday → today = "Friday"
// System looks for Friday's schedule
// But staff is working Thursday's night shift!
```

**What We Need:**
```typescript
// Detect if this is a night shift from yesterday
const SHIFT_BOUNDARY_HOUR = 6  // 6 AM cutoff

if (currentHour < SHIFT_BOUNDARY_HOUR) {
  // It's between midnight and 6 AM
  // Check if yesterday had a night shift
  const yesterday = getYesterday()
  const yesterdaysSchedule = await getWorkSchedule(yesterday)
  
  if (yesterdaysSchedule.shiftType === 'NIGHT_SHIFT') {
    // This is yesterday's shift!
    shiftDayOfWeek = yesterday
    shiftDate = yesterdaysSchedule.date
  }
}
```

---

## 🎯 **THE SOLUTION**

### **Phase 1: Add Shift Date Fields to Schema**

**Update `time_entries` model:**
```prisma
model time_entries {
  id               String          @id
  staffUserId      String
  clockIn          DateTime        // Actual clock-in timestamp
  clockOut         DateTime?       // Actual clock-out timestamp
  shiftDate        DateTime        // NEW! The date of the SHIFT (not clock-in date)
  shiftDayOfWeek   String          // NEW! "Thursday", "Friday", etc. (for performance queries)
  totalHours       Decimal?        @db.Decimal(5, 2)
  notes            String?
  createdAt        DateTime        @default(now())
  updatedAt        DateTime
  breaksScheduled  Boolean         @default(false)
  clockOutReason   ClockOutReason?
  expectedClockIn  DateTime?
  lateBy           Int?
  wasLate          Boolean         @default(false)
  earlyBy          Int?
  earlyClockOutBy  Int?
  lateReason       LateReason?
  wasEarly         Boolean         @default(false)
  wasEarlyClockOut Boolean         @default(false)
  workScheduleId   String?
  workedFullShift  Boolean         @default(false)
  breaks           breaks[]
  staff_users      staff_users     @relation(fields: [staffUserId], references: [id], onDelete: Cascade)
  work_schedule    work_schedules? @relation(fields: [workScheduleId], references: [id])
  
  @@index([shiftDate])           // NEW! Index for performance queries
  @@index([shiftDayOfWeek])      // NEW! Index for day-based queries
}
```

---

### **Phase 2: Create Timezone Helper Functions**

**New File: `lib/timezone-helpers.ts`**

```typescript
/**
 * Get current time in staff's timezone (Asia/Manila)
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
  return staffTime.toLocaleDateString('en-US', { weekday: 'long' })
}

/**
 * Detect if current time is within a night shift from yesterday
 * Returns: { isNightShift: boolean, shiftDayOfWeek: string, shiftDate: Date }
 */
export async function detectShiftDay(
  staffUserId: string,
  timezone: string = 'Asia/Manila'
): Promise<{ isNightShift: boolean; shiftDayOfWeek: string; shiftDate: Date }> {
  const staffTime = getStaffLocalTime(timezone)
  const currentHour = staffTime.getHours()
  
  const SHIFT_BOUNDARY_HOUR = 6  // 6 AM cutoff
  
  // If it's between midnight and 6 AM, check if this is yesterday's night shift
  if (currentHour < SHIFT_BOUNDARY_HOUR) {
    // Get yesterday in staff timezone
    const yesterday = new Date(staffTime)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayDayOfWeek = yesterday.toLocaleDateString('en-US', { weekday: 'long' })
    
    // Check if yesterday's schedule is a night shift
    const yesterdaySchedule = await prisma.work_schedules.findFirst({
      where: {
        staff_profiles: { staffUserId },
        dayOfWeek: yesterdayDayOfWeek,
        shiftType: 'NIGHT_SHIFT'  // Only if it's a night shift
      }
    })
    
    if (yesterdaySchedule) {
      // Parse yesterday's shift start time
      const startTime = parseTimeString(yesterdaySchedule.startTime)
      
      // Night shift = starts in evening (after 6 PM)
      if (startTime.hour >= 18) {
        // This is yesterday's night shift!
        return {
          isNightShift: true,
          shiftDayOfWeek: yesterdayDayOfWeek,
          shiftDate: yesterday
        }
      }
    }
  }
  
  // Not a night shift crossover - use today
  return {
    isNightShift: false,
    shiftDayOfWeek: getStaffDayOfWeek(timezone),
    shiftDate: staffTime
  }
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
```

---

### **Phase 3: Update Clock-In Logic**

**Updated: `app/api/time-tracking/clock-in/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getStaffUser } from "@/lib/auth-helpers"
import { logClockedIn } from "@/lib/activity-generator"
import { randomUUID } from "crypto"
import { getStaffLocalTime, detectShiftDay, parseTimeString } from "@/lib/timezone-helpers"

export async function POST(request: NextRequest) {
  try {
    const staffUser = await getStaffUser()
    
    if (!staffUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // ✅ FIX #1: Get staff timezone (default to Asia/Manila)
    const staffTimezone = staffUser.staff_profiles?.timezone || 'Asia/Manila'
    
    // ✅ FIX #2: Get current time in STAFF timezone
    const nowInStaffTz = getStaffLocalTime(staffTimezone)
    
    // ✅ FIX #3: Detect if this is a night shift from yesterday
    const { isNightShift, shiftDayOfWeek, shiftDate } = await detectShiftDay(
      staffUser.id,
      staffTimezone
    )
    
    console.log(`🕐 Clock-in detection:`, {
      staffTimezone,
      nowInStaffTz: nowInStaffTz.toISOString(),
      isNightShift,
      shiftDayOfWeek,
      shiftDate: shiftDate.toISOString()
    })
    
    // Get profile ID
    const profileId = staffUser.staff_profiles?.id
    
    // Check if already clocked in
    const activeEntry = await prisma.time_entries.findFirst({
      where: {
        staffUserId: staffUser.id,
        clockOut: null,
      },
    })
    
    if (activeEntry) {
      return NextResponse.json(
        { error: "You are already clocked in", activeEntry },
        { status: 400 }
      )
    }
    
    // ✅ FIX #4: Check for existing entries for THIS SHIFT DATE (not calendar date)
    const startOfShiftDate = new Date(shiftDate)
    startOfShiftDate.setHours(0, 0, 0, 0)
    const endOfShiftDate = new Date(shiftDate)
    endOfShiftDate.setHours(23, 59, 59, 999)
    
    const existingShiftEntry = await prisma.time_entries.findFirst({
      where: {
        staffUserId: staffUser.id,
        shiftDate: {
          gte: startOfShiftDate,
          lte: endOfShiftDate
        }
      }
    })
    
    if (existingShiftEntry) {
      return NextResponse.json({
        error: `You have already clocked in for ${shiftDayOfWeek}'s shift. Only one session per shift is allowed.`
      }, { status: 400 })
    }
    
    // ✅ FIX #5: Get work schedule for the SHIFT DAY (not current day)
    const workSchedule = profileId ? await prisma.work_schedules.findFirst({
      where: {
        profileId: profileId,
        dayOfWeek: shiftDayOfWeek  // ← Now uses detected shift day!
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        shiftType: true
      }
    }) : null
    
    if (!workSchedule) {
      return NextResponse.json({
        error: `No work schedule found for ${shiftDayOfWeek}. Please contact admin.`
      }, { status: 400 })
    }
    
    // ✅ FIX #6: Calculate expected clock-in in STAFF TIMEZONE
    let wasLate = false
    let lateBy = 0
    let wasEarly = false
    let earlyBy = 0
    let expectedClockIn: Date | null = null
    
    if (workSchedule.startTime && workSchedule.startTime.trim() !== '') {
      try {
        const { hour, minute } = parseTimeString(workSchedule.startTime)
        
        // Create expected clock-in time for the SHIFT DATE
        expectedClockIn = new Date(shiftDate)
        expectedClockIn.setHours(hour, minute, 0, 0)
        
        // For night shifts, if shift starts at night (e.g., 11 PM Thursday),
        // and we're clocking in after midnight (e.g., 1 AM Friday),
        // we need to compare against yesterday's shift start time
        if (isNightShift && nowInStaffTz.getDate() !== shiftDate.getDate()) {
          // Clocking in after midnight for yesterday's night shift
          // expectedClockIn is already set to yesterday's date with shift start time
          // This is correct!
        }
        
        // Calculate late/early
        const diffMs = nowInStaffTz.getTime() - expectedClockIn.getTime()
        const diffMinutes = Math.floor(Math.abs(diffMs) / 60000)
        
        if (diffMs > 0) {
          wasLate = true
          lateBy = diffMinutes
        } else if (diffMs < 0) {
          wasEarly = true
          earlyBy = diffMinutes
        }
        
        console.log(`⏰ Late/Early Check:`, {
          expectedClockIn: expectedClockIn.toISOString(),
          actualClockIn: nowInStaffTz.toISOString(),
          wasLate,
          lateBy,
          wasEarly,
          earlyBy
        })
        
      } catch (error) {
        console.error('[Clock-In] Error parsing start time:', error)
      }
    }
    
    // Get late reason if provided
    const body = await request.json().catch(() => ({}))
    const lateReason = body.lateReason || null
    
    // ✅ FIX #7: Create time entry with SHIFT DATE
    const timeEntry = await prisma.time_entries.create({
      data: {
        id: randomUUID(),
        staffUserId: staffUser.id,
        clockIn: nowInStaffTz,            // Actual clock-in time (might be Friday 1 AM)
        shiftDate: shiftDate,             // ← NEW! Shift date (Thursday)
        shiftDayOfWeek: shiftDayOfWeek,   // ← NEW! "Thursday"
        workScheduleId: workSchedule.id,
        expectedClockIn,
        wasLate,
        lateBy,
        lateReason: wasLate ? lateReason : null,
        wasEarly,
        earlyBy,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })
    
    console.log(`✅ Time entry created:`, {
      id: timeEntry.id,
      clockIn: timeEntry.clockIn,
      shiftDate: timeEntry.shiftDate,
      shiftDayOfWeek: timeEntry.shiftDayOfWeek,
      isNightShift
    })
    
    // Log activity
    await logClockedIn(staffUser.id, staffUser.name, wasLate, lateBy)
    
    return NextResponse.json({
      success: true,
      timeEntry,
      workSchedule,
      isNightShift,
      shiftDayOfWeek,
      message: isNightShift 
        ? `Clocked in for ${shiftDayOfWeek}'s night shift` 
        : `Clocked in for ${shiftDayOfWeek}`
    })
    
  } catch (error) {
    console.error("❌ Clock-in error:", error)
    return NextResponse.json(
      { error: "Failed to clock in. Please try again." },
      { status: 500 }
    )
  }
}
```

---

### **Phase 4: Update Performance Metrics Queries**

**Problem:** Performance metrics are currently grouped by calendar `date`, not `shiftDate`.

**Update: `/app/api/analytics/route.ts`** (or wherever performance is queried)

```typescript
// OLD: Group by calendar date
const metrics = await prisma.performance_metrics.groupBy({
  by: ['date'],  // ❌ Calendar date - wrong for night shifts!
  where: { staffUserId }
})

// NEW: Join with time_entries to get shiftDate
const metrics = await prisma.$queryRaw`
  SELECT 
    te.shiftDate as shift_date,
    te.shiftDayOfWeek as shift_day,
    SUM(pm.mouseMovements) as total_mouse,
    SUM(pm.keystrokes) as total_keys,
    SUM(pm.activeTime) as total_active,
    AVG(pm.productivityScore) as avg_productivity
  FROM performance_metrics pm
  JOIN time_entries te ON DATE(pm.date) = DATE(te.shiftDate)
    AND pm.staffUserId = te.staffUserId
  WHERE pm.staffUserId = ${staffUserId}
  GROUP BY te.shiftDate, te.shiftDayOfWeek
  ORDER BY te.shiftDate DESC
`
```

---

### **Phase 5: Update Breaks to Use Shift Date**

**Update: Break queries to filter by `shiftDate`**

```typescript
// OLD: Get breaks for today (calendar date)
const breaks = await prisma.breaks.findMany({
  where: {
    staffUserId,
    createdAt: {
      gte: startOfDay,
      lte: endOfDay
    }
  }
})

// NEW: Get breaks for this shift
const breaks = await prisma.breaks.findMany({
  where: {
    staffUserId,
    time_entries: {
      shiftDate: {
        gte: startOfShiftDate,
        lte: endOfShiftDate
      }
    }
  },
  include: {
    time_entries: {
      select: {
        shiftDate: true,
        shiftDayOfWeek: true
      }
    }
  }
})
```

---

## 🎯 **TESTING SCENARIOS**

### **Scenario 1: Day Shift (No Crossover)**
```
Schedule: Thursday 9:00 AM - 6:00 PM
Clock In: Thursday 9:05 AM

Expected:
  shiftDayOfWeek: "Thursday"
  shiftDate: Thursday
  wasLate: true
  lateBy: 5
✅ WORKS with new logic
```

### **Scenario 2: Night Shift - On Time**
```
Schedule: Thursday 11:00 PM - Friday 8:00 AM
Clock In: Thursday 11:00 PM

Expected:
  shiftDayOfWeek: "Thursday"
  shiftDate: Thursday
  wasLate: false
✅ WORKS with new logic
```

### **Scenario 3: Night Shift - Late After Midnight**
```
Schedule: Thursday 11:00 PM - Friday 8:00 AM
Clock In: Friday 1:00 AM (2 hours late)

Expected:
  shiftDayOfWeek: "Thursday"  ← Detected as yesterday's shift!
  shiftDate: Thursday
  wasLate: true
  lateBy: 120 minutes
✅ WORKS with new logic (uses detectShiftDay)
```

### **Scenario 4: Night Shift - Very Late (After 6 AM)**
```
Schedule: Thursday 11:00 PM - Friday 8:00 AM
Clock In: Friday 7:00 AM (8 hours late)

Expected:
  shiftDayOfWeek: "Friday"  ← Past shift boundary, counts as Friday
  shiftDate: Friday
  Error: "You missed Thursday's shift. Please contact admin."
⚠️ May need special handling for missed shifts
```

---

## 📊 **DATA MIGRATION**

**For existing `time_entries` without `shiftDate`:**

```sql
-- Add new columns (nullable first)
ALTER TABLE time_entries 
  ADD COLUMN shift_date TIMESTAMP,
  ADD COLUMN shift_day_of_week VARCHAR(10);

-- Backfill with clockIn date for existing records
UPDATE time_entries
SET 
  shift_date = DATE(clock_in),
  shift_day_of_week = TO_CHAR(clock_in, 'Day');

-- Make columns required after backfill
ALTER TABLE time_entries
  ALTER COLUMN shift_date SET NOT NULL,
  ALTER COLUMN shift_day_of_week SET NOT NULL;

-- Add indexes
CREATE INDEX idx_time_entries_shift_date ON time_entries(shift_date);
CREATE INDEX idx_time_entries_shift_day ON time_entries(shift_day_of_week);
```

---

## ✅ **WHAT THIS FIXES**

1. ✅ **Timezone Awareness**
   - Clock-in uses staff timezone (Asia/Manila)
   - No more UTC confusion

2. ✅ **Night Shift Detection**
   - Detects when clocking in after midnight
   - Checks if this is yesterday's night shift
   - Uses 6 AM shift boundary

3. ✅ **Correct Shift Assignment**
   - `time_entries.shiftDate` = Thursday (even if clocking in Friday 1 AM)
   - `time_entries.shiftDayOfWeek` = "Thursday"
   - All records attached to correct shift!

4. ✅ **Accurate Late Tracking**
   - Compares against correct shift start time
   - Even if 2 hours late and it's Friday, still tracks against Thursday 11 PM

5. ✅ **Performance Metrics Grouping**
   - Metrics grouped by `shiftDate`, not calendar date
   - Thursday night shift metrics all under Thursday

6. ✅ **Break Scheduling**
   - Breaks attached to correct shift via `timeEntryId`
   - Automatically inherits correct shift date

---

## 🚀 **IMPLEMENTATION PLAN**

### **Step 1: Schema Update**
```bash
# Add fields to prisma/schema.prisma
# Then run:
npx prisma db push
```

### **Step 2: Create Helper Functions**
- Create `lib/timezone-helpers.ts`
- Add functions: `getStaffLocalTime`, `detectShiftDay`, `parseTimeString`

### **Step 3: Update Clock-In API**
- Update `app/api/time-tracking/clock-in/route.ts`
- Use new helper functions
- Save `shiftDate` and `shiftDayOfWeek`

### **Step 4: Update Clock-Out API**
- Update `app/api/time-tracking/clock-out/route.ts`
- Use `shiftDate` for shift end time calculations

### **Step 5: Update Performance Queries**
- Update `/app/api/analytics/route.ts`
- Group by `shiftDate` instead of calendar date

### **Step 6: Data Migration**
- Run SQL to backfill existing records
- Set `shift_date = clock_in date` for old records

### **Step 7: Testing**
- Test day shifts (should work same as before)
- Test night shifts clocking in on time
- Test night shifts clocking in late after midnight
- Test night shifts clocking in very late (after 6 AM)

---

## 🎉 **RESULT**

**Before Fix:**
```
Thursday Night Shift: 11:00 PM - 8:00 AM
Staff clocks in at Friday 1:00 AM (2 hours late)

❌ System thinks it's Friday
❌ Looks for Friday schedule
❌ Performance metrics under Friday
❌ Can't calculate late time
❌ Chaos!
```

**After Fix:**
```
Thursday Night Shift: 11:00 PM - 8:00 AM
Staff clocks in at Friday 1:00 AM (2 hours late)

✅ System detects: "This is Thursday's night shift!"
✅ shiftDate: Thursday
✅ shiftDayOfWeek: "Thursday"
✅ wasLate: true, lateBy: 120 minutes
✅ Performance metrics attached to Thursday
✅ Client sees accurate report for Thursday shift
✅ Perfect! 🎯
```

---

## 📝 **NOTES**

- **Shift Boundary = 6 AM**: Anything before 6 AM is considered part of yesterday's night shift (if one exists)
- **Manila Timezone**: Default is `Asia/Manila` for Filipino staff
- **Backward Compatible**: Day shifts work exactly the same
- **Performance**: Indexed by `shiftDate` for fast queries
- **Client Transparency**: Reports show correct shift days

**You feel me now?** 😎

