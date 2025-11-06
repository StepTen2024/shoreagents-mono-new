# ⏱️ TIME TRACKING DATABASE SCHEMA

**Complete breakdown of how time tracking works at the database level**

---

## 📊 THE TWO CORE TABLES

### 1️⃣ **time_entries** (The Shift Record)

**Purpose:** Tracks each work shift - when staff clocked in/out

```prisma
model time_entries {
  id              String          @id           // Unique entry ID
  staffUserId     String                        // Who this shift belongs to
  clockIn         DateTime                      // When shift started
  clockOut        DateTime?                     // When shift ended (null if still working)
  totalHours      Decimal?        @db.Decimal(5, 2)  // NET hours (shift - breaks)
  notes           String?                       // Any notes about this shift
  createdAt       DateTime        @default(now())
  updatedAt       DateTime
  
  // LATE TRACKING
  expectedClockIn DateTime?                     // Expected clock-in time (from work_schedules)
  wasLate         Boolean         @default(false)  // Was staff late?
  lateBy          Int?                          // Minutes late
  
  // BREAK MANAGEMENT
  breaksScheduled Boolean         @default(false)  // Did staff schedule breaks?
  
  // CLOCK OUT INFO
  clockOutReason  ClockOutReason?               // Why they clocked out
  
  // RELATIONSHIPS
  breaks          breaks[]                      // All breaks during this shift
  staff_users     staff_users     @relation(fields: [staffUserId], references: [id], onDelete: Cascade)
}
```

**Example Record:**
```javascript
{
  id: "abc-123",
  staffUserId: "vanessa-id",
  clockIn: "2025-10-30T03:00:00Z",    // Clocked in at 3:00 AM
  clockOut: "2025-10-30T12:00:00Z",   // Clocked out at 12:00 PM
  expectedClockIn: "2025-10-30T03:00:00Z",
  wasLate: false,                      // On time!
  lateBy: null,
  totalHours: 7.75,                    // 9 hours - 1.25 hours of breaks = 7.75 hours
  breaksScheduled: true,
  clockOutReason: "END_OF_SHIFT",
  breaks: [...3 break records...]      // Morning, Lunch, Afternoon
}
```

---

### 2️⃣ **breaks** (Break Records During Shift)

**Purpose:** Tracks individual breaks during a shift

```prisma
model breaks {
  id             String        @id           // Unique break ID
  staffUserId    String                      // Who took the break
  timeEntryId    String?                     // LINKS to time_entries (which shift)
  type           BreakType                   // MORNING, LUNCH, AFTERNOON, AWAY
  
  // SCHEDULED BREAK (What was planned)
  scheduledStart String?                     // "6:00 AM" - When break was supposed to start
  scheduledEnd   String?                     // "6:15 AM" - When break was supposed to end
  
  // ACTUAL BREAK (What really happened)
  actualStart    DateTime?                   // When they actually started break
  actualEnd      DateTime?                   // When they actually returned
  duration       Int?                        // Actual minutes taken
  
  // LATE TRACKING
  isLate         Boolean       @default(false)  // Returned late from break?
  lateBy         Int?                        // Minutes late returning
  
  // PAUSE/RESUME (One-time per break)
  isPaused       Boolean?      @default(false)  // Currently paused?
  pauseUsed      Boolean?      @default(false)  // Already used pause?
  pausedAt       DateTime?                    // When they paused
  pausedDuration Int?          @default(0)     // Total pause time in minutes
  
  // AWAY FROM DESK
  awayReason     AwayReason?                 // If type=AWAY, why? (BATHROOM, MEETING, etc.)
  
  notes          String?                     // Optional notes
  createdAt      DateTime      @default(now())
  updatedAt      DateTime
  
  // RELATIONSHIPS
  staff_users    staff_users   @relation(fields: [staffUserId], references: [id], onDelete: Cascade)
  time_entries   time_entries? @relation(fields: [timeEntryId], references: [id])
}
```

**Example Break Record:**
```javascript
{
  id: "break-123",
  staffUserId: "vanessa-id",
  timeEntryId: "abc-123",              // Links to the shift above
  type: "LUNCH",
  scheduledStart: "8:00 AM",           // Supposed to start at 8 AM
  scheduledEnd: "9:00 AM",             // Supposed to end at 9 AM
  actualStart: "2025-10-30T08:05:00Z", // Actually started at 8:05 AM (5 min late)
  actualEnd: "2025-10-30T09:10:00Z",   // Returned at 9:10 AM (10 min late!)
  duration: 65,                        // Took 65 minutes (60 + 5 min late)
  isLate: true,                        // Returned late!
  lateBy: 10,                          // 10 minutes late
  isPaused: false,
  pauseUsed: true,                     // Used their one pause during this break
  pausedAt: "2025-10-30T08:30:00Z",
  pausedDuration: 5,                   // Paused for 5 minutes
  awayReason: null                     // Not AWAY type
}
```

