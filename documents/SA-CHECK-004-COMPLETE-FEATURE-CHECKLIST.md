# ☑️ 004 - COMPLETE FEATURE CHECKLIST

**Shore Agents Platform - End-to-End Feature Testing & Verification**

**Purpose:** Check every feature exists, works correctly, and matches business logic  
**Assume nothing is done until tested and checked**

---

## 📋 **HOW TO USE THIS DOCUMENT**

1. Go through each section in order
2. Test each feature (follow "How to Test" instructions)
3. Mark `[ ]` with `[X]` when verified working
4. Note any issues in "Issues Found" column
5. Don't assume it works - TEST IT

---

## 1️⃣ **RECRUITMENT FLOW**

### **Client Side (Hiring)**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Client can view candidate pool | Login as client → Browse candidates | See list of available candidates with profiles | |
| [ ] | Client can filter candidates | Use filters (skills, experience, etc.) | Candidate list updates based on filters | |
| [ ] | Client can request interview | Click "Request Interview" on candidate | Modal opens with timezone-aware scheduling | |
| [ ] | Client timezone shows correctly | Check interview request form | Shows times in CLIENT's timezone (USA/AUS/NZ) | |
| [ ] | Client can submit interview request | Fill form → Submit | Success message, request sent to management | |
| [ ] | Client sees pending interview requests | Go to Interviews/Requests page | See list of pending requests | |
| [ ] | Client can send hire request | After interview → "Send Hire Request" | Hire request created, sent to management | |
| [ ] | Client sees pending hire requests | Go to Hiring Dashboard | See staff pending acceptance | |

---

### **Management Side (Scheduling)**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Management sees interview requests | Login as admin → Interview Requests | See all client requests with client timezone | |
| [ ] | Management in Manila timezone | Check displayed times | Management sees MNL time for scheduling | |
| [ ] | Management can schedule interview | Select request → Schedule interview | Set time, notify candidate + client | |
| [ ] | Management handles timezone conversion | Schedule interview close to client's preferred time | System converts times correctly (Client TZ ↔ MNL TZ) | |
| [ ] | Management sees hire requests | Go to Hiring Dashboard | See all pending hire requests from clients | |
| [ ] | Management can contact candidate | Click on hire request → Contact candidate | Can call/email candidate to confirm acceptance | |
| [ ] | Management can set start date & shift | In hire acceptance flow → Set details | Can select start date + shift time (day/night/mid) | |

---

### **Candidate Side (Application)**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Candidate receives interview invite | (Check email/notification system) | Candidate gets interview details in MNL time | |
| [ ] | Candidate receives hire offer | After client sends hire request | Candidate gets email with offer details | |
| [ ] | Candidate can accept hire offer | Click accept link → Confirm | Redirects to contract signing + onboarding | |
| [ ] | Candidate can reject hire offer | Click reject link → Confirm | Hire request marked as rejected | |

---

## 2️⃣ **ONBOARDING FLOW**

### **Staff Side (New Hire)**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Staff receives onboarding email | After accepting hire | Email with signup link + recruitment info | |
| [ ] | Staff can create account | Click signup link → Register | Account created, logged in | |
| [ ] | Staff sees onboarding dashboard | After login (first time) | 7-step onboarding checklist visible | |
| [ ] | **Step 1: Personal Info** | Fill out form → Submit | Data saved, step marked complete | |
| [ ] | **Step 2: Government IDs** | Upload IDs → Submit | Files uploaded to Supabase, step complete | |
| [ ] | **Step 3: Background Clearances** | Upload documents → Submit | Documents saved, step complete | |
| [ ] | **Step 4: Education** | Fill education history → Submit | Data saved, step complete | |
| [ ] | **Step 5: Medical Info** | Fill medical form → Submit | Data saved, step complete | |
| [ ] | **Step 6: Contract Signature** | Review contract → Sign digitally | Contract signed, step complete | |
| [ ] | **Step 7: Welcome Form** | Fill interests/preferences → Submit | staff_interests created (for AI personalization) | |
| [ ] | All 7 steps completed | Complete all steps | "Onboarding Complete" message, waiting for admin verification | |
| [ ] | Staff sees "Waiting for Verification" | After completing onboarding | Clear message that admin needs to verify | |
| [ ] | Staff sees start date | Check dashboard | Start date visible (set by management) | |
| [ ] | Staff sees shift time | Check dashboard | Shift time visible in THEIR timezone (MNL) | |

---

