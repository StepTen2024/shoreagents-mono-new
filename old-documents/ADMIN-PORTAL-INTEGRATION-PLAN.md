# Admin Portal Integration Plan

**Version:** 1.0.0  
**Date:** October 13, 2025  
**Status:** In Progress

---

## 📋 Overview

Integrate the v0.dev generated Admin Dashboard into the main gamified-dashboard project as `/admin/*` routes, creating a complete **3-portal system** (Staff, Client, Admin) with shared authentication and database.

---

## 🎯 Goals

1. ✅ Add Admin Portal at `/admin/*` routes
2. ✅ Implement Role-based authentication (ADMIN only)
3. ⏳ Create Admin-specific API routes
4. ⏳ Replace mock data with real Prisma queries
5. ⏳ Implement Staff Assignment management
6. ⏳ Build Review Scheduling system (based on `startDate`)
7. ⏳ Create Client Review Submission flow
8. ⏳ Enable seamless portal switching
9. ⏳ Connect all admin pages to database

---

## 📁 File Structure

```
gamified-dashboard (1)/
├── app/
│   ├── admin/                          # NEW - Admin Portal
│   │   ├── layout.tsx                  # Auth protection (ADMIN only)
│   │   ├── page.tsx                    # Dashboard overview
│   │   ├── staff/page.tsx              # Staff management
│   │   ├── clients/page.tsx            # Client organizations
│   │   ├── client-users/page.tsx       # Client user management
│   │   ├── assignments/page.tsx        # Staff assignments (CRITICAL)
│   │   ├── reviews/page.tsx            # Review scheduling
│   │   ├── tasks/page.tsx              # Task oversight
│   │   ├── tickets/page.tsx            # Support tickets
│   │   ├── documents/page.tsx          # Document management
│   │   ├── time-tracking/page.tsx      # Time tracking
│   │   ├── gamification/page.tsx       # Gamification management
│   │   ├── analytics/page.tsx          # Performance analytics
│   │   ├── activity/page.tsx           # Activity feed moderation
│   │   └── settings/page.tsx           # System settings
│   ├── api/
│   │   └── admin/                      # NEW - Admin API routes
│   │       ├── staff/route.ts
│   │       ├── staff/[id]/route.ts
│   │       ├── clients/route.ts
│   │       ├── clients/[id]/route.ts
│   │       ├── client-users/route.ts
│   │       ├── client-users/[id]/route.ts
│   │       ├── assignments/route.ts    # CRITICAL
│   │       ├── assignments/[id]/route.ts
│   │       ├── reviews/route.ts
│   │       ├── reviews/send/route.ts   # Send review requests
│   │       ├── reviews/[id]/route.ts
│   │       ├── analytics/route.ts
│   │       └── stats/route.ts
│   ├── client/
│   │   └── reviews/
│   │       └── submit/
│   │           └── [assignmentId]/page.tsx  # NEW - Client review form
│   ├── login/page.tsx                  # MODIFY - Add role-based redirect
│   └── ...
├── components/
│   ├── admin/                          # NEW - Admin components
│   │   ├── admin-sidebar.tsx           # Admin navigation
│   │   ├── admin-dashboard.tsx
│   │   └── icons.tsx
│   ├── dashboard-sidebar.tsx           # MODIFY - Add portal switcher
│   ├── client-sidebar.tsx              # MODIFY - Add portal switcher
│   └── ...
├── lib/
│   ├── review-schedule.ts              # NEW - Review scheduling logic
│   └── ...
└── public/
    └── admin/                          # NEW - Admin assets
        └── *.png, *.jpg
```

---

## 🔄 Implementation Phases

### Phase 1: File Structure & Component Merge ✅

#### 1.1 Copy Admin Pages ✅
- [x] Copy all pages from `admin-dashboard (1)/app/` to `/app/admin/`
- [x] Include all 14 page directories with `page.tsx` and `loading.tsx`
- [x] Fix image paths to use `/admin/` prefix

#### 1.2 Admin Layout Setup ✅
- [x] Create `/app/admin/layout.tsx` with authentication
- [x] Redirect non-ADMIN users appropriately
- [x] Wrap children with AdminSidebar

#### 1.3 Merge UI Components ✅
- [x] Copy missing UI components to `/components/ui/`
- [x] Create `/components/admin/` for admin-specific components
- [x] Update `admin-sidebar.tsx` with correct routes

#### 1.4 Copy Admin Assets ✅
- [x] Copy images to `/public/admin/`

---

### Phase 2: Authentication & Authorization ✅

#### 2.1 Admin Role Protection ✅
**File:** `/app/admin/layout.tsx`

