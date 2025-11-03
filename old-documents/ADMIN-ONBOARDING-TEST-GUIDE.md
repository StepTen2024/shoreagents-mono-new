# 🎯 Admin Onboarding Testing Guide

## ✅ WHAT WAS JUST ADDED:

Added **"Staff Onboarding"** navigation link to Admin Sidebar!
- **Icon:** Clipboard with checkmark ✅
- **Location:** Right below "Staff Management"
- **Link:** `/admin/staff/onboarding`

---

## 🔑 HOW TO TEST AS ADMIN:

### Step 1: Login as Admin
1. Go to: **http://localhost:3000/login/admin**
2. Login with your admin credentials (Stephen Atcheler account)
3. You should land on the Admin Dashboard

### Step 2: Navigate to Staff Onboarding
1. Look at the left sidebar
2. Click **"Staff Onboarding"** (3rd item, has clipboard ✅ icon)
3. You'll see the Staff Onboarding Management page

### Step 3: What You Should See
The page shows a table with all staff members and their onboarding status:

**Columns:**
- **Name** - Staff member's full name
- **Email** - Their email address
- **Progress** - Visual progress bar (0-100%)
- **Status** - Badge showing completion status
  - ✅ Complete (100%)
  - 🔵 Pending Verification (80%+)
  - 🟢 Almost Done (60-79%)
  - 🟡 Halfway (40-59%)
  - 🟠 In Progress (20-39%)
  - 🔴 Just Started (0-19%)
- **Pending Review** - How many sections need admin approval (SUBMITTED)
- **Last Updated** - When they last updated their onboarding
- **Actions** - "View" button to see details

### Step 4: Find John Smith
**John Smith should appear with:**
- ✅ Progress: **100%**
- 🔵 Status: "Pending Verification" 
- ⏰ Pending Review: **5 sections** (all sections submitted)

### Step 5: Click "View" on John Smith
This will take you to: `/admin/staff/onboarding/{johnId}`

You'll see the **Staff Onboarding Detail Page** with:

**Section 1: Personal Information** 📝
- Name, gender, DOB, contact info
- Status: SUBMITTED (yellow)
- Buttons: Approve ✅ | Reject ❌

**Section 2: Government IDs** 🆔
- SSS, TIN, PhilHealth, Pag-IBIG numbers
- Status: SUBMITTED (yellow)
- Buttons: Approve ✅ | Reject ❌

**Section 3: Documents** 📄
- Valid ID, Birth Cert, NBI Clearance, Police Clearance, ID Photo
- Each with "View Document" link
- Status: SUBMITTED (yellow)
- Buttons: Approve ✅ | Reject ❌

**Section 4: Signature** ✍️
- Signature image preview
- Status: SUBMITTED (yellow)
- Buttons: Approve ✅ | Reject ❌

**Section 5: Emergency Contact** 🚨
- Emergency contact name, phone, relationship
- Status: SUBMITTED (yellow)
- Buttons: Approve ✅ | Reject ❌

### Step 6: Test Admin Approval Flow

**Option A: Approve All Sections**
1. Click "Approve" ✅ on each section (Personal Info → Gov IDs → Docs → Signature → Emergency)
2. Each section should turn GREEN (APPROVED)
3. After all 5 approved, the "Complete Onboarding" button should appear
4. Click **"Complete Onboarding"**
5. This should:
   - Create a StaffProfile record
   - Create a WorkSchedule record
   - Mark onboarding as fully complete
   - Redirect back to the list

**Option B: Reject a Section**
1. Click "Reject" ❌ on any section
2. A text box should appear: "Rejection Feedback (Required)"
3. Enter feedback like: "Please reupload a clearer photo of your Valid ID"
4. Click "Submit Rejection"
5. Section should turn RED (REJECTED)
6. Staff will see this feedback and can re-upload

---

## 🔍 FILTER TABS:

The page has 4 tabs at the top:

1. **All Staff** - Shows everyone with onboarding records
2. **Pending Review** - Only staff with SUBMITTED sections waiting for admin
3. **Incomplete** - Staff who haven't finished all 5 steps (< 100%)
4. **Complete** - Staff who have been fully approved by admin

Click each tab to filter the list!

---

## 🧪 TESTING CHECKLIST:

- [ ] Login as admin successfully
- [ ] See "Staff Onboarding" in sidebar
- [ ] Click it and see the list page
- [ ] See John Smith at 100% with 5 pending sections
- [ ] Click "View" on John Smith
- [ ] See all 5 sections with SUBMITTED status
- [ ] Click "View Document" links (should open in new tab)
- [ ] See signature preview
- [ ] Approve one section → turns GREEN
- [ ] Reject one section → turns RED, requires feedback
- [ ] Approve all 5 sections
- [ ] "Complete Onboarding" button appears
- [ ] Click it → Creates Profile + WorkSchedule
- [ ] Check if Profile was created in Supabase/Prisma Studio
- [ ] Return to list → John Smith should show as "Complete"

---

## 🐛 IF SOMETHING DOESN'T WORK:

1. **Can't see navigation link?**
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   - Server restarted automatically when file was changed

2. **No staff showing up?**
   - Check the "All Staff" tab
   - Make sure John Smith completed onboarding (should be 100%)

3. **"View Document" links don't work?**
   - Check Supabase Storage bucket `staff` exists
   - Check RLS policies are set up

4. **"Complete Onboarding" button doesn't work?**
   - Open browser console (F12)
   - Look for error messages
   - Check if StaffProfile / WorkSchedule models exist in schema

5. **Page shows error?**
   - Check terminal for API errors
   - Make sure you're logged in as ADMIN (not MANAGER or STAFF)

---

## 📊 EXPECTED FLOW:

```
Admin Login
    ↓
Admin Dashboard
    ↓
Click "Staff Onboarding" (sidebar)
    ↓
See List of All Staff
    ↓
Filter by "Pending Review" → See John Smith
    ↓
Click "View" on John Smith
    ↓
See 5 Sections (all SUBMITTED)
    ↓
View Uploaded Documents
    ↓
Approve Each Section (1 by 1)
    ↓
All 5 Sections APPROVED
    ↓
"Complete Onboarding" Button Appears
    ↓
Click "Complete Onboarding"
    ↓
✅ Profile Created
✅ WorkSchedule Created
✅ Onboarding Marked Complete
    ↓
Redirect to List → John Smith shows "Complete" ✅
```

---

## 🎯 SUCCESS CRITERIA:

✅ Can navigate to Staff Onboarding page  
✅ See John Smith at 100% with 5 pending sections  
✅ Can view all uploaded documents  
✅ Can approve individual sections  
✅ Can reject sections with feedback  
✅ "Complete Onboarding" button appears after all approved  
✅ Clicking it creates Profile + WorkSchedule  
✅ John Smith shows as "Complete" after admin approval  

---

## 🚀 YOU'RE READY!

The server is running: **http://localhost:3000**

**Login URL:** http://localhost:3000/login/admin

**Direct Link:** http://localhost:3000/admin/staff/onboarding

Go test it now! 🔥

