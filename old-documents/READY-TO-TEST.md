# ✅ READY TO TEST - All Logging & Debugging Implemented!

## Quick Start

### 1. Server is Running
✅ Server is already running on `http://localhost:3000`

### 2. Open Browser Console
- Press `F12` in Chrome
- Go to "Console" tab
- Keep it open while testing

### 3. Watch Server Terminal
- Keep your terminal visible
- You'll see emoji-labeled logs for every action

---

## Test Flow

### As Admin:

1. **Login as admin**
2. **Go to:** Staff Management → Staff Onboarding
3. **Click on staff:** (e.g., the new user you just created)
4. **Approve sections one by one:**
   - Click ✓ Approve button on "Personal Information"
   - ✅ Check browser console: `🔍 ADMIN VERIFY`
   - ✅ Check server terminal: `📥 VERIFY REQUEST` → `✅ DATABASE UPDATED` → `📊 COMPLETION UPDATED`
   - Repeat for all 5 sections

5. **Complete Onboarding:**
   - Once all 5 approved, employment form appears
   - Fill in:
     - Select Company
     - Role: "Customer Support"
     - Salary: 1200
     - Start Date: Today
     - Shift: "9:00 AM - 6:00 PM"
     - HMO: ✓
   - Click "Complete Onboarding & Create Profile"
   - ✅ Check browser console: `🚀 COMPLETING ONBOARDING` → `✅ COMPLETE SUCCESS`
   - ✅ Check server terminal for ALL these logs:
     ```
     🚀 COMPLETING ONBOARDING REQUEST
     ✅ STAFF USER UPDATED
     ✅ PROFILE CREATED
     🔐 CREATING PERSONAL RECORD  ← THIS IS THE KEY ONE!
     ✅ PERSONAL RECORD CREATED    ← IF THIS SHOWS, IT WORKED!
     ✅ WORK SCHEDULE CREATED
     ✅ ONBOARDING MARKED COMPLETE
     🎉 ONBOARDING COMPLETION SUCCESS
     ```

6. **If you see error:**
   ```
   ❌ PERSONAL RECORD CREATION FAILED: [error details]
   ```
   → The error message will tell us exactly what's wrong!

---

### As Staff:

1. **Login as staff** (the user who completed onboarding)
2. **Dashboard shows blue banner:** "⏳ Awaiting Admin Verification"
3. **Click banner** → Goes to `/onboarding/status`
4. **Status page shows:**
   - Overall progress: 100%
   - Breakdown: X approved, Y pending, Z rejected
   - 5 section cards with status badges
   - Any admin feedback
   - Blue alert: "Awaiting verification" (if not all approved yet)
   - Green alert: "All set!" (if admin completed)

---

## What To Check in Supabase

After admin completes onboarding, verify these tables:

### 1. staff_users
```sql
SELECT name, "companyId" FROM staff_users WHERE id = 'your-staff-user-id';
```
✅ Should show full legal name + company ID

### 2. staff_profiles
```sql
SELECT * FROM staff_profiles WHERE "staffUserId" = 'your-staff-user-id';
```
✅ Should have demographics (gender, civilStatus, dateOfBirth) + employment data

### 3. staff_personal_records (THE KEY TABLE!)
```sql
SELECT * FROM staff_personal_records WHERE "staffUserId" = 'your-staff-user-id';
```
✅ Should have:
- SSS, TIN, PhilHealth, Pag-IBIG numbers
- Emergency contact (name, number, relationship)
- All document URLs (validId, birthCert, nbiClearance, etc.)

**If this row is MISSING:**
→ Check server logs for `❌ PERSONAL RECORD CREATION FAILED`
→ The error will tell us why

### 4. work_schedules
```sql
SELECT * FROM work_schedules WHERE "profileId" = 'profile-id-from-step-2';
```
✅ Should have 7 rows (one per day), 5 workdays with shift times

---

## Console Logs You'll See

