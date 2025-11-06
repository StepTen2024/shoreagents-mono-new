# 📊 RECRUITMENT → SHIFT TRACKING FLOW

## Complete Flow: How Client's Hire Request Becomes Time Tracking

This document shows how the **9:00 AM start time and Monday-Friday schedule** from the hire request flows through the entire system to connect with our **timezone/shift tracking system**.

---

## 🔄 **THE COMPLETE FLOW**

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT SIDE                                   │
└─────────────────────────────────────────────────────────────────────┘

1️⃣ **CLIENT REQUESTS TO HIRE** (Where you are now!)
   Location: /client/recruitment?tab=interviews
   Screen: "Request to Hire Candidate" modal
   
   Data Collected:
   ✅ preferredStartDate: "11/15/2025"
   ✅ workSchedule: {
        workDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        workStartTime: "09:00 AM"
        isMonToFri: true
        hasCustomHours: false
      }
   
   ↓ POST /api/client/interviews/hire-request
   
   Saves to: interview_requests table
   ├─ status: "HIRE_REQUESTED"
   ├─ clientPreferredStart: 2025-11-15
   ├─ workSchedule: { workDays, workStartTime, etc. }  ← 🔥 Stored as JSON
   └─ hireRequestedAt: NOW()

---

┌─────────────────────────────────────────────────────────────────────┐
│                        ADMIN SIDE                                    │
└─────────────────────────────────────────────────────────────────────┘

2️⃣ **ADMIN SENDS JOB OFFER**
   Location: /admin/recruitment?tab=interviews
   Screen: Clicks "Send Job Offer" on HIRE_REQUESTED interview
   
   ↓ POST /api/admin/recruitment/interviews/hire
   
   Creates: job_acceptances table
   ├─ interviewRequestId: (links back)
   ├─ candidateEmail: "candidate@email.com"
   ├─ position: "Admin Support"
   ├─ companyId: "xxx"
   ├─ workDays: "["Monday","Tuesday","Wednesday","Thursday","Friday"]"
   ├─ workStartTime: "09:00 AM"  ← 🔥 From client's workSchedule
   ├─ workEndTime: "18:00"        ← Auto-calculated (start + 9 hours)
   ├─ clientTimezone: "Asia/Manila"
   └─ isDefaultSchedule: true
   
   Updates: interview_requests
   └─ status: "OFFER_SENT"

---

3️⃣ **CANDIDATE ACCEPTS OFFER**
   Location: Candidate clicks email link
   
   Candidate creates account as staff_users
   ├─ email: "candidate@email.com"
   ├─ name: "Kevin"
   └─ role: "STAFF"
   
   Staff completes 9-step onboarding...

---

4️⃣ **ADMIN COMPLETES ONBOARDING**
   Location: /admin/staff/onboarding/[staffUserId]
   Screen: Admin clicks "Complete Onboarding" after verifying all 9 sections
   
   Form Data:
   ✅ companyId: "xxx"
   ✅ startDate: "2025-11-15"
   ✅ shiftTime: "9:00 AM - 6:00 PM"  ← 🔥 From job_acceptances
   ✅ currentRole: "Admin Support"
   ✅ salary: 30000
   
   ↓ POST /api/admin/staff/onboarding/[staffUserId]/complete
   
   Creates: staff_profiles table
   ├─ staffUserId: "xxx"
   ├─ companyId: "xxx"
   ├─ currentRole: "Admin Support"
   ├─ salary: 30000
   ├─ startDate: 2025-11-15
   ├─ employmentStatus: "PROBATIONARY"
   └─ timezone: "Asia/Manila"  ← 🔥 Set to Manila for Filipino staff

---

┌─────────────────────────────────────────────────────────────────────┐
│             🌙 TIMEZONE/SHIFT TRACKING CONNECTION 🌙                │
└─────────────────────────────────────────────────────────────────────┘

