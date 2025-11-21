# Recruitment Flow - Job Requests Implementation & Issues

**Date**: November 20, 2024  
**Status**: Partial Implementation - Client Side Complete, Admin Side In Progress  
**Branch**: `stepten-deployed`

---

## 🎯 **OBJECTIVE**

Implement a complete recruitment flow where:
1. **Clients** can create job requests and see applicants from the BPOC talent pool
2. **BPOC Candidates** can apply to jobs
3. **Clients** can interview candidates
4. **Admins** can oversee all job requests, see which clients/companies they belong to, and view all applicants

---

## 🗄️ **DATABASE ARCHITECTURE**

### **Two Database System:**

#### **1. Shore Agents DB (Supabase)**
- Primary application database
- Tables: `companies`, `client_users`, `staff_users`, `interview_requests`, `job_acceptances`
- Connection: `DATABASE_URL` environment variable

#### **2. BPOC Database (Railway PostgreSQL)**
- Pre-vetted candidates and job applications
- Tables: `candidates`, `job_requests`, `applications`
- Connection: `BPOC_DATABASE_URL` environment variable

### **Critical Data Relationships:**

```
Shore Agents DB              BPOC Database
┌─────────────┐             ┌──────────────┐
│ companies   │────────────>│ job_requests │
│ id (UUID)   │  linked by  │ company_id   │
└─────────────┘             └──────────────┘
                                    │
                                    │ linked by job_id
                                    ▼
                            ┌──────────────┐
                            │ applications │
                            │ job_id (int) │
                            └──────────────┘
                                    │
                                    │ linked by candidate_id
                                    ▼
                            ┌──────────────┐
                            │ candidates   │
                            │ id           │
                            └──────────────┘
```

**KEY MAPPING:**
- `job_requests.company_id` (BPOC) = `companies.id` (Shore Agents)
- `applications.job_id` = `job_requests.id` (BPOC)
- `applications.candidate_id` = `candidates.id` (BPOC)

---

## ✅ **COMPLETED: CLIENT PORTAL**

### **Location:** `/app/client/recruitment/page.tsx`

### **Features Implemented:**

1. **✅ Data Filtering Fix**
   - **Problem**: All clients saw ALL job requests from BPOC database
   - **Solution**: Modified `/app/api/client/job-requests/route.ts` to filter by `clientUser.companyId`
   - **Result**: Clients now only see their own job requests

2. **✅ UI Styling Overhaul**
   - Implemented empty state with gradient icon
   - Redesigned job request form with consistent Client Portal styling
   - Fixed "Add" buttons in form (changed from black to outlined with dashed borders)
   - Added clear headers and descriptions

3. **✅ Applicant Counts**
   - Implemented `getApplicationCounts()` in `lib/bpoc-db.ts`
   - Fetches real application counts from BPOC database
   - Displays correct number of applicants per job

4. **✅ Job Details Modal**
   - Shows full job description, requirements, responsibilities
   - Lists all applicants with cover letters and profiles
   - Links to applicant profiles

### **Files Modified:**
- ✅ `/app/client/recruitment/page.tsx` - UI and modal implementation
- ✅ `/app/api/client/job-requests/route.ts` - Data filtering and applicant counts
- ✅ `/app/api/client/job-requests/[id]/applications/route.ts` - NEW: Fetch applications for modal
- ✅ `/lib/bpoc-db.ts` - Added `getApplicationCounts()` and `getApplicationsForJobRequest()`

### **What Client Portal Shows:**
- ✅ Only their own job requests
- ✅ Number of applicants per job
- ✅ Job details modal with full information
- ✅ List of applicants with profiles and cover letters

---

## 🚧 **IN PROGRESS: ADMIN PORTAL**

### **Location:** `/app/admin/recruitment/page.tsx`

### **Goal:**
Admin should see:
1. **All job requests** from BPOC database
2. **Which company** each job belongs to (e.g., "StepTen Inc")
3. **Which client user** created it (e.g., "Stephen Atcheler")
4. **Number of applicants** for each job
5. **Full applicant details** when viewing a job

### **Current Implementation:**