```typescript
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

export default async function AdminLayout({ children }) {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin")
  }
  
  if (session.user.role !== "ADMIN") {
    if (session.user.role === "CLIENT") {
      redirect("/client")
    } else {
      redirect("/") // Staff portal
    }
  }
  
  return <AdminSidebar>{children}</AdminSidebar>
}
```

#### 2.2 Update Login Flow ⏳
**File:** `/app/login/page.tsx`

Add role-based redirect after successful login:
- `ADMIN` → `/admin`
- `CLIENT` → `/client`
- `STAFF/TEAM_LEAD/MANAGER` → `/`

---

### Phase 3: API Routes for Admin ⏳

#### 3.1 Staff Management API
**Files:** `/app/api/admin/staff/route.ts`, `/app/api/admin/staff/[id]/route.ts`

**Endpoints:**
- `GET /api/admin/staff` - List all staff with filters
- `POST /api/admin/staff` - Create new staff member
- `GET /api/admin/staff/[id]` - Get staff details
- `PUT /api/admin/staff/[id]` - Update staff
- `DELETE /api/admin/staff/[id]` - Deactivate staff

**Features:**
- Filter by role, employment status, client
- Include profile, assignments, gamification data
- Support pagination

#### 3.2 Client Management API
**Files:** `/app/api/admin/clients/route.ts`, `/app/api/admin/clients/[id]/route.ts`

**Endpoints:**
- `GET /api/admin/clients` - List all clients
- `POST /api/admin/clients` - Create client organization
- `GET /api/admin/clients/[id]` - Get client details
- `PUT /api/admin/clients/[id]` - Update client
- `DELETE /api/admin/clients/[id]` - Deactivate client

**Features:**
- Include assigned staff count
- Include client users count
- Include active reviews count

#### 3.3 Client Users API
**Files:** `/app/api/admin/client-users/route.ts`, `/app/api/admin/client-users/[id]/route.ts`

**Endpoints:**
- `GET /api/admin/client-users` - List client users
- `POST /api/admin/client-users` - Create client user
- `GET /api/admin/client-users/[id]` - Get user details
- `PUT /api/admin/client-users/[id]` - Update user
- `DELETE /api/admin/client-users/[id]` - Deactivate user

**Features:**
- Filter by client organization
- Filter by role (OWNER/ADMIN/MANAGER/VIEWER)
- Include managed offshore staff count

#### 3.4 Staff Assignments API (CRITICAL) ⏳
**Files:** `/app/api/admin/assignments/route.ts`, `/app/api/admin/assignments/[id]/route.ts`

**Endpoints:**
- `GET /api/admin/assignments` - List all assignments
- `POST /api/admin/assignments` - Create assignment (triggers review schedule)
- `GET /api/admin/assignments/[id]` - Get assignment details
- `PUT /app/api/admin/assignments/[id]` - Update assignment
- `DELETE /api/admin/assignments/[id]` - End assignment

**Features:**
- Join User, Client, ClientUser (manager)
- Calculate next review due date from `startDate`
- Show review status (Not Sent / Pending / Overdue / Completed)
- Filter by client, staff, status

**Prisma Query Example:**
```typescript
const assignments = await prisma.staffAssignment.findMany({
  where: { isActive: true },
  include: {
    user: {
      include: {
        profile: true,
        gamificationProfile: true,
      }
    },
    client: true,
    manager: true,
  }
})
```

#### 3.5 Review Management API ⏳
**Files:** `/app/api/admin/reviews/route.ts`, `/app/api/admin/reviews/send/route.ts`, `/app/api/admin/reviews/[id]/route.ts`

**Endpoints:**
- `GET /api/admin/reviews` - List all reviews with filters
- `POST /api/admin/reviews/send` - Manually trigger review request
- `GET /api/admin/reviews/[id]` - View review details

**Features:**
- Filter by staff, client, review type, status
- Calculate due dates based on assignment start dates
- Send review request emails to clients
- View submitted review answers and scores

#### 3.6 System-Wide Endpoints ⏳
**Files:** `/app/api/admin/analytics/route.ts`, `/app/api/admin/stats/route.ts`

**Endpoints:**
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/analytics` - System metrics

**Features:**
- Aggregate data from multiple models
- Real-time counts (staff, clients, reviews, tickets)
- Average productivity scores
- Clocked-in staff count

---

### Phase 4: Data Integration (Replace Mock Data) ⏳

#### 4.1 Admin Dashboard (`/app/admin/page.tsx`) ⏳

**Replace mock stats with real queries:**

```typescript
// Total staff
const totalStaff = await prisma.user.count({
  where: { role: { in: ['STAFF', 'TEAM_LEAD', 'MANAGER'] } }
})

