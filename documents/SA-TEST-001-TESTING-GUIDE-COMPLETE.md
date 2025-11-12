# 🧪 001 - COMPLETE TESTING GUIDE
## **Shore Agents End-to-End Testing**

**DO NOT SKIP STEPS. DO NOT ASSUME SHIT WORKS. TEST EVERYTHING.**

---

## 📋 **HOW TO USE THIS GUIDE**

1. **Go in order** - Don't jump around
2. **Mark ✅ or ❌** as you test
3. **If something fails, STOP and report it**
4. **Screenshot errors** - Don't just say "it broke"
5. **Test on ALL 3 portals** where applicable

---

## 🎯 **THE 3 PORTALS**

| Portal | URL | Who Uses It |
|--------|-----|-------------|
| **Staff Portal** | `/` | Staff members (daily workers) |
| **Client Portal** | `/client` | Clients who hired staff |
| **Admin Portal** | `/admin` | Management team (Shore Agents internal) |

---

## 📊 **TESTING CHECKLIST - OVERVIEW**

- [ ] **Phase 1:** Recruitment Flow (Client → Hire Staff)
- [ ] **Phase 2:** Onboarding Flow (Candidate → Staff User)
- [ ] **Phase 3:** Time Tracking (Clock In/Out, Breaks)
- [ ] **Phase 4:** Tasks System (Client assigns → Staff completes)
- [ ] **Phase 5:** Support Tickets (2 types)
- [ ] **Phase 6:** Performance Reviews (Auto-triggered)
- [ ] **Phase 7:** AI Assistant (Staff asks questions)
- [ ] **Phase 8:** Documents (Upload, Approve, Access)
- [ ] **Phase 9:** Social Feed (Posts, Reactions, Comments)
- [ ] **Phase 10:** Admin Staff Profiles (View all employee data)

---

# 🧪 PHASE 1: RECRUITMENT FLOW

## **What This Does:**
Client browses candidates or posts jobs → Requests interview → Hires candidate

---

### **TEST 1.1: Browse Candidates**

**Portal:** Client Portal (`/client/recruitment/browse`)

**Steps:**
1. Login as client
2. Go to Recruitment → Browse Candidates
3. You should see candidate cards with:
   - Photo
   - Name
   - Skills
   - Experience
   - Hourly rate
   - "Request Interview" button

**✅ PASS IF:**
- All candidates display
- Photos load
- Skills show correctly
- "Request Interview" button clickable

**❌ FAIL IF:**
- 500 error
- No candidates show
- Photos broken
- Button doesn't work

---

### **TEST 1.2: Request Interview**

**Portal:** Client Portal

**Steps:**
1. Click "Request Interview" on any candidate
2. Modal/form appears
3. Fill in:
   - Preferred date/time
   - Interview notes
4. Submit

**✅ PASS IF:**
- Modal opens
- Form submits successfully
- Success message appears
- Interview request saved to database

**❌ FAIL IF:**
- Modal doesn't open
- Form errors out
- No confirmation
- Database not updated

---

### **TEST 1.3: Management Sees Interview Request**

**Portal:** Admin Portal (`/admin/recruitment/interviews`)

**Steps:**
1. Login as management
2. Go to Recruitment → Interviews
3. Find the interview request you just created

**✅ PASS IF:**
- Interview request shows up
- Client name correct
- Candidate name correct
- Date/time shown
- Status = "PENDING"

**❌ FAIL IF:**
- Request doesn't appear
- Data missing or wrong
- Can't find it

---

### **TEST 1.4: Hire Candidate**

**Portal:** Admin Portal

**Steps:**
1. Open the interview request
2. Click "Approve" or "Hire Candidate"
3. System should create:
   - Job acceptance record
   - Start onboarding process
   - Send notifications

**✅ PASS IF:**
- Status changes to "HIRED"
- Onboarding record created
- Candidate moves to onboarding pipeline