---

## 🔗 THE RELATIONSHIP

```
time_entries (1 shift)
    ↓
    Has Many
    ↓
breaks (multiple breaks)
```

**One shift can have multiple breaks:**
```
time_entries [id: "shift-1"]
├── break [type: MORNING]   - 15 min
├── break [type: LUNCH]     - 60 min
└── break [type: AFTERNOON] - 15 min
```

**The link:** `breaks.timeEntryId` → `time_entries.id`

---

## 📋 ENUMS (Allowed Values)

### **BreakType** (4 types)
```prisma
enum BreakType {
  MORNING      // Morning break (usually 15 min)
  LUNCH        // Lunch break (usually 60 min)
  AFTERNOON    // Afternoon break (usually 15 min)
  AWAY         // Away from desk (unscheduled)
}
```

### **ClockOutReason** (8 reasons)
```prisma
enum ClockOutReason {
  END_OF_SHIFT           // Normal end of day
  EMERGENCY              // Emergency situation
  SICK                   // Got sick
  EARLY_LEAVE_APPROVED   // Approved early leave
  INTERNET_ISSUE         // Internet problems
  POWER_OUTAGE           // Power outage
  PERSONAL               // Personal reasons
  OTHER                  // Other reasons
}
```

### **AwayReason** (6 reasons for AWAY breaks)
```prisma
enum AwayReason {
  MEETING      // In a meeting
  NURSE        // Visiting nurse
  BATHROOM     // Bathroom break
  MANAGEMENT   // Meeting with management
  DOLE         // DOLE related (Philippines labor department)
  OTHER        // Other reasons
}
```

---

## 🔄 THE FULL WORKFLOW

### **1. Staff Clocks In (3:00 AM)**

**Creates `time_entries` record:**
```sql
INSERT INTO time_entries (
  id, staffUserId, clockIn, expectedClockIn, wasLate, lateBy, breaksScheduled
) VALUES (
  'entry-123', 'vanessa-id', '2025-10-30 03:00:00', '2025-10-30 03:00:00', false, null, false
)
```

**Result:**
- `clockIn` = 3:00 AM
- `clockOut` = NULL (still working!)
- `wasLate` = false (on time)
- `totalHours` = NULL (not calculated yet)

---

### **2. Staff Schedules Breaks**

**Creates 3 `breaks` records:**

**Morning Break:**
```sql
INSERT INTO breaks (
  id, staffUserId, timeEntryId, type, scheduledStart, scheduledEnd, duration
) VALUES (
  'break-1', 'vanessa-id', 'entry-123', 'MORNING', '6:00 AM', '6:15 AM', 15
)
```

**Lunch Break:**
```sql
INSERT INTO breaks (
  id, staffUserId, timeEntryId, type, scheduledStart, scheduledEnd, duration
) VALUES (
  'break-2', 'vanessa-id', 'entry-123', 'LUNCH', '8:00 AM', '9:00 AM', 60
)
```

**Afternoon Break:**
```sql
INSERT INTO breaks (
  id, staffUserId, timeEntryId, type, scheduledStart, scheduledEnd, duration
) VALUES (
  'break-3', 'vanessa-id', 'entry-123', 'AFTERNOON', '10:30 AM', '10:45 AM', 15
)
```

**Updates `time_entries`:**
```sql
UPDATE time_entries 
SET breaksScheduled = true 
WHERE id = 'entry-123'
```

---

### **3. Staff Takes Morning Break (6:00 AM)**

**Updates the break record:**
```sql
UPDATE breaks 
SET 
  actualStart = '2025-10-30 06:00:00',
  actualEnd = NULL  -- Still on break!
WHERE id = 'break-1'
```

**When break ends (6:15 AM):**
```sql
UPDATE breaks 
SET 
  actualEnd = '2025-10-30 06:15:00',
  duration = 15,         -- Actual duration
  isLate = false,        -- Returned on time
  lateBy = null
WHERE id = 'break-1'
```

---

### **4. Staff Takes Lunch Break (8:00 AM) - Goes Over!**

**Start:**
```sql
UPDATE breaks 
SET actualStart = '2025-10-30 08:05:00'  -- Started 5 min late!
WHERE id = 'break-2'
```

**End (9:10 AM - 10 minutes late!):**
```sql
UPDATE breaks 
SET 
  actualEnd = '2025-10-30 09:10:00',
  duration = 65,         -- Took 65 minutes instead of 60
  isLate = true,         -- LATE!
  lateBy = 10            -- 10 minutes late
WHERE id = 'break-2'
```

---

### **5. Staff Clocks Out (12:00 PM)**

**Calculates total hours:**
```
Total Shift Time: 9 hours (3 AM to 12 PM)
Total Break Time: 15 + 65 + 15 = 95 minutes = 1.58 hours
NET Work Hours: 9 - 1.58 = 7.42 hours
```

