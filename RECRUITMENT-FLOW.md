# 🎯 RECRUITMENT FLOW - Complete System Overview

**Last Updated:** November 6, 2025  
**Status:** ✅ FULLY OPERATIONAL

---

## 📊 SYSTEM ARCHITECTURE

### **3 DATABASES:**
1. **Shore Agents DB (Supabase/PostgreSQL)** - Interview requests, job acceptances, staff records
2. **BPOC Database** - 26 pre-vetted candidates with resumes, assessments, DISC profiles
3. **Auth System** - NextAuth.js 5 + Supabase Auth

### **3 PORTALS:**
1. **Client Portal** (`/client/recruitment`) - Request interviews, post jobs, manage candidates
2. **Admin Portal** (`/admin/recruitment`) - Review candidates, schedule interviews, send offers, finalize hires
3. **Staff Portal** - Sign up after job acceptance (onboarding)

---

## 🔄 COMPLETE RECRUITMENT WORKFLOW

### **PHASE 1: CLIENT DISCOVERS TALENT** 👔

**Client Portal: `/client/recruitment`**

**Tab 1: Talent Pool** 🔍
- Browse 26 pre-vetted candidates from BPOC database
- Search by skills, location, DISC type
- View candidate profiles:
  - Resume, experience, education
  - DISC personality scores (D, I, S, C)
  - Typing speed & accuracy
  - AI assessments & career path analysis
  - Cultural fit scores
  - Salary expectations
  
