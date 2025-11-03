# 🗄️ COMPLETE DATABASE SCHEMA & FUNCTIONALITY DOCUMENTATION

> **Shore Agents AI Monorepo - Complete Database Architecture & API Documentation**
> 
> This document provides a comprehensive overview of the entire database schema, relationships, and all Staff, Client, and Admin functionalities.

---

## 📋 TABLE OF CONTENTS

1. [Database Overview](#database-overview)
2. [Schema Comparison & Mismatches](#schema-comparison--mismatches)
3. [Complete Table Relationships](#complete-table-relationships)
4. [User Types & Roles](#user-types--roles)
5. [Staff Functions](#staff-functions)
6. [Client Functions](#client-functions)
7. [Admin Management Functions](#admin-management-functions)
8. [Data Flow Diagrams](#data-flow-diagrams)

---

## 🎯 DATABASE OVERVIEW

### Technology Stack
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Connection Pooling**: PgBouncer (Transaction mode)
- **Direct Connection**: Port 5432 (for migrations)

### Schema Files
- **Primary Schema**: `prisma/schema.prisma` ✅ (Active, Production)
- **Secondary Schema**: `prisma/schema 2.prisma` ⚠️ (Legacy/Alternative)

---

## ⚠️ SCHEMA COMPARISON & MISMATCHES

### Key Differences Between Schemas

| Aspect | Primary Schema | Secondary Schema | Status |
|--------|---------------|------------------|---------|
| **Model Naming** | `snake_case` (e.g., `staff_users`) | `PascalCase` (e.g., `StaffUser`) | ⚠️ **MISMATCH** |
| **@map directive** | Not used | Used (`@@map("staff_users")`) | Different approach |
| **Offboarding** | ✅ `staff_offboarding` table | ❌ Missing | **MISSING TABLE** |
| **Welcome Forms** | ✅ `staff_welcome_forms` table | ✅ `StaffWelcomeForm` | Both have it |
| **Relation Names** | Direct field names | Descriptive (e.g., `@relation("CompanyStaff")`) | Naming difference |
| **Default Values** | Basic | More `@updatedAt` decorators | Minor difference |

### ⚠️ CRITICAL FINDINGS

#### 1. **OFFBOARDING TABLE MISSING IN SECONDARY SCHEMA**
The secondary schema (`schema 2.prisma`) is **missing** the `staff_offboarding` table entirely:

**Primary Schema HAS:**
```prisma
model staff_offboarding {
  id                     String            @id
  staffUserId            String            @unique
  initiatedBy            String
  reason                 OffboardingReason
  lastWorkingDate        DateTime
  offboardingNotes       String?
  status                 OffboardingStatus @default(INITIATED)
  exitInterviewCompleted Boolean           @default(false)
  // ... more fields
}
```

**Secondary Schema:** ❌ **MISSING COMPLETELY**

**Impact**: Any application using schema 2 will fail when trying to access offboarding functionality.

#### 2. **Model Name Inconsistency**
- **Primary**: Uses PostgreSQL table names directly (`staff_users`, `client_users`)
- **Secondary**: Uses PascalCase model names with `@@map` to database tables

**Recommendation**: Use **PRIMARY SCHEMA** as source of truth.

---

## 📊 COMPLETE TABLE RELATIONSHIPS

### Total Tables: **35**

### Core User Tables (3)
```
┌─────────────────────┐
│  management_users   │ ← Admin/Manager accounts
│  ├─ id (PK)        │
│  ├─ authUserId     │
│  ├─ name, email    │
│  ├─ role           │
│  └─ department     │
└─────────────────────┘
         │
         │ manages (1:M)
         ↓
┌─────────────────────┐
│      company        │ ← Client Companies
│  ├─ id (PK)        │
│  ├─ companyName    │
│  ├─ accountMgr FK  │───→ management_users.id
│  └─ isActive       │
└─────────────────────┘
         │
         ├──────────────────┬─────────────────┐
         │                  │                 │
         ↓ (1:M)           ↓ (1:M)          ↓ (1:M)
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│client_users  │   │ staff_users  │   │    tasks     │
│ ├─ id (PK)   │   │ ├─ id (PK)   │   │ ├─ id (PK)   │
│ ├─ companyId │   │ ├─ companyId │   │ ├─ companyId │
│ ├─ role      │   │ ├─ role      │   │ └─ status    │
│ └─ email     │   │ ├─ email     │   └──────────────┘
└──────────────┘   │ └─ active    │
                   └──────────────┘
```

---

## 👥 USER TYPES & ROLES

### 1. **Management Users** (`management_users` + `management_profiles`)
**Roles:**
- `ADMIN` - Full system access
- `MANAGER` - Department-specific access

**Profile Fields:**
- Employment details (startDate, salary, leave tracking)
- **Timezone** (default: "Asia/Manila")
- Bio & responsibilities (ShoreAgents role description)

**Departments:**
- CEO_EXECUTIVE
- IT_DEPARTMENT
- HR_DEPARTMENT
- NURSE_DEPARTMENT
- RECRUITMENT_DEPARTMENT
- ACCOUNT_MANAGEMENT
- FINANCE_DEPARTMENT
- NERDS_DEPARTMENT
- OPERATIONS

### 2. **Staff Users** (`staff_users`)
**Roles:**
- `STAFF` - Regular employee
- `TEAM_LEAD` - Team leadership

**Employment Status:**
- `PROBATION` - First 6 months
- `REGULAR` - Confirmed employee
- `TERMINATED` - No longer employed

### 3. **Client Users** (`client_users`)
**Roles:**
- `OWNER` - Company owner
- `ADMIN` - Full client portal access
- `MANAGER` - Limited management access
- `VIEWER` - Read-only access

---

## 🔷 STAFF FUNCTIONS

### 📍 Staff User Lifecycle

```
┌──────────────┐
│  RECRUITMENT │
└──────┬───────┘
       │
       ↓
┌──────────────────────────────────────────────┐
│ 1. Interview Request (client/admin)          │
│    └─ interview_requests table               │
└──────┬───────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────┐
│ 2. Job Acceptance                            │
│    └─ job_acceptances table                  │
│    └─ Signup email sent to candidate         │
└──────┬───────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────┐
│ 3. Account Creation                          │
│    └─ staff_users created                    │
│    └─ staff_onboarding created               │
└──────┬───────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────┐
│ 4. ONBOARDING (9-Step Process)               │
│    ├─ Personal Info                          │
│    ├─ Government IDs                         │
│    ├─ Documents (NBI, Birth Cert, etc.)      │
│    ├─ Signature                              │
│    ├─ Emergency Contact                      │
│    ├─ Education                              │
│    ├─ Medical Certificate                    │
│    ├─ Resume                                 │
│    └─ Data Privacy Consent                   │
│    Status: PENDING → SUBMITTED → APPROVED    │
└──────┬───────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────┐
│ 5. Contract Signing                          │
│    └─ employment_contracts table             │
│    └─ Initial all 5 pages + final signature  │
└──────┬───────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────┐
│ 6. Profile Completion                        │
│    └─ staff_profiles created                 │
│    └─ work_schedules created                 │
│    └─ Welcome form (staff_welcome_forms)     │
└──────┬───────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────┐
│ 7. ACTIVE EMPLOYMENT                         │
│    ├─ Time tracking (clock in/out)           │
│    ├─ Break management                       │
│    ├─ Task assignments                       │
│    ├─ Performance metrics tracking           │
│    ├─ Reviews (Month 1, 3, 5, Recurring)     │
│    ├─ Gamification (levels, badges, points)  │
│    └─ Activity feed participation            │
└──────┬───────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────┐
│ 8. OFFBOARDING (if applicable)               │
│    └─ staff_offboarding table                │
│    Reasons: RESIGNATION, TERMINATION, etc.   │
│    Status: INITIATED → PENDING_EXIT →        │
│            PROCESSING → COMPLETED            │
└──────────────────────────────────────────────┘
```

### 📝 Staff API Endpoints & Functions

#### **Time Tracking** (`/api/time-tracking/`)
```typescript
// Clock In
POST /api/time-tracking/clock-in
- Creates time_entries record
- Validates work schedule
- Calculates if late

// Clock Out
POST /api/time-tracking/clock-out
- Updates time_entries.clockOut
- Calculates totalHours
- Records clockOutReason

// Status Check
GET /api/time-tracking/status
- Returns current clock-in status
- Shows active breaks
```

#### **Break Management** (`/api/breaks/`)
```typescript
// Types: MORNING, LUNCH, AFTERNOON, AWAY
POST /api/breaks/start
- Creates break record
- Links to time_entry

POST /api/breaks/[id]/end
- Ends break, calculates duration
- Checks if late (lateBy field)

POST /api/breaks/[id]/pause
- Pauses break timer
- Records pausedAt timestamp

POST /api/breaks/[id]/resume
- Resumes break timer
- Accumulates pausedDuration

GET /api/breaks/scheduled
- Returns scheduled breaks for the day
```

#### **Task Management** (`/api/tasks/`)
```typescript
GET /api/tasks
- Fetches staff's assigned tasks
- Filters: TODO, IN_PROGRESS, STUCK, FOR_REVIEW, COMPLETED

POST /api/tasks
- Create new task (SELF-assigned)
- Supports: subtasks, attachments, tags

PUT /api/tasks/[id]
- Update task status, priority
- Add time spent

DELETE /api/tasks/[id]
- Soft delete task

// Task Assignments (Many-to-Many)
POST /api/tasks/[id]/subtasks
- Add subtasks to main task

POST /api/tasks/[id]/responses
- Add comments/responses
- Attach files
```

#### **Performance Metrics** (`/api/performance-reviews/`)
```typescript
// Auto-tracked metrics
- mouseMovements
- mouseClicks
- keystrokes
- activeTime / idleTime
- screenTime
- downloads / uploads
- bandwidth
- clipboardActions
- filesAccessed
- urlsVisited
- tabsSwitched
- productivityScore (calculated)
- applicationsUsed (JSON)
- visitedUrls (JSON)
- screenshotUrls (JSON)
```

#### **Reviews System** (`/api/performance-reviews/`)
```typescript
// Review Types
- MONTH_1: First month review
- MONTH_3: 3rd month review
- MONTH_5: 5th month review
- RECURRING: 6-month recurring

GET /api/performance-reviews
- Fetch all reviews for staff

GET /api/performance-reviews/[id]
- View specific review details

POST /api/performance-reviews/[id]/acknowledge
- Staff acknowledges review
- Sets acknowledgedDate
```

#### **Documents** (`/api/documents/`)
```typescript
GET /api/documents
- Fetch staff's documents
- Filter by category: CLIENT, TRAINING, PROCEDURE, CULTURE, SEO, OTHER

POST /api/documents
- Upload new document
- Set sharing permissions (sharedWithAll or specific users)

GET /api/documents/[id]
- View document details
- Includes comments

POST /api/documents/[id]/comments
- Add comment on document
```

#### **Tickets** (`/api/tickets/`)
```typescript
// Categories: IT, HR, MANAGEMENT, EQUIPMENT, STATION, 
//             SURROUNDINGS, COMPENSATION, TRANSPORT, 
//             ONBOARDING, OFFBOARDING, CLINIC, etc.

GET /api/tickets
- Fetch staff's tickets
- Status: OPEN, IN_PROGRESS, RESOLVED, CLOSED

POST /api/tickets
- Create support ticket
- Priority: LOW, MEDIUM, HIGH, URGENT

POST /api/tickets/[ticketId]/responses
- Add response/comment
- Attach files
```

#### **Activity Feed** (`/api/activity/` & `/api/posts/`)
```typescript
// Post Types: ACHIEVEMENT, MILESTONE, KUDOS, WIN, 
//             CELEBRATION, UPDATE, ANNOUNCEMENT

GET /api/posts
- Fetch activity feed
- Filter by audience: STAFF, CLIENT, MANAGEMENT, ALL

POST /api/posts
- Create new post
- Tag users (taggedUserIds)
- Upload images

POST /api/activity/[id]/react
- React to post: LIKE, LOVE, CELEBRATE, FIRE, CLAP, etc.

POST /api/activity/[id]/comments
- Comment on post
```

#### **Gamification** (`/api/leaderboard/`)
```typescript
// gamification_profiles table
- level (1-100)
- points (earned through tasks, reviews)
- rank (leaderboard position)
- streak (consecutive days)
- tasksCompleted
- performanceScore
- reviewRating

// user_badges table
Badges: SPEEDSTER, PERFECTIONIST, FIRE, EARLY_BIRD, 
        TEAM_PLAYER, TOP_PERFORMER, CONSISTENT, INNOVATOR

GET /api/leaderboard
- Returns ranked staff by points
```

#### **Profile Management** (`/api/profile/`)
```typescript
GET /api/profile
- Fetch staff profile
- Includes: salary, leave, HMO, work schedule

PUT /api/profile
- Update personal info

POST /api/profile/avatar
- Upload profile picture

POST /api/profile/cover
- Upload cover photo
```

---

## 🔷 CLIENT FUNCTIONS

### 📍 Client User Capabilities

```
┌─────────────────────────────────────────────┐
│ CLIENT PORTAL FUNCTIONS                     │
├─────────────────────────────────────────────┤
│ ✅ Staff Management                         │
│ ✅ Task Assignment                          │
│ ✅ Document Sharing                         │
│ ✅ Recruitment (Candidate Browsing)         │
│ ✅ Interview Requests                       │
│ ✅ Performance Review Submission            │
│ ✅ Ticket Support System                    │
│ ✅ Company Profile Management               │
│ ✅ Analytics Dashboard                      │
│ ✅ Time Tracking Overview                   │
└─────────────────────────────────────────────┘
```

### 📝 Client API Endpoints & Functions

#### **Staff Management** (`/api/client/staff/`)
```typescript
GET /api/client/staff
- View all staff assigned to client company
- Filter by: active status, start date
- Includes:
  - Onboarding completion %
  - Current employment status
  - Work schedules
  - Performance scores (last 7 days)
  - Active tasks count
  - Review ratings
  - Current month hours
  - Active break status

GET /api/client/staff/[id]
- View detailed staff profile
- Performance history
- Task completion rate
- Leave balances
- Review history
```

#### **Task Management** (`/api/client/tasks/`)
```typescript
GET /api/client/tasks
- View all tasks for staff under this client
- Filter by staff, status, priority

POST /api/client/tasks
- Assign new task to staff
- Set: title, description, deadline, priority
- Attach files
- Add subtasks

PUT /api/client/tasks/[id]
- Update task details
- Change priority

POST /api/client/tasks/bulk
- Bulk task assignment to multiple staff
```

#### **Document Management** (`/api/client/documents/`)
```typescript
GET /api/client/documents
- View:
  1. Client's uploaded documents
  2. Staff documents shared with client

POST /api/client/documents
- Upload document (PDF, DOCX, etc.)
- Uses CloudConvert for PDF conversion
- Share with:
  - All staff (sharedWithAll: true)
  - Specific staff (sharedWith: [ids])
- Categories: CLIENT, TRAINING, PROCEDURE, etc.

DELETE /api/client/documents/[id]
- Remove document
```

#### **Recruitment & Hiring** (`/api/client/candidates/` & `/api/client/interviews/`)
```typescript
// BPOC Database Integration (External)
GET /api/client/candidates
- Browse anonymized candidate profiles from BPOC
- Filters:
  - skills (comma-separated)
  - location
  - minExperience (years)
  - discType (personality)
  - culturalFitMin (score)
  - searchQuery

GET /api/client/candidates/[id]
- View detailed candidate profile (still anonymized)

// Interview Workflow
POST /api/client/interviews/request
- Request interview with candidate
- Provide: 
  - bpocCandidateId
  - preferredTimes (JSON array)
  - clientNotes

GET /api/client/interviews
- View all interview requests
- Status: PENDING, SCHEDULED, COMPLETED, 
          HIRE_REQUESTED, OFFER_SENT, etc.

POST /api/client/interviews/hire-request
- Request to hire candidate
- Provide preferred start date

POST /api/client/interviews/reject
- Reject candidate after interview
```

#### **Performance Reviews** (`/api/client/performance-reviews/`)
```typescript
GET /api/client/performance-reviews
- View all reviews for staff
- Filter by: staff, type, status

POST /api/client/performance-reviews/[reviewId]
- Submit review for staff
- Provide:
  - ratings (JSON object per category)
  - strengths
  - improvements
  - additionalComments
  - overallScore

GET /api/client/performance-reviews/auto-create
- Auto-generate reviews based on employment dates
- Creates MONTH_1, MONTH_3, MONTH_5 reviews

GET /api/client/performance-reviews/count
- Get count of pending reviews
```

#### **Company Management** (`/api/client/company/`)
```typescript
GET /api/client/company
- Fetch client's company profile
- Includes:
  - Company details
  - Account manager info
  - Staff count
  - Contract info

PUT /api/client/company
- Update company profile:
  - bio, phone, website
  - tradingName, location

POST /api/client/company/upload
- Upload company logo/cover photo
```

#### **Onboarding Monitoring** (`/api/client/onboarding/`)
```typescript
GET /api/client/onboarding
- View onboarding progress for all staff
- Shows:
  - Completion percentage
  - Section statuses (9 steps)
  - Pending approvals
```

#### **Offboarding** (`/api/client/offboarding/`)
```typescript
GET /api/client/offboarding
- View offboarding records for staff
- Status tracking
```

#### **Tickets** (`/api/client/tickets/`)
```typescript
GET /api/client/tickets
- View all tickets from staff

POST /api/client/tickets
- Create ticket (rare, usually staff creates)

POST /api/client/tickets/[ticketId]
- Respond to staff ticket
- Update status
```

#### **Analytics** (`/api/client/analytics/`)
```typescript
GET /api/client/analytics
- Overall staff performance metrics
- Task completion rates
- Average productivity scores
- Leave usage statistics
- Time tracking summaries
```

#### **Time Tracking** (`/api/client/time-tracking/`)
```typescript
GET /api/client/time-tracking
- View time entries for all staff
- Filter by date range
- Shows:
  - Clock in/out times
  - Total hours worked
  - Late entries
  - Break usage
```

---

## 🔷 ADMIN MANAGEMENT FUNCTIONS

### 📍 Admin User Capabilities

```
┌─────────────────────────────────────────────┐
│ ADMIN PORTAL - FULL SYSTEM CONTROL         │
├─────────────────────────────────────────────┤
│ ✅ Staff Management (ALL)                   │
│ ✅ Client Management (ALL)                  │
│ ✅ Company Management                       │
│ ✅ Management User Administration           │
│ ✅ Recruitment Pipeline                     │
│ ✅ Onboarding Verification (9-Step)         │
│ ✅ Offboarding Management                   │
│ ✅ Contract Management                      │
│ ✅ System Analytics                         │
│ ✅ Task Oversight                           │
│ ✅ Ticket Management                        │
│ ✅ Document Repository                      │
│ ✅ Performance Review Oversight             │
└─────────────────────────────────────────────┘
```

### 📝 Admin API Endpoints & Functions

#### **Staff Administration** (`/api/admin/staff/`)
```typescript
GET /api/admin/staff
- View ALL staff users across all companies
- Includes:
  - Company affiliation
  - Employment status
  - Contact info
  - Current role

GET /api/admin/staff/[id]
- View detailed staff record
- Full access to all fields

POST /api/admin/create-staff-profile
- Create new staff profile after job acceptance
- Initialize:
  - staff_profiles
  - work_schedules
  - gamification_profiles
```

#### **Onboarding Management** (`/api/admin/staff/onboarding/`)
```typescript
GET /api/admin/staff/onboarding
- View all staff onboarding records
- Filters:
  - all: All records
  - pending: Has submitted sections waiting approval
  - incomplete: Not yet complete
  - complete: Fully approved

GET /api/admin/staff/onboarding/[staffUserId]
- View specific staff onboarding details
- All 9 sections with status

POST /api/admin/staff/onboarding/[staffUserId]/verify
- Verify/Approve submitted section
- Sections:
  1. personalInfo
  2. govId
  3. documents
  4. signature
  5. emergencyContact
  6. education
  7. medical
  8. resume
  9. dataPrivacy
- Set status: APPROVED or REJECTED
- Provide feedback if rejected

POST /api/admin/staff/onboarding/[staffUserId]/complete
- Mark onboarding as complete
- Create staff_profiles with:
  - companyId
  - employmentStatus (PROBATION/REGULAR)
  - startDate
  - currentRole
  - salary
  - hmo
  - work_schedules (based on shift time)
- Creates gamification_profiles
- Logs activity post
```

#### **Offboarding Management** (`/api/admin/staff/offboarding/`)
```typescript
GET /api/admin/staff/offboarding
- View all offboarding records
- Filter by status

POST /api/admin/staff/offboarding/initiate
- Start offboarding process
- Provide:
  - staffUserId
  - reason (RESIGNATION, TERMINATION, etc.)
  - lastWorkingDate
  - offboardingNotes

GET /api/admin/staff/offboarding/[staffUserId]
- View offboarding progress

PUT /api/admin/staff/offboarding/[staffUserId]
- Update offboarding checklist:
  - exitInterviewCompleted
  - equipmentReturned
  - accessRevoked
  - finalPaymentProcessed
  - clearanceIssued

POST /api/admin/staff/offboarding/complete
- Complete offboarding
- Set status: COMPLETED
- Optionally deactivate staff user
```

#### **Client Management** (`/api/admin/clients/` & `/api/admin/client-users/`)
```typescript
GET /api/admin/clients
- View all client companies
- Includes:
  - Client users (owners, admins, managers)
  - Staff assigned to company
  - Account manager
  - Contract status

GET /api/admin/client-users
- View all client users across all companies
- Filter by company

GET /api/admin/client-users/[id]
- View detailed client user profile

POST /api/admin/client-users
- Create new client user (Admin creates accounts)
```

#### **Company Management** (`/api/admin/companies/`)
```typescript
GET /api/admin/companies
- View all companies
- Statistics:
  - Total staff
  - Active contracts
  - Account manager

POST /api/admin/companies
- Create new company record
- Assign account manager

PUT /api/admin/companies/[id]
- Update company details
- Change isActive status
```

#### **Management User Administration** (`/api/admin/management/`)
```typescript
GET /api/admin/management
- View all management users
- Shows department assignments

POST /api/admin/management
- Create new admin/manager account
- Assign department
```

#### **Recruitment Pipeline** (`/api/admin/recruitment/`)
```typescript
GET /api/admin/recruitment/candidates
- Browse BPOC candidate pool (admin view)
- Full candidate details (not anonymized)

GET /api/admin/recruitment/interviews
- View all interview requests from clients
- Filter by status

POST /api/admin/recruitment/interviews/[id]
- Update interview status
- Add meeting link
- Schedule time
- Add admin notes

POST /api/admin/recruitment/interviews/hire
- Approve hire request from client
- Triggers job_acceptances creation

POST /api/admin/recruitment/interviews/finalize-hire
- Create staff user account
- Send signup email to candidate

POST /api/admin/recruitment/interviews/confirm-acceptance
- Confirm candidate accepted and signed up

POST /api/admin/recruitment/interviews/mark-declined
- Mark candidate declined offer
- Record decline reason
```

#### **Contract Management** (`/api/admin/contracts/`)
```typescript
GET /api/admin/contracts
- View all employment contracts
- Filter by: signed, approved, pending

GET /api/admin/contracts/[contractId]
- View contract details
- Check initials on all pages
- View signatures

POST /api/admin/contracts/[contractId]/approve
- Admin approves contract
- Sets adminApproved: true
- Records adminApprovedBy and adminApprovedAt
```

#### **System Analytics** (`/api/admin/analytics/`)
```typescript
GET /api/admin/analytics
- System-wide analytics:
  - Total staff count (by status)
  - Total clients
  - Total companies
  - Tasks overview (by status)
  - Tickets overview (by status)
  - Onboarding statistics
  - Offboarding statistics
  - Performance review status
  - Time tracking aggregates
  - Revenue metrics (if applicable)
```

#### **Staff Analytics** (`/api/admin/staff-analytics/`)
```typescript
GET /api/admin/staff-analytics
- Performance analytics for all staff
- Metrics:
  - Average productivity scores
  - Task completion rates
  - Review ratings
  - Attendance records
  - Leave usage

GET /api/admin/staff-analytics/[staffUserId]
- Individual staff analytics
- Detailed performance history
```

#### **Task Oversight** (`/api/admin/tasks/`)
```typescript
GET /api/admin/tasks
- View ALL tasks across all staff and companies
- Filter by:
  - company
  - staff
  - client
  - status
  - priority
  - date range
```

#### **Ticket Management** (`/api/admin/tickets/`)
```typescript
GET /api/admin/tickets
- View ALL support tickets
- Filter by:
  - category
  - priority
  - status
  - assignedTo

POST /api/admin/tickets/[ticketId]/assign
- Assign ticket to specific management user

PUT /api/admin/tickets/[ticketId]/status
- Update ticket status
- Resolve/Close tickets
```

#### **Document Repository** (`/api/admin/documents/`)
```typescript
GET /api/admin/documents
- View ALL documents
- Filter by:
  - source (STAFF, CLIENT, ADMIN)
  - category
  - uploader

POST /api/admin/documents
- Upload system-wide documents
- Share with:
  - All staff
  - All clients
  - Specific companies
```

#### **Performance Reviews** (`/api/admin/reviews/`)
```typescript
GET /api/admin/reviews
- View all performance reviews
- Filter by:
  - staff
  - type
  - status
  - date range

GET /api/admin/reviews/stats
- Review statistics
- Average ratings
- Pending reviews count

POST /api/admin/reviews/trigger-creation
- Manually trigger review creation
- For specific staff or bulk

POST /api/admin/reviews/send
- Send review to client for submission

GET /api/admin/reviews/[id]
- View review details
- Add management notes

PUT /api/admin/reviews/[id]
- Update review
- Add managementNotes
```

#### **Break Oversight** (`/api/admin/breaks/`)
```typescript
GET /api/admin/breaks
- View break records for all staff
- Identify late returns
- Monitor break usage patterns
```

#### **Performance Metrics** (`/api/admin/performance/`)
```typescript
GET /api/admin/performance
- View performance metrics for all staff
- Aggregate data:
  - Average productivity scores
  - Active time vs idle time
  - Application usage trends
```

#### **Time Tracking Administration** (`/api/admin/time-tracking/`)
```typescript
GET /api/admin/time-tracking
- View all time entries
- Filter by:
  - staff
  - date range
  - company
- Identify:
  - Late clock-ins
  - Early clock-outs
  - Missing clock-outs
```

---

## 📊 DATA FLOW DIAGRAMS

### 1. **Staff Hiring Flow**

```
CLIENT                    ADMIN                    CANDIDATE
   │                        │                          │
   │ Browse BPOC Candidates │                          │
   ├────────────────────────>                          │
   │                        │                          │
   │ Request Interview      │                          │
   ├────────────────────────>                          │
   │                        │                          │
   │                        │ Schedule Interview       │
   │                        ├─────────────────────────>│
   │                        │                          │
   │                        │ Conduct Interview        │
   │                        │<────────────────────────>│
   │                        │                          │
   │ Request Hire           │                          │
   ├────────────────────────>                          │
   │                        │                          │
   │                        │ Approve & Send Offer     │
   │                        ├─────────────────────────>│
   │                        │                          │
   │                        │      Accept Offer        │
   │                        │<─────────────────────────┤
   │                        │                          │
   │                        │ Create JobAcceptance     │
   │                        │ Send Signup Email        │
   │                        ├─────────────────────────>│
   │                        │                          │
   │                        │   Sign Up & Create       │
   │                        │   Staff Account          │
   │                        │<─────────────────────────┤
   │                        │                          │
   │                        │ Create staff_onboarding  │
   │                        │ (9-Step Process Begins)  │
   │                        │                          │
```

### 2. **Onboarding Flow (9 Steps)**

```
CANDIDATE/STAFF          ADMIN                    SYSTEM
      │                    │                        │
      │ 1. Personal Info   │                        │
      ├───────────────────>│                        │
      │                    │ Verify                 │
      │                    │ Approve/Reject         │
      │<───────────────────┤                        │
      │                    │                        │
      │ 2. Gov IDs Upload  │                        │
      ├───────────────────>│                        │
      │                    │ Verify                 │
      │<───────────────────┤                        │
      │                    │                        │
      │ 3. Documents       │                        │
      │ (NBI, Birth Cert)  │                        │
      ├───────────────────>│                        │
      │                    │ Verify                 │
      │<───────────────────┤                        │
      │                    │                        │
      │ ... Steps 4-9      │                        │
      ├───────────────────>│                        │
      │                    │                        │
      │                    │ ALL APPROVED?          │
      │                    │ Complete Onboarding    │
      │                    ├───────────────────────>│
      │                    │                        │
      │                    │         Create:        │
      │                    │    - staff_profiles    │
      │                    │    - work_schedules    │
      │                    │    - gamification      │
      │                    │                        │
      │ Contract Signing   │                        │
      ├───────────────────>│                        │
      │ Initial 5 Pages    │                        │
      │ + Final Signature  │                        │
      │                    │                        │
      │                    │ Admin Approves         │
      │                    │ Contract               │
      │                    │                        │
      │         ✅ ONBOARDING COMPLETE              │
      │                                             │
```

### 3. **Daily Staff Activity Flow**

```
STAFF                    SYSTEM                   CLIENT/ADMIN
  │                        │                          │
  │ Clock In               │                          │
  ├───────────────────────>│                          │
  │                        │ Create time_entries      │
  │                        │ Check work_schedules     │
  │                        │ Calculate wasLate        │
  │                        │                          │
  │ Start Tasks            │                          │
  ├───────────────────────>│                          │
  │                        │ Update task status       │
  │                        │ to IN_PROGRESS           │
  │                        │                          │
  │ Take Morning Break     │                          │
  ├───────────────────────>│                          │
  │                        │ Create break record      │
  │                        │                          │
  │ Resume Work            │                          │
  ├───────────────────────>│                          │
  │                        │ End break                │
  │                        │ Calculate duration       │
  │                        │                          │
  │ Track Activity         │                          │
  ├───────────────────────>│                          │
  │                        │ Log performance_metrics: │
  │                        │  - keystrokes            │
  │                        │  - mouse movements       │
  │                        │  - active time           │
  │                        │  - applications used     │
  │                        │  - URLs visited          │
  │                        │                          │
  │ Complete Task          │                          │
  ├───────────────────────>│                          │
  │                        │ Update task.status       │
  │                        │ = COMPLETED              │
  │                        │ Add gamification points  │
  │                        │                          │
  │                        │        Notify Client     │
  │                        ├─────────────────────────>│
  │                        │                          │
  │ Clock Out              │                          │
  ├───────────────────────>│                          │
  │                        │ Update time_entries      │
  │                        │ Calculate totalHours     │
  │                        │                          │
```

### 4. **Task Assignment Flow**

```
CLIENT                   SYSTEM                   STAFF
  │                        │                        │
  │ Create Task            │                        │
  ├───────────────────────>│                        │
  │ - Title, Description   │                        │
  │ - Priority, Deadline   │                        │
  │ - Assign to Staff      │                        │
  │                        │                        │
  │                        │ Create tasks record    │
  │                        │ createdByType=CLIENT   │
  │                        │                        │
  │                        │ Create task_assignments│
  │                        │ (Many-to-Many)         │
  │                        │                        │
  │                        │       Notify Staff     │
  │                        ├───────────────────────>│
  │                        │                        │
  │                        │    View Task Details   │
  │                        │<───────────────────────┤
  │                        │                        │
  │                        │    Update Status       │
  │                        │<───────────────────────┤
  │                        │                        │
  │        View Progress   │                        │
  │<───────────────────────┤                        │
  │                        │                        │
  │                        │    Mark Completed      │
  │                        │<───────────────────────┤
  │                        │                        │
  │        Notification    │                        │
  │<───────────────────────┤                        │
  │                        │                        │
```

### 5. **Performance Review Flow**

```
SYSTEM                   CLIENT                   STAFF
  │                        │                        │
  │ Auto-Generate Review   │                        │
  │ (based on start date)  │                        │
  │ - MONTH_1, MONTH_3,    │                        │
  │   MONTH_5, RECURRING   │                        │
  │                        │                        │
  │         Notify Client  │                        │
  ├───────────────────────>│                        │
  │                        │                        │
  │                        │ Fill Review Form       │
  │                        │ - Ratings              │
  │                        │ - Strengths            │
  │                        │ - Improvements         │
  │                        │ - Overall Score        │
  │      Submit Review     │                        │
  │<───────────────────────┤                        │
  │                        │                        │
  │ Update reviews record  │                        │
  │ status = SUBMITTED     │                        │
  │                        │                        │
  │                        │        Notify Staff    │
  │                        │        (Review Ready)  │
  │                        ├───────────────────────>│
  │                        │                        │
  │                        │    View Review         │
  │<───────────────────────┼────────────────────────┤
  │                        │                        │
  │                        │    Acknowledge Review  │
  │<───────────────────────┼────────────────────────┤
  │                        │                        │
  │ Set acknowledgedDate   │                        │
  │ status = COMPLETED     │                        │
  │                        │                        │
```

---

## 📦 COMPLETE TABLE REFERENCE

### Summary of All 35 Tables

| # | Table Name | Purpose | Key Relationships |
|---|------------|---------|-------------------|
| 1 | `management_users` | Admin/Manager accounts | → company (manages) |
| 2 | `management_profiles` | Management employment details + timezone | → management_users |
| 3 | `staff_users` | Employee accounts | → company, multiple children |
| 4 | `client_users` | Client portal users | → company |
| 5 | `client_profiles` | Client profile + timezone | → client_users |
| 6 | `company` | Client companies | ← staff, clients, tasks |
| 7 | `staff_profiles` | Employment details + timezone | → staff_users |
| 8 | `staff_onboarding` | 9-step onboarding | → staff_users |
| 9 | `staff_offboarding` | Offboarding process | → staff_users |
| 8 | `staff_personal_records` | Gov IDs, documents | → staff_users |
| 9 | `staff_welcome_forms` | Welcome questionnaire | → staff_users |
| 10 | `client_profiles` | Client user details | → client_users |
| 11 | `work_schedules` | Weekly work hours | → staff_profiles |
| 12 | `time_entries` | Clock in/out records | → staff_users |
| 13 | `breaks` | Break tracking | → staff_users, time_entries |
| 14 | `tasks` | Task management | → staff, company, clients |
| 15 | `task_assignments` | Many-to-many staff-tasks | → staff_users, tasks |
| 16 | `task_responses` | Task comments | → tasks |
| 17 | `subtasks` | Checklist items | → tasks |
| 18 | `performance_metrics` | Activity tracking | → staff_users |
| 19 | `reviews` | Performance reviews | → staff_users |
| 20 | `salary_history` | Salary increase tracking | staff/management users |
| 21 | `tickets` | Support tickets | → staff, client, management |
| 21 | `ticket_responses` | Ticket messages | → tickets |
| 22 | `activity_posts` | Social feed posts | → staff, client, management |
| 23 | `post_reactions` | Post reactions | → activity_posts |
| 24 | `post_comments` | Post comments | → activity_posts |
| 25 | `gamification_profiles` | Levels, points, badges | → staff_users |
| 26 | `user_badges` | Earned badges | → gamification_profiles |
| 27 | `kudos` | Peer recognition | → staff_users (from/to) |
| 28 | `documents` | File repository | → staff_users |
| 29 | `document_comments` | Document comments | → documents |
| 30 | `notifications` | User notifications | → staff_users, activity_posts |
| 31 | `interview_requests` | Candidate interviews | → client_users |
| 32 | `job_acceptances` | Hire confirmations | → interview_requests |
| 33 | `employment_contracts` | Contract signing | → job_acceptances, staff_users |

---

## 🔐 AUTHENTICATION & AUTHORIZATION

### Auth System
- **Provider**: NextAuth.js
- **Strategy**: Credentials (email/password)
- **Session**: JWT-based

### User Type Detection
```typescript
// Based on database tables
if (staff_users.authUserId === session.user.id) {
  role = "STAFF"
}
if (client_users.authUserId === session.user.id) {
  role = "CLIENT"
}
if (management_users.authUserId === session.user.id) {
  role = "ADMIN" | "MANAGER"
}
```

### Protected Routes
- `/api/admin/*` - Management users only
- `/api/client/*` - Client users only
- `/api/*` (other) - Staff users (or respective owners)

---

## 🎨 ENUMS REFERENCE

### All System Enums

```prisma
// Management
enum ManagementRole { ADMIN, MANAGER }
enum Department {
  CEO_EXECUTIVE, IT_DEPARTMENT, HR_DEPARTMENT,
  NURSE_DEPARTMENT, RECRUITMENT_DEPARTMENT,
  ACCOUNT_MANAGEMENT, FINANCE_DEPARTMENT,
  NERDS_DEPARTMENT, OPERATIONS
}

// Staff
enum StaffRole { STAFF, TEAM_LEAD }
enum EmploymentStatus { PROBATION, REGULAR, TERMINATED }

// Client
enum ClientRole { OWNER, ADMIN, MANAGER, VIEWER }

// Onboarding/Offboarding
enum OnboardingStatus { PENDING, SUBMITTED, APPROVED, REJECTED }
enum OffboardingReason {
  RESIGNATION, TERMINATION, END_OF_CONTRACT,
  MUTUAL_AGREEMENT, RETIREMENT, OTHER
}
enum OffboardingStatus {
  INITIATED, PENDING_EXIT, PROCESSING, COMPLETED, CANCELLED
}

// Tasks
enum TaskStatus { TODO, IN_PROGRESS, STUCK, FOR_REVIEW, COMPLETED }
enum TaskPriority { LOW, MEDIUM, HIGH, URGENT }
enum TaskSource { SELF, CLIENT, MANAGEMENT }
enum CreatorType { STAFF, CLIENT, ADMIN }

// Time Tracking
enum BreakType { MORNING, LUNCH, AFTERNOON, AWAY }
enum AwayReason {
  MEETING, NURSE, BATHROOM, MANAGEMENT, DOLE, OTHER
}
enum ClockOutReason {
  END_OF_SHIFT, EMERGENCY, SICK, EARLY_LEAVE_APPROVED,
  INTERNET_ISSUE, POWER_OUTAGE, PERSONAL, OTHER
}

// Reviews
enum ReviewType { MONTH_1, MONTH_3, MONTH_5, RECURRING }
enum ReviewStatus { PENDING, SUBMITTED, UNDER_REVIEW, COMPLETED }

// Tickets
enum TicketCategory {
  IT, HR, MANAGEMENT, EQUIPMENT, STATION, SURROUNDINGS,
  COMPENSATION, TRANSPORT, ONBOARDING, OFFBOARDING,
  CLINIC, MEETING_ROOM, MAINTENANCE, CLEANING, FINANCE,
  OPERATIONS, ACCOUNT_SUPPORT, STAFF_PERFORMANCE,
  PURCHASE_REQUEST, BONUS_REQUEST, REFERRAL,
  REPORTING_ISSUES, SYSTEM_ACCESS, GENERAL_INQUIRY
}
enum TicketPriority { LOW, MEDIUM, HIGH, URGENT }
enum TicketStatus { OPEN, IN_PROGRESS, RESOLVED, CLOSED }

// Activity Feed
enum PostType {
  ACHIEVEMENT, MILESTONE, KUDOS, WIN,
  CELEBRATION, UPDATE, ANNOUNCEMENT
}
enum PostAudience { STAFF, CLIENT, MANAGEMENT, ALL }
enum ReactionType {
  LIKE, LOVE, CELEBRATE, FIRE, CLAP,
  LAUGH, POO, ROCKET, SHOCKED, MIND_BLOWN
}

// Gamification
enum BadgeType {
  SPEEDSTER, PERFECTIONIST, FIRE, EARLY_BIRD,
  TEAM_PLAYER, TOP_PERFORMER, CONSISTENT, INNOVATOR
}

// Documents
enum DocumentCategory {
  CLIENT, TRAINING, PROCEDURE, CULTURE, SEO, OTHER
}
enum DocumentSource { STAFF, CLIENT, ADMIN }

// Recruitment
enum InterviewRequestStatus {
  PENDING, APPROVED, REJECTED, SCHEDULED, COMPLETED,
  CANCELLED, HIRE_REQUESTED, OFFER_SENT,
  OFFER_ACCEPTED, OFFER_DECLINED, HIRED
}

// Notifications
enum NotificationType { TAG, MENTION, COMMENT, REACTION, SYSTEM }
```

---

## 🔧 RECOMMENDED ACTIONS

### 1. **Schema Consolidation**
- ✅ **Use PRIMARY SCHEMA** (`prisma/schema.prisma`) as single source of truth
- ⚠️ **Delete or Archive** `prisma/schema 2.prisma` to avoid confusion
- ✅ Ensure all migrations reference primary schema

### 2. **Missing Table in Secondary Schema**
- ❌ `staff_offboarding` is MISSING in `schema 2.prisma`
- ⚠️ Any application using schema 2 will have broken offboarding functionality
- ✅ If schema 2 is in use anywhere, add the offboarding table immediately

### 3. **Database Naming Convention**
- Current: `snake_case` table names
- Recommendation: Stick with `snake_case` for PostgreSQL best practices
- Model names can be PascalCase with `@@map` directive (like schema 2)

### 4. **Documentation Maintenance**
- ✅ Keep this document updated when schema changes
- ✅ Add JSDoc comments to Prisma models for better IDE support
- ✅ Create migration scripts documentation

---

## 📞 SUPPORT & MAINTENANCE

### Common Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Run Migrations
npx prisma migrate dev --name migration_name

# View Database in Studio
npx prisma studio

# Reset Database (CAUTION!)
npx prisma migrate reset

# Seed Database
npx prisma db seed

# Format Schema
npx prisma format

# Validate Schema
npx prisma validate
```

### Database Connections

```env
# Transaction Mode (for queries)
DATABASE_URL="postgresql://user:pass@host:6543/db?pgbouncer=true"

# Direct Mode (for migrations)
DIRECT_URL="postgresql://user:pass@host:5432/db"
```

---

## 📊 STATISTICS

- **Total Tables**: 35
- **Total Enums**: 30
- **Total API Endpoints**: 100+
- **User Types**: 3 (Staff, Client, Management)
- **Roles**: 8 (across all user types)
- **Onboarding Steps**: 9
- **Contract Pages**: 5
- **Review Types**: 4
- **Badge Types**: 8
- **Reaction Types**: 10
- **Ticket Categories**: 26

---

## ✅ CONCLUSION

This document provides a complete overview of the Shore Agents AI Monorepo database schema, including:

1. ✅ All 33 database tables with relationships
2. ✅ Complete Staff functionality (onboarding, time tracking, tasks, reviews, gamification)
3. ✅ Complete Client functionality (staff management, hiring, tasks, reviews)
4. ✅ Complete Admin functionality (system-wide management)
5. ✅ Schema comparison and mismatch identification
6. ✅ Data flow diagrams for key processes

**Critical Finding**: The secondary schema is missing the `staff_offboarding` table and uses different model naming conventions. Recommend using the primary schema only.

---

**Last Updated**: October 28, 2025
**Schema Version**: 1.0 (Primary)
**Document Version**: 1.0