### **Admin Side (Verification)**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Admin sees pending onboarding list | Login as admin → Onboarding Dashboard | See all staff awaiting verification | |
| [ ] | Admin can view onboarding details | Click on staff → View details | See all 7 steps + uploaded documents | |
| [ ] | Admin can approve each step | Click "Approve" on each step | Step status changes to APPROVED | |
| [ ] | Admin can reject steps | Click "Reject" → Add note | Step status changes to REJECTED, staff notified to resubmit | |
| [ ] | Admin can verify onboarding complete | After all steps approved → "Complete Onboarding" | staff_profiles created with all details | |
| [ ] | Admin sets up work schedule | In onboarding completion → Set schedule | work_schedules created (Mon-Fri with times) | |
| [ ] | Admin installs Electron app | Before Day 1 → Install on staff PC | Electron ready for tracking | |

---

### **Client Side (Visibility)**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Client sees onboarding progress | Login as client → Staff Dashboard | See their hired staff with onboarding progress | |
| [ ] | Client sees start date | Check staff profile | Start date visible in CLIENT timezone | |
| [ ] | Client sees shift time | Check staff schedule | Shift times shown in CLIENT timezone | |
| [ ] | Client sees "Coming Soon" status | Before start date | Staff marked as "Starting on [date]" | |

---

## 3️⃣ **DAY 1: CLOCK IN & TIME TRACKING**

### **Staff Side (Time Entry)**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Staff can log into Electron app | Open Electron → Login | Successfully authenticated | |
| [ ] | Staff sees "Clock In" button | On shift start day → Check dashboard | Clock In button visible and active | |
| [ ] | Staff can clock in | Click "Clock In" | time_entries created with clockIn timestamp | |
| [ ] | Clock in time recorded in staff TZ | Check time_entries.clockIn | Time stored in Manila timezone | |
| [ ] | Shift date calculated correctly | Clock in at 10 PM Thu → Check shiftDate | shiftDate = Thursday (even if calendar crosses to Fri) | |
| [ ] | Late detection works | Clock in 10 min late → Check wasLate | wasLate = true, lateBy = 10 | |
| [ ] | Early detection works | Clock in 5 min early → Check wasEarly | wasEarly = true, earlyBy = 5 | |
| [ ] | Late reason can be provided | Clock in late → Select reason | lateReason saved (TRAFFIC, SICK, EMERGENCY, etc.) | |
| [ ] | Break scheduler appears | After clock in | Break scheduler modal shows up | |
| [ ] | Staff can schedule breaks | Set lunch break time → Submit | breaks created with scheduledStart time | |
| [ ] | Staff can start break | Click "Start Break" | break.actualStart recorded | |
| [ ] | Staff can end break | Click "End Break" | break.actualEnd recorded, break duration calculated | |
| [ ] | Staff can clock out | Click "Clock Out" → Confirm | time_entries.clockOut recorded | |
| [ ] | Clock out reason can be provided | Clock out → Select reason | clockOutReason saved (END_OF_SHIFT, EMERGENCY, SICK) | |
| [ ] | Early clock out detected | Clock out before shift end → Check | wasEarlyClockOut = true, earlyClockOutBy calculated | |
| [ ] | Total hours calculated | After clock out → Check totalHours | Net hours worked (excluding breaks) calculated | |
| [ ] | Staff sees time entry history | Go to Time Tracking page | See all past clock ins/outs with details | |

---

### **Electron Tracking (Background)**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Electron tracks mouse movements | While clocked in → Move mouse | mouseMovements increments in performance_metrics | |
| [ ] | Electron tracks mouse clicks | While clocked in → Click around | mouseClicks increments | |
| [ ] | Electron tracks keystrokes | While clocked in → Type | keystrokes increments | |
| [ ] | Electron tracks active time | While working → Check | activeTime increments (minutes) | |
| [ ] | Electron detects idle time | Go idle for 2+ min → Check | idleTime increments | |
| [ ] | Electron captures screenshots | Every 10 min (configurable) → Check | Screenshots saved to storage | |
| [ ] | Electron tracks apps used | Open apps → Check applicationsused | Array of apps used added | |
| [ ] | Electron tracks URLs visited | Visit websites → Check visitedurls | Array of URLs added | |
| [ ] | Electron tracks tab switches | Switch tabs → Check tabsSwitched | Counter increments | |
| [ ] | Electron calculates productivity | After shift → Check productivityScore | Score calculated (0-100) | |
| [ ] | All metrics tied to shift date | Check performance_metrics.shiftDate | All data recorded against correct shift date | |
| [ ] | Night shift tracking correct | Work Thu 10PM - Fri 2AM → Check | All metrics = Thursday shift | |

---

