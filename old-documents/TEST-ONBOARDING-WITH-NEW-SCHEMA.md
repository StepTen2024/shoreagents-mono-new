# 🧪 Test Onboarding with New Schema

## ✅ What Changed Since Last Test

### Database Changes:
1. ❌ Removed `staff_assignments` table
2. ❌ Removed `client` and `accountManager` from `staff_profiles`
3. ✅ Added `gender`, `civilStatus`, `dateOfBirth` to `staff_profiles`
4. ✅ Created NEW `staff_personal_records` table

### What Gets Created Now:
- **StaffUser** - Updated with full legal name + companyId
- **StaffProfile** - Employment details + demographics (NEW!)
- **StaffPersonalRecord** - HR data (tax IDs, emergency contact, docs) (NEW!)
- **WorkSchedule** - Mon-Fri schedule

---

## 🚀 TESTING STEPS

### Step 1: Clear Old Data (Fresh Start)

You'll need to delete John Smith's onboarding record to test fresh:
1. Go to Supabase dashboard
2. Delete from `staff_onboarding` where firstName = 'John'
3. Delete from `staff_profiles` where staffUserId matches
4. Delete from `staff_personal_records` if exists
5. OR use a different test user

### Step 2: Staff Completes Onboarding

**URL:** http://localhost:3000/login/staff

Login as staff member and complete ALL 5 steps:

**Step 1 - Personal Info:**
- First Name: John
- Middle Name: Robert
- Last Name: Smith
- Gender: Male
- Civil Status: Single
- Date of Birth: 1995-06-15
- Contact: +63 912 345 6789
- Email: john@test.com

**Step 2 - Government IDs:**
- SSS: 12-3456789-0
- TIN: 123-456-789-000
- PhilHealth: 12-345678901-2
- Pag-IBIG: 1234-5678-9012

**Step 3 - Documents:**
- Upload 5 documents (any image/PDF files)
- Valid ID, Birth Cert, NBI, Police Clearance, ID Photo

**Step 4 - Signature:**
- Upload signature image

**Step 5 - Emergency Contact:**
- Name: Jane Smith
- Phone: +63 923 456 7890
- Relationship: Sister

**Expected Result:** Should reach 100% completion

### Step 3: Admin Reviews & Approves

**URL:** http://localhost:3000/login/admin

Login as admin:

1. Go to **"Staff Onboarding"** in sidebar
2. Find John Smith - Should show:
   - Progress: 100%
   - Status: "📋 Ready for Verification"
   - Pending Review: 5 sections

3. Click **"View"** on John Smith

4. Approve ALL 5 sections:
   - Personal Information ✅
   - Government IDs ✅
   - Documents ✅
   - Signature ✅
   - Emergency Contact ✅

### Step 4: Complete Onboarding (NEW FORM!)

After approving all 5 sections, you'll see the employment form:

**Fill Out:**
- **Company:** Select "Acme Corp" (or any test company)
- **Employment Status:** Probation (default)
- **Start Date:** Today's date (default)
- **Shift Time:** 9:00 AM - 6:00 PM (default)
- **Role Title:** "Virtual Assistant"
- **Monthly Salary:** 800
- **HMO:** ON (default)

Click **"Complete Onboarding & Create Profile"**

### Step 5: Verify in Database

Check Supabase tables:

**staff_users:**
```sql
SELECT id, name, email, companyId 
FROM staff_users 
WHERE email = 'john@test.com';
```
**Expected:**
- name: "John Robert Smith" (full legal name)
- companyId: [selected company ID]

**staff_profiles:** (NEW FIELDS!)
```sql
SELECT 
  staffUserId,
  phone,
  gender,
  civilStatus,
  dateOfBirth,
  employmentStatus,
  startDate,
  currentRole,
  salary,
  hmo
FROM staff_profiles;
```
**Expected:**
- phone: "+63 912 345 6789"
- gender: "Male" ✨ NEW!
- civilStatus: "Single" ✨ NEW!
- dateOfBirth: "1995-06-15" ✨ NEW!
- employmentStatus: "PROBATION"
- currentRole: "Virtual Assistant"
- salary: 800
- hmo: true

**staff_personal_records:** (NEW TABLE!)
```sql
SELECT 
  staffUserId,
  sss,
  tin,
  philhealthNo,
  pagibigNo,
  emergencyContactName,
  emergencyContactNo,
  validIdUrl,
  birthCertUrl
FROM staff_personal_records;
```
**Expected:** ✨ NEW TABLE!
- sss: "12-3456789-0"
- tin: "123-456-789-000"
- philhealthNo: "12-345678901-2"
- pagibigNo: "1234-5678-9012"
- emergencyContactName: "Jane Smith"
- emergencyContactNo: "+63 923 456 7890"
- validIdUrl: [Supabase URL]
- birthCertUrl: [Supabase URL]