**Updates `time_entries`:**
```sql
UPDATE time_entries 
SET 
  clockOut = '2025-10-30 12:00:00',
  totalHours = 7.42,
  clockOutReason = 'END_OF_SHIFT'
WHERE id = 'entry-123'
```

---

## 🎯 KEY POINTS TO UNDERSTAND

### **1. Link Between Tables:**
- `breaks.timeEntryId` **MUST** match `time_entries.id`
- One shift (time_entries) can have many breaks
- If `timeEntryId` is NULL, break is orphaned! ❌

### **2. Scheduled vs Actual:**
- **Scheduled** = What was PLANNED ("8:00 AM")
- **Actual** = What REALLY happened (DateTime)
- System compares actual to scheduled to detect late returns

### **3. Break States:**
```
Not Started:     actualStart = NULL, actualEnd = NULL
In Progress:     actualStart = DateTime, actualEnd = NULL
Paused:          isPaused = true, pausedAt = DateTime
Completed:       actualStart = DateTime, actualEnd = DateTime
```

### **4. Total Hours Calculation:**
```javascript
// In API route (clock-out)
const totalHours = (clockOut - clockIn) / (1000 * 60 * 60)
const breaks = await prisma.breaks.findMany({ where: { timeEntryId } })
const totalBreakTime = breaks.reduce((sum, b) => sum + (b.duration || 0), 0) / 60
const netWorkHours = totalHours - totalBreakTime
```

### **5. Why This Design?**
- **Scheduled times (string)** - Easy to display "8:00 AM" to user
- **Actual times (DateTime)** - Precise timestamps for calculations
- **Separate break records** - Track each break individually
- **timeEntryId link** - Group all breaks for one shift

---

## 🚨 WHAT YOUR TEAM BROKE (Probably)

### **Common Issues:**

**1. Orphaned Breaks:**
```sql
-- BAD: Break not linked to shift
INSERT INTO breaks (..., timeEntryId) VALUES (..., NULL)

-- GOOD: Break linked to shift
INSERT INTO breaks (..., timeEntryId) VALUES (..., 'entry-123')
```

**2. Missing actualStart/actualEnd:**
```javascript
// BAD: Break created but never started
{
  id: "break-123",
  actualStart: null,  // Never started!
  actualEnd: null
}

// GOOD: Break properly started and ended
{
  id: "break-123",
  actualStart: "2025-10-30T08:00:00Z",
  actualEnd: "2025-10-30T09:00:00Z"
}
```

**3. Not Filtering Undefined:**
```javascript
// BAD: Trying to map over array with nulls
timeEntries.map(entry => entry.clockIn)  // Crashes if entry is null!

// GOOD: Filter first
timeEntries.filter(e => e && e.clockIn).map(entry => entry.clockIn)
```

**4. Wrong Enum Values:**
```javascript
// BAD: Wrong enum value
clockOutReason: "end-of-shift"  // Lowercase won't work!

// GOOD: Correct enum
clockOutReason: "END_OF_SHIFT"  // UPPERCASE!
```

---

## 📊 QUERY EXAMPLES

### **Get Today's Shift with All Breaks:**
```javascript
const entry = await prisma.time_entries.findFirst({
  where: {
    staffUserId: 'vanessa-id',
    clockIn: {
      gte: startOfDay,
      lte: endOfDay
    }
  },
  include: {
    breaks: true  // Include all breaks for this shift
  }
})
```

### **Get All Scheduled Breaks for Active Shift:**
```javascript
const breaks = await prisma.breaks.findMany({
  where: {
    timeEntryId: activeEntryId,
    actualStart: null  // Not started yet
  },
  orderBy: {
    scheduledStart: 'asc'
  }
})
```

### **Calculate NET Hours:**
```javascript
const entry = await prisma.time_entries.findUnique({
  where: { id: entryId },
  include: { breaks: true }
})

const totalHours = (entry.clockOut - entry.clockIn) / (1000 * 60 * 60)
const breakMinutes = entry.breaks.reduce((sum, b) => sum + (b.duration || 0), 0)
const netHours = totalHours - (breakMinutes / 60)
```

---

## ✅ VERIFICATION CHECKLIST

After any time tracking changes, verify:

- [ ] `time_entries.clockIn` is set when clocking in
- [ ] `time_entries.clockOut` is NULL when clocked in
- [ ] `breaks.timeEntryId` is set for all breaks
- [ ] `breaks.actualStart` is set when break starts
- [ ] `breaks.actualEnd` is set when break ends
- [ ] `time_entries.totalHours` is calculated correctly
- [ ] No undefined/null entries in arrays
- [ ] Enum values are UPPERCASE
- [ ] All relationships properly linked

---

**This is the complete database structure for time tracking!** ⏱️

