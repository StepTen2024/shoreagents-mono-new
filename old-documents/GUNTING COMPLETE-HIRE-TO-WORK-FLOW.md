# 🎯 COMPLETE HIRE-TO-WORK FLOW

## The Full Journey: Candidate → Staff Member Ready to Work

---

## 📊 THE COMPLETE FLOW:

```
1. RECRUITMENT
   ↓
2. INTERVIEW REQUEST
   ↓
3. INTERVIEW COORDINATION (Admin)
   ↓
4. INTERVIEW HAPPENS
   ↓
5. CLIENT DECISION (Hire/Reject)
   ↓
6. JOB OFFER & ACCEPTANCE
   ↓
7. CONTRACT GENERATION ✂️ (GUNTING STARTS HERE)
   ↓
8. CONTRACT SIGNING
   ↓
9. ONBOARDING (8 Steps) ✂️ (GUNTING CORE)
   ↓
10. WELCOME FORM ("Get to Know You")
   ↓
11. READY TO WORK! 🎉
```

---

## 🔥 STEP-BY-STEP BREAKDOWN:

### 1️⃣ **RECRUITMENT PHASE**

**Location:** `/client/recruitment`

**What Happens:**
- Client views **Talent Pool** (all available candidates from BPOC database)
- OR Client views **Applicants** (candidates who applied to their specific jobs)
- Candidates pulled from **BPOC Candidate Database**
- All candidate info stored in system

**Tables:**
- `candidates` (from BPOC)
- `applications` (who applied to what)

**Test:**
- ✅ View candidates in talent pool
- ✅ View applicants for specific jobs
- ✅ See candidate profiles

---

### 2️⃣ **INTERVIEW REQUEST**

**Location:** Client clicks "Request Interview" on candidate

**What Happens:**
- Client selects candidate
- Picks preferred interview times
- Adds notes about what they're looking for
- System creates interview request

**Tables:**
- `interview_requests` ✅ **JUST FIXED!**

**Test:**
- ✅ Client requests interview (should work now!)
- ✅ Interview request saved with candidate info
- ✅ Preferred times recorded

---

### 3️⃣ **ADMIN COORDINATION**

**Location:** `/admin/recruitment` (Dashboard)

**What Happens:**
- Admin sees ALL applicants
- Admin sees ALL interview requests
- Admin coordinates with candidate
- Admin sets ACTUAL interview time
- Interview scheduled

**Tables:**
- `interviews` (scheduled interviews)
- `interview_requests` (pending requests)
- `applications` (all applicants)

**Test:**
- ✅ Admin sees interview requests
- ✅ Admin can schedule interview
- ✅ Interview shows in dashboard

---

### 4️⃣ **INTERVIEW HAPPENS**

**Location:** Client dashboard - Interviews Section

**What Happens:**
- Client sees scheduled interviews
- Interview takes place (external)
- Client makes decision

**Tables:**
- `interviews` (with status updates)

**Test:**
- ✅ Client sees scheduled interviews
- ✅ Interview list displays correctly

---

### 5️⃣ **CLIENT DECISION**

**Location:** Client dashboard after interview

**What Happens:**
- Client clicks **HIRE** or **REJECT**
- If HIRE → Admin gets notified
- If REJECT → Interview closed

**Tables:**
- `interviews` (status: hired/rejected)
- Notifications sent to admin

**Test:**
- ✅ Client can mark as hired
- ✅ Client can reject
- ✅ Admin notified on hire

---

### 6️⃣ **JOB OFFER & ACCEPTANCE**

**Location:** Admin calls candidate

**What Happens:**
- Admin calls candidate to finalize terms
- Discuss: Start date, Salary, HMO, Benefits, etc.
- Candidate accepts job
- System creates job acceptance record

**Two Options:**

**Option A: Candidate Signs Up (Automatic)**
- Candidate signs up to portal
- System pulls candidate data from BPOC
- Auto-fills contract details

**Option B: Admin Manual Entry**
- Admin enters job details manually:
  - Start Date
  - Salary
  - HMO status
  - Candidate Name
  - Candidate Address
  - Basic info needed for contract

**Tables:**
- `job_acceptance` (accepted jobs)
- `candidates` (source of candidate info)

**Test:**
- ✅ Admin can create job acceptance
- ✅ Candidate info pulled from BPOC
- ✅ OR Admin can enter manually

---

### 7️⃣ **CONTRACT GENERATION** ✂️ **[GUNTING STARTS]**

**Location:** Admin triggers contract creation

**What Happens:**
- System takes job acceptance data
- Takes candidate details (name, address, etc.)
- Generates employment contract HTML
- Contract includes:
  - Job title, salary, start date
  - Company details
  - Terms and conditions
  - Signature section
- Contract saved and sent to candidate

**Tables:**
- `employment_contract` (generated contract)
- Links to `staff_users` (now candidate becomes staff)

**Test:**
- ✅ Contract generates from job acceptance
- ✅ All details pulled correctly
- ✅ Contract HTML renders properly

---

### 8️⃣ **CONTRACT SIGNING**

**Location:** `/staff/contract`

**What Happens:**
- Candidate (now Staff User) logs in
- Views employment contract
- Reviews all terms
- Signs contract digitally
- System notified contract signed

**Tables:**
- `employment_contract` (signed = true)
- `staff_users` (onboarding can begin)