#### **Files Modified:**
- `/app/admin/recruitment/page.tsx` - UI with job cards and modal
- `/app/api/admin/recruitment/job-requests/route.ts` - Fetch all jobs with enrichment
- `/app/api/admin/recruitment/job-requests/[id]/route.ts` - NEW: Fetch single job with details

#### **Logic:**
1. Fetch all job requests from BPOC database
2. For each job, use `job_requests.company_id` to query Shore Agents `companies` table
3. Fetch related `client_users` from Shore Agents database
4. Fetch application counts from BPOC `applications` table
5. Return enriched data with company name, client name, and applicant counts

---

## ❌ **CURRENT BLOCKING ERROR**

### **Error Message:**
```
❌ [ADMIN] Error enriching job 116: TypeError: Cannot read properties of undefined (reading 'findUnique')
    at eval (webpack-internal:///(rsc)/./app/api/admin/recruitment/job-requests/route.ts:73:56)
```

### **Problem Analysis:**

#### **What's Happening:**
- `prisma` object is `undefined` in the Admin API routes
- This happens despite importing `PrismaClient` and instantiating it
- Webpack is not correctly bundling the Prisma client for these specific routes

#### **What We Tried:**

1. **✅ Import from `@/lib/prisma`**
   ```typescript
   import { prisma } from '@/lib/prisma'
   ```
   - **Result**: Still undefined in webpack build

2. **✅ Direct PrismaClient instantiation**
   ```typescript
   import { PrismaClient } from '@prisma/client'
   const prisma = new PrismaClient()
   ```
   - **Result**: Still undefined in webpack build

3. **✅ Prisma regeneration**
   ```bash
   npx prisma generate
   ```
   - **Result**: No change

4. **✅ Multiple cache clears**
   ```bash
   rm -rf .next node_modules/.cache
   ```
   - **Result**: Webpack still bundles undefined prisma

#### **Confirmed Working in Other Routes:**
- ✅ `/app/api/client/job-requests/route.ts` - Prisma works fine
- ✅ `/app/api/time-tracking/status/route.ts` - Prisma works fine
- ✅ All other API routes - Prisma works fine

### **Theory:**
There may be something specific about:
- The admin recruitment route structure
- The combination of BPOC Pool + Prisma in the same file
- Webpack's module resolution for this specific path

---

## 📊 **DATA FLOW: WHAT EACH PORTAL NEEDS**

### **CLIENT PORTAL - Job Requests Tab**

**Should Display:**
```
┌────────────────────────────────────┐
│  Your Job Requests                 │
│  [+ New Job Request]               │
├────────────────────────────────────┤
│                                    │
│  📋 UI/UX Designer                 │
│  Posted: 2 days ago                │
│  1 applicants | [View Details]    │
│                                    │
│  📋 Senior Developer               │
│  Posted: 5 days ago                │
│  3 applicants | [View Details]    │
│                                    │
└────────────────────────────────────┘
```

**Modal - Job Details:**
```
┌────────────────────────────────────┐
│  UI/UX Designer & Multimedia       │
│                                    │
│  Description: ...                  │
│  Requirements: ...                 │
│  Responsibilities: ...             │
│                                    │
│  Applicants (1):                   │
│  ┌──────────────────────────────┐ │
│  │ 👤 Lovell Smith              │ │
│  │ Full Stack Developer         │ │
│  │ Cover Letter: ...            │ │
│  │ [View Profile]               │ │
│  └──────────────────────────────┘ │
└────────────────────────────────────┘
```

---

### **ADMIN PORTAL - Job Requests Tab**

**Should Display:**
```
┌─────────────────────────────────────────┐
│  All Job Requests                       │
├─────────────────────────────────────────┤
│                                         │
│  📋 UI/UX Designer                      │
│  🏢 Company: StepTen Inc                │
│  👤 Client: Stephen Atcheler           │
│  📧 stephen@stepten.com                 │
│  1 applicants | [View]                  │
│                                         │
│  📋 Marketing Manager                   │
│  🏢 Company: Tech Solutions LLC         │
│  👤 Client: Jane Doe                    │
│  📧 jane@techsolutions.com              │
│  3 applicants | [View]                  │
│                                         │
└─────────────────────────────────────────┘
```