**Actions:**
- **"Request Interview"** → Creates `interview_requests` record with:
  - `clientUserId` (who's hiring)
  - `bpocCandidateId` (from BPOC database)
  - `candidateFirstName`
  - `preferredTimes` (3 time slots in client's timezone)
  - `clientNotes` (why they want this candidate)
  - `workSchedule` (Mon-Fri 9-6 or custom)
  - `status: PENDING`

**Tab 2: Job Requests** 📋
- Create job postings for BPOC candidates to apply
- Stored in BPOC `job_requests` table
- Not directly connected to Shore Agents hiring flow yet

**Tab 3: Interviews** 📅
- View all interview requests
- Track status: `PENDING`, `SCHEDULED`, `COMPLETED`, `OFFER_SENT`, etc.
- **Actions:**
  - Request to Hire (sends work schedule to admin)
  - Reject candidate (with reason)
  - Cancel interview
  - Reschedule
  - Add notes

---

### **PHASE 2: ADMIN REVIEWS & SCHEDULES** 👨‍💼

**Admin Portal: `/admin/recruitment`**

**Tab 1: Candidates** 🔍
- Same 26 BPOC candidates
- Advanced filters (skills, location, DISC)
- Click candidate → Full profile at `/admin/recruitment/candidate/[id]`
  - **5 Tabs:**
    1. Overview - Bio, location, scores
    2. Resume - Experience, education, skills, certifications
    3. Assessments - DISC scores, cultural fit, typing tests
    4. AI Insights - Strengths, career path, salary analysis
    5. Contact - Email, phone

**Tab 2: Job Requests** 📋
- View all BPOC job postings
- (Not main hiring flow)

**Tab 3: Interviews** 📅
- All `interview_requests` from database
- **Status Pipeline:**
  1. **PENDING** - New request from client
  2. **SCHEDULED** - Admin set meeting time
  3. **COMPLETED** - Interview done
  4. **OFFER_SENT** - Job offer sent to candidate
  5. **OFFER_ACCEPTED** - Candidate accepted
  6. **HIRED** - Finalized, ready for onboarding
  7. **REJECTED** - Client/admin rejected
  8. **CANCELLED** - Client cancelled

**Admin Actions:**

1. **Schedule Interview**
   - Click "Schedule" on PENDING interview
   - Choose from client's 3 preferred times
   - Add meeting link (Zoom, Meet, etc.)
   - Status → `SCHEDULED`
   - API: `POST /api/admin/recruitment/interviews/[id]/schedule`

2. **Mark Complete**
   - After interview, mark as `COMPLETED`
   - Add admin notes
   - API: `POST /api/admin/recruitment/interviews/[id]/complete`

3. **Send Job Offer** 🎉
   - Click "Send Offer" on COMPLETED interview
   - **Modal opens with:**
     - Candidate email (from BPOC)
     - Position
     - Company
     - Salary (e.g., ₱40,000/month)
     - Shift type (DAY_SHIFT, NIGHT_SHIFT, etc.)
     - Work location (WORK_FROM_HOME, HYBRID, OFFICE)
     - HMO included? (true/false)
     - Leave credits (default 12 days)
     - Client timezone (UTC+8)
     - Work hours (9 hours with breaks)
     - Work schedule (Mon-Fri 9-6 or custom)
     - Preferred start date
   
   - **What happens:**
     - Creates `job_acceptances` record
     - Updates `interview_requests.status` → `OFFER_SENT`
     - Sets `offerSentAt`, `hireRequestedAt`, `hireRequestedBy: 'admin'`
     - Stores work schedule in `job_acceptances` (workDays, workStartTime, workEndTime, clientTimezone)
     - Generates offer link: `/offer/accept?jobId=[uuid]`
     - **TODO:** Send email to candidate with offer details + link
   
   - API: `POST /api/admin/recruitment/interviews/hire`

4. **Candidate Accepts Offer** (Manual for now)
   - Admin marks interview as `OFFER_ACCEPTED`
   - API: `POST /api/admin/recruitment/interviews/confirm-acceptance`

5. **Finalize Hire** 🎯
   - Click "Finalize Hire" on OFFER_ACCEPTED interview
   - **Modal:**
     - Final start date
     - Staff email (for signup)
     - Admin notes
   
   - **What happens:**
     - Updates `interview_requests.status` → `HIRED`
     - Sets `finalStartDate`
     - Updates `job_acceptances` with staff email
     - Adds hire note to `adminNotes`
     - **Prepares for staff signup:** Staff will create account with this email, system auto-matches
   
   - API: `POST /api/admin/recruitment/interviews/finalize-hire`

---

### **PHASE 3: STAFF ONBOARDING** 🚀

**After Finalize Hire:**

1. **Staff receives email** (when implemented)
   - "Congratulations! You've been hired by [Company]"
   - Position, start date, work schedule
   - "Create your account: [signup link]"

2. **Staff signs up at `/login/staff`**
   - Uses email from `job_acceptances.candidateEmail`
   - System finds matching `job_acceptances` record
   - Creates `staff_users` record
   - Links `job_acceptances.staffUserId` → `staff_users.id`
   - Creates `staff_profiles` with work schedule from `job_acceptances`

3. **Staff completes onboarding**
   - 5-step wizard (Personal Info, Gov IDs, Documents, Signature, Emergency Contact)
   - Files uploaded to Supabase Storage
   - Progress tracked in `staff_onboarding_submissions`
   - Admin verifies each section
   - After all 5 approvals → Staff can work! 🎉

---

## 🗄️ DATABASE SCHEMA

### **`interview_requests`** (Shore Agents DB)
```prisma
model interview_requests {
  id                   String                 @id
  clientUserId         String                 // Who's hiring
  bpocCandidateId      String                 // Candidate from BPOC
  candidateFirstName   String
  preferredTimes       Json                   // 3 time slots
  clientNotes          String?
  adminNotes           String?
  clientPreferredStart DateTime?
  finalStartDate       DateTime?
  hireRequestedAt      DateTime?
  hireRequestedBy      String?                // 'admin' or 'client'
  meetingLink          String?
  offerDeclineReason   String?
  offerResponseAt      DateTime?
  offerSentAt          DateTime?
  scheduledTime        DateTime?
  status               InterviewRequestStatus @default(PENDING)
  workSchedule         Json?                  // Client's work schedule
  createdAt            DateTime               @default(now())
  updatedAt            DateTime
  
  client_users         client_users           @relation(...)
  job_acceptances      job_acceptances?
}
```

**Status Flow:**
```
PENDING → SCHEDULED → COMPLETED → OFFER_SENT → OFFER_ACCEPTED → HIRED
         ↘ CANCELLED / REJECTED ↙
```

### **`job_acceptances`** (Shore Agents DB)
```prisma
model job_acceptances {
  id                   String                @id
  interviewRequestId   String                @unique
  bpocCandidateId      String
  candidateEmail       String                // For staff signup
  candidatePhone       String?
  position             String
  companyId            String
  acceptedByAdminId    String                // Admin who sent offer
  acceptedAt           DateTime              @default(now())
  signupEmailSent      Boolean               @default(false)
  signupEmailSentAt    DateTime?
  staffUserId          String?               @unique // After signup
  contractSigned       Boolean               @default(false)
  contractSignedAt     DateTime?
  
  // Work Schedule (from client hire request)
  clientTimezone       String                @default("UTC")
  isDefaultSchedule    Boolean               @default(true)
  workDays             String[]              @default(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"])
  workStartTime        String                @default("09:00")
  workEndTime          String                @default("18:00")
  
  createdAt            DateTime              @default(now())
  updatedAt            DateTime
  
  company              company               @relation(...)
  interview_requests   interview_requests    @relation(...)
  staff_users          staff_users?          @relation(...)
  employment_contracts employment_contracts?
}
```

### **Candidates Table** (BPOC Database - External)
```sql
-- 26 pre-vetted candidates
CREATE TABLE candidates (
  id UUID PRIMARY KEY,
  first_name VARCHAR,
  last_name VARCHAR,
  email VARCHAR UNIQUE,
  phone VARCHAR,
  avatar_url VARCHAR,
  bio TEXT,
  position VARCHAR,
  location_city VARCHAR,
  location_country VARCHAR,
  
  -- Resume data (JSON)
  resume_data JSONB, -- { skills: [], experience: [], education: [], certifications: [], languages: [] }
  
  -- DISC Assessment
  latest_primary_type VARCHAR, -- 'D', 'I', 'S', 'C'
  latest_secondary_type VARCHAR,
  d_score FLOAT,
  i_score FLOAT,
  s_score FLOAT,
  c_score FLOAT,
  
  -- Cultural Fit
  cultural_results JSONB,
  cultural_summary TEXT,
  
  -- Typing Test
  typing_wpm INT,
  typing_accuracy FLOAT,
  typing_best_wpm INT,
  typing_best_accuracy FLOAT,
  
  -- AI Analysis
  ai_overall_score FLOAT,
  ai_key_strengths JSONB, -- ["Strength 1", "Strength 2"]
  ai_strengths_analysis TEXT,
  ai_improved_summary TEXT,
  ai_salary_analysis JSONB,
  ai_career_path JSONB, -- { currentRole, nextCareerSteps, timeframe, skillsNeeded }
  
  -- Scores
  leaderboard_score INT,
  overall_score FLOAT,
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

---

## 🔑 KEY API ENDPOINTS

### **Client APIs**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/client/interviews/request` | POST | Create interview request |
| `/api/client/interviews` | GET | List client's interview requests |
| `/api/client/interviews/hire-request` | POST | Request to hire candidate |
| `/api/client/interviews/reject` | POST | Reject candidate |
| `/api/client/interviews/[id]/cancel` | PATCH | Cancel interview |
| `/api/client/interviews/[id]/reschedule-request` | POST | Request new time |
| `/api/client/interviews/[id]/notes` | PATCH | Update client notes |
| `/api/client/job-requests` | POST | Create job posting |

### **Admin APIs**
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/recruitment/candidates` | GET | List 26 BPOC candidates |
| `/api/admin/recruitment/candidates/[id]` | GET | Get candidate details |
| `/api/admin/recruitment/interviews` | GET | List all interview requests |
| `/api/admin/recruitment/interviews/[id]/schedule` | POST | Schedule interview time |
| `/api/admin/recruitment/interviews/[id]/complete` | POST | Mark interview complete |
| `/api/admin/recruitment/interviews/[id]/notes` | POST | Update admin notes |
| `/api/admin/recruitment/interviews/hire` | POST | **Send job offer** |
| `/api/admin/recruitment/interviews/confirm-acceptance` | POST | Mark offer as accepted |
| `/api/admin/recruitment/interviews/finalize-hire` | POST | **Finalize hire** |
| `/api/admin/recruitment/interviews/[id]/cancel` | POST | Cancel interview |
| `/api/admin/recruitment/interviews/[id]/undo-cancel` | POST | Undo cancellation |
| `/api/admin/recruitment/job-requests` | GET | List BPOC job postings |

---

## 🎨 UI COMPONENTS

### **Client Recruitment Page**
- `app/client/recruitment/page.tsx`
- 3 tabs: Talent Pool, Job Requests, Interviews
- Features:
  - Candidate search & filters
  - Interview request modal
  - Hire request modal (work schedule)
  - Reject modal
  - Interview timeline with status badges

### **Admin Recruitment Page**
- `app/admin/recruitment/page.tsx`
- 3 tabs: Candidates, Job Requests, Interviews
- Features:
  - Advanced candidate filtering
  - `RecruitmentCandidatesTab` component
  - Interview scheduling modal
  - Job offer modal (comprehensive details)
  - Finalize hire modal
  - Admin notes tracking

### **Candidate Profile Page**
- `app/admin/recruitment/candidate/[id]/page.tsx`
- 5 tabs: Overview, Resume, Assessments, AI Insights, Contact
- Full candidate data from BPOC
- JSON parsing for nested data
- Empty state handling

---

## ⚠️ KNOWN GAPS & TODO

### **Email System** 📧
- ❌ No email sent when job offer created
- ❌ No email sent when candidate should sign up
- ❌ Candidate can't accept/decline offer via email link
- **Solution:** Implement Resend or SendGrid for:
  1. Offer email to candidate
  2. Signup invitation after finalization
  3. Interview reminders

### **Candidate Self-Service** 🙋
- ❌ Candidates can't accept/decline offers themselves
- ❌ No `/offer/accept?jobId=[uuid]` page built
- **Workaround:** Admin manually marks as `OFFER_ACCEPTED`

### **Job Requests → Hiring** 📋
- ❌ BPOC job postings not integrated with hiring flow
- ❌ Clients can post jobs but can't hire from applications
- **Potential:** Connect job applicants to interview requests

### **Contract Generation** 📄
- ⚠️ `employment_contracts` table exists but not auto-generated
- **TODO:** Generate PDF contract after hire finalization

---

## ✅ WHAT WORKS PERFECTLY

1. **✅ Client can browse 26 BPOC candidates**
2. **✅ Client can request interviews with work schedule**
3. **✅ Admin can view all candidates & interview requests**
4. **✅ Admin can schedule interviews**
5. **✅ Admin can send comprehensive job offers**
6. **✅ Work schedule flows from client → admin → job_acceptances → staff_profiles**
7. **✅ Admin can finalize hire with start date & staff email**
8. **✅ Staff onboarding ready to go (5-step wizard fully functional)**

---

## 🔐 SECURITY & PERMISSIONS

### **Client Portal**
- Can only see their own interview requests
- Can only create requests for their company
- Can't access other companies' data

### **Admin Portal**
- `ADMIN` or `MANAGER` role required
- Can view ALL interview requests
- Can send offers & finalize hires
- Full candidate database access

### **Staff Portal**
- Can only access after signup
- Email must match `job_acceptances.candidateEmail`
- Auto-linked to company via `companyId`

---

## 📊 STATUS TRACKING

### **Interview Request Status**
```typescript
enum InterviewRequestStatus {
  PENDING          // Client submitted, waiting for admin
  SCHEDULED        // Admin set meeting time
  COMPLETED        // Interview done
  OFFER_SENT       // Admin sent job offer
  OFFER_ACCEPTED   // Candidate accepted offer
  OFFER_DECLINED   // Candidate declined offer
  HIRED            // Finalized, ready for onboarding
  REJECTED         // Client/admin rejected
  CANCELLED        // Client cancelled
}
```

### **Activity Log**
All actions logged in:
- `interview_requests.adminNotes` (timestamped)
- `interview_requests.clientNotes`
- Console logs with emojis 🎉📧✅

---

## 🚀 DEPLOYMENT NOTES

### **Environment Variables Required**
```env
# Shore Agents Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# BPOC Database (External)
BPOC_DATABASE_URL="postgresql://bpoc-readonly@..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."

# Supabase Storage (for onboarding files)
NEXT_PUBLIC_SUPABASE_URL="..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
```

### **Database Connections**
1. **Prisma** → Shore Agents DB (Supabase)
2. **pg Pool** → BPOC DB (read-only access)

---

## 🎯 RECOMMENDED TESTING FLOW

1. **Login as Client** → `/client/recruitment`
2. Browse candidates → Request interview with "John Doe"
3. **Login as Admin** → `/admin/recruitment`
4. View interview in "Interviews" tab
5. Schedule interview → Add Zoom link
6. Mark as COMPLETED
7. Send job offer → Fill all details
8. Manually mark as OFFER_ACCEPTED (until email works)
9. Finalize hire → Set start date & staff email
10. **Staff creates account** → Auto-links to `job_acceptances`
11. Complete onboarding → Admin verifies all 5 sections
12. **Staff ready to work!** 🎉

---

**End of Documentation** ✅

