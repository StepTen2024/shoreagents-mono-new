# 👁️ WHO SEES WHAT - Quick Reference Guide

**Last Updated:** October 13, 2025

---

## 📊 Quick Access Matrix

| Feature | 🔴 ADMIN | 🔵 STAFF | 🟢 CLIENT |
|---------|---------|---------|----------|
| **Dashboard** | All data | Own stats | Org stats |
| **Staff Profiles** | All staff | Own only | Assigned only |
| **Client Orgs** | All clients | Assigned only | Own org only |
| **Client Users** | All users | Contact info | Own org users |
| **Assignments** | All | Own only | Assigned to org |
| **Reviews** | All | Own reviews | Can submit |
| **Tasks** | All | Own only | ❌ No access |
| **Time Tracking** | All | Own only | Assigned staff |
| **Gamification** | All | Own + leaderboard | ❌ No access |
| **Documents** | All | Assigned | Own org docs |
| **Support Tickets** | All | Own only | Own org only |
| **Social Feed** | All + moderate | Full access | ❌ No access |
| **AI Assistant** | Full | Personal | Limited |
| **Analytics** | Full | Own stats | Org stats |
| **Settings** | System wide | Personal | Personal |

---

## 🎯 Permission Levels

### 🔴 ADMIN (System Administrator)
**Role:** `ADMIN`  
**Login:** `/login/admin`

#### Can See:
- ✅ Everything across all clients
- ✅ All staff members
- ✅ All client organizations
- ✅ All assignments, reviews, tasks
- ✅ System-wide analytics
- ✅ All time entries
- ✅ All documents

#### Can Do:
- ✅ Create/Edit/Delete staff
- ✅ Create/Edit/Delete clients
- ✅ Create/Edit/Delete client users
- ✅ Assign staff to clients
- ✅ Send review requests
- ✅ Override any settings
- ✅ View all reports
- ✅ Export all data

#### Cannot Do:
- ❌ (Has full access)

---

### 🔵 STAFF (Offshore Staff Member)
**Roles:** `STAFF`, `TEAM_LEAD`, `MANAGER`  
**Login:** `/login/staff`

#### Can See:
- ✅ Own profile & stats
- ✅ Clients they're assigned to
- ✅ Own tasks & assignments
- ✅ Own time logs
- ✅ Own reviews & feedback
- ✅ Own gamification progress
- ✅ Leaderboard (all staff)
- ✅ Documents assigned to them
- ✅ Own support tickets
- ✅ Social feed (staff only)

#### Can Do:
- ✅ Update own profile
- ✅ Clock in/out
- ✅ Complete tasks
- ✅ Upload documents
- ✅ Create support tickets
- ✅ Post on social feed
- ✅ Earn points & achievements

#### Cannot Do:
- ❌ See other staff's private data
- ❌ Edit assignments
- ❌ Create/edit clients
- ❌ Access admin features
- ❌ See other staff's reviews
- ❌ Modify gamification points

---

### 🟢 CLIENT (Client Organization User)
**Roles:** `CLIENT_ADMIN`, `CLIENT_USER`  
**Login:** `/login/client`

#### Can See:
- ✅ Own organization profile
- ✅ Staff assigned to their org
- ✅ Assignments for their org
- ✅ Time logged by assigned staff
- ✅ Documents for their org
- ✅ Own support tickets
- ✅ Review forms for assigned staff

#### Can Do:
- ✅ Submit performance reviews
- ✅ View assigned staff profiles
- ✅ Upload documents
- ✅ Create support tickets
- ✅ View time reports
- ✅ Request staff changes (via tickets)

#### Cannot Do:
- ❌ See other clients' data
- ❌ Edit staff profiles
- ❌ Access internal gamification
- ❌ See staff's private information
- ❌ Create/modify assignments
- ❌ Access system settings
- ❌ See internal tasks

---

## 🔒 Data Isolation Rules

### Rule 1: Staff Can Only See Their Own Data
```
✅ Staff A sees: Their tasks, time, reviews, assignments
❌ Staff A cannot see: Staff B's data
```

### Rule 2: Clients Are Completely Isolated
```
✅ Client X sees: Staff assigned to X, docs for X
❌ Client X cannot see: Client Y's anything
```

### Rule 3: Admin Sees Everything
```
✅ Admin sees: All staff, all clients, all data
✅ Admin can: Do anything in the system
```

### Rule 4: Assignment-Based Access
```
If Staff Member is assigned to Client:
  ✅ Staff can see Client contact info
  ✅ Client can see Staff profile
  ✅ Client can review Staff
  
If Staff Member is NOT assigned to Client:
  ❌ Staff cannot see Client
  ❌ Client cannot see Staff
```

---

## 🚦 Access Control Flow

### Creating a New Assignment

```
1. ADMIN creates assignment
   ├─→ Assigns Staff Member A to Client X
   │
2. Staff Member A can now:
   ├─→ See Client X in their dashboard
   ├─→ View Client X contact info
   ├─→ Log time for Client X
   └─→ See tasks for Client X
   
3. Client X can now:
   ├─→ See Staff Member A in their staff list
   ├─→ View Staff Member A's profile
   ├─→ Submit reviews for Staff Member A
   └─→ View time logged by Staff Member A
```