### **Client Side (Monitoring)**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Client sees staff clock in/out | Login as client → Analytics Dashboard | See their staff's clock in/out times | |
| [ ] | Client sees curated analytics | Check analytics display | See: Productivity %, Hours worked, Tasks completed | |
| [ ] | Client DOES NOT see granular data | Look for website visits | Should NOT see "YouTube 22 times" or specific URLs | |
| [ ] | Client sees professional metrics | Check displayed data | High-level: Active time, Idle time (%), Task completion | |
| [ ] | Client times shown in client TZ | Check all timestamps | All times displayed in CLIENT's timezone | |
| [ ] | Client sees break times | Check staff timeline | Breaks visible on timeline | |
| [ ] | Client sees late/early indicators | Check attendance data | Late/early badges visible with minutes | |
| [ ] | Client can view daily summary | Select staff → View day | Summary of day's work (hours, productivity, tasks) | |
| [ ] | Client can view weekly trends | Go to weekly view | Charts showing productivity trends | |

---

### **Management Side (Full Visibility)**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Management sees ALL staff | Login as admin → Analytics | See all staff across all clients | |
| [ ] | Management sees RAW analytics | Check detailed view | See EVERYTHING: website visits, apps, idle patterns | |
| [ ] | Management sees granular data | Open staff detail | See "YouTube 22 times", specific URLs, exact idle times | |
| [ ] | Management can filter by client | Use company filter | See only staff for selected client | |
| [ ] | Management can filter by date | Select date range | Analytics update for that period | |
| [ ] | Management sees attendance issues | Check attendance report | Late arrivals, early departures, missing clock ins highlighted | |
| [ ] | Management can download reports | Click "Export" → Download | CSV/PDF report generated | |
| [ ] | Management sees screenshots | If enabled → View screenshots | All captured screenshots visible | |
| [ ] | Management can coach using data | Use raw data for 1-on-1 | Can address specific issues (YouTube usage, idle time) | |

---

## 4️⃣ **TASKS MANAGEMENT**

### **Client Side (Task Assignment)**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Client can create task | Click "New Task" → Fill form | Task created with createdByType = CLIENT | |
| [ ] | Client can assign to staff | Select staff member → Assign | Task assigned to specific staff | |
| [ ] | Client can set priority | Select High/Medium/Low | Priority saved correctly | |
| [ ] | Client can set due date | Pick date → Save | Due date saved | |
| [ ] | Client can add description | Write task details → Save | Description saved | |
| [ ] | Client can attach files | Upload file → Attach | File saved to Supabase storage | |
| [ ] | Client sees their assigned tasks | Go to Tasks page | See all tasks they created | |
| [ ] | Client sees task status | Check task card | Status shown (TODO, IN_PROGRESS, COMPLETED) | |
| [ ] | Client can update task | Edit task → Change details | Updates saved | |
| [ ] | Client can mark complete | Click "Mark Complete" | Status → COMPLETED | |
| [ ] | Client can comment on task | Add comment → Submit | Comment added (via universal comments) | |
| [ ] | Client gets notified of updates | Staff updates task → Check | Notification sent to client | |

---

### **Staff Side (Task Completion)**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Staff sees assigned tasks | Login as staff → Tasks page | See all tasks assigned to them | |
| [ ] | Staff can create own tasks | Click "New Task" → Fill form | Task created with createdByType = STAFF | |
| [ ] | Staff sees client-assigned tasks | Check task list | Tasks from client clearly marked | |
| [ ] | Staff can update task status | Drag to IN_PROGRESS → Drop | Status updated | |
| [ ] | Staff can add progress notes | Click task → Add note | Note saved | |
| [ ] | Staff can mark complete | Click "Complete" → Confirm | Status → COMPLETED | |
| [ ] | Staff can attach files | Upload file → Attach | File saved | |
| [ ] | Staff can comment on task | Add comment → Submit | Comment added | |
| [ ] | Staff gets notified of new tasks | Client creates task → Check | Notification sent to staff | |
| [ ] | Staff can filter tasks | Use filters (status, priority, due date) | Task list updates | |

---

### **Management Side (Oversight)**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Management sees ALL tasks | Login as admin → Tasks page | See tasks from all staff + all clients | |
| [ ] | Management can filter by staff | Select staff member → Filter | See that staff's tasks only | |
| [ ] | Management can filter by client | Select client → Filter | See tasks for that client's staff | |
| [ ] | Management can create tasks | Click "New Task" → Assign | Task created with createdByType = MANAGEMENT | |
| [ ] | Management can reassign tasks | Edit task → Change assignee | Task reassigned | |
| [ ] | Management sees overdue tasks | Check overdue filter | All past-due tasks highlighted | |
| [ ] | Management can generate reports | Export tasks → Download | Task report generated | |

