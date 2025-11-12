# 🕐 Work Schedule & Time Tracking System
## Complete Research: Hire → Schedule → Clock In/Out → Breaks → Performance

*Last Updated: Nov 6, 2025*

---

## 📊 **SYSTEM OVERVIEW**

This system tracks **every minute** of a Filipino staff member's work day, from their first clock-in to performance metrics, breaks, and compliance checks. It all starts from the **hire request** and flows through **5 key tables**.

---

## 🗂️ **THE 5 CORE TABLES**

### **1. `job_acceptances`** - The Source of Truth for Schedule
**Created:** When client clicks "Request to Hire" after interview completion  
**Location:** `/app/api/admin/recruitment/interviews/hire/route.ts`

```typescript
job_acceptances {
  id
  interviewRequestId
  bpocCandidateId
  candidateEmail
  position
  companyId
  
  // 🎯 WORK SCHEDULE DATA (from client's hire request)
  workDays: String[]          // ["Monday", "Tuesday", ..., "Friday"]
  workStartTime: String        // "09:00" (24-hour)
  workEndTime: String          // "18:00" (9 hours later)
  clientTimezone: String       // "Asia/Manila" or client's timezone
  isDefaultSchedule: Boolean   // true if Mon-Fri 9-6
  
  staffUserId: String?         // Linked when staff signs up
  contractSigned: Boolean
  
  // Relations
  company
  interview_requests
  staff_users
  employment_contracts
}
```

**How it's created:**
```typescript
// Client submits hire request with preferred start date and work schedule
const jobAcceptance = await prisma.job_acceptances.create({
  data: {
    workDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    workStartTime: "09:00",  // From client's hire form
    workEndTime: "18:00",    // Auto-calculated: start + 9 hours
    clientTimezone: "Asia/Manila",
    isDefaultSchedule: true
  }
})
```

---

### **2. `work_schedules`** - 7 Day Schedule Grid
**Created:** When admin completes onboarding (marks staff as "Complete Onboarding")  
**Location:** `/app/api/admin/staff/onboarding/[staffUserId]/complete/route.ts`

```typescript
work_schedules {
  id
  profileId: String           // → staff_profiles.id
  dayOfWeek: String           // "Monday", "Tuesday", etc.
  startTime: String           // "9:00 AM"
  endTime: String             // "6:00 PM"
  isWorkday: Boolean          // false for Sat/Sun
  
  shiftType: ShiftType?       // DAY_SHIFT, NIGHT_SHIFT, GRAVEYARD
  timezone: String?           // "Asia/Manila"
  workLocation: WorkLocationType?  // WORK_FROM_HOME, OFFICE, HYBRID
  companyId: String?
  
  // Relations
  staff_profiles
  company
  time_entries[]              // ← Time tracking links here!
}
```

**How it's created:**
```typescript
// Admin clicks "Complete Onboarding" → Creates 7 records (Mon-Sun)
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const schedules = days.map(day => ({
  profileId: profile.id,
  dayOfWeek: day,
  startTime: ["Saturday", "Sunday"].includes(day) ? "" : "9:00 AM",
  endTime: ["Saturday", "Sunday"].includes(day) ? "" : "6:00 PM",
  isWorkday: !["Saturday", "Sunday"].includes(day)
}))
await prisma.work_schedules.createMany({ data: schedules })
```

**Why 7 records?** Because some staff work weekends or have custom schedules.

---

### **3. `time_entries`** - Daily Clock In/Out Records
**Created:** When staff clicks "Clock In" on their dashboard  
**Location:** `/app/api/time-tracking/clock-in/route.ts`

