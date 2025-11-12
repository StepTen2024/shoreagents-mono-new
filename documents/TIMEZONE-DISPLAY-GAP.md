# 🚨 TIMEZONE DISPLAY GAP - CLIENT vs ADMIN vs STAFF

## The Problem You Just Identified

**Client in Australia** creates interview request at **3:00 PM Brisbane time**.  
**Admin in Philippines** sees it as... what time?  
**Staff in Philippines** needs to know when to show up... in what time?

---

## 🔍 **WHAT WE FOUND**

### ✅ **What WORKS:**
1. Client profile HAS timezone field: `client_profiles.timezone`
2. Client frontend SENDS timezone with interview requests
3. Staff timezone tracking works (Asia/Manila for shift detection)

### ❌ **What's BROKEN:**

#### **1. Interview Request Times - NO TIMEZONE STORED!**

**Frontend sends:**
```typescript
// app/client/talent-pool/[id]/page.tsx:951
{
  preferred_times: [
    {
      datetime: "2025-11-07T09:00",
      timezone: "Australia/Brisbane",
      timezoneDisplay: "Brisbane Time (AEST)"
    }
  ],
  client_timezone: "Australia/Brisbane"  // ← Sent but NOT stored!
}
```

**Backend stores:**
```typescript
// app/api/client/interviews/request/route.ts:56
await prisma.interview_requests.create({
  data: {
    preferredTimes: preferred_times,  // ← Stores the array with timezone
    // ❌ BUT: client_timezone is IGNORED!
    // ❌ NO separate clientTimezone field in interview_requests!
  }
})
```

**Schema:**
```prisma
model interview_requests {
  id                   String   @id
  preferredTimes       Json     // ← Has timezone in JSON
  // ❌ NO clientTimezone field!
  workSchedule         Json?    // ← Has timezone in JSON
}
```

---

## 🔥 **THE IMPACT**

### Scenario: Client in Brisbane books interview

**Client Time:** Thursday 3:00 PM Brisbane (AEST = UTC+10)  
**Manila Time:** Thursday 1:00 PM Manila (PHT = UTC+8)  
**UTC Time:** Thursday 5:00 AM UTC

#### **Current Behavior (BROKEN):**

1. **Client sees:** "Thursday 3:00 PM" ✅ Correct (in their timezone)
2. **Admin sees:** "Thursday 3:00 PM" ❌ WRONG! (Should be 1:00 PM Manila)
3. **Staff sees:** "Thursday 3:00 PM" ❌ WRONG! (Should be 1:00 PM Manila)

**Result:** Staff shows up 2 hours late because they thought 3 PM meant Manila time!

---

## 📊 **DETAILED BREAKDOWN**

### **1. Hire Request Workflow**

```
CLIENT (Brisbane, UTC+10)
"I want staff to start at 9:00 AM"
↓
❓ Question: 9:00 AM in WHOSE timezone?
   - Client's 9:00 AM Brisbane? (= 7:00 AM Manila)
   - Staff's 9:00 AM Manila? (= 11:00 AM Brisbane)
↓
CURRENT: Assumes 9:00 AM is a "universal" time
↓
ADMIN sees: "9:00 AM" (no timezone context)
↓
STAFF schedule created: 9:00 AM Manila
↓
❌ MISMATCH if client meant Brisbane time!
```

### **2. Interview Scheduling**

```
CLIENT schedules interview
"Thursday 3:00 PM my time (Brisbane)"
↓
Stored in DB: { datetime: "2025-11-07T15:00", timezone: "Australia/Brisbane" }
↓
ADMIN views in /admin/recruitment?tab=interviews
Shows: "Thursday 3:00 PM"
↓
❌ Admin doesn't know if that's Brisbane or Manila time!
↓
Admin schedules Zoom call for "3:00 PM"
↓
❌ Client joins at Brisbane 3 PM, Admin waits at Manila 3 PM
↓
❌ NO ONE SHOWS UP!
```

---

## ✅ **THE FIX NEEDED**

### **Part 1: Schema Changes**

Add `clientTimezone` to relevant tables:

```prisma
model interview_requests {
  // ... existing fields
  preferredTimes       Json
  clientTimezone       String?  // ← NEW! "Australia/Brisbane", "UTC", etc.
  workSchedule         Json?
}

model job_acceptances {
  // ... existing fields
  clientTimezone       String   @default("UTC")  // ← ALREADY EXISTS! ✅
}
```

### **Part 2: API Changes**

#### A. Store client timezone when creating interview request

```typescript
// app/api/client/interviews/request/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { 
    bpoc_candidate_id, 
    preferred_times, 
    client_notes,
    client_timezone  // ← ACCEPT this!
  } = body
  
  // Get client profile to use as fallback
  const clientUser = await prisma.client_users.findUnique({
    where: { authUserId: session.user.id },
    include: { client_profiles: true }
  })
  
  const effectiveTimezone = client_timezone 
    || clientUser.client_profiles?.timezone 
    || "UTC"
  
  await prisma.interview_requests.create({
    data: {
      preferredTimes: preferred_times,
      clientTimezone: effectiveTimezone,  // ← STORE IT!
      // ... rest
    }
  })
}
```

#### B. Convert times for admin display