// Staff by employment status
const regularStaff = await prisma.profile.count({
  where: { employmentStatus: 'REGULAR' }
})
const probationStaff = await prisma.profile.count({
  where: { employmentStatus: 'PROBATION' }
})

// Active clients
const activeClients = await prisma.client.count()

// Pending reviews (calculate from assignments)
const assignments = await prisma.staffAssignment.findMany({
  where: { isActive: true },
  include: { user: { include: { reviewsReceived: true } } }
})
// Calculate reviews due based on startDate

// Open tickets
const openTickets = await prisma.ticket.count({
  where: { status: { in: ['OPEN', 'IN_PROGRESS'] } }
})

// Staff clocked in
const staffClockedIn = await prisma.timeEntry.count({
  where: { clockOut: null }
})

// Avg productivity
const avgProductivity = await prisma.performanceMetric.aggregate({
  _avg: { productivityScore: true }
})
```

**Reviews Due This Week Table:**
- Fetch from `StaffAssignment` + calculate due dates
- Month 1: `startDate` + 30 days
- Month 3: `startDate` + 90 days
- Month 5: `startDate` + 150 days
- 6-Month: Last review + 180 days

#### 4.2 Staff Management (`/app/admin/staff/page.tsx`) ⏳

**Connect to Database:**
```typescript
const staff = await prisma.user.findMany({
  where: {
    role: { in: ['STAFF', 'TEAM_LEAD', 'MANAGER'] }
  },
  include: {
    profile: true,
    staffAssignments: {
      where: { isActive: true },
      include: { client: true }
    },
    tasks: {
      where: { status: { in: ['TODO', 'IN_PROGRESS'] } }
    },
    performanceMetrics: {
      orderBy: { date: 'desc' },
      take: 30
    },
    gamificationProfile: true,
  }
})
```

**Add Create Staff Dialog:**
- Form for User + Profile creation
- Fields: name, email, password, role, phone, location, startDate, currentRole, salary

#### 4.3 Client Management (`/app/admin/clients/page.tsx`) ⏳

**Connect to Database:**
```typescript
const clients = await prisma.client.findMany({
  include: {
    offshoreStaff: {
      where: { isActive: true }
    },
    onshoreStaff: true,
    _count: {
      select: {
        offshoreStaff: true,
        onshoreStaff: true,
      }
    }
  }
})
```

**Add Create Client Dialog:**
- Form for Client organization
- Fields: companyName, industry, location, billingEmail
- Option to create initial admin user

#### 4.4 Client Users (`/app/admin/client-users/page.tsx`) ⏳

**Connect to Database:**
```typescript
const clientUsers = await prisma.clientUser.findMany({
  include: {
    client: true,
    managedOffshoreStaff: {
      where: { isActive: true }
    }
  }
})
```

#### 4.5 Assignments (`/app/admin/assignments/page.tsx`) - MOST CRITICAL ⏳

**Connect to Database:**
```typescript
const assignments = await prisma.staffAssignment.findMany({
  where: { isActive: true },
  include: {
    user: {
      include: {
        profile: true,
        reviewsReceived: {
          orderBy: { submittedDate: 'desc' }
        }
      }
    },
    client: true,
    manager: true,
  },
  orderBy: { startDate: 'desc' }
})

// For each assignment, calculate:
// - Days employed: today - startDate
// - Next review due: getNextReviewDue(startDate, completedReviews)
// - Review status: Not Sent / Pending / Overdue / Completed
```

**Add Create Assignment Dialog:**
- Staff dropdown (User where role = STAFF)
- Client dropdown (Client)
- Manager dropdown (ClientUser filtered by selected client)
- Role input
- Start date picker
- Rate input
- **Review schedule preview** showing all upcoming review dates

#### 4.6 Review Scheduling (`/app/admin/reviews/page.tsx`) ⏳

**Connect to Database:**
```typescript
// Get all assignments with their review schedules
const assignments = await prisma.staffAssignment.findMany({
  where: { isActive: true },
  include: {
    user: true,
    client: true,
  }
})

// Get all submitted reviews
const reviews = await prisma.review.findMany({
  include: {
    user: true,
  },
  orderBy: { submittedDate: 'desc' }
})