**Test:**
- ✅ Staff can view contract
- ✅ Contract displays correctly
- ✅ Signature capture works
- ✅ Contract marked as signed

---

### 9️⃣ **ONBOARDING (8 STEPS)** ✂️ **[GUNTING CORE]**

**Location:** `/staff/onboarding`

**What Happens:**
Staff completes all 8 steps:

1. **Personal Info**
   - SSS, TIN, PhilHealth, Pag-IBIG
   - Name, gender, civil status
   - Date of birth, contact

2. **Resume Upload**
   - Upload resume file
   - Stored in Supabase

3. **Government ID**
   - Upload valid ID
   - Stored securely

4. **Education**
   - Add education records
   - Degree, institution, year

5. **Medical Info**
   - Medical conditions
   - Allergies
   - Medications

6. **Data Privacy**
   - Privacy consents
   - Marketing consent
   - Third-party consent

7. **Signature**
   - Digital signature
   - For onboarding verification

8. **Emergency Contact**
   - Emergency contact details
   - Alternative contact

**Tables:**
- `staff_onboarding` (all onboarding data)
- `education_records` (education entries)

**Admin Verification:**
- Admin reviews each section
- Can APPROVE or REJECT each
- If rejected, sends feedback
- Staff fixes and resubmits
- Once all 8 APPROVED → Complete onboarding

**Test:**
- ✅ All 8 steps work
- ✅ File uploads work (resume, ID)
- ✅ Data saves correctly
- ✅ Admin can view all sections
- ✅ Admin can approve/reject
- ✅ Feedback system works
- ✅ Complete onboarding triggers next step

---

### 🔟 **WELCOME FORM ("Get to Know You")**

**Location:** Triggered after onboarding complete

**What Happens:**
- Staff fills "Get to Know You" form
- Fun questions (favorite food, hobbies, etc.)
- Team building info
- Helps integrate into company culture

**Tables:**
- `staff_welcome_form` (welcome form data)

**Test:**
- ✅ Form appears after onboarding
- ✅ Questions display
- ✅ Staff can submit
- ✅ Data saved

---

### 1️⃣1️⃣ **READY TO WORK!** 🎉

**What Happens:**
- Staff profile fully set up
- All paperwork complete
- Ready for first day
- Can access full staff portal

**Final Status:**
- ✅ Contract signed
- ✅ Onboarding complete
- ✅ Welcome form done
- ✅ Staff user ACTIVE

---

## 🧪 COMPLETE FLOW TESTING CHECKLIST:

### ✅ **Phase 1: Recruitment → Interview**
- [ ] View talent pool candidates
- [ ] View job applicants
- [ ] Request interview with candidate (**NOW WORKS!**)
- [ ] Admin sees interview requests
- [ ] Admin schedules interview
- [ ] Client sees scheduled interviews

### ✅ **Phase 2: Hire → Job Acceptance**
- [ ] Client marks candidate as HIRED
- [ ] Admin gets notification
- [ ] Admin creates job acceptance (manual entry or auto-pull)
- [ ] Job details recorded (start date, salary, etc.)
- [ ] Candidate address and info saved

### ✅ **Phase 3: Contract → Signing**
- [ ] System generates employment contract
- [ ] Contract pulls data from job acceptance
- [ ] Staff user can log in
- [ ] Staff views contract at `/staff/contract`
- [ ] Staff signs contract
- [ ] Contract marked as signed

### ✅ **Phase 4: Onboarding (GUNTING)**
- [ ] Staff redirected to `/staff/onboarding`
- [ ] Complete all 8 onboarding steps
- [ ] Admin views at `/admin/staff/onboarding`
- [ ] Admin approves all 8 sections
- [ ] Admin clicks "Complete Onboarding"
- [ ] Welcome form created

### ✅ **Phase 5: Welcome → Ready**
- [ ] Staff fills welcome form
- [ ] Form submitted
- [ ] Staff status: ACTIVE
- [ ] Staff can access full portal

---

## 🗄️ DATABASE TABLES INVOLVED:

```
RECRUITMENT:
├── candidates (BPOC)
├── applications
└── interview_requests ✅

INTERVIEWS:
└── interviews

HIRING:
├── job_acceptance
└── employment_contract

ONBOARDING (GUNTING):
├── staff_users
├── staff_onboarding
├── education_records
└── staff_welcome_form

ONGOING:
├── staff_profile
├── time_entries
├── breaks
└── performance_metrics
```

---

## 🎯 TESTING PRIORITY:

**1. Fix Interview Requests** ✅ **DONE!**

**2. Test Recruitment → Hire Flow**
   - Interview request
   - Admin scheduling
   - Client hire decision

**3. Test Job Acceptance → Contract**
   - Create job acceptance
   - Generate contract
   - Staff signs contract

**4. Test GUNTING Onboarding**
   - All 8 steps
   - Admin verification
   - Complete onboarding

**5. Test Welcome Form**
   - Form displays
   - Submit works
   - Staff ready

---

## 🚀 LET'S TEST THE FULL FLOW!

**Starting Point:**
```
http://localhost:3000/client/recruitment
```

**End Point:**
```
Staff Status: ACTIVE & READY TO WORK! 🎉
```

---

**Last Updated:** October 23, 2025  
**Status:** Database fixed, ready for full flow testing! ✂️🔥