**❌ FAIL IF:**
- Hire button doesn't work
- No status change
- Onboarding doesn't start

---

# 🧪 PHASE 2: ONBOARDING FLOW

## **What This Does:**
Candidate goes through 7-step digital onboarding → Becomes staff user

---

### **TEST 2.1: Onboarding Steps (All 7)**

**Portal:** Staff Onboarding (`/onboarding`)

**The 7 Steps:**
1. **Personal Information** (name, DOB, address, etc.)
2. **Government IDs** (upload SSS, TIN, PhilHealth, Pag-IBIG)
3. **Background Clearances** (NBI, Police, Barangay)
4. **Education** (highest level, school, graduation)
5. **Welcome Form** (interests, hobbies, fun facts - for AI)
6. **Medical Info** (allergies, conditions, emergency contact)
7. **Employment Contract** (review, e-sign)

**Steps:**
1. Access onboarding link (candidate gets email)
2. Complete EACH step one by one
3. Upload documents where required
4. Click "Next" after each step

**✅ PASS IF:**
- All 7 steps accessible
- Forms save correctly
- File uploads work
- Progress bar updates
- Can navigate back/forward
- E-signature captures properly

**❌ FAIL IF:**
- Steps skip or break
- Uploads fail
- Data doesn't save
- Progress stuck
- E-signature doesn't work

---

### **TEST 2.2: Client Sees Onboarding Progress**

**Portal:** Client Portal (`/client/staff/onboarding/[candidateId]`)

**Steps:**
1. Login as client
2. Navigate to hired candidate's onboarding page
3. Check progress display

**✅ PASS IF:**
- Shows completion percentage (e.g., "42% Complete")
- Lists all 7 steps with status (Complete/Incomplete)
- Documents viewable (if uploaded)
- Real-time updates

**❌ FAIL IF:**
- No progress shown
- Percentage wrong
- Can't see documents
- Data outdated

---

### **TEST 2.3: Management Completes Onboarding**

**Portal:** Admin Portal (`/admin/onboarding/[staffUserId]`)

**Steps:**
1. Login as management
2. Go to Onboarding → Find candidate
3. Review all 7 steps
4. Click "Complete Onboarding" button
5. System should create:
   - `staff_users` record
   - `staff_profiles` record
   - Login credentials sent

**✅ PASS IF:**
- All steps show as complete
- "Complete Onboarding" button appears
- Staff user created in database
- Staff can now login

**❌ FAIL IF:**
- Button doesn't appear/work
- Staff user not created
- Login doesn't work

---

# 🧪 PHASE 3: TIME TRACKING

## **What This Does:**
Staff clocks in/out daily, system tracks hours, breaks, early/late

---

### **TEST 3.1: Clock In (On Time)**

**Portal:** Staff Portal (`/`)

**Prerequisites:**
- Staff has work schedule set (e.g., 6:00 AM - 3:00 PM)

**Steps:**
1. Login as staff
2. Current time MATCHES shift start time (±5 min)
3. Click "Clock In" button
4. System records clock-in time

**✅ PASS IF:**
- Clock in successful
- Timer starts showing elapsed time
- Status changes to "Clocked In"
- `time_entries` record created with:
  - `clockIn` timestamp
  - `scheduledStart` from work schedule
  - `status` = null (on time)

**❌ FAIL IF:**
- Button doesn't work
- Timer doesn't start
- No database record
- Wrong timestamp

---

### **TEST 3.2: Clock In (LATE)**

**Portal:** Staff Portal

**Steps:**
1. Staff shift starts at 6:00 AM
2. Clock in at 6:20 AM (20 minutes late)
3. System should prompt: "You're 20 min late. Why?"
4. Staff selects reason (Traffic, Family Emergency, etc.)

**✅ PASS IF:**
- Late detection works
- Prompt appears with reason dropdown
- Reason saved to database
- `time_entries.lateMinutes` = 20
- `time_entries.lateReason` saved