```typescript
// app/api/admin/recruitment/interviews/route.ts
export async function GET() {
  const interviews = await prisma.interview_requests.findMany({
    include: {
      client_users: {
        include: { client_profiles: true }
      }
    }
  })
  
  // Format for admin view (convert to Manila time)
  const formatted = interviews.map(interview => {
    const clientTz = interview.clientTimezone || "UTC"
    const adminTz = "Asia/Manila"
    
    // Convert preferredTimes from client timezone to Manila
    const convertedTimes = interview.preferredTimes.map(time => {
      return convertTimezone(time.datetime, clientTz, adminTz)
    })
    
    return {
      ...interview,
      preferredTimes: interview.preferredTimes,  // Original (for reference)
      preferredTimesInAdminTz: convertedTimes,   // ← Converted for display!
      clientTimezone: clientTz,
      adminTimezone: adminTz
    }
  })
  
  return NextResponse.json({ interviews: formatted })
}
```

### **Part 3: Timezone Helper Functions**

```typescript
// lib/timezone-helpers.ts

/**
 * Convert a datetime from one timezone to another
 */
export function convertTimezone(
  datetime: string,  // "2025-11-07T15:00"
  fromTz: string,    // "Australia/Brisbane"
  toTz: string       // "Asia/Manila"
): {
  datetime: string,
  displayTime: string
} {
  // Parse datetime in source timezone
  const date = new Date(datetime)
  
  // Format in target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: toTz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
  
  return {
    datetime: date.toISOString(),
    displayTime: formatter.format(date)
  }
}

/**
 * Format time with timezone label for display
 */
export function formatTimeWithTimezone(
  datetime: string,
  timezone: string,
  viewerTimezone: string
): string {
  if (timezone === viewerTimezone) {
    // Same timezone - just show time
    return `${datetime} (your time)`
  } else {
    // Different timezone - show both
    const converted = convertTimezone(datetime, timezone, viewerTimezone)
    return `${datetime} ${timezone} (${converted.displayTime} your time)`
  }
}
```

### **Part 4: Frontend Display**

#### Admin View:
```typescript
// app/admin/recruitment/page.tsx

{interview.preferredTimes.map((time, idx) => (
  <div key={idx}>
    {/* Show client's time */}
    <p className="text-sm text-muted-foreground">
      Client time: {time.datetime} {interview.clientTimezone}
    </p>
    
    {/* Show converted Manila time */}
    <p className="text-base font-semibold">
      Manila time: {time.convertedDatetime} PHT
      {interview.clientTimezone !== 'Asia/Manila' && (
        <Badge variant="outline" className="ml-2">
          Converted from {interview.clientTimezone}
        </Badge>
      )}
    </p>
  </div>
))}
```

---

## 🎯 **SUMMARY OF ISSUES**

### **1. No Client Timezone Stored**
- ❌ `interview_requests` doesn't store `clientTimezone`
- ✅ `job_acceptances` DOES have `clientTimezone`
- ❌ Causes confusion in interview scheduling

### **2. No Timezone Conversion**
- ❌ Admin sees times in client's timezone (without knowing)
- ❌ Staff sees times in client's timezone (without knowing)
- ❌ No indication of timezone differences

### **3. Work Schedule Ambiguity**
- ❌ When client says "9:00 AM", we don't know whose timezone
- ❌ `workSchedule.workStartTime` has no timezone context
- ✅ `job_acceptances.clientTimezone` exists but not always used

---

## 🚀 **IMPLEMENTATION PRIORITY**

### **Phase 1: Critical (Now)**
1. Add `clientTimezone` to `interview_requests` schema
2. Update interview request API to store client timezone
3. Add timezone conversion helpers
4. Display converted times in admin interview view

### **Phase 2: Important (Soon)**
1. Add timezone indicators in all time displays
2. Show "your time" vs "client time" labels
3. Convert work schedule times for admin view
4. Add timezone selection in client profile

### **Phase 3: Nice-to-Have (Later)**
1. Auto-detect client timezone from browser
2. Show multiple timezone options when scheduling
3. Calendar integration with proper timezone support
4. Email notifications with timezone-aware times

---

## 📝 **CURRENT STATE vs DESIRED STATE**

### **Interview Request Times**

| Aspect | Current | Desired |
|--------|---------|---------|
| Client creates at 3 PM Brisbane | Stored as "15:00" | Stored as "15:00 Brisbane" |
| Admin views | Shows "15:00" (ambiguous) | Shows "13:00 Manila (3 PM Brisbane)" |
| Staff views | Shows "15:00" (ambiguous) | Shows "13:00 Manila (3 PM Brisbane)" |
| Timezone stored | ❌ No | ✅ Yes |
| Conversion | ❌ No | ✅ Yes |

### **Work Schedule Times**

| Aspect | Current | Desired |
|--------|---------|---------|
| Client says "9 AM start" | Assumed Manila time | Clarify: "9 AM your time or Manila?" |
| Stored in DB | "09:00 AM" (ambiguous) | "09:00 Brisbane → 07:00 Manila" |
| Admin sees | "09:00 AM" | "09:00 AM Manila (11 AM Brisbane)" |
| Staff sees | "09:00 AM Manila" ✅ | "09:00 AM Manila" ✅ |

---

## ✅ **CONCLUSION**

Your intuition was **100% CORRECT!**

We have:
- ✅ Client timezone in profile
- ✅ Staff timezone in profile (Asia/Manila)
- ✅ Shift tracking with timezone awareness
- ❌ **NO timezone conversion for interview/schedule display**
- ❌ **NO storage of client timezone in interview_requests**
- ❌ **NO "your time vs their time" labeling**

**This is a CRITICAL gap that will cause:**
- Missed interviews
- Confused scheduling
- Staff showing up at wrong times
- Client frustration

**Priority: HIGH - Fix this ASAP!** 🔥