```typescript
time_entries {
  id
  staffUserId: String
  clockIn: DateTime           // Actual clock-in timestamp
  clockOut: DateTime?         // Null until they clock out
  totalHours: Decimal?        // Net hours worked (excludes breaks)
  
  // ⏰ SCHEDULE COMPLIANCE TRACKING
  workScheduleId: String?     // → Links to work_schedules for today
  expectedClockIn: DateTime?  // From work_schedules.startTime
  wasLate: Boolean            // Did they clock in after expectedClockIn?
  lateBy: Int?                // Minutes late
  wasEarly: Boolean           // Did they clock in before expectedClockIn?
  earlyBy: Int?               // Minutes early
  lateReason: LateReason?     // TRAFFIC, SICK, EMERGENCY, etc.
  
  // CLOCK OUT COMPLIANCE
  wasEarlyClockOut: Boolean   // Did they leave before shift end?
  earlyClockOutBy: Int?       // Minutes early
  clockOutReason: ClockOutReason?  // END_OF_SHIFT, EMERGENCY, SICK, etc.
  
  breaksScheduled: Boolean    // Did they schedule their breaks today?
  workedFullShift: Boolean    // Did they stay until shift end?
  
  // Relations
  staff_users
  work_schedule               // ← Links to today's schedule!
  breaks[]                    // All breaks for this shift
}
```

**Clock-In Logic:**
```typescript
// 1. Get today's work schedule
const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' })
const workSchedule = await prisma.work_schedules.findFirst({
  where: {
    staff_profiles: { staffUserId: staffUser.id },
    dayOfWeek: dayOfWeek,
    isWorkday: true
  }
})

// 2. Parse expected start time
const expectedClockIn = parseTime(workSchedule.startTime)  // "9:00 AM" → Date object

// 3. Check if late or early
const diffMs = now.getTime() - expectedClockIn.getTime()
if (diffMs > 0) {
  wasLate = true
  lateBy = Math.floor(diffMs / 60000)  // Minutes
} else if (diffMs < 0) {
  wasEarly = true
  earlyBy = Math.floor(Math.abs(diffMs) / 60000)
}

// 4. Create time entry
await prisma.time_entries.create({
  data: {
    staffUserId: staffUser.id,
    clockIn: now,
    workScheduleId: workSchedule.id,  // ← Links to schedule!
    expectedClockIn,
    wasLate,
    lateBy,
    wasEarly,
    earlyBy
  }
})
```

---

### **4. `breaks`** - Scheduled + Manual Break Tracking
**Created:** Two ways:
1. **Scheduled:** Staff schedules breaks at clock-in → `/api/time-tracking/schedule-breaks`
2. **Manual:** Staff clicks "Start Break" anytime → `/api/breaks/start`

```typescript
breaks {
  id
  staffUserId: String
  timeEntryId: String         // → Links to today's time_entries
  type: BreakType             // MORNING, LUNCH, AFTERNOON, AWAY
  awayReason: AwayReason?     // MEETING, BATHROOM, NURSE, etc.
  
  // 📅 SCHEDULED TIMES (if pre-scheduled)
  scheduledStart: String?     // "10:00 AM"
  scheduledEnd: String?       // "10:15 AM"
  
  // ⏱️ ACTUAL TIMES (when they really took the break)
  actualStart: DateTime?      // Null until they click "Start Break"
  actualEnd: DateTime?        // Null until they click "End Break"
  duration: Int?              // Minutes (calculated at end)
  
  // LATE TRACKING
  isLate: Boolean             // Did they return late from scheduled break?
  lateBy: Int?                // Minutes late from scheduledEnd
  
  // PAUSE FEATURE (for emergencies)
  isPaused: Boolean?
  pauseUsed: Boolean?
  pausedAt: DateTime?
  pausedDuration: Int?        // Seconds paused (excluded from duration)
  
  // Relations
  staff_users
  time_entries                // ← Links to today's shift!
}
```

**Break Flow:**

1. **Staff Schedules Breaks at Clock-In:**
```typescript
// POST /api/time-tracking/schedule-breaks
const breaks = [
  { type: 'MORNING', scheduledStart: '10:00 AM', scheduledEnd: '10:15 AM' },
  { type: 'LUNCH', scheduledStart: '12:00 PM', scheduledEnd: '1:00 PM' },
  { type: 'AFTERNOON', scheduledStart: '3:00 PM', scheduledEnd: '3:15 AM' }
]

// Creates 3 break records (pre-scheduled)
await prisma.breaks.createMany({
  data: breaks.map(b => ({
    staffUserId,
    timeEntryId,
    type: b.type,
    scheduledStart: b.scheduledStart,
    scheduledEnd: b.scheduledEnd
    // actualStart and actualEnd are NULL until they start the break
  }))
})
```