**❌ FAIL IF:**
- Late not detected
- No prompt
- Reason not saved
- Wrong calculation

---

### **TEST 3.3: Clock In (EARLY)**

**Portal:** Staff Portal

**Steps:**
1. Staff shift starts at 6:00 AM
2. Clock in at 5:45 AM (15 minutes early)
3. System should show: "Wow! You're 15 min early! 🎉"

**✅ PASS IF:**
- Early detection works
- Positive message shown
- `time_entries.earlyMinutes` = 15
- Bonus time tracked

**❌ FAIL IF:**
- Early not detected
- No message
- Not tracked

---

### **TEST 3.4: Scheduled Break**

**Portal:** Staff Portal

**Prerequisites:**
- Work schedule has breaks defined (e.g., Lunch 12:00 PM - 1:00 PM)

**Steps:**
1. Staff clocked in
2. At 12:00 PM, modal auto-pops: "Time for lunch break!"
3. Staff clicks "Start Break"
4. Break timer starts (counts UP to show how long on break)
5. At 1:00 PM (scheduled end), modal pops: "Break time over!"
6. Staff clicks "End Break"

**✅ PASS IF:**
- Auto-popup at break time
- Break timer works
- End reminder appears
- `breaks` record created with:
  - `scheduledStart`
  - `actualStart`
  - `actualEnd`
  - `duration` calculated correctly

**❌ FAIL IF:**
- No auto-popup
- Timer doesn't work
- Can't end break
- Break not recorded

---

### **TEST 3.5: Manual Break**

**Portal:** Staff Portal

**Steps:**
1. Staff clicks "Take Break" (outside scheduled time)
2. Break starts
3. System tracks as manual/unscheduled
4. Staff clicks "End Break"

**✅ PASS IF:**
- Manual break starts
- Timer works
- `breaks` record has:
  - `scheduledStart` = null
  - `actualStart` = timestamp
  - `type` = "RESTROOM" or "OTHER"

**❌ FAIL IF:**
- Can't start manual break
- Not tracked separately
- Confused with scheduled break

---

### **TEST 3.6: Clock Out**

**Portal:** Staff Portal

**Steps:**
1. Staff shift ends at 3:00 PM
2. Staff clicks "Clock Out" at 3:00 PM
3. System calculates:
   - Total hours worked
   - Breaks deducted
   - Productivity score
   - Overtime (if applicable)

**✅ PASS IF:**
- Clock out successful
- Timer stops
- `time_entries` updated with:
  - `clockOut` timestamp
  - `totalHours` calculated
  - `overtimeMinutes` (if > scheduled end)
- Status shows "Clocked Out"

**❌ FAIL IF:**
- Can't clock out
- Calculations wrong
- No database update

---

### **TEST 3.7: Client Sees Time Entry**

**Portal:** Client Portal (`/client/time-tracking`)

**Steps:**
1. Login as client
2. Go to Time Tracking
3. Find today's entry for your staff

**✅ PASS IF:**
- Time entry shows up
- Clock in/out times correct
- Break times shown
- Total hours displayed
- Can see if late/early

**❌ FAIL IF:**
- No time entry
- Data missing/wrong
- Can't view details

---

### **TEST 3.8: Admin Sees All Time Entries**

**Portal:** Admin Portal (`/admin/time-tracking`)

**Steps:**
1. Login as management
2. Go to Time Tracking
3. View all staff time entries

**✅ PASS IF:**
- All entries listed
- Can filter by:
  - Staff member
  - Date range
  - Company
- Export functionality works

**❌ FAIL IF:**
- Entries missing
- Filters don't work
- Can't export

---

# 🧪 PHASE 4: TASKS SYSTEM

## **What This Does:**
Client assigns tasks to staff → Staff completes → Everyone sees progress

---

### **TEST 4.1: Client Creates Task**

**Portal:** Client Portal (`/client/tasks`)