---

## 5️⃣ **TICKETS SYSTEM**

### **Staff Tickets (Internal Support)**

#### **Staff Side:**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Staff can create ticket | Click "New Ticket" → Fill form | Ticket created (IT/HR/Equipment/Clinic) | |
| [ ] | Staff can select category | Choose category → Submit | Category saved (IT, EQUIPMENT, HR, CLINIC, etc.) | |
| [ ] | Staff can set priority | Choose priority → Submit | Priority saved (HIGH, MEDIUM, LOW) | |
| [ ] | Staff can attach files | Upload image/file → Attach | File saved to storage | |
| [ ] | Staff can add description | Write issue details → Save | Description saved | |
| [ ] | Staff sees their tickets | Go to Tickets page | See all tickets they created | |
| [ ] | Staff can comment on ticket | Add comment → Submit | Comment added | |
| [ ] | Staff sees ticket status | Check ticket card | Status shown (OPEN, IN_PROGRESS, RESOLVED, CLOSED) | |
| [ ] | Staff gets notified of replies | Management replies → Check | Notification sent | |
| [ ] | Staff ONLY sees their tickets | Check ticket list | Only their own tickets visible | |

#### **Management Side:**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Management sees ALL staff tickets | Login as admin → Tickets (Staff filter) | See all staff tickets | |
| [ ] | Tickets auto-assigned by category | Check ticket assignedTo | IT tickets → IT Manager, HR → HR Manager, etc. | |
| [ ] | Management can reply to ticket | Click ticket → Add reply | Reply saved, staff notified | |
| [ ] | Management can change status | Drag ticket to IN_PROGRESS | Status updated | |
| [ ] | Management can reassign | Edit assignedTo → Save | Ticket reassigned | |
| [ ] | Management can mark resolved | Move to RESOLVED → Confirm | Status → RESOLVED, staff notified | |
| [ ] | Management can close ticket | Move to CLOSED → Confirm | Status → CLOSED | |

---

### **Client Tickets (Account Support)**

#### **Client Side:**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Client can create ticket | Click "New Ticket" → Fill form | Ticket created (Account/Billing/Support) | |
| [ ] | Client can select category | Choose category → Submit | Category saved (ACCOUNT_SUPPORT, BILLING, STAFF_PERFORMANCE, etc.) | |
| [ ] | Client can set priority | Choose priority → Submit | Priority saved | |
| [ ] | Client can attach files | Upload file → Attach | File saved | |
| [ ] | Client can add description | Write question/issue → Save | Description saved | |
| [ ] | Client sees their tickets | Go to Support page | See all tickets they created | |
| [ ] | Client can comment on ticket | Add comment → Submit | Comment added | |
| [ ] | Client sees ticket status | Check ticket card | Status shown | |
| [ ] | Client gets notified of replies | Account Manager replies → Check | Notification sent | |
| [ ] | Client ONLY sees their tickets | Check ticket list | Only their own tickets visible | |
| [ ] | Client DOES NOT see staff tickets | Look for staff tickets | Staff tickets NOT visible to client | |

#### **Management Side:**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Management sees ALL client tickets | Login as admin → Tickets (Client filter) | See all client tickets | |
| [ ] | Tickets auto-assigned to Account Manager | Check ticket assignedTo | Client tickets → Account Manager | |
| [ ] | Management can reply to ticket | Click ticket → Add reply | Reply saved, client notified | |
| [ ] | Management can change status | Drag ticket to IN_PROGRESS | Status updated | |
| [ ] | Management can reassign | Edit assignedTo → Save | Ticket reassigned | |
| [ ] | Management can mark resolved | Move to RESOLVED → Confirm | Status → RESOLVED | |

---

### **CRITICAL VISIBILITY TEST:**

| Status | Test | How to Verify | Expected Result | Issues Found |
|--------|------|---------------|-----------------|--------------|
| [ ] | **Client NEVER sees staff tickets** | Login as client → Check all ticket views | ZERO staff tickets visible (not even count) | |
| [ ] | **Staff NEVER sees client tickets** | Login as staff → Check all ticket views | ZERO client tickets visible | |
| [ ] | **Management sees BOTH** | Login as admin → Tickets page | See both staff + client tickets (with filters) | |

---

## 6️⃣ **AI ASSISTANT**