// Calculate which reviews are due/overdue for each assignment
```

**Tabs:** All / Due This Month / Overdue / Completed

**Actions:**
- "Send Review Request" → Triggers email to client
- "View Answers" → Shows submitted review details

#### 4.7 Other Pages ⏳

- **Tasks:** Connect to `Task` model with CLIENT/STAFF source filtering
- **Tickets:** Connect to `Ticket`, `TicketResponse` models
- **Documents:** Connect to `Document` model with STAFF/CLIENT source badges
- **Time Tracking:** Connect to `TimeEntry`, `PerformanceMetric` models
- **Gamification:** Connect to `GamificationProfile`, `UserBadge`, `Kudos` models
- **Analytics:** Aggregate data from multiple models
- **Activity:** Connect to `ActivityPost`, `PostReaction`, `PostComment` models

---

### Phase 5: Navigation & Portal Switching ⏳

#### 5.1 Admin Sidebar ✅
**File:** `/components/admin/admin-sidebar.tsx`

Features:
- Logo + "Shore Agents Admin"
- 14 navigation items
- Portal switcher at bottom:
  - "View Staff Portal" → `/`
  - "View Client Portal" → `/client`
  - "Admin Panel" (current, highlighted)
- Admin profile dropdown

#### 5.2 Update Staff Sidebar ⏳
**File:** `/components/dashboard-sidebar.tsx`

Add portal switcher (if user is ADMIN):
```typescript
{session.user.role === "ADMIN" && (
  <Link href="/admin">
    <Button variant="ghost">🔧 Admin Panel</Button>
  </Link>
)}
```

#### 5.3 Update Client Sidebar ⏳
**File:** `/components/client-sidebar.tsx`

Add portal switcher (if client user has OWNER/ADMIN role):
```typescript
{session.user.isAdmin && (
  <Link href="/admin">
    <Button variant="ghost">🔧 Admin Panel</Button>
  </Link>
)}
```

---

### Phase 6: Review Scheduling Logic ⏳

#### 6.1 Calculate Review Due Dates
**File:** `/lib/review-schedule.ts`

```typescript
import { Review } from "@prisma/client"

export type ReviewMilestone = {
  type: "MONTH_1" | "MONTH_3" | "MONTH_5" | "RECURRING_6M"
  dueDate: Date
  daysUntilDue: number
  isOverdue: boolean
}

/**
 * Calculate the next review due date for a staff assignment
 * @param startDate - Assignment start date
 * @param completedReviews - Array of completed reviews
 * @returns Next review milestone or null if all complete
 */