### Review Submission Flow

```
1. ADMIN sends review request
   ├─→ Email sent to Client X
   │
2. CLIENT X logs in
   ├─→ Sees review form for Staff Member A
   ├─→ Submits review with ratings & feedback
   │
3. Review saved to database
   │
4. STAFF MEMBER A can now:
   ├─→ View the review
   ├─→ See ratings & feedback
   └─→ Track review history
   
5. ADMIN can:
   ├─→ View all reviews
   └─→ Generate analytics
```

---

## 📱 Portal-Specific Features

### Admin Portal (`/admin/*`)
**Primary Purpose:** System management & oversight

**Unique Features:**
- Bulk operations (import/export)
- System-wide analytics
- Review request sending
- Staff-to-client assignments
- User account management
- System settings & configuration

---

### Staff Portal (`/` or `/staff/*`)
**Primary Purpose:** Day-to-day work & productivity

**Unique Features:**
- Time tracking with idle detection
- Task management
- Gamification & leaderboards
- Social feed
- Personal performance dashboard
- AI assistant for work help

---

### Client Portal (`/client/*`)
**Primary Purpose:** Review & monitor assigned staff

**Unique Features:**
- Performance review submission
- View assigned staff profiles
- Time report viewing
- Document sharing with Shore Agents
- Support ticket creation
- Staff performance trends

---

## 🎨 UI Differences

### Navigation Differences

#### Admin Portal
```
📊 Dashboard
👥 Staff Management
🏢 Client Organizations
👤 Client Users
📋 Assignments
⭐ Reviews
✅ Tasks
⏱️ Time Tracking
🎫 Tickets
📁 Documents
🎮 Gamification
📊 Analytics
📱 Activity Logs
⚙️ Settings
```

#### Staff Portal
```
🏠 Home Dashboard
✅ Tasks
📈 Performance
⏱️ Time Tracking
🎮 Gamification
📁 Documents
🎫 Support
💬 Social Feed
🤖 AI Assistant
👤 Profile
```

#### Client Portal
```
🏠 Dashboard
👥 Assigned Staff
⭐ Reviews
📊 Reports
📁 Documents
🎫 Support
⚙️ Settings
```

---

## 🔐 Security Boundaries

### API Route Protection

#### `/api/admin/*`
- ✅ Requires `role: ADMIN`
- ❌ Staff cannot access
- ❌ Clients cannot access

#### `/api/staff/*`
- ✅ Requires staff role (`STAFF`, `TEAM_LEAD`, `MANAGER`)
- ✅ Can only access own data
- ❌ Cannot access other staff data

#### `/api/client/*`
- ✅ Requires `clientUser` record
- ✅ Can only access own organization data
- ❌ Cannot access other clients' data

---

## 💡 Real-World Examples

### Example 1: Maria (Staff Member)
**Email:** maria@shoreagents.com  
**Role:** STAFF

**What Maria Sees:**
- Her own dashboard with tasks & stats
- Tech Corp (her assigned client)
- Her time logs
- Reviews from Tech Corp about her
- Her gamification points & level
- Documents assigned to her

**What Maria CANNOT See:**
- Other staff members' tasks
- Clients she's not assigned to
- Other staff's reviews
- System admin settings

---

### Example 2: Sarah (Client Admin)
**Email:** sarah@techcorp.com  
**Role:** CLIENT_ADMIN  
**Organization:** Tech Corp

**What Sarah Sees:**
- Tech Corp's dashboard
- Staff assigned to Tech Corp (Maria, John)
- Review forms for Maria & John
- Time reports for Maria & John
- Documents for Tech Corp

**What Sarah CANNOT See:**
- Other client organizations
- Shore Agents' internal data
- Staff not assigned to Tech Corp
- Internal gamification system

---

### Example 3: Admin (System Administrator)
**Email:** sysadmin@shoreagents.com  
**Role:** ADMIN

**What Admin Sees:**
- EVERYTHING!
- All staff across all clients
- All client organizations
- All reviews, tasks, time entries
- System analytics & reports

**What Admin Can Do:**
- Assign Maria to Tech Corp
- Send review request to Sarah
- View all data
- Modify system settings
- Generate reports

---

## 🎯 Testing Checklist

When testing, verify:

- [ ] Login to Admin portal → Can see all data
- [ ] Login as Staff → Can only see own data
- [ ] Login as Client → Can only see own org data
- [ ] Staff A cannot see Staff B's private info
- [ ] Client X cannot see Client Y's data
- [ ] Assignments properly link Staff ↔ Client
- [ ] Reviews flow: Admin → Client → Staff
- [ ] Time logs properly filtered by role
- [ ] Documents respect access controls
- [ ] API routes enforce role checks

---

## 📚 Related Docs

- `3-PORTAL-DATA-FLOW-MAP.md` - Detailed feature-by-feature breakdown
- `3-PORTAL-VERIFICATION-CHECKLIST.md` - Testing checklist
- `TESTING-LOGINS.md` - Test user credentials
- `ADMIN-PORTAL-INTEGRATION-PLAN.md` - Technical implementation

---

**Need to change access control?**  
Edit: `/app/api/auth/[...nextauth]/route.ts` for auth logic  
Edit: Individual API route files for permission checks