### **Staff Side (Using AI)**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Staff can access AI Assistant | Click AI Assistant icon/page | Chat interface loads | |
| [ ] | AI reads staff_interests | Start chat → AI mentions interests | AI personalizes based on welcome form | |
| [ ] | AI reads staff_profiles | Ask about job → AI knows position | AI aware of staff's role, timezone, experience | |
| [ ] | AI can answer questions | Ask "How do I...?" → Get response | AI provides helpful answer | |
| [ ] | AI can access approved documents | Ask about uploaded document | AI can read and summarize approved docs | |
| [ ] | AI can create tasks | Say "Create task to..." | Task created via AI | |
| [ ] | AI can generate daily report | Say "Generate daily report" | Report created with tasks + analytics | |
| [ ] | AI knows staff timezone | Ask time-related question | AI responds in staff's timezone | |
| [ ] | AI respects document approval | Ask about unapproved doc | AI says "waiting for approval" | |
| [ ] | Chat history saved | Close and reopen AI | Previous chat messages still there | |

---

### **Document Approval Workflow**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Staff can upload document | Click "Upload Document" → Select file | Document uploaded with status = PENDING | |
| [ ] | AI CANNOT access unapproved docs | Ask AI about new document | AI says waiting for approval | |
| [ ] | Client sees pending documents | Login as client → Documents page | See docs uploaded by their staff (PENDING) | |
| [ ] | Client can approve document | Click "Approve" → Confirm | Status → APPROVED | |
| [ ] | Client can reject document | Click "Reject" → Add note | Status → REJECTED, staff notified | |
| [ ] | AI CAN access approved docs | After approval → Ask AI | AI can now read and use document | |
| [ ] | Management sees all documents | Login as admin → Documents | See all documents (staff + client + admin) | |

---

### **Role-Based Document Visibility**

| Status | Test | How to Verify | Expected Result | Issues Found |
|--------|------|---------------|-----------------|--------------|
| [ ] | Staff sees their own documents | Login as staff → Documents | See only docs they uploaded + client-shared docs | |
| [ ] | Client sees their staff's documents | Login as client → Documents | See docs from their assigned staff | |
| [ ] | Client sees their own documents | Upload doc as client → Check | Own docs visible | |
| [ ] | Management sees ALL documents | Login as admin → Documents | See docs from all users | |

---

### **Management Side (Oversight)**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Management can view AI chat logs | Go to AI Logs page (if exists) | See staff AI conversations (for auditing) | |
| [ ] | Management can see AI usage stats | Check analytics | See who's using AI, how often | |

---

## 7️⃣ **PERFORMANCE REVIEWS**

### **Auto-Creation System**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Month 1 review auto-creates | Staff at day 23 → Check | Review created 7 days before day 30 | |
| [ ] | Month 3 review auto-creates | Staff at day 83 → Check | Review created 7 days before day 90 | |
| [ ] | Month 5 review auto-creates | Staff at day 143 → Check | Review created 7 days before day 150 | |
| [ ] | Recurring review auto-creates | After regularization → 6 months later | Review created | |
| [ ] | Reviews based on start date | Check review dueDate | Calculated from staff_profiles.startDate | |

---

### **Client Side (Filling Reviews)**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Client sees pending reviews | Login as client → Performance Reviews | See reviews with status = PENDING | |
| [ ] | Client can click to fill review | Click "Complete Review" → Opens form | Review form loads with questions | |
| [ ] | Month 1 review (18 questions) | Open Month 1 review | See 18 questions across categories | |
| [ ] | Month 3 review (26 questions) | Open Month 3 review | See 26 questions | |
| [ ] | Month 5 review (24 questions) | Open Month 5 review | See 24 questions | |
| [ ] | Recurring review (18 questions) | Open Recurring review | See 18 questions | |
| [ ] | Client can rate 1-5 stars | Rate each question → Select stars | Rating saved | |
| [ ] | Client can add strengths | Write in "Strengths" field → Save | Text saved | |
| [ ] | Client can add improvements | Write in "Areas to Improve" → Save | Text saved | |
| [ ] | Client can add comments | Write in "Additional Comments" → Save | Text saved | |
| [ ] | Client can submit review | Click "Submit Review" → Confirm | Status → SUBMITTED | |
| [ ] | Overall score calculated | After submit → Check | Percentage score calculated (average of ratings) | |
| [ ] | Performance level determined | Check score | Level shown (Critical <50%, Needs Improvement 50-69%, Good 70-84%, Excellent 85%+) | |
| [ ] | Client can view submitted reviews | Go to "Submitted Reviews" | See all completed reviews | |

---