5️⃣ **WORK SCHEDULES CREATED** ← 🔥 THIS IS WHERE IT CONNECTS!
   
   Same API: POST /api/admin/staff/onboarding/[staffUserId]/complete
   
   Creates: work_schedules table (7 rows, one per day)
   
   FOR EACH DAY OF THE WEEK:
   ├─ profileId: (staff_profiles.id)
   ├─ dayOfWeek: "Monday" / "Tuesday" / etc.
   ├─ startTime: "9:00 AM"   ← 🔥 From shiftTime (Mon-Fri)
   ├─ endTime: "6:00 PM"     ← 🔥 From shiftTime (Mon-Fri)
   ├─ isWorkday: true        ← Mon-Fri = true, Sat-Sun = false
   └─ shiftType: "DAY_SHIFT" (inferred from 9 AM start)
   
   Result: 7 rows in work_schedules
   - Monday:    9:00 AM - 6:00 PM (isWorkday: true)
   - Tuesday:   9:00 AM - 6:00 PM (isWorkday: true)
   - Wednesday: 9:00 AM - 6:00 PM (isWorkday: true)
   - Thursday:  9:00 AM - 6:00 PM (isWorkday: true)  ← 🌙 THIS IS THE KEY!
   - Friday:    9:00 AM - 6:00 PM (isWorkday: true)
   - Saturday:  "" (isWorkday: false)
   - Sunday:    "" (isWorkday: false)

---

┌─────────────────────────────────────────────────────────────────────┐
│              🚀 STAFF STARTS WORK - CLOCK IN 🚀                     │
└─────────────────────────────────────────────────────────────────────┘