**work_schedules:**
```sql
SELECT dayOfWeek, startTime, endTime, isWorkday
FROM work_schedules;
```
**Expected:**
- Monday-Friday: 9:00 AM - 6:00 PM, isWorkday: true
- Saturday-Sunday: empty times, isWorkday: false

---

## ✅ SUCCESS CHECKLIST

### Staff Side:
- [ ] Can complete all 5 onboarding steps
- [ ] Reaches 100% completion
- [ ] Sees "Awaiting Admin Verification" banner (blue)
- [ ] Banner stays visible until admin completes

### Admin Side:
- [ ] Sees staff at 100% with "Ready for Verification"
- [ ] Can approve all 5 sections
- [ ] Sees employment form after all approved
- [ ] All fields have smart defaults
- [ ] Can select company from dropdown
- [ ] Can submit form successfully

### Database:
- [ ] `staff_users.name` updated with full legal name
- [ ] `staff_users.companyId` set correctly
- [ ] `staff_profiles` created with NEW demographic fields:
  - [ ] gender populated
  - [ ] civilStatus populated
  - [ ] dateOfBirth populated
- [ ] `staff_personal_records` created (NEW TABLE!) with:
  - [ ] All government IDs
  - [ ] Emergency contact
  - [ ] Document URLs
- [ ] `work_schedules` created with shift times
- [ ] `staff_onboarding.isComplete` = true

### Removed Fields (Should NOT Exist):
- [ ] `staff_profiles.client` - REMOVED ❌
- [ ] `staff_profiles.accountManager` - REMOVED ❌
- [ ] `staff_assignments` table - REMOVED ❌

---

## 🐛 What to Watch For

### Potential Issues:

1. **Missing Demographics:**
   - If gender/civilStatus/DOB are NULL, the API isn't copying them
   - Check: `app/api/admin/staff/onboarding/[staffUserId]/complete/route.ts`

2. **PersonalRecord Not Created:**
   - If table is empty, check for errors in API
   - Look for console errors when clicking "Complete Onboarding"

3. **Old Fields Referenced:**
   - If you see errors about `client` or `accountManager`, some code still references them
   - We skipped Point 6 (code updates), so this is expected

4. **Company Relationship:**
   - To display client name, must query: `staffUser.company.companyName`
   - Not: `profile.client` (field no longer exists)

---

## 🔍 Console Debugging

Open browser console (F12) when testing:

**Expected logs when completing onboarding:**
```
Creating staff profile...
Creating staff personal record...
Creating work schedule...
Marking onboarding complete...
✅ Success!
```

**If errors appear:**
- Check for "client is not defined" → Old code referencing removed field
- Check for "personalRecord failed" → Issue creating new table
- Check for validation errors → Missing required fields

---

## 📊 Quick Database Check

Run this in Supabase SQL editor:

```sql
-- Check complete record for a staff member
SELECT 
  su.name as "Staff Name",
  su.email,
  c.companyName as "Company",
  sp.gender,
  sp.civilStatus,
  sp.dateOfBirth,
  sp.employmentStatus,
  sp.currentRole,
  sp.salary,
  spr.sss,
  spr.emergencyContactName
FROM staff_users su
LEFT JOIN company c ON su.companyId = c.id
LEFT JOIN staff_profiles sp ON su.id = sp.staffUserId
LEFT JOIN staff_personal_records spr ON su.id = spr.staffUserId
WHERE su.email = 'john@test.com';
```

**Expected:**
- Company name from relationship (not profile.client)
- Demographics in profile (gender, civil status, DOB)
- HR data in personal_records (SSS, emergency contact)

---

## 🎯 What's Different From Last Test

**NEW in staff_profiles:**
- ✅ gender (auto-populated from onboarding)
- ✅ civilStatus (auto-populated from onboarding)
- ✅ dateOfBirth (auto-populated from onboarding)

**NEW table staff_personal_records:**
- ✅ All government IDs separated
- ✅ Emergency contact separated
- ✅ Document URLs separated

**REMOVED:**
- ❌ staff_profiles.client field
- ❌ staff_profiles.accountManager field
- ❌ staff_assignments table

**Relationships:**
- ✅ Client name via: `staffUser.company.companyName`
- ✅ Account manager via: `staffUser.company.accountManager.name`

---

## 🚀 Ready to Test!

**Server:** http://localhost:3000

**Staff Login:** http://localhost:3000/login/staff
**Admin Login:** http://localhost:3000/login/admin

**Start testing and report any issues!** 🔥