### **Management Side (Processing Reviews)**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Management sees ALL reviews | Login as admin → Performance Reviews | See reviews from all clients for all staff | |
| [ ] | Management sees pending reviews | Filter by PENDING | See reviews waiting for client | |
| [ ] | Management sees submitted reviews | Filter by SUBMITTED | See reviews completed by client | |
| [ ] | Management can add notes | Open submitted review → Add management notes | Notes saved | |
| [ ] | Management can mark reviewed | Click "Mark as Reviewed" → Confirm | Status → UNDER_REVIEW | |
| [ ] | Management can finalize review | Click "Finalize" → Confirm | Status → FINALIZED | |
| [ ] | Management can see upcoming reviews | Check upcoming reviews list | See reviews due soon (next 7 days) | |
| [ ] | Management can manually trigger | Click "Trigger Review Creation" | Reviews created for eligible staff | |

---

### **Staff Side (Viewing Finalized Reviews)**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Staff CANNOT see pending reviews | Login as staff → Performance Reviews | Pending reviews NOT visible | |
| [ ] | Staff CANNOT see submitted reviews | Check reviews page | Submitted reviews NOT visible | |
| [ ] | Staff CAN see finalized reviews | Check reviews page | Only FINALIZED reviews visible | |
| [ ] | Staff sees client feedback | Open finalized review | See client's ratings, strengths, improvements | |
| [ ] | Staff sees management notes | Check finalized review | See management's notes (if any) | |
| [ ] | Staff sees overall score | Check review | Score + performance level visible | |

---

## 8️⃣ **POSTS & SOCIAL FEED**

### **Staff Side (Creating Posts)**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Staff can create post | Click "New Post" → Write content | Post created | |
| [ ] | Staff can select audience | Choose audience (All Staff, My Team, Everyone) | Audience saved | |
| [ ] | Staff can upload media | Attach image/video → Upload | Media saved to storage | |
| [ ] | Staff can add tags | Add tags → Save | Tags saved | |
| [ ] | Staff can post achievement | Select "Achievement" type → Post | Achievement badge shown | |
| [ ] | Staff can post question | Select "Question" type → Post | Question format shown | |
| [ ] | Staff sees their feed | Go to Posts page | See posts filtered by audience | |
| [ ] | Staff sees "All Staff" posts | Check feed | See posts from other staff (if audience = ALL_STAFF) | |
| [ ] | Staff sees "My Team" posts | Filter by My Team | See posts from staff in same company | |
| [ ] | Staff sees "Everyone" posts | Check feed | See posts from staff + management | |
| [ ] | Staff can react to posts | Click reaction button → Select emoji | Reaction added (via universal reactions) | |
| [ ] | Staff can comment on posts | Add comment → Submit | Comment added (via universal comments) | |
| [ ] | Staff can like posts | Click like button | Like count increments | |
| [ ] | Staff can edit their post | Edit post → Change content | Post updated | |
| [ ] | Staff can delete their post | Delete post → Confirm | Post deleted | |

---

### **Client Side (Viewing Posts)**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Client sees "My Team" posts | Login as client → Posts page | See posts from their assigned staff | |
| [ ] | Client sees "All Clients" posts | Check feed | See posts shared with all clients | |
| [ ] | Client sees "Everyone" posts | Check feed | See posts visible to everyone | |
| [ ] | Client DOES NOT see "All Staff" posts | Look for staff-only posts | Staff-only posts NOT visible | |
| [ ] | Client can react to posts | Click reaction button → Select emoji | Reaction added | |
| [ ] | Client can comment on posts | Add comment → Submit | Comment added | |
| [ ] | Client can create posts | Click "New Post" → Write content | Post created with client role | |

---

### **Management Side (Full Feed)**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Management sees ALL posts | Login as admin → Posts page | See posts from all users (staff/client/management) | |
| [ ] | Management can filter by audience | Use audience filter | Feed updates based on filter | |
| [ ] | Management can create posts | Click "New Post" → Write content | Post created | |
| [ ] | Management can pin posts | Click "Pin" on post | Post pinned to top | |
| [ ] | Management can delete any post | Delete post → Confirm | Post deleted (moderation) | |
| [ ] | Management can react to posts | Click reaction button | Reaction added | |
| [ ] | Management can comment on posts | Add comment → Submit | Comment added | |

---

### **Universal Comments & Reactions**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Comments work on posts | Add comment → Submit | Comment saved to `comments` table | |
| [ ] | Comments work on tasks | Add comment to task → Submit | Comment saved (commentableType = TASK) | |
| [ ] | Comments work on tickets | Add comment to ticket → Submit | Comment saved (commentableType = TICKET) | |
| [ ] | Reactions work on posts | React to post → Select emoji | Reaction saved to `reactions` table | |
| [ ] | Reactions work on comments | React to comment → Select emoji | Reaction saved (reactableType = COMMENT) | |
| [ ] | Can reply to comments | Reply to comment → Submit | Nested comment created (parentId set) | |
| [ ] | Can edit own comments | Edit comment → Change text | Comment updated | |
| [ ] | Can delete own comments | Delete comment → Confirm | Comment deleted | |