export function getNextReviewDue(
  startDate: Date,
  completedReviews: Review[]
): ReviewMilestone | null {
  const now = new Date()
  const daysSinceStart = Math.floor(
    (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Check which reviews are completed
  const completedTypes = new Set(completedReviews.map(r => r.type))

  // Month 1 Review (30 days after start)
  if (!completedTypes.has("MONTH_1")) {
    const dueDate = new Date(startDate)
    dueDate.setDate(dueDate.getDate() + 30)
    return {
      type: "MONTH_1",
      dueDate,
      daysUntilDue: Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      isOverdue: now > dueDate
    }
  }

  // Month 3 Review (90 days after start)
  if (!completedTypes.has("MONTH_3") && daysSinceStart >= 60) {
    const dueDate = new Date(startDate)
    dueDate.setDate(dueDate.getDate() + 90)
    return {
      type: "MONTH_3",
      dueDate,
      daysUntilDue: Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      isOverdue: now > dueDate
    }
  }

  // Month 5 Review (150 days after start)
  if (!completedTypes.has("MONTH_5") && daysSinceStart >= 120) {
    const dueDate = new Date(startDate)
    dueDate.setDate(dueDate.getDate() + 150)
    return {
      type: "MONTH_5",
      dueDate,
      daysUntilDue: Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      isOverdue: now > dueDate
    }
  }

  // 6-Month Recurring (every 180 days after last recurring review)
  const recurringReviews = completedReviews
    .filter(r => r.type === "RECURRING_6M")
    .sort((a, b) => b.submittedDate.getTime() - a.submittedDate.getTime())

  if (daysSinceStart >= 150) {
    const lastRecurring = recurringReviews[0]
    const baseDate = lastRecurring ? lastRecurring.submittedDate : startDate
    const dueDate = new Date(baseDate)
    dueDate.setDate(dueDate.getDate() + 180)

    if (now >= dueDate) {
      return {
        type: "RECURRING_6M",
        dueDate,
        daysUntilDue: Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        isOverdue: now > dueDate
      }
    }
  }

  return null // All reviews up to date
}

/**
 * Get complete review schedule for an assignment
 * @param startDate - Assignment start date
 * @returns Array of all review milestones
 */
export function getReviewSchedule(startDate: Date): ReviewMilestone[] {
  const milestones: ReviewMilestone[] = []
  const now = new Date()

  // Month 1
  const month1 = new Date(startDate)
  month1.setDate(month1.getDate() + 30)
  milestones.push({
    type: "MONTH_1",
    dueDate: month1,
    daysUntilDue: Math.floor((month1.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    isOverdue: now > month1
  })

  // Month 3
  const month3 = new Date(startDate)
  month3.setDate(month3.getDate() + 90)
  milestones.push({
    type: "MONTH_3",
    dueDate: month3,
    daysUntilDue: Math.floor((month3.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    isOverdue: now > month3
  })

  // Month 5
  const month5 = new Date(startDate)
  month5.setDate(month5.getDate() + 150)
  milestones.push({
    type: "MONTH_5",
    dueDate: month5,
    daysUntilDue: Math.floor((month5.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    isOverdue: now > month5
  })

  // First 6-month recurring
  const recurring1 = new Date(startDate)
  recurring1.setDate(recurring1.getDate() + 180)
  milestones.push({
    type: "RECURRING_6M",
    dueDate: recurring1,
    daysUntilDue: Math.floor((recurring1.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    isOverdue: now > recurring1
  })

  return milestones
}

/**
 * Format review type for display
 */
export function formatReviewType(type: string): string {
  const labels = {
    MONTH_1: "Month 1 Review",
    MONTH_3: "Month 3 Review",
    MONTH_5: "Month 5 - Regularization",
    RECURRING_6M: "6-Month Check-In",
    AD_HOC: "Ad-Hoc Review"
  }
  return labels[type as keyof typeof labels] || type
}
```

#### 6.2 Review Request Workflow

**Process:**
1. Admin clicks "Send Review Request" on Assignments or Reviews page
2. System checks if review already exists (prevent duplicates)
3. Creates review request email with link to client review form
4. Sends email to client (primary contact or manager)
5. Client receives email, clicks link → `/client/reviews/submit/[assignmentId]`
6. Client fills out review form (questions from `review-templates.ts`)
7. On submit, creates `Review` record with answers, calculates `overallScore`
8. Staff sees review in `/reviews` page, can acknowledge

#### 6.3 Client Review Submission Page (NEW) ⏳
**File:** `/app/client/reviews/submit/[assignmentId]/page.tsx`

**Features:**
- Fetch assignment details (staff member, role, start date, client)
- Detect review type based on start date and previous reviews
- Load questions from `review-templates.ts` (MONTH_1_QUESTIONS, MONTH_3_QUESTIONS, etc.)
- Render form with sections and question types (rating, text, select)
- Progress indicator showing completion
- Save draft functionality
- Submit button → POST to `/api/client/reviews` → creates Review record

**Form Structure:**
```typescript
<form onSubmit={handleSubmit}>
  {/* Staff Info Header */}
  <Card>
    <Avatar />
    <h2>{staffName}</h2>
    <p>{role} at {clientCompany}</p>
    <Badge>{reviewType}</Badge>
  </Card>

  {/* Questions by Section */}
  {sections.map(section => (
    <Card key={section}>
      <h3>{section.emoji} {section.name}</h3>
      {section.questions.map(q => (
        <QuestionField
          key={q.id}
          question={q}
          value={answers[q.id]}
          onChange={handleAnswerChange}
        />
      ))}
    </Card>
  ))}

  {/* Actions */}
  <Button type="button" onClick={saveDraft}>Save Draft</Button>
  <Button type="submit">Submit Review</Button>
</form>
```

---

### Phase 7: Testing & Validation ⏳

#### 7.1 Portal Access Testing
- [ ] Admin can access `/admin/*`
- [ ] Staff cannot access `/admin/*` (redirects to `/`)
- [ ] Client cannot access `/admin/*` (redirects to `/client`)
- [ ] Admin can navigate to Staff/Client portals
- [ ] Logout works from all portals

#### 7.2 Data Flow Testing
- [ ] Create staff member (shows in staff list)
- [ ] Create client organization (shows in client list)
- [ ] Create client user (shows in client users list)
- [ ] Create staff assignment (appears in assignments, triggers review schedule)
- [ ] Review due dates calculate correctly
- [ ] Send review request (client receives, can submit)
- [ ] Submitted review appears in admin panel
- [ ] Staff sees review in their portal

#### 7.3 Cross-Portal Features
- [ ] Documents uploaded by staff visible to admin
- [ ] Documents uploaded by client visible to admin
- [ ] Tasks created by client visible in admin tasks page
- [ ] Time entries from staff visible in admin time tracking
- [ ] Tickets from staff visible in admin tickets page

---

## 📊 Database Schema Reference

### Key Models

**User**
- id, email, name, role (STAFF/TEAM_LEAD/MANAGER/ADMIN/CLIENT)
- Relations: Profile, StaffAssignment, Task, Review, TimeEntry, etc.

**Profile**
- userId, startDate, daysEmployed, currentRole, salary
- employmentStatus (PROBATION/REGULAR/TERMINATED)
- Leave credits, HMO

**Client**
- id, companyName, industry, location, billingEmail
- Relations: ClientUser, StaffAssignment

**ClientUser**
- id, clientId, email, name, role (OWNER/ADMIN/MANAGER/VIEWER)
- Relations: managedOffshoreStaff (via StaffAssignment)

**StaffAssignment** (CRITICAL)
- id, userId, clientId, managerId
- role, startDate, rate, isActive
- Unique constraint: [userId, clientId]

**Review**
- id, userId, type (MONTH_1/MONTH_3/MONTH_5/RECURRING_6M/AD_HOC)
- status (PENDING/ACKNOWLEDGED/ARCHIVED)
- client, reviewer, reviewerTitle
- submittedDate, evaluationPeriod
- overallScore, previousScore
- answers (JSON)
- acknowledgedDate

---

## 🚀 Implementation Order

1. ✅ **File Copy & Merge** - Get admin UI into main project
2. ✅ **Authentication** - Protect admin routes
3. ⏳ **Navigation** - Portal switching works
4. ⏳ **API Routes** - Create admin-specific endpoints
5. ⏳ **Dashboard Integration** - Admin home page with real data
6. ⏳ **Assignments Page** - Most critical for review scheduling
7. ⏳ **Review Scheduling** - Calculate due dates, send requests
8. ⏳ **Client Review Form** - Allow clients to submit reviews
9. ⏳ **Remaining Pages** - Connect other admin pages to DB
10. ⏳ **Testing** - Validate entire system

---

## ✅ Success Criteria

- [ ] All 3 portals accessible with proper authentication
- [ ] Admin can manage staff, clients, and assignments
- [ ] Review scheduling calculates due dates correctly from assignment start date
- [ ] Clients can submit reviews through their portal
- [ ] Staff can view submitted reviews
- [ ] Portal navigation works seamlessly
- [ ] No broken links or missing pages
- [ ] All mock data replaced with real database queries
- [ ] Time tracking, tasks, tickets, documents all visible in admin panel
- [ ] System-wide analytics and reporting working

---

## 📝 Progress Tracking

### Current Status (Updated: October 13, 2025)

**Phase 1:** ✅ Complete (100%)  
**Phase 2:** ✅ Complete (100%)  
**Phase 3:** ⏳ Not Started (0%)  
**Phase 4:** ⏳ Not Started (0%)  
**Phase 5:** ⏳ Partially Complete (33%)  
**Phase 6:** ⏳ Not Started (0%)  
**Phase 7:** ⏳ Not Started (0%)

**Overall Progress:** ~22%

---

## ✅ Completed Work (Phases 1 & 2)

### Phase 1: File Structure & Component Merge ✅

#### Files Created/Modified:
- ✅ **app/admin/** - All 14 admin pages copied
  - `page.tsx` (Dashboard overview)
  - `staff/page.tsx`
  - `clients/page.tsx`
  - `client-users/page.tsx`
  - `assignments/page.tsx`
  - `reviews/page.tsx`
  - `tasks/page.tsx`
  - `tickets/page.tsx`
  - `documents/page.tsx`
  - `time-tracking/page.tsx`
  - `gamification/page.tsx`
  - `analytics/page.tsx`
  - `activity/page.tsx`
  - `settings/page.tsx`
  - All include `loading.tsx` for Suspense

- ✅ **components/admin/** - Admin-specific components
  - `admin-sidebar.tsx` - Navigation with 14 items + portal switcher
  - `admin-dashboard.tsx`
  - `icons.tsx`

- ✅ **public/admin/** - Admin assets
  - All placeholder images (*.png, *.jpg)

- ✅ **Import Fixes**
  - All admin pages updated to use `@/components/admin/icons`
  - Removed `DashboardLayout` wrapper (using layout.tsx instead)
  - Fixed image paths to use `/admin/` prefix

### Phase 2: Authentication & Authorization ✅

#### Files Created:
- ✅ **app/admin/layout.tsx**
  - Checks for authenticated session
  - Redirects non-logged-in users to `/login?callbackUrl=/admin`
  - Enforces ADMIN role requirement
  - Redirects CLIENT role to `/client`
  - Redirects STAFF/TEAM_LEAD/MANAGER to `/`
  - Wraps children with `<AdminSidebar>`

#### Features Implemented:
- ✅ Role-based access control (ADMIN only)
- ✅ Automatic redirection based on user role
- ✅ AdminSidebar with 14 navigation items
- ✅ Portal switcher in sidebar (Staff Portal, Client Portal links)
- ✅ Dark purple/indigo theme matching design
- ✅ Build successfully compiles

### Phase 5: Navigation (Partially Complete - 33%)

#### Completed:
- ✅ AdminSidebar component created with portal switcher
- ✅ Links to Staff Portal (`/`) and Client Portal (`/client`)

#### Outstanding:
- ⏳ Update Staff Sidebar (`components/dashboard-sidebar.tsx`)
  - Add "Admin Panel" link for users with ADMIN role
- ⏳ Update Client Sidebar (`components/client-sidebar.tsx`)
  - Add "Admin Panel" link for OWNER/ADMIN client users

---

## 🚧 Outstanding Work

### Phase 3: Admin API Routes (0%)

**Priority: HIGH** - Required for all admin pages to function

#### To Create:
- [ ] `/app/api/admin/staff/route.ts` - GET (list), POST (create)
- [ ] `/app/api/admin/staff/[id]/route.ts` - GET, PUT, DELETE
- [ ] `/app/api/admin/clients/route.ts` - GET (list), POST (create)
- [ ] `/app/api/admin/clients/[id]/route.ts` - GET, PUT, DELETE
- [ ] `/app/api/admin/client-users/route.ts` - GET (list), POST (create)
- [ ] `/app/api/admin/client-users/[id]/route.ts` - GET, PUT, DELETE
- [ ] `/app/api/admin/assignments/route.ts` - **CRITICAL** - GET (list), POST (create with review scheduling)
- [ ] `/app/api/admin/assignments/[id]/route.ts` - GET, PUT, DELETE
- [ ] `/app/api/admin/reviews/route.ts` - GET (list with filters)
- [ ] `/app/api/admin/reviews/send/route.ts` - POST (trigger review request)
- [ ] `/app/api/admin/reviews/[id]/route.ts` - GET (view details)
- [ ] `/app/api/admin/analytics/route.ts` - GET (system metrics)
- [ ] `/app/api/admin/stats/route.ts` - GET (dashboard statistics)

**Estimated Time:** 6-8 hours

### Phase 4: Data Integration (0%)

**Priority: HIGH** - Replace all mock data with real database queries

#### Pages to Update:
- [ ] `/app/admin/page.tsx` - Dashboard with real stats
- [ ] `/app/admin/staff/page.tsx` - Staff list from database
- [ ] `/app/admin/clients/page.tsx` - Client list from database
- [ ] `/app/admin/client-users/page.tsx` - Client users from database
- [ ] `/app/admin/assignments/page.tsx` - **CRITICAL** - Assignments with review schedules
- [ ] `/app/admin/reviews/page.tsx` - Reviews from database
- [ ] `/app/admin/tasks/page.tsx` - Tasks from database
- [ ] `/app/admin/tickets/page.tsx` - Tickets from database
- [ ] `/app/admin/documents/page.tsx` - Documents from database
- [ ] `/app/admin/time-tracking/page.tsx` - Time entries from database
- [ ] `/app/admin/gamification/page.tsx` - Gamification data from database
- [ ] `/app/admin/analytics/page.tsx` - Analytics from database
- [ ] `/app/admin/activity/page.tsx` - Activity feed from database
- [ ] `/app/admin/settings/page.tsx` - System settings

**Estimated Time:** 8-10 hours

### Phase 5: Navigation (67% remaining)

#### To Complete:
- [ ] Update `/components/dashboard-sidebar.tsx`
  - Add check: `{session.user.role === "ADMIN" && <Link href="/admin">Admin Panel</Link>}`
- [ ] Update `/components/client-sidebar.tsx`
  - Add check: `{session.user.isAdmin && <Link href="/admin">Admin Panel</Link>}`
- [ ] Update `/app/login/page.tsx`
  - Add role-based redirect after login
  - ADMIN → `/admin`
  - CLIENT → `/client`
  - STAFF/TEAM_LEAD/MANAGER → `/`

**Estimated Time:** 1 hour

### Phase 6: Review Scheduling Logic (0%)

**Priority: CRITICAL** - Core feature for admin portal

#### To Create:
- [ ] `/lib/review-schedule.ts`
  - `getNextReviewDue()` function
  - `getReviewSchedule()` function
  - `formatReviewType()` function
- [ ] `/app/client/reviews/submit/[assignmentId]/page.tsx`
  - Client review submission form
  - Dynamic question rendering from `review-templates.ts`
  - Progress indicator
  - Save draft functionality
- [ ] Email notification system for review requests
- [ ] Integration with assignments page

**Estimated Time:** 6-8 hours

### Phase 7: Testing & Validation (0%)

**Priority: MEDIUM** - After all features implemented

#### Test Cases:
- [ ] Portal access control (3 test scenarios)
- [ ] Data flow testing (8 test scenarios)
- [ ] Cross-portal features (5 test scenarios)
- [ ] Review scheduling workflow (end-to-end)
- [ ] Create/update/delete operations for all entities

**Estimated Time:** 4-6 hours

---

## 📊 Detailed Completion Status

| Component | Status | Files Modified | Notes |
|-----------|--------|----------------|-------|
| Admin Pages | ✅ 100% | 14 page files + loading states | All copied and fixed |
| Admin Layout | ✅ 100% | `app/admin/layout.tsx` | Auth protection working |
| Admin Sidebar | ✅ 100% | `components/admin/admin-sidebar.tsx` | Navigation + portal switcher |
| Admin APIs | ❌ 0% | 13+ API route files needed | Phase 3 - Not started |
| Database Integration | ❌ 0% | 14 admin page files | Phase 4 - Not started |
| Portal Switching | ⏳ 33% | 3 sidebar components | Only admin sidebar done |
| Review Scheduling | ❌ 0% | `lib/review-schedule.ts` + client form | Phase 6 - Not started |
| Testing | ❌ 0% | N/A | Phase 7 - After implementation |

---

## ⚠️ Blockers & Dependencies

### Current Blockers:
None - ready to proceed with Phase 3

### Dependencies:
1. **Phase 4** depends on **Phase 3** - Need APIs before connecting UI
2. **Phase 6** depends on **Phase 3 & 4** - Need assignments API and data
3. **Phase 7** depends on **All previous phases** - Testing requires complete implementation

---

## 🎯 Next Steps (Priority Order)

1. **Phase 3.4** - Create Assignments API (CRITICAL)
   - This unlocks review scheduling functionality
   - Required for: assignments page, review scheduling, dashboard stats

2. **Phase 6.1** - Create Review Scheduling Logic
   - Required immediately after assignments API
   - Enables: review due date calculations, overdue detection

3. **Phase 3.1-3.3** - Create Staff, Client, Client User APIs
   - Required for: staff management, client management pages
   - Enables: creating assignments (depends on staff/client existence)

4. **Phase 4.1 & 4.5** - Connect Dashboard & Assignments Page
   - High visibility pages
   - Show immediate value to users

5. **Phase 3.5** - Create Reviews API
   - Required for: sending review requests, viewing submissions

6. **Phase 6.3** - Create Client Review Submission Form
   - Completes the review workflow loop

7. **Phase 4.2-4.7** - Connect Remaining Admin Pages
   - Lower priority, can be done incrementally

8. **Phase 5** - Complete Portal Switching
   - Quick wins, improves navigation UX

9. **Phase 7** - Testing & Validation
   - Final phase after all features complete

---

## 📈 Estimated Time to Completion

| Phase | Status | Time Remaining | Complexity |
|-------|--------|----------------|------------|
| Phase 1 | ✅ Complete | 0 hours | Low |
| Phase 2 | ✅ Complete | 0 hours | Medium |
| Phase 3 | ⏳ Not Started | 6-8 hours | High |
| Phase 4 | ⏳ Not Started | 8-10 hours | Medium |
| Phase 5 | ⏳ 33% Complete | 1 hour | Low |
| Phase 6 | ⏳ Not Started | 6-8 hours | High |
| Phase 7 | ⏳ Not Started | 4-6 hours | Medium |

**Total Estimated Time Remaining:** 25-33 hours  
**Total Project Time:** 30-38 hours  
**Current Progress:** 22%

---

## 🔗 Related Documents

- `AI-ASSISTANT-DOCUMENT-SYNC-COMPLETE.md` - Document sync feature docs
- `CRITICAL-PATTERNS-DO-NOT-BREAK.md` - Coding guidelines
- `CLIENT-PORTAL-SETUP.md` - Client portal documentation
- `PROJECT_STATUS.md` - Overall project status
- `lib/review-templates.ts` - Review question templates
- `prisma/schema.prisma` - Database schema

---

## 👥 Roles & Permissions

| Role | Staff Portal | Client Portal | Admin Portal |
|------|-------------|---------------|--------------|
| **STAFF** | ✅ Full Access | ❌ No Access | ❌ No Access |
| **TEAM_LEAD** | ✅ Full Access | ❌ No Access | ❌ No Access |
| **MANAGER** | ✅ Full Access | ❌ No Access | ❌ No Access |
| **ADMIN** | ✅ Can View | ✅ Can View | ✅ Full Access |
| **CLIENT (OWNER)** | ❌ No Access | ✅ Full Access | ❌ No Access |
| **CLIENT (ADMIN)** | ❌ No Access | ✅ Full Access | ❌ No Access |
| **CLIENT (MANAGER)** | ❌ No Access | ✅ Limited Access | ❌ No Access |
| **CLIENT (VIEWER)** | ❌ No Access | ✅ Read Only | ❌ No Access |

---

**Last Updated:** October 13, 2025  
**Next Review:** After Phase 3 completion

