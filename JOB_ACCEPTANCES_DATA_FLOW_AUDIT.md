# Job Acceptances Data Flow Audit

## Summary
This document audits whether all fields from `job_acceptances` are properly passed and used throughout the system.

---

## 📋 Schema Fields (23 fields total)

### Core Fields
- ✅ `id` - Primary key
- ✅ `interviewRequestId` - Links to interview
- ✅ `bpocCandidateId` - Candidate ID
- ✅ `candidateEmail` - Email address
- ✅ `candidatePhone` - Phone number
- ✅ `position` - Job title
- ✅ `companyId` - Company assignment
- ✅ `acceptedByAdminId` - Admin who approved
- ✅ `acceptedAt` - Timestamp
- ✅ `staffUserId` - Links to staff_users

### Work Schedule Fields
- ⚠️ `clientTimezone` - **Partially Used**
- ⚠️ `isDefaultSchedule` - **Not Used After Creation**
- ✅ `workDays` - Array of working days
- ✅ `workStartTime` - Shift start time
- ✅ `workEndTime` - Shift end time
- ❌ `customHours` - **NOT USED**

### Employment Terms Fields
- ✅ `salary` - Monthly salary
- ⚠️ `shiftType` - **Used as fallback only**
- ⚠️ `workLocation` - **Used minimally**
- ⚠️ `hmoIncluded` - **Used but not in staff_profiles initially**
- ⚠️ `leaveCredits` - **Used but not in staff_profiles initially**
- ❌ `workHours` - **Used as text fallback only**
- ❌ `preferredStartDate` - **Not used consistently**

### Status Fields
- ❌ `signupEmailSent` - **NOT USED**
- ❌ `signupEmailSentAt` - **NOT USED**
- ❌ `contractSigned` - **NOT USED**
- ❌ `contractSignedAt` - **NOT USED**
- ✅ `createdAt` - System timestamp
- ✅ `updatedAt` - System timestamp

---

## 🔍 Detailed Analysis by Route

### 1️⃣ Creation: `/api/admin/recruitment/interviews/hire` (Primary Creation)

**Fields SET:**
```typescript
{
  id: ✅ crypto.randomUUID(),
  interviewRequestId: ✅,
  bpocCandidateId: ✅,
  candidateEmail: ✅,
  candidatePhone: ✅ (or null),
  position: ✅,
  salary: ✅ parseFloat(salary) or null,
  companyId: ✅,
  acceptedByAdminId: ✅ managementUser.id,
  
  // Work schedule (from client hire request)
  workDays: ✅ parsed from workSchedule,
  workStartTime: ✅ parsed from workSchedule,
  workEndTime: ✅ calculated (start + 9 hours),
  clientTimezone: ✅ scheduleTimezone,
  isDefaultSchedule: ✅,
  
  // Missing fields (not set):
  shiftType: ❌ NOT SET,
  workLocation: ❌ NOT SET,
  hmoIncluded: ❌ NOT SET,
  leaveCredits: ❌ NOT SET,
  workHours: ❌ NOT SET,
  preferredStartDate: ❌ NOT SET,
  customHours: ❌ NOT SET
}
```

**ISSUES:**
1. ❌ `shiftType`, `workLocation`, `hmoIncluded`, `leaveCredits` are in the request body but **NOT SAVED**
2. ❌ `preferredStartDate` is in body but **NOT SAVED**
3. ❌ `workHours` text is in body but **NOT SAVED**

---

### 2️⃣ Usage: `/api/auth/signup/staff` (Staff Account Creation)

**Fields USED from job_acceptances:**
```typescript
{
  ✅ id: Used to link staffUserId
  ✅ companyId: Assigned to staff_users
  ✅ position: Used for staff_profiles.currentRole
  ✅ salary: Used for staff_profiles.salary
  ✅ interview_requests.finalStartDate: Used for staff_profiles.startDate
  
  // Fields NOT USED:
  ❌ workDays: Not used
  ❌ workStartTime: Not used
  ❌ workEndTime: Not used
  ❌ clientTimezone: Not used
  ❌ hmoIncluded: Not used
  ❌ leaveCredits: Not used
  ❌ shiftType: Not used
  ❌ workLocation: Not used
}
```

**Created staff_profiles with:**
- ✅ currentRole ← position
- ✅ salary ← salary
- ✅ startDate ← interview.finalStartDate
- ⚠️ phone ← from BPOC (not job_acceptances)
- ⚠️ location ← from BPOC (not job_acceptances)
- ❌ hmo: NOT SET (should use hmoIncluded)
- ❌ totalLeave: NOT SET (should use leaveCredits)
- ❌ Work schedule: NOT CREATED