---

## 9️⃣ **OFFBOARDING**

### **Management Initiation (Current Implementation)**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Management can initiate offboarding | Go to Offboarding Dashboard → "Initiate" | Modal opens | |
| [ ] | Management can select staff | Select staff from dropdown | Staff selected | |
| [ ] | Management can select reason | Choose reason (RESIGNATION, TERMINATION, etc.) | Reason saved | |
| [ ] | Management can add details | Write reason details → Save | Details saved | |
| [ ] | Management can set last working day | Pick date → Save | lastWorkingDate saved | |
| [ ] | Management can add notes | Write offboarding notes → Save | Notes saved | |
| [ ] | Offboarding record created | Submit form → Confirm | staff_offboarding created with status = INITIATED | |
| [ ] | Management sees offboarding list | Go to Offboarding page | See all offboarding cases | |
| [ ] | Management can filter offboarding | Filter by Active/Completed | List updates | |

---

### **Staff Offboarding Process**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Staff sees offboarding notification | After initiation → Login as staff | Staff notified of offboarding | |
| [ ] | Staff can complete exit interview | Click "Exit Interview" → Fill form | Exit interview saved | |
| [ ] | Staff account deactivated | After last working day → Try login | Account disabled, can't login | |

---

### **Client Notification**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Client notified of offboarding | After initiation → Login as client | Client sees notification | |
| [ ] | Client can see offboarding details | Check staff profile | Offboarding info visible | |

---

### **⚠️ NOT YET IMPLEMENTED:**

| Status | Feature | Status | Notes |
|--------|---------|--------|-------|
| [ ] | Client can initiate offboarding | ❌ NOT IMPLEMENTED | User said "not decided yet" | |
| [ ] | Staff can initiate resignation | ❌ NOT IMPLEMENTED | User said "not decided yet" | |

---

## 🔟 **ANALYTICS & REPORTING**

### **Client Analytics Dashboard**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Client sees productivity overview | Login as client → Analytics | See overall productivity score for all staff | |
| [ ] | Client can select time range | Choose "Last 7 days" / "Last 30 days" | Analytics update for selected range | |
| [ ] | Client can filter by staff | Select staff member → Filter | See individual staff analytics | |
| [ ] | Client sees attendance summary | Check attendance section | See clock ins, late arrivals, early departures | |
| [ ] | Client sees task completion rate | Check tasks section | See % of tasks completed | |
| [ ] | Client sees hours worked | Check hours section | Total hours + breakdown by day | |
| [ ] | Client sees active vs idle time | Check activity section | High-level percentages (not granular) | |
| [ ] | Client can download reports | Click "Export" → Download | PDF/CSV report generated | |
| [ ] | Real-time updates work | While staff working → Refresh | Analytics update in real-time | |

---

### **Management Analytics Dashboard**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Management sees ALL staff analytics | Login as admin → Analytics | See all staff across all clients | |
| [ ] | Management sees RAW data | Open detailed view | See granular data (URLs, apps, idle times) | |
| [ ] | Management can filter by company | Select company → Filter | See staff for that client only | |
| [ ] | Management can filter by date range | Select custom range → Apply | Analytics update | |
| [ ] | Management sees website visits | Check detailed analytics | See all visited URLs with counts | |
| [ ] | Management sees app usage | Check applications section | See all apps used with time spent | |
| [ ] | Management sees screenshots | If enabled → View | All screenshots accessible | |
| [ ] | Management can compare staff | Select multiple staff → Compare | Side-by-side comparison view | |
| [ ] | Management can export detailed reports | Export with options → Download | Full detailed report generated | |

---

## 1️⃣1️⃣ **NOTIFICATIONS SYSTEM**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Staff notified of new tasks | Client assigns task → Check staff | Notification appears | |
| [ ] | Client notified of task completion | Staff completes task → Check client | Notification appears | |
| [ ] | Client notified of pending review | Review due in 7 days → Check client | Notification sent | |
| [ ] | Management notified of tickets | Staff creates ticket → Check admin | Notification appears | |
| [ ] | Staff notified of ticket replies | Management replies → Check staff | Notification appears | |
| [ ] | Notification badge shows count | Check sidebar badge | Unread count displayed | |
| [ ] | Can mark notification as read | Click notification | Badge count decreases | |
| [ ] | Can mark all as read | Click "Mark all read" | All notifications cleared | |