**Modal - Job Details (Admin View):**
```
┌─────────────────────────────────────────┐
│  UI/UX Designer & Multimedia            │
│                                         │
│  🏢 Company: StepTen Inc                │
│  📧 Company Email: hello@stepten.com    │
│                                         │
│  👤 Requested by: Stephen Atcheler     │
│  📧 stephen@stepten.com                 │
│                                         │
│  Job Details: ...                       │
│                                         │
│  Applicants (1):                        │
│  ┌───────────────────────────────────┐ │
│  │ 👤 Lovell Smith                   │ │
│  │ 🎯 Full Stack Developer           │ │
│  │ 📧 lovell@email.com               │ │
│  │ 📄 Cover Letter: ...              │ │
│  │ ✅ Status: Applied                │ │
│  │ 📅 Applied: Nov 18, 2024          │ │
│  │ [View Full Profile]               │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 🔧 **NEXT STEPS TO COMPLETE ADMIN SIDE**

### **Option 1: Debug Prisma Webpack Issue**
- Investigate why webpack bundles `prisma` as undefined in this specific route
- Check Next.js config, webpack externals, or module resolution
- May need to add specific webpack configuration

### **Option 2: Alternative Approach - Direct Supabase Connection**
- Instead of using Prisma in admin routes, use direct PostgreSQL queries
- Similar to how we handle BPOC database with `pg.Pool`
- Create a separate Shore Agents Pool connection

### **Option 3: Combine Queries in Working Route**
- Move the admin enrichment logic to a route where Prisma works
- Export a helper function that both routes can use

---

## 📝 **KEY LEARNINGS**

1. **Two-Database Architecture Works**
   - Successfully querying both BPOC and Shore Agents databases
   - UUID to UUID mapping works correctly
   - `pg.Pool` for BPOC is stable and fast

2. **Column Name Discovery**
   - BPOC `applications` table uses `job_id` (not `job_request_id`)
   - Dynamic column detection helped identify this

3. **Client Side Implementation is Solid**
   - Data filtering works perfectly
   - UI is consistent and polished
   - Modal with applicant details functions correctly

4. **Webpack/Prisma Mystery**
   - Prisma works in 95% of routes
   - Specific combination of admin + recruitment routes causes issue
   - Cache clearing doesn't resolve it

---

## 📋 **FILES CHANGED IN THIS SESSION**

### **Client Portal:**
- ✅ `/app/client/recruitment/page.tsx`
- ✅ `/app/api/client/job-requests/route.ts`
- ✅ `/app/api/client/job-requests/[id]/applications/route.ts` (NEW)

### **Admin Portal:**
- 🚧 `/app/admin/recruitment/page.tsx`
- 🚧 `/app/api/admin/recruitment/job-requests/route.ts`
- 🚧 `/app/api/admin/recruitment/job-requests/[id]/route.ts` (NEW)

### **Shared:**
- ✅ `/lib/bpoc-db.ts` - Added application fetching functions

### **Temporary (Deleted):**
- `/app/api/admin/debug-bpoc/route.ts` - Used for schema debugging, then removed

---

## 🎯 **SUCCESS CRITERIA**

### **Client Portal** ✅
- [x] Show only client's own job requests
- [x] Display accurate applicant counts
- [x] Open modal with job details
- [x] Show applicant profiles and cover letters
- [x] Consistent UI/UX with rest of Client Portal

### **Admin Portal** 🚧
- [x] Fetch all job requests from BPOC
- [x] Fetch applicant counts accurately
- [ ] Display company name for each job (Prisma error blocking)
- [ ] Display client user name and email (Prisma error blocking)
- [ ] Open modal with full job details (Prisma error blocking)
- [ ] Show all applicants with profiles (Partially working)

---

## 💡 **RECOMMENDATION**

**Use Option 2 (Direct Supabase Connection) for Admin Routes:**

Instead of fighting the Prisma webpack issue, implement a parallel connection:

```typescript
import { Pool } from 'pg'

const shoreAgentsPool = new Pool({
  connectionString: process.env.DATABASE_URL
})

// Query companies directly
const company = await shoreAgentsPool.query(
  'SELECT * FROM companies WHERE id = $1',
  [companyId]
)
```

This mirrors our successful BPOC implementation and avoids the Prisma bundling issue entirely.

---

**End of Documentation**