**Steps:**
1. Login as client
2. Click "Create Task"
3. Fill in:
   - Task title
   - Description
   - Assign to staff
   - Priority (Low/Medium/High)
   - Due date
4. Submit

**✅ PASS IF:**
- Task form opens
- Can select staff from dropdown
- Task saves successfully
- Confirmation appears

**❌ FAIL IF:**
- Form doesn't open
- Can't assign staff
- Submit fails
- No task created

---

### **TEST 4.2: Staff Sees Task**

**Portal:** Staff Portal (`/tasks`)

**Steps:**
1. Login as assigned staff
2. Go to Tasks
3. Find the task client just created

**✅ PASS IF:**
- Task appears in list
- Shows correct:
  - Title
  - Description
  - Due date
  - Priority badge
  - Status = "TODO"

**❌ FAIL IF:**
- Task doesn't show
- Data missing
- Wrong staff assigned

---

### **TEST 4.3: Staff Updates Task Status**

**Portal:** Staff Portal

**Steps:**
1. Click on task
2. Change status: TODO → IN_PROGRESS
3. Add comment: "Started working on this"
4. Later: Change status to COMPLETED

**✅ PASS IF:**
- Status changes work
- Comments save
- Client sees status update in real-time
- Task completion tracked

**❌ FAIL IF:**
- Status won't change
- Comments don't save
- Client doesn't see updates

---

### **TEST 4.4: Admin Sees All Tasks**

**Portal:** Admin Portal (`/admin/tasks`)

**Steps:**
1. Login as management
2. View all tasks across all clients/staff

**✅ PASS IF:**
- All tasks visible
- Can filter by:
  - Client
  - Staff
  - Status
  - Priority
- Search works

**❌ FAIL IF:**
- Tasks missing
- Filters broken
- Wrong data

---

# 🧪 PHASE 5: SUPPORT TICKETS

## **What This Does:**
2 types of tickets - Staff tickets (internal) and Client tickets (support)

---

### **TEST 5.1: Staff Creates Ticket**

**Portal:** Staff Portal (`/tickets`)

**Steps:**
1. Login as staff
2. Click "Create Ticket"
3. Fill in:
   - Category (e.g., "PC Issues", "Need Nurse", "HR Question")
   - Subject
   - Description
4. Submit

**✅ PASS IF:**
- Ticket created
- Auto-assigned to correct management team member
- Status = "OPEN"
- Staff sees ticket in their list

**❌ FAIL IF:**
- Form doesn't work
- No auto-assignment
- Ticket not created

---

### **TEST 5.2: Management Sees Staff Ticket**

**Portal:** Admin Portal (`/admin/tickets`)

**Steps:**
1. Login as management
2. View assigned tickets
3. Find the ticket staff just created

**✅ PASS IF:**
- Ticket appears in queue
- Shows:
  - Staff name
  - Category
  - Priority
  - Created timestamp
- Can click to view details

**❌ FAIL IF:**
- Ticket doesn't show
- Wrong assignment
- Missing data

---

### **TEST 5.3: Management Responds to Ticket**

**Portal:** Admin Portal

**Steps:**
1. Open ticket
2. Add response: "I'll look into this"
3. Change status to "IN_PROGRESS"
4. Later: Add resolution and close ticket

**✅ PASS IF:**
- Response saves
- Staff sees response in real-time
- Status updates work
- Can close ticket
- Closed tickets archived

**❌ FAIL IF:**
- Response doesn't save
- Staff doesn't see it
- Can't close ticket

---

### **TEST 5.4: Client Creates Ticket**

**Portal:** Client Portal (`/client/support`)

**Steps:**
1. Login as client
2. Create support ticket
3. Questions like:
   - "How do I give my staff a bonus?"
   - "Can I change shift times?"
   - "Need help with billing"

**✅ PASS IF:**
- Ticket created
- Routed to Account Manager
- Client sees ticket status

**❌ FAIL IF:**
- Form broken
- Wrong routing
- No visibility

---