---

## 1️⃣2️⃣ **AUTHENTICATION & SECURITY**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Staff can login | Go to login → Enter credentials | Redirects to staff portal | |
| [ ] | Client can login | Go to login → Enter credentials | Redirects to client portal | |
| [ ] | Management can login | Go to login → Enter credentials | Redirects to admin portal | |
| [ ] | Role-based redirects work | Login as each role → Check | Correct portal for each role | |
| [ ] | Can't access wrong portal | Login as staff → Try /admin | Access denied / redirect | |
| [ ] | Session persists | Login → Close browser → Reopen | Still logged in | |
| [ ] | Can logout | Click logout → Confirm | Redirects to login, session cleared | |
| [ ] | Password reset works | Click "Forgot Password" → Reset | Email sent, can reset password | |

---

## 1️⃣3️⃣ **TIMEZONE HANDLING**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Staff times in Manila TZ | Login as staff → Check all times | All times shown in Asia/Manila | |
| [ ] | Client times in their TZ | Login as client (USA) → Check | All times shown in client's timezone | |
| [ ] | Management times configurable | Login as admin → Check | Times shown in admin's timezone | |
| [ ] | Shift crossover handled correctly | Night shift Thu 10PM - Fri 2AM | All data = Thursday shift | |
| [ ] | Interview scheduling converts TZ | Client in LA, staff in Manila | Times converted correctly | |
| [ ] | Work schedule shows correct TZ | Check staff schedule | Times shown in staff TZ | |
| [ ] | Client sees schedule in their TZ | Client checks staff schedule | Times shown in client TZ | |

---

## 1️⃣4️⃣ **FILE UPLOADS & STORAGE**

| Status | Feature | How to Test | Expected Result | Issues Found |
|--------|---------|-------------|-----------------|--------------|
| [ ] | Staff can upload documents | Upload doc → Submit | Saved to Supabase `staff` bucket | |
| [ ] | Client can upload documents | Upload doc → Submit | Saved to Supabase `client` bucket | |
| [ ] | Management can upload documents | Upload doc → Submit | Saved to Supabase `management` bucket | |
| [ ] | File size limits enforced | Try upload 50MB file | Error shown if too large | |
| [ ] | File types validated | Try upload .exe file | Error if not allowed | |
| [ ] | Can download uploaded files | Click download on document | File downloads | |
| [ ] | Can preview documents | Click preview on document | Preview modal opens | |
| [ ] | RLS policies work | Try access other user's file | Access denied | |

---

## 1️⃣5️⃣ **LEADERBOARD (Not Yet Implemented)**

| Status | Feature | Status | Notes |
|--------|---------|--------|-------|
| [ ] | Leaderboard page exists | ❌ NOT IMPLEMENTED | User said "easy to build at the end" | |
| [ ] | Rankings based on metrics | ❌ NOT IMPLEMENTED | Needs definition | |
| [ ] | Gamification badges | ❌ NOT IMPLEMENTED | Needs design | |

---

## 📊 **COMPLETION TRACKING**

**Total Features:** `___` / `___`  
**Completion Rate:** `___%`

**Critical Issues Found:** `___`  
**Minor Issues Found:** `___`

---

## 🐛 **BUG TRACKING SECTION**

| # | Feature | Issue Description | Severity | Status | Notes |
|---|---------|-------------------|----------|--------|-------|
| 1 | | | HIGH / MEDIUM / LOW | OPEN / FIXED | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |
| 5 | | | | | |

---

## ✅ **SIGN-OFF CHECKLIST**

| Status | Milestone | Signed By | Date |
|--------|-----------|-----------|------|
| [ ] | All recruitment features tested and working | | |
| [ ] | All onboarding features tested and working | | |
| [ ] | All time tracking features tested and working | | |
| [ ] | All task features tested and working | | |
| [ ] | All ticket features tested and working | | |
| [ ] | All AI Assistant features tested and working | | |
| [ ] | All performance review features tested and working | | |
| [ ] | All posts/feed features tested and working | | |
| [ ] | All analytics features tested and working | | |
| [ ] | All visibility rules verified correct | | |
| [ ] | All timezone handling verified correct | | |
| [ ] | Security & authentication verified | | |
| [ ] | **PLATFORM READY FOR PRODUCTION** | | |

---

**END OF CHECKLIST**

*Last Updated: [DATE]*  
*Tested By: [NAME]*  
*Status: [IN_PROGRESS / COMPLETE]*