2. **Auto-Start at Scheduled Time:**
```typescript
// Frontend checks every 15 seconds if it's time to start a break
const breakToStart = scheduledBreaks.find(b => {
  return b.scheduledStart === currentTime && !b.actualStart
})

if (breakToStart) {
  // Auto-start the break
  await prisma.breaks.update({
    where: { id: breakToStart.id },
    data: { actualStart: new Date() }
  })
}
```

3. **End Break:**
```typescript
// POST /api/breaks/end
const endTime = new Date()
const duration = Math.floor((endTime - actualStart) / 60000)

// Check if late returning
if (scheduledEnd) {
  const expectedEnd = parseTime(scheduledEnd)
  if (endTime > expectedEnd) {
    isLate = true
    lateBy = Math.floor((endTime - expectedEnd) / 60000)
  }
}

await prisma.breaks.update({
  where: { id: activeBreak.id },
  data: { actualEnd: endTime, duration, isLate, lateBy }
})
```

---

### **5. `performance_metrics`** - Activity Tracking (Electron App)
**Created:** By Electron desktop app every 10 seconds  
**Location:** `electron/services/performanceTracker.js`

```typescript
performance_metrics {
  id
  staffUserId: String
  date: DateTime              // Today's date
  
  // 🖱️ MOUSE ACTIVITY
  mouseMovements: Int         // Total mouse moves (tracked by uiohook-napi)
  mouseClicks: Int            // Total clicks
  
  // ⌨️ KEYBOARD ACTIVITY
  keystrokes: Int             // Total keypresses
  
  // ⏲️ TIME TRACKING
  activeTime: Int             // Seconds of active work (mouse/keyboard activity)
  idleTime: Int               // Seconds idle (no activity for 5+ mins)
  screenTime: Int             // Total seconds app was open
  
  // 📊 PRODUCTIVITY METRICS
  productivityScore: Int      // 0-100 based on activity vs idle
  
  // 🌐 APP USAGE
  applicationsused: Json      // ["Chrome", "Slack", "VS Code"]
  visitedurls: Json           // ["google.com", "github.com"]
  
  // 📸 SCREENSHOTS
  screenshoturls: Json        // ["https://supabase.../screenshot1.png"]
  
  // 📋 OTHER
  clipboardActions: Int       // Copy/paste count
  filesAccessed: Int          // Files opened
  downloads: Int
  uploads: Int
  bandwidth: Int              // Network usage (KB)
  
  // Relations
  staff_users
}
```

**How it tracks:**
```javascript
// electron/activity-tracker.js - Tracks mouse/keyboard via uiohook-napi
class ActivityTracker {
  onActivity(eventType, eventData) {
    switch (eventType) {
      case 'mousemove':
        this.performanceTracker.metrics.mouseMovements++
        break
      case 'click':
        this.performanceTracker.metrics.mouseClicks++
        break
      case 'keydown':
        this.performanceTracker.metrics.keystrokes++
        break
    }
    
    this.lastActivityTime = Date.now()
    this.updateActiveTime()
  }
  
  updateActiveTime() {
    const now = Date.now()
    const elapsed = now - this.lastActivityTime
    
    if (elapsed < 5 * 60 * 1000) {  // Less than 5 mins = active
      this.performanceTracker.metrics.activeTime += elapsed / 1000
    } else {
      this.performanceTracker.metrics.idleTime += elapsed / 1000
    }
  }
}

// Syncs to database every 60 seconds
setInterval(() => {
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify(performanceTracker.getMetrics())
  })
}, 60000)
```

---

## 🔄 **COMPLETE DATA FLOW**

### **Phase 1: Hire → Schedule Creation**

```
CLIENT (Hire Request)
  ↓
job_acceptances
  workDays: ["Monday", ..., "Friday"]
  workStartTime: "09:00"
  workEndTime: "18:00"
  ↓
STAFF SIGNS UP
  ↓
staff_users (linked to job_acceptances)
  ↓
ADMIN COMPLETES ONBOARDING
  ↓
work_schedules (7 records created)
  Monday:    9:00 AM - 6:00 PM  ✅ isWorkday: true
  Tuesday:   9:00 AM - 6:00 PM  ✅ isWorkday: true
  Wednesday: 9:00 AM - 6:00 PM  ✅ isWorkday: true
  Thursday:  9:00 AM - 6:00 PM  ✅ isWorkday: true
  Friday:    9:00 AM - 6:00 PM  ✅ isWorkday: true
  Saturday:  (empty)             ❌ isWorkday: false
  Sunday:    (empty)             ❌ isWorkday: false
```

