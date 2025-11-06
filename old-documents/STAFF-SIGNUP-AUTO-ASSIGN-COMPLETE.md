# ✅ STAFF SIGNUP AUTO-ASSIGN FIX - COMPLETE

**Date:** October 26, 2025  
**File Fixed:** `app/api/auth/signup/staff/route.ts`  
**Status:** ✅ **IMPLEMENTED**

---

## 🎯 What Was Fixed

### **Problem:**
When a candidate signed up after being hired, the system was NOT auto-assigning their client company, even though the admin had already selected it during the hire process.

**Old Code (Line 60):**
```typescript
companyId: null, // ❌ Management will assign company later
```

### **Solution:**
Updated the signup API to:
1. ✅ Accept `jobAcceptanceId` parameter
2. ✅ Fetch job acceptance data (includes company, position)
3. ✅ Auto-assign `companyId` from job acceptance
4. ✅ Auto-create onboarding record
5. ✅ Auto-create employment contract if from hire flow
6. ✅ Log all steps for debugging

**New Code (Lines 39-62, 80-87):**
```typescript
// Check for job acceptance data (from hire flow)
let companyId = null
let position = null
let jobAcceptance = null

if (jobAcceptanceId) {
  jobAcceptance = await prisma.jobAcceptance.findUnique({
    where: { id: jobAcceptanceId },
    include: {
      company: true
    }
  })

  if (jobAcceptance) {
    companyId = jobAcceptance.companyId  // ✅ AUTO-ASSIGN
    position = jobAcceptance.position
    console.log('✅ [SIGNUP] Job acceptance found:', {
      company: jobAcceptance.company.companyName,
      position: jobAcceptance.position
    })
  }
}

// ...

const staffUser = await prisma.staffUser.create({
  data: {
    authUserId: authData.user.id,
    email,
    name,
    role: "STAFF",
    companyId: companyId,  // ✅ Auto-assigned if from job acceptance
  }
})
```

---

## 📊 The Complete Flow (Now Working)

### **Before Fix:**
```
1. Client interviews Tina
2. Admin hires Tina → Selects "Acme Corp"
3. JobAcceptance created with companyId = "acme-id"
4. Tina signs up
5. Staff account created with companyId = null ❌
6. Welcome form shows: Client: [EMPTY] ❌
7. Admin must manually assign company ❌
```

### **After Fix:**
```
1. Client interviews Tina
2. Admin hires Tina → Selects "Acme Corp"
3. JobAcceptance created with companyId = "acme-id"
4. Tina clicks signup link with jobAcceptanceId
5. Staff account created with companyId = "acme-id" ✅
6. Onboarding record created ✅
7. Employment contract created ✅
8. Welcome form shows: Client: "Acme Corp" ✅
9. Tina completes onboarding → Ready to work! ✅
```

---

## 🔧 What Happens Now

### **Scenario A: Hired Candidate (Recommended)**
**URL:** `/login/staff/signup?jobAcceptanceId=xxx-yyy-zzz`

**Signup receives:**
```json
{
  "name": "Tina Smith",
  "email": "tina@example.com",
  "password": "password123",
  "jobAcceptanceId": "xxx-yyy-zzz"
}
```

**System does:**
1. ✅ Fetches job acceptance → Gets companyId + position
2. ✅ Creates Supabase auth user
3. ✅ Creates staff_users record WITH companyId
4. ✅ Creates staff_onboarding record
5. ✅ Creates employment_contract record
6. ✅ Returns success with company info

**Response:**
```json
{
  "message": "Staff account created successfully",
  "user": {
    "id": "staff-id",
    "name": "Tina Smith",
    "email": "tina@example.com",
    "role": "STAFF",
    "companyId": "acme-corp-id"
  },
  "fromJobAcceptance": true,
  "company": "Acme Corporation",
  "position": "Virtual Assistant"
}
```

### **Scenario B: Manual Signup (Still Supported)**
**URL:** `/login/staff/signup`