**ISSUES:**
1. ❌ Work schedule data (`workDays`, `workStartTime`, `workEndTime`, `clientTimezone`) **NOT USED** during signup
2. ❌ `hmoIncluded` **NOT TRANSFERRED** to `staff_profiles.hmo`
3. ❌ `leaveCredits` **NOT TRANSFERRED** to `staff_profiles.totalLeave`
4. ❌ `work_schedules` table **NOT POPULATED** during signup

---

### 3️⃣ Usage: `/api/contract` (Contract Generation)

**Fields USED:**
```typescript
{
  ✅ salary: Used for totalMonthlyGross, basicSalary
  ✅ workDays: Used to build workSchedule string
  ✅ workStartTime: Used in workSchedule
  ✅ workEndTime: Used in workSchedule
  ✅ clientTimezone: Displayed in workSchedule
  ✅ workLocation: Used for contactType (REMOTE vs FULL_TIME)
  ✅ position: Used for contract position
  ✅ hmoIncluded: Used for hmoOffer text
  ✅ leaveCredits: Used for paidLeave text
  ✅ preferredStartDate: Used as fallback for startDate
  ⚠️ shiftType: Used as fallback if workStartTime/workEndTime missing
  ⚠️ workHours: Used as fallback if workStartTime/workEndTime missing
  
  ❌ customHours: Never used
}
```

**GOOD:** Contract generation properly uses most fields from `job_acceptances`

---

### 4️⃣ Usage: `/api/admin/staff/onboarding/[staffUserId]/complete` (Onboarding Completion)

**Fields USED:**
```typescript
{
  ✅ clientTimezone: Used for timezone conversion in work_schedules
  
  // But work schedule created from admin input, not job_acceptances:
  ⚠️ workDays: NOT USED (admin provides shiftTime instead)
  ⚠️ workStartTime: NOT USED (admin provides shiftTime instead)
  ⚠️ workEndTime: NOT USED (admin provides shiftTime instead)
}
```

**Fields USED in staff_profiles update:**
```typescript
{
  // From admin form, not job_acceptances:
  employmentStatus: from body,
  startDate: from body,
  currentRole: from body,
  salary: from body,
  hmo: from body
}
```

**ISSUES:**
1. ⚠️ Admin re-enters data that's **ALREADY IN** `job_acceptances`
2. ❌ Work schedule from `job_acceptances` **IGNORED**, admin provides new `shiftTime`
3. ❌ Potential for **MISMATCHED DATA** between what client requested and what admin enters

---

### 5️⃣ Usage: `/api/time-tracking/status` (Current Time Tracking)

**Fields USED:**
```typescript
{
  ❌ NONE - job_acceptances not queried at all
  ⚠️ Only uses work_schedules from staff_profiles
}
```

**ISSUE:** Time tracking has **NO DIRECT CONNECTION** to original work schedule from `job_acceptances`

---

## 🚨 Critical Issues Found

### Issue #1: Missing Fields at Creation
**Location:** `/api/admin/recruitment/interviews/hire` (line 149)

**Problem:** Admin receives these fields in the request body but **DOESN'T SAVE** them:
```typescript
const {
  salary, ✅ SAVED
  shiftType, ❌ NOT SAVED
  workLocation, ❌ NOT SAVED
  hmoIncluded, ❌ NOT SAVED
  leaveCredits, ❌ NOT SAVED
  workHours, ❌ NOT SAVED
  clientPreferredStart ❌ NOT SAVED (should go to preferredStartDate)
} = body
```

**Impact:** Benefits and shift details are **LOST** after initial offer

**Fix Required:**
```typescript
const jobAcceptance = await prisma.job_acceptances.create({
  data: {
    // ... existing fields ...
    salary: salary ? parseFloat(salary) : null,
    shiftType: shiftType || null,              // ADD THIS
    workLocation: workLocation || null,         // ADD THIS
    hmoIncluded: hmoIncluded || false,         // ADD THIS
    leaveCredits: leaveCredits || 12,          // ADD THIS
    workHours: workHours || null,              // ADD THIS
    preferredStartDate: clientPreferredStart   // ADD THIS
      ? new Date(clientPreferredStart) 
      : null,
  }
})
```

---

### Issue #2: Staff Profile Missing Benefits Data
**Location:** `/api/auth/signup/staff` (line 183)

**Problem:** When staff creates account, benefits from `job_acceptances` are **NOT TRANSFERRED**:

```typescript
await prisma.staff_profiles.create({
  data: {
    // ... existing fields ...
    salary: salary, ✅ USED
    hmo: ??? ❌ NOT SET (should use jobAcceptance.hmoIncluded)
    totalLeave: ??? ❌ NOT SET (should use jobAcceptance.leaveCredits)
  }
})
```