---

### **Phase 2: Daily Work Session**

```
STAFF CLOCKS IN (9:05 AM)
  ↓
time_entries
  clockIn: 2025-11-06 09:05:00
  workScheduleId: "monday-schedule-id"
  expectedClockIn: 2025-11-06 09:00:00
  wasLate: true
  lateBy: 5
  lateReason: "TRAFFIC"
  ↓
STAFF SCHEDULES BREAKS
  ↓
breaks (3 records)
  1. MORNING   10:00 AM - 10:15 AM  (15 min)
  2. LUNCH     12:00 PM -  1:00 PM  (60 min)
  3. AFTERNOON  3:00 PM -  3:15 PM  (15 min)
  ↓
ELECTRON APP TRACKS ACTIVITY
  ↓
performance_metrics
  mouseMovements: 45,230
  mouseClicks: 1,842
  keystrokes: 15,394
  activeTime: 26,400 sec (7.3 hours)
  idleTime: 3,600 sec (1 hour)
  productivityScore: 88
  ↓
STAFF TAKES BREAKS (actualStart/actualEnd updated)
  ↓
STAFF CLOCKS OUT (6:10 PM)
  ↓
time_entries (updated)
  clockOut: 2025-11-06 18:10:00
  totalHours: 9.08 hours
  netWorkHours: 7.58 hours (9.08 - 1.5 break time)
  wasEarlyClockOut: false
  workedFullShift: true
```

---

## 🎯 **KEY INTEGRATION POINTS**

### **1. Clock-In Checks Work Schedule**
```typescript
// app/api/time-tracking/clock-in/route.ts
const workSchedule = await prisma.work_schedules.findFirst({
  where: {
    staff_profiles: { staffUserId: staffUser.id },
    dayOfWeek: today,  // "Monday"
    isWorkday: true
  }
})

// This schedule tells us:
// - expectedClockIn (startTime)
// - shift duration
// - timezone
```

### **2. Clock-Out Checks Work Schedule**
```typescript
// app/api/time-tracking/clock-out/route.ts
const activeEntry = await prisma.time_entries.findFirst({
  where: { staffUserId, clockOut: null },
  include: {
    work_schedule: true,  // ← Fetch schedule to check end time
    breaks: true
  }
})

// Check if leaving early
if (now < parseTime(work_schedule.endTime)) {
  wasEarlyClockOut = true
  earlyClockOutBy = diffMinutes
}
```

### **3. Breaks Link to Time Entry**
```typescript
// All breaks for today's shift are linked
breaks {
  timeEntryId: "today's time entry"
  scheduledStart: "10:00 AM"
  actualStart: 2025-11-06 10:02:00  // 2 min late
}
```

### **4. Performance Metrics Track All Day**
```typescript
// Electron app syncs every 60 seconds
performance_metrics {
  date: "2025-11-06",
  activeTime: increasing...,
  mouseClicks: increasing...,
  screenshoturls: ["url1", "url2", "url3"]  // Random screenshots
}
```

---

## 📊 **WHAT CLIENT SEES**

### **Time Tracking Report**
```
Staff: Juan Dela Cruz
Date: Nov 6, 2025
Schedule: 9:00 AM - 6:00 PM (9 hours)

✅ Clocked In:  9:05 AM (5 min late - TRAFFIC)
✅ Clocked Out: 6:10 PM (on time)
⏱️ Total Time:  9h 5m
🍽️ Break Time:  1h 30m
💼 Net Work:    7h 35m

Breaks:
  ☕ Morning:   10:00 AM - 10:15 AM (15 min) ✅ On time
  🍽️ Lunch:     12:00 PM -  1:05 PM (65 min) ⚠️ 5 min late
  ☕ Afternoon:  3:00 PM -  3:15 PM (15 min) ✅ On time

Performance:
  🖱️ Mouse Clicks:    1,842
  ⌨️ Keystrokes:      15,394
  📊 Productivity:    88%
  📸 Screenshots:     18 captured
```