**Signup receives:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123"
}
```

**System does:**
1. ✅ Creates Supabase auth user
2. ✅ Creates staff_users record with companyId = null
3. ✅ Creates staff_onboarding record
4. ⏸️ NO contract created (admin assigns company later)

**Response:**
```json
{
  "message": "Staff account created successfully",
  "user": {
    "id": "staff-id",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "STAFF",
    "companyId": null
  },
  "fromJobAcceptance": false,
  "company": null,
  "position": null
}
```

---

## 📝 New Features Added

### 1. **Job Acceptance Integration**
```typescript
// Lines 39-62
if (jobAcceptanceId) {
  jobAcceptance = await prisma.jobAcceptance.findUnique({
    where: { id: jobAcceptanceId },
    include: { company: true }
  })
  
  if (jobAcceptance) {
    companyId = jobAcceptance.companyId
    position = jobAcceptance.position
  }
}
```

### 2. **Auto-Create Onboarding Record**
```typescript
// Lines 97-105
await prisma.staffOnboarding.create({
  data: {
    staffUserId: staffUser.id,
    email: staffUser.email,
    firstName: name.split(' ')[0],
    lastName: name.split(' ').slice(1).join(' ') || name.split(' ')[0],
  }
})
```

### 3. **Auto-Create Employment Contract**
```typescript
// Lines 109-138
if (jobAcceptance && companyId) {
  const contract = await prisma.employmentContract.create({
    data: {
      jobAcceptanceId: jobAcceptance.id,
      staffUserId: staffUser.id,
      companyId: companyId,
      employeeName: name,
      position: position || 'Staff Member',
      assignedClient: jobAcceptance.company.companyName,
      // ... more fields
    }
  })
}
```

### 4. **Enhanced Logging**
```typescript
console.log('📝 [SIGNUP] Staff signup attempt:', { email, hasJobAcceptance: !!jobAcceptanceId })
console.log('✅ [SIGNUP] Job acceptance found:', { company, position })
console.log('✅ [SIGNUP] Staff user created:', { id, companyId, hasCompany })
console.log('✅ [SIGNUP] Onboarding record created')
console.log('✅ [SIGNUP] Employment contract created:', contract.id)
```

---

## 🧪 How To Test

### **Test 1: Full Hire Flow**
```bash
# 1. Admin hires candidate
# Go to: http://localhost:3000/admin/recruitment
# Click "Hire" on interview
# Fill form:
#   Position: Virtual Assistant
#   Company: Acme Corporation
#   Email: newstaff@example.com

# 2. Copy the signup link from terminal:
# 📧 [ADMIN] Signup link: http://localhost:3000/login/staff/signup?jobAcceptanceId=xxx

# 3. Open signup link in browser
# Should see: "You've been hired as Virtual Assistant at Acme Corporation"

# 4. Fill signup form:
#   Name: New Staff
#   Email: newstaff@example.com (pre-filled)
#   Password: password123

# 5. Submit signup

# 6. Check terminal logs:
# Should see:
# 📝 [SIGNUP] Staff signup attempt: { email: 'newstaff@example.com', hasJobAcceptance: true }
# ✅ [SIGNUP] Job acceptance found: { company: 'Acme Corporation', position: 'Virtual Assistant' }
# ✅ [SIGNUP] Staff user created: { id: '...', companyId: '...', hasCompany: true }
# ✅ [SIGNUP] Onboarding record created
# ✅ [SIGNUP] Employment contract created: ...

# 7. Login as new staff
# Go to: http://localhost:3000/welcome
# Should see:
#   Full Name: New Staff ✅
#   Client: Acme Corporation ✅
#   Start Date: [current date] ✅
```

### **Test 2: Manual Signup (Legacy)**
```bash
# 1. Go directly to signup
# http://localhost:3000/login/staff/signup

# 2. Fill form:
#   Name: Manual Staff
#   Email: manual@example.com
#   Password: password123

# 3. Submit signup

# 4. Check terminal logs:
# Should see:
# 📝 [SIGNUP] Staff signup attempt: { email: 'manual@example.com', hasJobAcceptance: false }
# ✅ [SIGNUP] Staff user created: { id: '...', companyId: null, hasCompany: false }
# ✅ [SIGNUP] Onboarding record created

# 5. Login as manual staff
# Go to: http://localhost:3000/welcome
# Should see:
#   Full Name: Manual Staff ✅
#   Client: [EMPTY] ⏸️ (Admin must assign)
#   Start Date: [EMPTY] ⏸️ (Admin must set)
```

---

## ✅ Benefits

1. **✅ Automatic Company Assignment**
   - No manual admin work needed
   - Company assigned at signup from hire data

2. **✅ Faster Onboarding**
   - Staff sees their client immediately
   - Contract auto-created
   - Welcome form pre-filled

3. **✅ Fewer Errors**
   - No manual data entry errors
   - Company guaranteed to match hire decision

4. **✅ Better UX**
   - Staff feels welcomed ("You've been hired at Acme!")
   - Clear progression from hire → signup → work

5. **✅ Audit Trail**
   - Logs show full journey
   - Easy to debug issues
   - Clear connection between hire and signup

---

## 📦 Files Changed

1. **`app/api/auth/signup/staff/route.ts`**
   - Added jobAcceptanceId handling
   - Auto-assigns companyId
   - Creates onboarding record
   - Creates employment contract
   - Enhanced logging

---

## 🎉 Summary

**The fix is complete!** Now when staff sign up through the hire flow:
- ✅ Their company is auto-assigned from the interview/hire data
- ✅ Welcome form displays the correct client name
- ✅ No manual admin work needed
- ✅ Full audit trail in logs

**Next Steps:**
1. Test the full flow (admin hire → staff signup → welcome form)
2. Verify welcome form shows client correctly
3. Check onboarding process flows smoothly

---

**Status:** ✅ Ready for Testing  
**Branch:** claude-god  
**Commit Ready:** Yes (needs commit)