6️⃣ **STAFF CLOCKS IN** (Uses our new timezone logic!)
   
   Location: Staff Electron app or /staff/time-tracking
   
   ↓ POST /api/time-tracking/clock-in
   
   🔍 Detection Process:
   
   A. Get staff timezone from staff_profiles
      └─ timezone: "Asia/Manila"  ← Set in step 4
   
   B. Get current time in Manila
      └─ nowInStaffTz = getStaffLocalTime("Asia/Manila")
      └─ Example: Friday 2:00 AM Manila time
   
   C. Detect shift day (handles night shift crossover!)
      └─ detectShiftDay(staffUserId, "Asia/Manila")
      └─ Checks: Is it Friday 2:00 AM? (Yes)
      └─ Checks: Did they have a night shift on Thursday?
      
      Query work_schedules:
      - Thursday: 9:00 AM - 6:00 PM (Not a night shift)
      - If it WAS 9:00 PM - 6:00 AM, it would say:
        → "This is Thursday's shift!" (even though it's Friday 2 AM)
   
   D. Get work schedule for the detected shift day
      └─ work_schedules WHERE dayOfWeek = "Thursday" (or Friday)
      └─ startTime: "9:00 AM"  ← 🔥 From original hire request!
      └─ endTime: "6:00 PM"
      └─ shiftType: "DAY_SHIFT"
   
   E. Calculate if late/early
      └─ expectedClockIn = createExpectedClockIn(shiftDate, "9:00 AM")
      └─ Compare nowInStaffTz with expectedClockIn
   
   F. Create time_entries record
      Creates: time_entries table
      ├─ staffUserId: "xxx"
      ├─ workScheduleId: (Thursday's work_schedule.id)
      ├─ clockIn: Friday 2:00 AM Manila time
      ├─ shiftDate: Thursday 2025-11-14  ← 🔥 Shift day, not calendar day!
      ├─ shiftDayOfWeek: "Thursday"       ← 🔥 For performance queries
      ├─ expectedClockIn: Thursday 9:00 AM
      ├─ wasLate: true
      ├─ lateBy: 300 minutes (5 hours late)
      └─ lateReason: "Traffic" (if provided)

---

7️⃣ **BREAKS & PERFORMANCE TRACKING** (Uses shift date!)
   
   When staff takes a break:
   ↓ POST /api/time-tracking/schedule-breaks
   
   Creates: breaks table
   ├─ staffUserId: "xxx"
   ├─ timeEntryId: (links to step 6)
   ├─ type: "LUNCH"
   ├─ scheduledStart: Friday 12:00 PM Manila
   ├─ shiftDate: Thursday 2025-11-14  ← 🔥 Inherited from time_entry
   └─ shiftDayOfWeek: "Thursday"      ← 🔥 Tracks to correct shift
   
   When Electron tracks activity:
   ↓ POST /api/analytics
   
   Creates/Updates: performance_metrics table
   ├─ staffUserId: "xxx"
   ├─ shiftDate: Thursday 2025-11-14  ← 🔥 From active time_entry
   ├─ shiftDayOfWeek: "Thursday"       ← 🔥 For reporting
   ├─ mouseMovements: 5000 → 5500     ← Increments, not replaces!
   ├─ keystrokes: 2000 → 2200         ← Cumulative
   ├─ applicationsused: [...old, ...new]  ← Merges arrays
   └─ visitedurls: [...old, ...new]       ← Merges arrays

---

## 🎯 **KEY CONNECTIONS TO YOUR HIRE FORM**

### Form Field → Database Journey:

1. **Start Time: "09:00 AM"**
   ```
   Client Form (Step 1)
   → interview_requests.workSchedule.workStartTime
   → job_acceptances.workStartTime
   → Admin Complete Onboarding shiftTime
   → work_schedules.startTime (for Mon-Fri)
   → Used in detectShiftDay() and expectedClockIn calculation
   ```

2. **Work Days: Monday-Friday**
   ```
   Client Form (Step 1)
   → interview_requests.workSchedule.workDays
   → job_acceptances.workDays (JSON array)
   → work_schedules (7 rows, Mon-Fri have times, Sat-Sun empty)
   → Used to determine which days are workdays
   ```

3. **End Time: "6:00 PM" (Auto-calculated)**
   ```
   Client Form calculates: startTime + 9 hours
   → interview_requests.workSchedule (implied)
   → job_acceptances.workEndTime
   → work_schedules.endTime (for Mon-Fri)
   → Used to detect early clock-out
   ```

4. **Timezone: "Asia/Manila" (Default for Filipino staff)**
   ```
   Set automatically in onboarding complete
   → staff_profiles.timezone
   → Used in getStaffLocalTime()
   → Used in detectShiftDay()
   → Ensures all time calculations are in staff's local time
   ```

---

## ✅ **RESULT: COMPLETE INTEGRATION**

Your hire request form data flows through:
1. Client hire request (workSchedule JSON)
2. Admin job offer (job_acceptances table)
3. Onboarding completion (staff_profiles + work_schedules)
4. **Time tracking APIs** (time_entries, breaks, performance_metrics)
5. **All use shiftDate and staff timezone** (our new fix!)

---

## 🧪 **TESTING SCENARIOS**

### Scenario 1: Day Shift (Normal Case)
```
Hire Form: 9:00 AM - 6:00 PM Monday-Friday
Staff Clocks In: Thursday 9:15 AM Manila time
Result:
- shiftDate: Thursday
- shiftDayOfWeek: "Thursday"
- wasLate: true (15 min)
- All performance data tagged to Thursday
```

### Scenario 2: Night Shift (Your Critical Case!)
```
Hire Form: 9:00 PM - 6:00 AM Monday-Friday
Staff Clocks In: Friday 1:00 AM Manila time
Result:
- detectShiftDay() sees: Friday 1 AM < 6 AM
- Checks Thursday's schedule: 9 PM - 6 AM (night shift)
- shiftDate: Thursday ← 🔥 CORRECT!
- shiftDayOfWeek: "Thursday"
- All performance data tagged to Thursday's shift
```

---

## 🎉 **CONCLUSION**

The **9:00 AM start time** and **Monday-Friday schedule** you're filling in right now will:

1. ✅ Be stored in `interview_requests.workSchedule`
2. ✅ Flow to `job_acceptances` table
3. ✅ Create 7 `work_schedules` rows (Mon-Fri with times, Sat-Sun empty)
4. ✅ Be used by `detectShiftDay()` to handle night shifts
5. ✅ Set `expectedClockIn` for late detection
6. ✅ Attach all `time_entries`, `breaks`, and `performance_metrics` to the correct shift date
7. ✅ Use `Asia/Manila` timezone for all calculations

**Your form → Our timezone fix = Complete integration! 🚀**