**Fix Required:**
```typescript
await prisma.staff_profiles.create({
  data: {
    id: crypto.randomUUID(),
    staffUserId: staffUser.id,
    currentRole: position || 'Staff Member',
    startDate: startDate,
    salary: salary,
    hmo: jobAcceptance.hmoIncluded || false,         // ADD THIS
    totalLeave: jobAcceptance.leaveCredits || 12,    // ADD THIS
    phone: phone,
    location: location,
    employmentStatus: 'PROBATION',
    daysEmployed: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
})
```

---

### Issue #3: Work Schedule Not Created at Signup
**Location:** `/api/auth/signup/staff` (after line 204)

**Problem:** Work schedule data exists in `job_acceptances` but `work_schedules` table is **NOT POPULATED** until admin completes onboarding

**Impact:** Staff has no work schedule between signup and onboarding completion

**Fix Required:** Add work schedule creation during signup:
```typescript
// After creating staff_profiles:
if (jobAcceptance && staffProfile) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const schedules = days.map((day) => ({
    id: crypto.randomUUID(),
    profileId: staffProfile.id,
    dayOfWeek: day,
    startTime: jobAcceptance.workDays.includes(day) 
      ? jobAcceptance.workStartTime 
      : "",
    endTime: jobAcceptance.workDays.includes(day) 
      ? jobAcceptance.workEndTime 
      : "",
    timezone: "Asia/Manila",
    clientTimezone: jobAcceptance.clientTimezone,
    isWorkday: jobAcceptance.workDays.includes(day),
    createdAt: new Date(),
    updatedAt: new Date()
  }))
  
  await prisma.work_schedules.createMany({ data: schedules })
}
```

---

### Issue #4: Unused Status Fields
**Location:** Entire codebase

**Problem:** These fields exist in schema but are **NEVER USED**:
- `signupEmailSent` - Always false
- `signupEmailSentAt` - Always null
- `contractSigned` - Always false
- `contractSignedAt` - Always null

**Impact:** Email tracking and contract status tracking don't work

**Options:**
1. Remove these fields if not needed
2. Implement email tracking and contract status updates

---

### Issue #5: Duplicate Data Entry at Onboarding
**Location:** `/api/admin/staff/onboarding/[staffUserId]/complete`

**Problem:** Admin re-enters data that's already in `job_acceptances`:
- salary (already in job_acceptances)
- currentRole/position (already in job_acceptances)
- startDate (already in interview_requests)
- hmo (already in job_acceptances)
- shiftTime/work schedule (already in job_acceptances)

**Impact:** 
- Potential for data mismatch
- Admin work duplication
- Source of truth confusion

**Recommendation:** Pre-fill onboarding form with data from `job_acceptances`

---

## ✅ Recommendations

### Priority 1 (Critical):
1. **Fix hire route** - Save all fields from body to `job_acceptances`
2. **Fix signup route** - Transfer `hmoIncluded` and `leaveCredits` to `staff_profiles`
3. **Create work schedules at signup** - Don't wait for onboarding completion

### Priority 2 (Important):
4. **Pre-fill onboarding form** - Use existing `job_acceptances` data
5. **Time tracking** - Add validation against `job_acceptances` work schedule

### Priority 3 (Optional):
6. **Clean up unused fields** - Remove or implement status tracking fields
7. **Add `customHours` usage** - Or remove if not needed

---

## 📊 Field Usage Summary

| Field | Creation | Signup | Contract | Onboarding | Time Tracking |
|-------|----------|--------|----------|------------|---------------|
| position | ✅ | ✅ | ✅ | ⚠️ | ❌ |
| salary | ⚠️ | ✅ | ✅ | ⚠️ | ❌ |
| workDays | ✅ | ❌ | ✅ | ❌ | ❌ |
| workStartTime | ✅ | ❌ | ✅ | ❌ | ❌ |
| workEndTime | ✅ | ❌ | ✅ | ❌ | ❌ |
| clientTimezone | ✅ | ❌ | ✅ | ✅ | ❌ |
| hmoIncluded | ❌ | ❌ | ✅ | ⚠️ | ❌ |
| leaveCredits | ❌ | ❌ | ✅ | ⚠️ | ❌ |
| shiftType | ❌ | ❌ | ⚠️ | ❌ | ❌ |
| workLocation | ❌ | ❌ | ✅ | ❌ | ❌ |
| workHours | ❌ | ❌ | ⚠️ | ❌ | ❌ |
| preferredStartDate | ❌ | ❌ | ⚠️ | ❌ | ❌ |
| customHours | ❌ | ❌ | ❌ | ❌ | ❌ |

**Legend:**
- ✅ Fully used
- ⚠️ Partially used / used as fallback
- ❌ Not used / not saved

---

## 🎯 Next Steps

1. Update `/api/admin/recruitment/interviews/hire` route
2. Update `/api/auth/signup/staff` route
3. Test the entire recruitment → signup → onboarding flow
4. Verify data consistency across all tables

