# 🤖 NOVA - GUNTING Migration & Testing Checklist

## 📅 Date: October 23, 2025
## 🎯 Mission: Prisma Migrate + GUNTING Flow Testing

---

## ✅ STEP 1: Database Migration

### Commands to Run:
```bash
# 1. Get on the right branch
git fetch origin
git checkout Gunting-Project-Scissor
git pull origin Gunting-Project-Scissor

# 2. Install dependencies
npm install

# 3. Generate Prisma Client
npx prisma generate

# 4. Run database migrations
npx prisma migrate dev --name gunting-onboarding-system

# 5. Verify migration success
npx prisma migrate status
```

### ✅ Expected Results:
- [ ] Prisma Client generated successfully
- [ ] All migrations applied
- [ ] Database schema in sync
- [ ] No migration errors

---

## ✅ STEP 2: Start Dev Server

```bash
npm run dev
```

### ✅ Expected Results:
- [ ] Server starts on http://localhost:3000
- [ ] No compilation errors
- [ ] WebSocket server ready
- [ ] All routes compile successfully

---

## ✅ STEP 3: Test GUNTING Onboarding Flow

### A. Staff User Flow

**URL:** http://localhost:3000/staff/onboarding

**Test All 8 Steps:**
1. [ ] **Personal Info** - Form submits, saves data
2. [ ] **Resume Upload** - File uploads to Supabase, URL saved
3. [ ] **Government ID** - File uploads, stored correctly
4. [ ] **Education** - Education records saved
5. [ ] **Medical Info** - Medical conditions, allergies saved
6. [ ] **Data Privacy** - Consent recorded
7. [ ] **Signature** - Signature canvas works, saves image
8. [ ] **Emergency Contact** - Contact info saved

**Check:**
- [ ] Progress indicator updates correctly
- [ ] Can navigate between steps
- [ ] Data persists when switching steps
- [ ] All API endpoints respond correctly

---

### B. Admin Verification Flow

**URL:** http://localhost:3000/admin/staff/onboarding

**Test Features:**
1. [ ] **View Staff List** - All pending onboardings show
2. [ ] **Open Individual Onboarding** - Can view all 8 sections
3. [ ] **Status Badges** - Show correct status (PENDING, APPROVED, REJECTED)
4. [ ] **View Uploaded Files** - Resume, Gov ID viewable
5. [ ] **Approve Section** - Updates status to APPROVED
6. [ ] **Reject Section** - Opens feedback modal
7. [ ] **Send Feedback** - Staff receives rejection reason
8. [ ] **Complete Onboarding** - Triggers contract generation

**Check:**
- [ ] All sections display correct data
- [ ] Approve/Reject buttons work
- [ ] Feedback modal functional
- [ ] Complete button only enabled when all approved
- [ ] Contract generation triggered correctly

---

### C. API Endpoints Testing

**Test these endpoints:**

1. **GET** `/api/admin/staff/onboarding`
   - [ ] Returns list of staff with onboarding data

2. **GET** `/api/admin/staff/onboarding/[staffUserId]`
   - [ ] Returns individual onboarding details

3. **POST** `/api/admin/staff/onboarding/[staffUserId]/verify`
   - [ ] Updates section status (APPROVED/REJECTED)
   - [ ] Saves feedback for rejections

4. **POST** `/api/admin/staff/onboarding/[staffUserId]/complete`
   - [ ] Checks all 8 sections approved
   - [ ] Generates employment contract
   - [ ] Creates welcome form record

5. **POST** `/api/staff/onboarding/[step]`
   - [ ] All 8 step endpoints work
   - [ ] File uploads work (resume, govId)
   - [ ] Data validation works

---

## ✅ STEP 4: Database Verification

```bash
# Check database records
npx prisma studio
```

**Verify Tables:**
- [ ] `StaffUser` - User records exist
- [ ] `StaffOnboarding` - All fields populated
- [ ] `EducationRecord` - Education entries exist
- [ ] `EmploymentContract` - Contracts generated
- [ ] `StaffWelcomeForm` - Welcome forms created

---

## 🐛 Bug Tracking

### Issues Found:
```
1. [Issue description]
   - Location: [file:line]
   - Severity: High/Medium/Low
   - Fix: [proposed solution]

2. [Issue description]
   - Location: [file:line]
   - Severity: High/Medium/Low
   - Fix: [proposed solution]
```

---

## 📊 Test Results Summary

**Database Migration:**
- Status: [ ] ✅ Success / [ ] ❌ Failed
- Notes:

**Onboarding Flow:**
- Status: [ ] ✅ All Working / [ ] ⚠️ Issues Found
- Notes:

**API Endpoints:**
- Status: [ ] ✅ All Working / [ ] ⚠️ Issues Found
- Notes:

**Overall Status:**
- [ ] ✅ Ready for Production
- [ ] ⚠️ Needs Minor Fixes
- [ ] ❌ Needs Major Work

---

## 🚀 Next Steps

After testing:
1. Document all bugs in GitHub Issue #77
2. Report completion to team in Slack #gunting
3. Commit any fixes:
   ```bash
   git add -A
   git commit -m "GUNTING-NOVA: [description of fixes]"
   git push origin Gunting-Project-Scissor
   ```

---

## ⏱️ Time Tracking

- Start Time: _______
- End Time: _______
- Total Duration: _______
- Issues Found: _______
- Issues Fixed: _______

---

**Good luck, Nova! You got this! 🤖✂️🔥**

