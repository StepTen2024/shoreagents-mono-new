# 🧪 GUNTING Flow Testing Guide - Stephen

## 🚀 Server Status
✅ **Running:** http://localhost:3000

---

## 📋 Test Flow (In Order):

### 1️⃣ **LOGIN PAGE**
**URL:** http://localhost:3000/login

**Test:**
- [ ] Page loads without errors
- [ ] Can log in as staff user
- [ ] Can log in as admin user
- [ ] Redirects correctly after login

---

### 2️⃣ **STAFF ONBOARDING (8 Steps)**
**URL:** http://localhost:3000/staff/onboarding

**Step 1: Personal Info**
- [ ] Form displays correctly
- [ ] Can enter all fields
- [ ] Saves and moves to next step

**Step 2: Resume Upload**
- [ ] File upload works
- [ ] Uploads to Supabase
- [ ] Resume URL saved to database
- [ ] Can view uploaded resume

**Step 3: Government ID**
- [ ] File upload works
- [ ] Gov ID stored correctly
- [ ] Can view uploaded ID

**Step 4: Education**
- [ ] Can add education records
- [ ] Multiple entries work
- [ ] Degree, institution, year saved

**Step 5: Medical Info**
- [ ] Medical conditions field works
- [ ] Allergies field works
- [ ] Medications field works
- [ ] Data saves correctly

**Step 6: Data Privacy**
- [ ] Privacy consent checkbox
- [ ] Marketing consent checkbox
- [ ] Third-party consent checkbox
- [ ] All consents recorded

**Step 7: Signature**
- [ ] Signature canvas loads
- [ ] Can draw signature
- [ ] Clear button works
- [ ] Signature image saved

**Step 8: Emergency Contact**
- [ ] Name, phone, relationship fields
- [ ] Alternative contact fields
- [ ] All data saves correctly
- [ ] Onboarding marked complete

**Overall:**
- [ ] Progress indicator updates through all 8 steps
- [ ] Can navigate between steps
- [ ] Data persists when switching steps
- [ ] All API calls succeed (check console)

---

### 3️⃣ **ADMIN VERIFICATION PAGE**
**URL:** http://localhost:3000/admin/staff/onboarding

**Test:**
- [ ] Lists all staff with pending onboarding
- [ ] Shows onboarding status for each
- [ ] Can click to view individual staff
- [ ] Status badges display correctly (PENDING/APPROVED/REJECTED)

---

### 4️⃣ **ADMIN INDIVIDUAL VIEW**
**URL:** http://localhost:3000/admin/staff/onboarding/[staffUserId]

**View Each Section:**
- [ ] Personal Info displays correctly
- [ ] Resume viewable (button works)
- [ ] Gov ID viewable
- [ ] Education records shown
- [ ] Medical info displayed
- [ ] Data privacy consents shown
- [ ] Signature image displays
- [ ] Emergency contacts shown

**Approve/Reject Flow:**
- [ ] **Approve button** updates status to APPROVED
- [ ] **Reject button** opens feedback modal
- [ ] Feedback modal has textarea
- [ ] Sending feedback updates status to REJECTED
- [ ] Feedback saved to database

**Complete Onboarding:**
- [ ] Complete button disabled until all 8 sections approved
- [ ] Complete button enables when all approved
- [ ] Clicking Complete:
  - [ ] Generates employment contract
  - [ ] Creates welcome form record
  - [ ] Updates onboarding status to complete
  - [ ] Shows success message

---

### 5️⃣ **CONTRACT VIEWING**

**Staff Contract View:**
**URL:** http://localhost:3000/staff/contract

- [ ] Shows employment contract
- [ ] Contract HTML renders correctly
- [ ] Signature section works
- [ ] Can sign contract
- [ ] Contract marked as signed

**Admin Contract View:**
**URL:** http://localhost:3000/admin/contracts/[contractId]

- [ ] Contract details display
- [ ] Shows signed/pending status
- [ ] Signature image shows if signed
- [ ] All contract fields populated

---

## 🔍 What to Check in Browser Console:

```javascript
// Should see these without errors:
✅ API calls to /api/staff/onboarding/*
✅ File uploads to Supabase
✅ WebSocket connections
✅ No React errors
✅ No compilation errors
```

---

## 🐛 Common Issues to Watch For:

1. **File Uploads:**
   - Check Supabase bucket exists
   - Check upload permissions
   - Verify file URLs are accessible

2. **API Endpoints:**
   - Check all POST requests return 200
   - Verify data is saved to database
   - Check error handling works

3. **UI/UX:**
   - All buttons clickable
   - Forms validate correctly
   - Progress indicator updates
   - Status badges show right colors

4. **Database:**
   - Open `npx prisma studio` to verify data
   - Check all fields populated
   - Verify relationships work

---

## ✅ Quick Database Check:

```bash
# Open Prisma Studio to view database
npx prisma studio

# Check these tables:
- StaffUser
- StaffOnboarding
- EducationRecord
- EmploymentContract
- StaffWelcomeForm
```

---

## 🎯 Success Criteria:

**ALL of these must work:**
- ✅ All 8 onboarding steps complete without errors
- ✅ Admin can view all sections
- ✅ Admin can approve/reject sections
- ✅ Admin can complete onboarding
- ✅ Contract generates correctly
- ✅ Staff can view and sign contract
- ✅ All data saves to database
- ✅ No console errors

---

## 📊 Test Results:

**Staff Onboarding:** [ ] ✅ Pass / [ ] ❌ Fail  
**Admin Verification:** [ ] ✅ Pass / [ ] ❌ Fail  
**Contract Generation:** [ ] ✅ Pass / [ ] ❌ Fail  
**Database Integrity:** [ ] ✅ Pass / [ ] ❌ Fail  

**Overall Status:** [ ] ✅ READY TO SHIP / [ ] ⚠️ NEEDS FIXES

---

## 🚀 After Testing:

1. Document any bugs found
2. Update team in Slack #gunting
3. Assign fixes to specific agents if needed
4. Re-test after fixes

---

**Let's scissor this! ✂️🔥**