### Browser Console (Admin):
```
🔍 ADMIN VERIFY: { section: "personalInfo", action: "APPROVED", ... }
✅ VERIFY SUCCESS: { success: true }
🔍 ADMIN VERIFY: { section: "govId", action: "APPROVED", ... }
✅ VERIFY SUCCESS: { success: true }
... (repeat for all sections)
🚀 COMPLETING ONBOARDING: { companyId: "...", salary: 1200, ... }
✅ COMPLETE SUCCESS: { staffName: "John Smith", companyName: "Tech Corp", ... }
```

### Server Terminal:
```
📥 VERIFY REQUEST: { staffUserId: "...", section: "personalInfo", ... }
💾 UPDATING DATABASE: { personalInfoStatus: "APPROVED", ... }
✅ DATABASE UPDATED: { section: "personalInfo", status: "APPROVED" }
📊 COMPLETION UPDATED: { completionPercent: 20, isComplete: false }
... (repeat for all sections)
🚀 COMPLETING ONBOARDING REQUEST: { staffUserId: "...", companyId: "..." }
✅ STAFF USER UPDATED: { companyId: "...", fullName: "John Smith" }
✅ PROFILE CREATED: { profileId: "...", salary: 1200, currentRole: "Customer Support" }
🔐 CREATING PERSONAL RECORD: { staffUserId: "...", sss: "...", tin: "...", ... }
✅ PERSONAL RECORD CREATED: { personalRecordId: "...", staffUserId: "..." }
✅ WORK SCHEDULE CREATED: { profileId: "...", schedulesCount: 7, workdays: 5 }
✅ ONBOARDING MARKED COMPLETE: { onboardingId: "...", staffUserId: "..." }
🎉 ONBOARDING COMPLETION SUCCESS: { staffName: "...", company: "...", role: "...", salary: ... }
```

---

## If Something Goes Wrong

### Problem 1: No console logs in browser
- **Solution:** Make sure F12 DevTools is open BEFORE clicking buttons

### Problem 2: No server logs
- **Solution:** Server might have crashed. Check terminal for errors. Restart if needed.

### Problem 3: Personal records not created
- **Check server logs for:**
  ```
  ❌ PERSONAL RECORD CREATION FAILED: [error details]
  ```
- Common errors:
  - **Foreign key constraint:** staffUserId doesn't exist
  - **Unique constraint:** Record already exists (delete old one)
  - **Column does not exist:** Schema mismatch (run `npx prisma generate`)

### Problem 4: Status page shows 404
- **Solution:** The file is at `app/onboarding/status/page.tsx`
- Navigate manually to: `http://localhost:3000/onboarding/status`
- If still 404, restart server

---

## Files Changed (5 total)

1. ✅ `app/api/admin/staff/onboarding/[staffUserId]/complete/route.ts` - Added 8 console logs + try-catch around personal records
2. ✅ `app/api/admin/staff/onboarding/[staffUserId]/verify/route.ts` - Added 4 console logs
3. ✅ `app/admin/staff/onboarding/[staffUserId]/page.tsx` - Added browser logging + enhanced success message
4. ✅ `app/onboarding/status/page.tsx` - NEW: Staff can see detailed onboarding status
5. ✅ `components/gamified-dashboard.tsx` - Updated banner to link to status page

---

## Expected Results

### ✅ Success Indicators:
- All console logs appear in browser and terminal
- Staff sees detailed status page
- Admin sees clear success message
- All 4 database tables populated:
  - staff_users (companyId set)
  - staff_profiles (created)
  - **staff_personal_records (created)** ← THE MAIN GOAL
  - work_schedules (5-7 rows)

### ❌ If Personal Records Still Don't Create:
- Server logs will show: `❌ PERSONAL RECORD CREATION FAILED: [exact error]`
- Share that error message and we'll fix it

---

## Ready? Let's Test! 🚀

1. **Open browser console (F12)**
2. **Watch server terminal**
3. **Login as admin**
4. **Go through verification flow**
5. **Complete onboarding**
6. **Check both consoles**
7. **Verify Supabase tables**

**The mystery of the missing personal records will be solved!** 🔍