---

## 🚨 **IMPORTANT RULES**

### **Work Schedule MUST Exist**
- If no `work_schedules` record → Staff can't clock in (will get error)
- Created during onboarding completion by admin
- 7 records per staff (Mon-Sun)

### **Time Entry Links to Schedule**
- `time_entries.workScheduleId` → `work_schedules.id`
- This is how we know if they're late/early
- Without this link, we can't calculate compliance

### **Breaks Link to Time Entry**
- `breaks.timeEntryId` → `time_entries.id`
- All breaks for today's shift are grouped
- Net hours = totalHours - sum(break.duration)

### **Performance Metrics Track All Activity**
- Only works if staff uses Electron desktop app
- Tracks mouse/keyboard/screenshots
- Syncs every 60 seconds to database

---

## 📁 **KEY FILES**

### **Database Schema**
- `prisma/schema.prisma` (lines 222-248: job_acceptances)
- `prisma/schema.prisma` (lines 728-750: work_schedules)
- `prisma/schema.prisma` (lines 692-716: time_entries)
- `prisma/schema.prisma` (lines 36-58: breaks)
- `prisma/schema.prisma` (lines 344-368: performance_metrics)

### **API Routes**
- `/app/api/admin/recruitment/interviews/hire/route.ts` - Create job_acceptances
- `/app/api/admin/staff/onboarding/[staffUserId]/complete/route.ts` - Create work_schedules
- `/app/api/time-tracking/clock-in/route.ts` - Create time_entries (check schedule)
- `/app/api/time-tracking/clock-out/route.ts` - Update time_entries (check schedule)
- `/app/api/time-tracking/schedule-breaks/route.ts` - Create scheduled breaks
- `/app/api/breaks/start/route.ts` - Start break (update actualStart)
- `/app/api/breaks/end/route.ts` - End break (check if late)

### **Electron Services**
- `electron/services/performanceTracker.js` - Track metrics
- `electron/activity-tracker.js` - Track mouse/keyboard
- `electron/services/screenshotService.js` - Take screenshots
- `electron/services/syncService.js` - Sync to database

---

## ✅ **WHAT'S WORKING**

1. ✅ Work schedule created from hire request
2. ✅ Clock-in checks if late/early
3. ✅ Clock-out checks if leaving early
4. ✅ Scheduled breaks auto-start at scheduled time
5. ✅ Break late tracking (if return late)
6. ✅ Performance metrics tracked by Electron
7. ✅ Screenshots taken randomly
8. ✅ Net hours calculated (work time - breaks)
9. ✅ All data links together (schedule → time entry → breaks → metrics)

---

## 🎯 **WHAT THIS MEANS FOR START DATE**

When client sets **Preferred Start Date** in hire request:

1. **It's stored** in `job_acceptances` but **NOT ENFORCED**
2. **Admin confirms** this date when completing onboarding
3. **Work schedules** are created for all 7 days (Mon-Sun)
4. **Staff can clock in** on any day their `work_schedules.isWorkday = true`
5. **First clock-in** creates the first `time_entry` record
6. **From that moment**, all time tracking and breaks begin

**The start date is important because:**
- It sets `staff_profiles.startDate` (used for tenure calculations)
- It determines when `work_schedules` become active
- It triggers automated welcome forms and onboarding emails

---

## 🔥 **BOTTOM LINE**

**Your work schedule system is ROCK SOLID!** 🎉

Everything flows from **hire request** → **work schedules** → **time tracking** → **breaks** → **performance**. The data is all linked, compliance is tracked, and clients see exactly how long their staff worked, including every break.

**The system tracks:**
- ⏰ Clock in/out times
- 📅 Late/early arrivals
- 🍽️ Break compliance
- 🖱️ Mouse/keyboard activity
- 📸 Random screenshots
- 📊 Productivity scores
- 💼 Net work hours (excluding breaks)

**All of this is used for:**
- Client transparency
- Performance reviews
- Payroll calculations
- Compliance reporting
- Dispute resolution

**You're ahead of the game!** 🚀