# 🧪 PHASE 6: PERFORMANCE REVIEWS

## **What This Does:**
Auto-triggered reviews at Month 1, 3, 5, 6+ → Client fills out → Management finalizes

---

### **TEST 6.1: Review Auto-Triggers**

**Portal:** Admin Portal (`/admin/performance-reviews`)

**Prerequisites:**
- Staff has been employed for 1 month (or simulate)

**Steps:**
1. System should auto-create review
2. Review shows in admin portal
3. Status = "PENDING_CLIENT_FEEDBACK"

**✅ PASS IF:**
- Review created automatically
- Correct type (Month 1, 3, 5, or Recurring)
- Assigned to correct staff
- Client notified

**❌ FAIL IF:**
- Review not created
- Wrong type
- No notification

---

### **TEST 6.2: Client Fills Out Review**

**Portal:** Client Portal (`/client/reviews/[reviewId]`)

**Steps:**
1. Login as client
2. Go to Performance Reviews
3. Open pending review
4. Rate staff on:
   - Work quality
   - Communication
   - Timeliness
   - Overall score (1-5 stars)
5. Add written feedback
6. Submit

**✅ PASS IF:**
- Review form loads
- All fields editable
- Star rating works
- Saves successfully
- Status changes to "PENDING_ADMIN_REVIEW"

**❌ FAIL IF:**
- Form doesn't load
- Can't submit
- Data not saved

---

### **TEST 6.3: Management Finalizes Review**

**Portal:** Admin Portal

**Steps:**
1. Open client-completed review
2. Review client's feedback
3. Add management notes
4. Decide action:
   - Continue
   - Probation
   - Terminate
5. Finalize review

**✅ PASS IF:**
- Can view client feedback
- Can add admin notes
- Action saves
- Status = "COMPLETED"
- Staff can see final review

**❌ FAIL IF:**
- Can't finalize
- Actions don't work
- Staff can't view

---

### **TEST 6.4: Staff Sees Review**

**Portal:** Staff Portal (`/reviews`)

**Steps:**
1. Login as staff
2. View completed reviews
3. Read client feedback

**✅ PASS IF:**
- Reviews listed
- Shows:
  - Review type
  - Scores
  - Feedback
  - Date
- Can't edit (read-only)

