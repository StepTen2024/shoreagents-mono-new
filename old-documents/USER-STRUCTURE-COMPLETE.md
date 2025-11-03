# 🏢 Shore Agents - Complete User Structure & Setup Guide

**Last Updated:** October 13, 2025  
**Status:** 🔵 Ready for Implementation

---

## 📋 Table of Contents

1. [The Three Groups](#the-three-groups)
2. [Database Structure](#database-structure)
3. [Access Points](#three-access-points)
4. [Logic Layers (9 Total)](#logic-layers)
5. [User Setup Guide](#user-setup-guide)

---

## The Three Groups

```
YOU (Shore Agents)
    ↓ employs
BPO WORKERS
    ↓ assigned to
CLIENTS
```

### 1️⃣ SHORE AGENTS (Internal Team)

**Your company's employees**

```
ADMIN
└─ Superuser (full system access)

MANAGER  
├─ IT Manager
├─ HR Manager
├─ Recruitment Manager
├─ Account Manager
└─ Finance Manager
```

**Database:** Stored in `User` table with roles: `ADMIN`, `MANAGER`

---

### 2️⃣ BPO WORKERS (Client's Offshore Employees)

**YOU employ them on behalf of the CLIENT**

```
STAFF (or TEAM_LEAD)
└─ Client's offshore worker
```

**Important Notes:**
- TEAM_LEAD is just a label - treat them the same as STAFF
- These are YOUR employees but work for the CLIENT
- They use Electron App or Web (`/`)

**Database:** Stored in `User` table with roles: `STAFF`, `TEAM_LEAD`

---

### 3️⃣ CLIENTS (Customer Companies)

**Your customers who hire BPO workers from you**

```
CLIENT (Organization)
└─ Company (TechCorp, HealthCo, etc.)

CLIENTUSER (People at that company)
├─ CEO
├─ COO
├─ Managers
└─ Team Leads
```

**Database:**
- `Client` table = The company
- `ClientUser` table = People who work at that company

---

## Database Structure

### Core Tables

#### 1. **User** (Shore Agents + BPO Workers)
```prisma
model User {
  id       String
  email    String  @unique
  name     String
  role     Role    // ADMIN, MANAGER, TEAM_LEAD, STAFF
  password String
}
```

**Contains:**
- Shore Agents staff (ADMIN, MANAGER)
- BPO Workers (STAFF, TEAM_LEAD)

---

#### 2. **Client** (Client Companies)
```prisma
model Client {
  id          String
  companyName String
  industry    String
  contactInfo String
}
```

**One record per company:**
- TechCorp Inc.
- HealthCo Solutions
- RetailMart Co.

---

#### 3. **ClientUser** (Client's Employees)
```prisma
model ClientUser {
  id       String
  clientId String
  email    String  @unique
  name     String
  role     String  // CEO, COO, Manager, etc.
  password String
  
  client   Client  @relation(fields: [clientId], references: [id])
}
```

**Multiple users per client:**
- TechCorp → Wendy (CEO), John (CTO), Sarah (HR Manager)
- HealthCo → Michael (CEO), Lisa (Operations Manager)

---

#### 4. **StaffAssignment** (Links BPO Workers to Clients)
```prisma
model StaffAssignment {
  id        String
  userId    String   // BPO Worker
  clientId  String   // Which client they work for
  startDate DateTime
  isActive  Boolean
  
  user      User     @relation(fields: [userId], references: [id])
  client    Client   @relation(fields: [clientId], references: [id])
}
```

**Purpose:** Shows which BPO worker is assigned to which client

---

## Relationships

```
┌─────────────────────────────────────────────────────┐
│                  Shore Agents                       │
│                                                     │
│  ADMIN                    MANAGER                   │
│  └─ System Admin          ├─ IT Manager            │
│                          ├─ HR Manager            │
│                          └─ Account Manager       │
└─────────────────────────────────────────────────────┘
                           │
                           │ employs
                           ▼
┌─────────────────────────────────────────────────────┐
│                   BPO Workers                       │
│                                                     │
│  STAFF / TEAM_LEAD                                  │
│  ├─ Maria Santos ──────────────┐                   │
│  ├─ John Reyes ────────────────┤                   │
│  └─ Sarah Lopez ───────────────┘                   │
└─────────────────────────────────────────────────────┘
                           │
                           │ via StaffAssignment
                           ▼
┌─────────────────────────────────────────────────────┐
│                     Clients                         │
│                                                     │
│  CLIENT (Company)                                   │
│  └─ TechCorp Inc.                                   │
│      └─ CLIENTUSER (Employees)                      │
│          ├─ Wendy (CEO)                             │
│          ├─ John (CTO)                              │
│          └─ Sarah (HR)                              │
└─────────────────────────────────────────────────────┘
```

---

## Three Access Points

### 1. Admin Portal: `/admin`
**Who:** Shore Agents Management (ADMIN, MANAGER)  
**Purpose:** Manage everything - BPO workers, clients, assignments, approvals

### 2. Staff Portal: `/` (Web) or Electron App
**Who:** BPO Workers (STAFF, TEAM_LEAD)  
**Purpose:** Work interface - clock in/out, tasks, see assigned client's info

### 3. Client Portal: `/client`
**Who:** Client's employees (ClientUser)  
**Purpose:** Monitor their assigned BPO workers, assign tasks, submit reviews

---

## Logic Layers

---

## LOGIC: Layer 1 - Login & Clock In/Out

### Login (Before Shift)

**STAFF (BPO Worker):**
- Opens Electron App OR web (`/`)
- Enters email/password
- Gets authenticated
- Sees their dashboard

**CLIENT (Client User):**
- Goes to `/client`
- Enters email/password
- Sees their assigned BPO workers

**ADMIN/MANAGER:**
- Goes to `/admin`
- Enters email/password
- Sees everything

### Clock In/Out

**STAFF:**
- Clicks "Clock In" → Creates `TimeEntry` record
- Works during shift
- Clicks "Clock Out" → Updates `TimeEntry` record with end time

### Visibility - Time Tracking Data

| Portal | What They See | Filter Logic |
|--------|---------------|--------------|
| **STAFF** | ONLY their own time entries | `WHERE timeEntry.userId = currentUser.id` |
| **CLIENT** | ONLY their assigned BPO workers' entries | `WHERE staffAssignment.clientId = client.id` |
| **ADMIN** | ALL time entries (all workers, all clients) | No filter |

---

## LOGIC: Layer 2 - Breaks

### Breaks

**STAFF:**
- Clicks "Start Break" → Creates `Break` record
- Takes break (Lunch, Restroom, Away, etc.)
- Clicks "End Break" → Updates `Break` record with end time

### Visibility - Break Data

| Portal | What They See | Filter Logic |
|--------|---------------|--------------|
| **STAFF** | ONLY their own breaks | `WHERE break.userId = currentUser.id` |
| **CLIENT** | ONLY their assigned BPO workers' breaks | `WHERE staffAssignment.clientId = client.id` |
| **ADMIN** | ALL breaks (all workers, all clients) | No filter |

---

## LOGIC: Layer 3 - Tasks

### Task Creation

**STAFF:**
- Can create tasks for themselves
- Source: `SELF`

**CLIENT:**
- Can create tasks for their assigned BPO workers
- Source: `CLIENT`

**MANAGER:**
- Can create tasks for any BPO worker
- Source: `MANAGER`

### Visibility - Tasks

| Portal | What They See | Filter Logic |
|--------|---------------|--------------|
| **STAFF** | ONLY their own tasks (created by them OR assigned to them) | `WHERE task.userId = currentUser.id` |
| **CLIENT** | ALL tasks for their assigned BPO workers<br>Shows who created each task:<br>- "Created by [Staff Name]" (staff created)<br>- "Created by You" (client created) | `WHERE staffAssignment.clientId = client.id` |
| **ADMIN** | ALL tasks (all staff, all clients)<br>Can filter by:<br>- Staff member<br>- Client<br>- Source (SELF, CLIENT, MANAGER) | No filter (or apply filters) |

---

## LOGIC: Layer 4 - Tickets

### Ticket Creation

**STAFF:**
- Can submit tickets for:
  - IT issues
  - HR issues
  - PC/equipment problems
  - Other support needs
- Ticket gets tagged by type (IT, HR, Equipment, etc.)

### Visibility - Tickets

| Portal | What They See | Filter Logic |
|--------|---------------|--------------|
| **STAFF** | ONLY their own tickets<br>Can see status/progress | `WHERE ticket.userId = currentUser.id` |
| **CLIENT** | ❌ Cannot see tickets<br>No access to staff support tickets | N/A |
| **ADMIN/MANAGER** | ALL tickets (from all staff)<br>Can filter by:<br>- Ticket type (IT, HR, Equipment)<br>- Staff member<br>- Status<br>- Date | No filter (or apply filters) |

---

## LOGIC: Layer 5 - Reviews (Performance Reviews)

### Review Process Flow

```
1. Review created (based on staff start date - DOLE requirement)
   └─ Notification sent to CLIENT 1 week before due date
   └─ Status: AUTO-CREATED

2. CLIENT completes review for their BPO worker
   └─ Submits review
   └─ Status: "PENDING_APPROVAL"

3. ADMIN/MANAGEMENT reviews what client said
   └─ Checks content
   └─ Approves review
   └─ Status: "APPROVED"

4. ADMIN/MANAGEMENT finalizes review
   └─ Makes it official
   └─ Status: "FINALIZED"

5. STAFF can now see the finalized review
   └─ Can acknowledge it
   └─ Status: "ACKNOWLEDGED"
```

### Review Status Flow

```
PENDING_APPROVAL → APPROVED → FINALIZED → ACKNOWLEDGED → ARCHIVED
   (Client)        (Admin)    (Admin)      (Staff)      (Admin)
```

### Visibility - Reviews

| Portal | What They See | Filter Logic |
|--------|---------------|--------------|
| **STAFF** | ONLY their own reviews<br>ONLY sees status: `FINALIZED` or `ACKNOWLEDGED`<br>❌ Cannot see `PENDING_APPROVAL` or `APPROVED` | `WHERE review.userId = currentUser.id AND review.status IN ('FINALIZED', 'ACKNOWLEDGED')` |
| **CLIENT** | Reviews for their assigned BPO workers<br>Can create/submit reviews<br>Can see reviews they submitted (all statuses) | `WHERE staffAssignment.clientId = client.id` |
| **ADMIN/MANAGER** | ALL reviews (all staff, all clients, all statuses)<br>Can approve reviews<br>Can finalize reviews<br>Acts as middle man | No filter |

---

## LOGIC: Layer 6 - Documents & AI Assistant

### Document Upload

**STAFF:**
- Uploads docs to their **AI Assistant** (personal)
- Personal work documents
- Only they can see their uploaded docs

**CLIENT:**
- Uploads docs to **Knowledge Base** (KB)
- Can select visibility:
  - **All their BPO workers** (shared to all staff)
  - **Specific BPO worker only** (individual access)

### Document Sharing Fields

```prisma
model Document {
  source        DocumentSource  // STAFF or CLIENT
  sharedWithAll Boolean         // Share with all staff?
  sharedWith    String[]        // Specific staff/client IDs
}
```

### Visibility - Documents

| Portal | What They See | Filter Logic |
|--------|---------------|--------------|
| **STAFF** | **AI Assistant:** Their own uploaded docs<br>**Knowledge Base:** Docs client shared with them<br>- Docs shared to "all staff"<br>- Docs shared specifically to them | `WHERE (doc.userId = currentUser.id) OR (doc.sharedWithAll = true AND staffAssignment.clientId = doc.clientId) OR (currentUser.id IN doc.sharedWith)` |
| **CLIENT** | **Knowledge Base:** All docs they uploaded<br>Can see which staff have access to each doc | `WHERE doc.uploadedBy = clientUser.id OR doc.source = 'CLIENT'` |
| **ADMIN/MANAGER** | ALL documents (all staff personal + all client KB)<br>Can filter by:<br>- Staff member<br>- Client<br>- Document type | No filter |

### Interface Sections

**STAFF Portal:**
- 📁 AI Assistant section (personal docs)
- 📚 Knowledge Base section (client-shared docs)

**CLIENT Portal:**
- 📚 Knowledge Base section (upload & manage docs for their workers)

**ADMIN Portal:**
- 📂 All Knowledge Docs section (everything)

---

## LOGIC: Layer 7 - Staff Performance (Monitoring)

### Performance Data (From Electron App)

**Collected Metrics:**
- Mouse Movements
- Mouse Clicks
- Keystrokes
- Idle Time
- Active Time
- Apps Used
- URLs Visited
- Screenshots (optional)

**Stored in:** `PerformanceMetric` table

### Visibility - Performance Data

| Portal | What They See | Filter Logic |
|--------|---------------|--------------|
| **STAFF** | ONLY their own performance data<br>Can see their productivity score | `WHERE performance.userId = currentUser.id` |
| **CLIENT** | Performance data for their assigned BPO workers<br>Can view:<br>- All their staff together (aggregate)<br>- Individual staff member (detailed) | `WHERE staffAssignment.clientId = client.id` |
| **ADMIN/MANAGER** | ALL staff performance data<br>Can filter by:<br>- Individual staff member<br>- Specific client (all their workers)<br>- All staff (system-wide) | No filter |

---

## LOGIC: Layer 8 - Team (BPO Workers)

### Team View

**Purpose:** Let BPO workers see their teammates (other workers on same client)

### Visibility - Team Members

| Portal | What They See | Filter Logic |
|--------|---------------|--------------|
| **STAFF** | Other BPO workers assigned to the SAME client<br>Shows teammates working for their client<br>Header: "{ClientName} Team" | `WHERE staffAssignment.clientId IN (SELECT clientId FROM staffAssignment WHERE userId = currentUser.id)` |
| **CLIENT** | Already sees their assigned workers (from other features)<br>No separate team view needed | N/A |
| **ADMIN/MANAGER** | Already sees all staff (from other features)<br>No separate team view needed | N/A |

---

## LOGIC: Layer 9 - Activity Feed (Social Feed)

### Activity Feed Content

**Automatic Posts:**
- Task completed
- Clock in/out
- Break start/end
- Review acknowledged
- Milestones reached

**Manual Posts:**
- Staff can create posts
- Clients can create posts
- Management can create posts

### Visibility - Activity Feed

| Portal | What They See | Filter Logic |
|--------|---------------|--------------|
| **STAFF** | Posts from their team (BPO workers on same client)<br>Automatic activity from teammates<br>Manual posts from teammates<br>Posts from their client<br>Posts from management (if targeted) | `WHERE staffAssignment.clientId = currentUser.clientId` |
| **CLIENT** | All activity from their assigned BPO workers<br>Automatic activity (tasks, clock in/out, breaks)<br>Manual posts from their workers<br>Posts from management (if targeted)<br>Can create posts visible to their workers | `WHERE staffAssignment.clientId = client.id` |
| **ADMIN/MANAGER** | ALL activity (all staff, all clients)<br>Can filter by:<br>- Staff level (individual)<br>- Client level (all workers for client)<br>- All activity (system-wide)<br>Can create posts with visibility control | No filter (or apply filters) |

---

## User Setup Guide

### Step 1: Create Shore Agents Staff

```sql
-- System Admin
INSERT INTO User (role, email, name, password)
VALUES ('ADMIN', 'admin@shoreagents.com', 'System Admin', 'hashed_password');

-- IT Manager
INSERT INTO User (role, email, name, password)
VALUES ('MANAGER', 'it@shoreagents.com', 'IT Manager', 'hashed_password');

-- HR Manager
INSERT INTO User (role, email, name, password)
VALUES ('MANAGER', 'hr@shoreagents.com', 'HR Manager', 'hashed_password');

-- Account Manager
INSERT INTO User (role, email, name, password)
VALUES ('MANAGER', 'accounts@shoreagents.com', 'Account Manager', 'hashed_password');
```

---

### Step 2: Create Client Companies

```sql
-- TechCorp Inc.
INSERT INTO Client (companyName, industry, contactInfo)
VALUES ('TechCorp Inc.', 'Technology', 'contact@techcorp.com');

-- HealthCo Solutions
INSERT INTO Client (companyName, industry, contactInfo)
VALUES ('HealthCo Solutions', 'Healthcare', 'contact@healthco.com');

-- RetailMart Co.
INSERT INTO Client (companyName, industry, contactInfo)
VALUES ('RetailMart Co.', 'Retail', 'contact@retailmart.com');
```

---

### Step 3: Create Client Users (People at those companies)

```sql
-- TechCorp Users
INSERT INTO ClientUser (clientId, email, name, role, password)
VALUES 
  ('techcorp_id', 'wendy@techcorp.com', 'Wendy Chen', 'CEO', 'hashed_password'),
  ('techcorp_id', 'john@techcorp.com', 'John Smith', 'CTO', 'hashed_password'),
  ('techcorp_id', 'sarah@techcorp.com', 'Sarah Johnson', 'HR Manager', 'hashed_password');

-- HealthCo Users
INSERT INTO ClientUser (clientId, email, name, role, password)
VALUES 
  ('healthco_id', 'michael@healthco.com', 'Michael Brown', 'CEO', 'hashed_password'),
  ('healthco_id', 'lisa@healthco.com', 'Lisa Martinez', 'Operations Manager', 'hashed_password');

-- RetailMart Users
INSERT INTO ClientUser (clientId, email, name, role, password)
VALUES 
  ('retailmart_id', 'david@retailmart.com', 'David Wilson', 'CEO', 'hashed_password');
```

---

### Step 4: Create BPO Workers (Staff)

```sql
-- TechCorp Workers
INSERT INTO User (role, email, name, password)
VALUES 
  ('STAFF', 'maria.santos@shoreagents.com', 'Maria Santos', 'hashed_password'),
  ('STAFF', 'juan.reyes@shoreagents.com', 'Juan Reyes', 'hashed_password'),
  ('TEAM_LEAD', 'ana.cruz@shoreagents.com', 'Ana Cruz', 'hashed_password');

-- HealthCo Workers
INSERT INTO User (role, email, name, password)
VALUES 
  ('STAFF', 'pedro.garcia@shoreagents.com', 'Pedro Garcia', 'hashed_password'),
  ('STAFF', 'carmen.lopez@shoreagents.com', 'Carmen Lopez', 'hashed_password');

-- RetailMart Workers
INSERT INTO User (role, email, name, password)
VALUES 
  ('STAFF', 'miguel.torres@shoreagents.com', 'Miguel Torres', 'hashed_password'),
  ('STAFF', 'isabel.morales@shoreagents.com', 'Isabel Morales', 'hashed_password');
```

---

### Step 5: Create Staff Assignments (Link workers to clients)

```sql
-- TechCorp Assignments
INSERT INTO StaffAssignment (userId, clientId, startDate, isActive)
VALUES 
  ('maria_id', 'techcorp_id', '2024-01-15', true),
  ('juan_id', 'techcorp_id', '2024-02-01', true),
  ('ana_id', 'techcorp_id', '2024-03-10', true);

-- HealthCo Assignments
INSERT INTO StaffAssignment (userId, clientId, startDate, isActive)
VALUES 
  ('pedro_id', 'healthco_id', '2024-01-20', true),
  ('carmen_id', 'healthco_id', '2024-04-01', true);

-- RetailMart Assignments
INSERT INTO StaffAssignment (userId, clientId, startDate, isActive)
VALUES 
  ('miguel_id', 'retailmart_id', '2024-02-15', true),
  ('isabel_id', 'retailmart_id', '2024-03-20', true);
```

---

## Test Scenarios After Setup

### Scenario 1: Maria Santos (TechCorp Worker)

**Login:** `maria.santos@shoreagents.com`

**Should See:**
- ✅ Only HER time entries
- ✅ Only HER tasks
- ✅ Team page showing: Ana Cruz, Juan Reyes (other TechCorp workers)
- ✅ Team header: "TechCorp Team"
- ✅ Only FINALIZED reviews

**Should NOT See:**
- ❌ Pedro or Carmen (HealthCo workers)
- ❌ Miguel or Isabel (RetailMart workers)
- ❌ PENDING_APPROVAL reviews

---

### Scenario 2: Wendy Chen (TechCorp CEO)

**Login:** `wendy@techcorp.com`

**Should See:**
- ✅ ALL TechCorp workers (Maria, Juan, Ana)
- ✅ ALL their time entries
- ✅ ALL their performance data
- ✅ Can create tasks for them
- ✅ Can submit reviews for them

**Should NOT See:**
- ❌ HealthCo workers
- ❌ RetailMart workers

---

### Scenario 3: System Admin

**Login:** `admin@shoreagents.com`

**Should See:**
- ✅ ALL workers (all companies)
- ✅ ALL time entries
- ✅ ALL reviews (any status)
- ✅ Can approve reviews
- ✅ Can finalize reviews

---

## Summary: Who Sees What

| Feature | STAFF | CLIENT | ADMIN |
|---------|-------|--------|-------|
| **Time Tracking** | Own only | Assigned workers | ALL |
| **Breaks** | Own only | Assigned workers | ALL |
| **Tasks** | Own only | Assigned workers | ALL |
| **Tickets** | Own only | ❌ None | ALL |
| **Reviews** | Own (FINALIZED only) | Assigned workers (any status) | ALL (any status) |
| **Documents** | Own + shared | Own uploads | ALL |
| **Performance** | Own only | Assigned workers | ALL |
| **Team** | Same-client workers | N/A | ALL |
| **Activity Feed** | Same-client team | Assigned workers | ALL |

---

**End of User Structure Guide**

**Ready for Seed Script Creation!** 🚀