**❌ FAIL IF:**
- Can't access reviews
- Missing data
- Can edit (shouldn't!)

---

# 🧪 PHASE 7: AI ASSISTANT

## **What This Does:**
Staff asks questions 24/7 → AI answers using knowledge base + context

---

### **TEST 7.1: Staff Opens AI Assistant**

**Portal:** Staff Portal (`/ai-assistant`)

**Steps:**
1. Login as staff
2. Navigate to AI Assistant
3. Interface should show:
   - Chat history
   - Input field
   - Quick actions
   - Suggested questions

**✅ PASS IF:**
- Page loads
- Chat interface clean
- Can type in message box
- Send button works

**❌ FAIL IF:**
- 500 error
- Interface broken
- Can't send messages

---

### **TEST 7.2: AI Responds to Question**

**Portal:** Staff Portal

**Steps:**
1. Type: "Hello, can you help me?"
2. Click Send
3. Wait for AI response

**✅ PASS IF:**
- Message sends
- AI responds within 5 seconds
- Response is relevant
- Chat history saves
- No errors

**❌ FAIL IF:**
- Message doesn't send
- 401/500 error
- No response
- Response is garbage

---

### **TEST 7.3: AI Uses Personalization**

**Portal:** Staff Portal

**Prerequisites:**
- Staff has completed "Staff Interests" form (hobbies, favorites, etc.)

**Steps:**
1. Ask AI: "What do you know about me?"
2. AI should respond with staff's personal info:
   - Name
   - Client they work for
   - Hobbies
   - Favorites (color, movie, etc.)

**✅ PASS IF:**
- AI knows staff name
- References their client
- Mentions interests/hobbies
- Personalized response

**❌ FAIL IF:**
- Generic response
- Wrong information
- No personalization

---

### **TEST 7.4: AI References Documents**

**Portal:** Staff Portal

**Prerequisites:**
- Client has uploaded documents (e.g., "How to use CRM.pdf")
- Document is APPROVED (status = "APPROVED")

**Steps:**
1. Ask AI: "How do I use the CRM system?"
2. AI should reference uploaded document

**✅ PASS IF:**
- AI mentions document
- Provides relevant answer
- Can reference multiple docs

**❌ FAIL IF:**
- Says "I don't know"
- Doesn't mention document
- Wrong document

---

### **TEST 7.5: Admin Sees AI Usage Stats**

**Portal:** Admin Portal (`/admin/ai-analytics`)

**Steps:**
1. Login as management
2. View AI usage statistics

**✅ PASS IF:**
- Shows number of chats
- Most asked questions
- Response times
- Error rates

**❌ FAIL IF:**
- No data shown
- Stats broken

---

# 🧪 PHASE 8: DOCUMENTS

## **What This Does:**
Upload docs → Approval workflow → AI can access approved docs

---

### **TEST 8.1: Client Uploads Document**

**Portal:** Client Portal (`/client/documents`)

**Steps:**
1. Login as client
2. Click "Upload Document"
3. Upload file (PDF, Word, etc.)
4. Add:
   - Title
   - Description
   - Visibility (Who can see it?)
5. Submit

**✅ PASS IF:**
- File uploads successfully
- Metadata saves
- Document appears in list
- Status = "PENDING_APPROVAL" (if staff-uploaded)
- Status = "APPROVED" (if client-uploaded)

**❌ FAIL IF:**
- Upload fails
- File doesn't save
- Wrong status

---

### **TEST 8.2: Staff Uploads Document (Needs Approval)**

**Portal:** Staff Portal (`/documents`)

**Steps:**
1. Login as staff
2. Upload document
3. Submit for approval

**✅ PASS IF:**
- Upload works
- Status = "PENDING_APPROVAL"
- Client gets notification
- Can't be used by AI yet

**❌ FAIL IF:**
- Upload fails
- Wrong status
- No approval workflow

---

### **TEST 8.3: Client Approves Staff Document**

**Portal:** Client Portal

**Steps:**
1. Go to Documents → Pending Approval
2. Review staff-uploaded document
3. Click "Approve"
4. Document now available to AI

**✅ PASS IF:**
- Can see pending docs
- Approve button works
- Status changes to "APPROVED"
- AI can now reference it

**❌ FAIL IF:**
- Can't approve
- Status doesn't change
- AI still can't use it

---

### **TEST 8.4: Admin Sees All Documents**

**Portal:** Admin Portal (`/admin/documents`)

**Steps:**
1. View all documents across all clients/staff
2. Filter by:
   - Company
   - Type
   - Status

**✅ PASS IF:**
- All documents listed
- Filters work
- Can download files
- Can see approval status

**❌ FAIL IF:**
- Documents missing
- Filters broken
- Can't download

---

# 🧪 PHASE 9: SOCIAL FEED (POSTS)

## **What This Does:**
Staff share achievements → Others react & comment → Build culture

---

### **TEST 9.1: Staff Creates Post**

**Portal:** Staff Portal (`/posts`)

**Steps:**
1. Login as staff
2. Click "Create Post"
3. Write post content
4. Select audience:
   - All Staff
   - My Team
   - My Client
5. Upload image (optional)
6. Post

**✅ PASS IF:**
- Post form opens
- Can type content
- Image upload works
- Audience selection works
- Post appears in feed

**❌ FAIL IF:**
- Form doesn't open
- Can't post
- Image fails
- Wrong audience

---

### **TEST 9.2: Others See Post**

**Portal:** Staff Portal (different user)

**Steps:**
1. Login as another staff member
2. Go to Posts feed
3. Apply filters (All Staff, My Team, etc.)

**✅ PASS IF:**
- Post appears in correct feeds
- Audience filter works
- Images display
- Timestamp correct

**❌ FAIL IF:**
- Post doesn't show
- Shows in wrong feed
- Images broken

---

### **TEST 9.3: React to Post**

**Portal:** Staff Portal

**Steps:**
1. Find a post
2. Click "React" button
3. Choose emoji: 👍 ❤️ 🎉 🔥 😂 🚀
4. Reaction should show on post

**✅ PASS IF:**
- Reaction picker opens
- Can select emoji
- Reaction appears immediately
- Count updates (e.g., "5 👍")
- Can toggle off (remove reaction)

**❌ FAIL IF:**
- Picker doesn't open
- Reaction doesn't save
- Count wrong
- Can't remove

---

### **TEST 9.4: Comment on Post**

**Portal:** Staff Portal

**Steps:**
1. Click "Comment" on post
2. Comments section expands
3. Type comment
4. Submit

**✅ PASS IF:**
- Comments section loads
- Can type and submit
- Comment appears
- Shows author name & avatar
- Timestamp correct

**❌ FAIL IF:**
- Section doesn't expand
- Can't submit
- Comment doesn't appear

---

### **TEST 9.5: Client Sees Staff Posts**

**Portal:** Client Portal (`/client/posts`)

**Steps:**
1. Login as client
2. View posts from YOUR staff only

**✅ PASS IF:**
- Shows posts from assigned staff
- Can react and comment
- Filtered correctly (only their staff)

**❌ FAIL IF:**
- Shows wrong posts
- Can't interact
- Sees other clients' staff

---

### **TEST 9.6: Admin Sees All Posts**

**Portal:** Admin Portal (`/admin/posts`)

**Steps:**
1. View all posts across entire platform
2. Filter by:
   - Company
   - Staff member
   - Date range

**✅ PASS IF:**
- All posts visible
- Filters work
- Can moderate (delete if needed)

**❌ FAIL IF:**
- Posts missing
- Filters broken
- Can't moderate

---

# 🧪 PHASE 10: ADMIN STAFF PROFILES

## **What This Does:**
Admin views comprehensive employee data - ALL INFO IN ONE PLACE

---

### **TEST 10.1: View Staff List**

**Portal:** Admin Portal (`/admin/staff`)

**Steps:**
1. Login as management
2. View all staff members
3. List should show:
   - Avatar
   - Name
   - Email
   - Company assigned
   - Employment status
   - Actions (View Profile)

**✅ PASS IF:**
- All staff listed
- Data correct
- Search works
- Filter by company works
- "View Profile" button works

**❌ FAIL IF:**
- List empty or broken
- Missing data
- Search/filter broken
- Can't click profile

---

### **TEST 10.2: View Comprehensive Staff Profile**

**Portal:** Admin Portal (`/admin/staff/[staffId]`)

**THIS IS THE BIG ONE - TEST EVERY SECTION:**

**Steps:**
1. Click on any staff member
2. Profile page should show **ALL** of these sections:

### **Section 1: Basic Info**
- ✅ Name, email, avatar
- ✅ Current role
- ✅ Company assigned
- ✅ Phone number
- ✅ Location
- ✅ Account created date

### **Section 2: Employment Details**
- ✅ Employment Status (PROBATION/REGULAR/CONTRACT)
- ✅ Start Date
- ✅ Days Employed (calculated)
- ✅ Timezone

### **Section 3: Compensation & Pay**
- ✅ Monthly Salary (₱XX,XXX)
- ✅ Last Pay Increase Date
- ✅ Increase Amount

### **Section 4: Leave Management**
- ✅ Total Leave Allowance (e.g., 12 days)
- ✅ Used Leave (e.g., 3 days)
- ✅ Vacation Leave Used
- ✅ Sick Leave Used
- ✅ Remaining Leave (calculated)

### **Section 5: Work Schedule** ⭐ **CRITICAL**
- ✅ Full weekly schedule (Monday-Sunday)
- ✅ Each day shows:
  - Start time (e.g., 6:00 AM)
  - End time (e.g., 3:00 PM)
  - Shift type (DAY_SHIFT/NIGHT_SHIFT)
  - Timezone
  - Rest days marked

### **Section 6: Personal Information**
- ✅ Date of Birth
- ✅ Gender
- ✅ Civil Status

### **Section 7: Benefits**
- ✅ HMO Coverage Status (Active/Not Enrolled)

### **Section 8: Staff Interests**
- ✅ Name, Client, Start Date
- ✅ Favorite Fast Food
- ✅ Favorite Color, Movie, Book
- ✅ Hobby, Dream Destination
- ✅ Pet Name, Favorite Sport/Game
- ✅ Favorite Quote, Fun Fact

### **Section 9: Onboarding Status**
- ✅ Completion percentage
- ✅ Link to full onboarding details

### **Section 10: Quick Actions**
- ✅ View Onboarding
- ✅ View Company
- ✅ Send Message

**✅ PASS IF:**
- ALL 10 SECTIONS SHOW
- ALL DATA DISPLAYS CORRECTLY
- NO MISSING FIELDS
- NO 500 ERRORS
- WORK SCHEDULE SHOWS FULL WEEK

**❌ FAIL IF:**
- ANY SECTION MISSING
- DATA WRONG OR EMPTY
- ERRORS ON PAGE LOAD
- WORK SCHEDULE DOESN'T SHOW

---

# 🚨 COMMON ISSUES TO WATCH FOR

## **Database Issues:**
- [ ] 500 errors = backend problem, check console
- [ ] Data not saving = API route broken
- [ ] Wrong data showing = query problem

## **UI Issues:**
- [ ] Buttons don't work = event handler missing
- [ ] Data not updating = need to refresh/refetch
- [ ] Modals don't open = z-index or state issue

## **Permission Issues:**
- [ ] "Unauthorized" = user role wrong
- [ ] Can't see data = RLS policy blocking
- [ ] Actions fail = permission check failing

## **Real-Time Issues:**
- [ ] Updates not showing = WebSocket disconnected
- [ ] Other users can't see = not broadcasting
- [ ] Notifications don't arrive = socket event missing

---

# 📝 REPORTING BUGS

## **WHEN SOMETHING FAILS:**

### **1. STOP TESTING**
Don't continue - report immediately

### **2. SCREENSHOT EVERYTHING:**
- The error message
- Browser console (F12 → Console tab)
- Network tab (if API error)
- The page/form where it broke

### **3. WRITE DOWN:**
- What you were testing (exact step)
- What you clicked/typed
- What SHOULD have happened
- What ACTUALLY happened
- Any error codes/messages

### **4. REPORT TO:**
- Create GitHub issue
- Tag as "bug"
- Include all screenshots
- Reference this test number (e.g., "TEST 3.2 FAILED")

---

# ✅ FINAL CHECKLIST

Before saying "testing complete", verify:

- [ ] All 10 phases tested
- [ ] All 3 portals checked
- [ ] At least 5 different users tested (staff, client, admin)
- [ ] All CRUD operations work (Create, Read, Update, Delete)
- [ ] No console errors on any page
- [ ] All data persists after page refresh
- [ ] Mobile responsive (test on phone)
- [ ] Fast load times (< 3 seconds)

---

# 🎯 SUCCESS CRITERIA

**95% Complete means:**
- ✅ All core workflows functional
- ✅ No breaking bugs
- ✅ Data integrity maintained
- ✅ Users can complete their job
- 🔧 Minor UI polish needed

**100% Complete means:**
- ✅ Everything above
- ✅ Zero bugs
- ✅ Perfect UI/UX
- ✅ Performance optimized
- ✅ Full documentation

---

**YOU'RE AT 95% - LET'S GET TO 100%!** 💪

**END OF TESTING GUIDE**

