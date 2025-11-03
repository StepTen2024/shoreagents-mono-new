# 📅 DAY 1 - STAFF FEATURE FLOW GUIDE

**For:** Vanessa Garcia's First Day (October 30, 2025)  
**Shift:** 3:00 AM - 12:00 PM (9 hours)

---

## 🎯 THE DAILY WORKFLOW (In Order)

This is how a staff member uses each feature throughout their workday, starting from clock-in to clock-out.

---

## 1️⃣ ⏱️ **TIME TRACKING** (FIRST THING!)

### What It Does:
- **Clock In/Out** - Start and end your work shift
- **Break Management** - Schedule and track breaks (Morning, Lunch, Afternoon)
- **Late Detection** - Automatically detects if you're late
- **Live Timer** - See how long you've been working in real-time
- **Stats Dashboard** - View today/week/month hours

### When Vanessa Uses It:
- **3:00 AM** - Clock in to start shift
- **System checks** - Compares to expected start time (3:00 AM from work schedule)
- **Break Scheduler** - Modal pops up to schedule breaks:
  - Morning Break: 6:00 AM - 6:15 AM (15 min)
  - Lunch Break: 8:00 AM - 9:00 AM (60 min)  
  - Afternoon Break: 10:30 AM - 10:45 AM (15 min)
- **Throughout Day** - Timer runs, tracks active time
- **12:00 PM** - Clock out (select reason: "END_OF_SHIFT")

### APIs Used:
```
GET  /api/time-tracking          - Fetch time entries & stats
POST /api/time-tracking/clock-in - Start shift
POST /api/time-tracking/clock-out - End shift
GET  /api/time-tracking/status   - Current clock status
POST /api/breaks/scheduled       - Schedule breaks
POST /api/breaks/start           - Start a break
POST /api/breaks/end             - End a break
```

### WebSocket Events:
```javascript
'time:clockin'    - Notifies when clocked in
'time:clockout'   - Notifies when clocked out
'break:started'   - Break timer begins
'break:ended'     - Break timer ends
'break:auto-start-trigger' - Server auto-starts scheduled breaks
```

### Data Tracked:
```typescript
time_entries {
  clockIn: DateTime           // When shift started
  clockOut: DateTime          // When shift ended
  expectedClockIn: DateTime   // From work_schedules (3:00 AM)
  wasLate: boolean           // Was Vanessa late?
  lateBy: number             // Minutes late
  totalHours: number         // NET hours (shift - breaks)
  clockOutReason: string     // Why clocked out
  breaksScheduled: boolean   // Did she schedule breaks?
}

breaks {
  type: 'MORNING' | 'LUNCH' | 'AFTERNOON' | 'AWAY'
  scheduledStart: '6:00 AM'
  scheduledEnd: '6:15 AM'
  actualStart: DateTime      // When actually started
  actualEnd: DateTime        // When actually returned
  duration: number           // Actual minutes taken
  isLate: boolean           // Returned late from break?
  lateBy: number            // Minutes late returning
}
```

### Why It's First:
**You can't do ANYTHING else until you clock in!** The system tracks:
- When you started
- If you were late
- Your net work hours (for payroll)
- Break compliance

---

## 2️⃣ 📊 **ANALYTICS** (Background Tracking)

### What It Does:
- **Performance Metrics** - Tracks productivity automatically
- **Activity Monitoring** - Mouse, keyboard, screen time
- **Productivity Score** - 0-100 score based on activity
- **Browser Tracking** - URLs visited (Electron app only)
- **App Usage** - Applications used during work
- **Screenshots** - Optional screenshot tracking

### When Vanessa Uses It:
- **Automatic** - Runs in background once clocked in
- **Electron App Required** - Must use desktop app for full tracking
- **Real-time Updates** - Updates every 5-10 seconds
- **Daily Summary** - View end of day stats

### APIs Used:
```
GET  /api/analytics                    - Fetch staff's own metrics
POST /api/analytics                    - Submit performance data
GET  /api/analytics/today              - Today's metrics only
GET  /api/client/analytics             - Client view (aggregated)
GET  /api/admin/analytics              - Admin view (all staff)
GET  /api/admin/staff-analytics/[id]   - Specific staff metrics
```

### Electron Integration:
```javascript
// Tracking happens in Electron main process
trackerConfig.js {
  trackMouse: true,
  trackKeyboard: true,
  trackScreenTime: true,
  trackUrls: true,           // Browser titles
  trackApps: true,
  takeScreenshots: false,    // Optional
  interval: 10000            // Update every 10s
}
```

### Data Tracked:
```typescript
performance_metrics {
  date: Date
  mouseMovements: number      // Total mouse moves
  mouseClicks: number         // Total clicks
  keystrokes: number          // Total keystrokes
  activeTime: number          // Minutes active
  idleTime: number            // Minutes idle
  screenTime: number          // Minutes screen on
  downloads: number           // Files downloaded
  uploads: number             // Files uploaded
  bandwidth: number           // Data transferred
  clipboardActions: number    // Copy/paste actions
  filesAccessed: number       // Files opened
  urlsVisited: number         // Browser pages
  tabsSwitched: number        // Tab switches
  productivityScore: number   // 0-100 score
  applicationsUsed: string[]  // ["Chrome", "VS Code"]
  visitedUrls: string[]       // Page titles (not URLs)
  screenshotUrls: string[]    // Screenshot S3 URLs
}
```

### Who Sees What:
- **Staff (Vanessa)** - Her own metrics only
- **Client** - Aggregated hours/productivity (no detailed activity)
- **Admin** - Full detailed metrics for all staff

### Why It Matters:
- **Performance Reviews** - Client sees if staff is productive
- **Payroll** - Verify hours worked
- **Compliance** - Ensure staff working during shift

---

## 3️⃣ ✅ **TASKS** (Daily Work)

### What It Does:
- **Task Management** - View and complete assigned tasks
- **Personal Tasks** - Create your own to-do list
- **Priorities** - High/Medium/Low priority levels
- **Status Tracking** - Todo → In Progress → Done
- **Notes** - Add notes to tasks

### When Vanessa Uses It:
- **After Clock-In** - Check what tasks assigned today
- **Throughout Day** - Mark tasks complete as finished
- **Before Clock-Out** - Ensure all tasks updated

### APIs Used:
```
GET  /api/tasks              - Fetch staff's tasks
POST /api/tasks              - Create new task
PUT  /api/tasks/[id]         - Update task
DELETE /api/tasks/[id]       - Delete task
```

### WebSocket Events:
```javascript
'task:created'  - New task assigned
'task:updated'  - Task status changed
'task:deleted'  - Task removed
```

### Data Structure:
```typescript
tasks {
  id: string
  title: string
  description: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  dueDate: DateTime
  staffUserId: string         // Assigned to Vanessa
  createdBy: string           // Admin who assigned it
  completedAt: DateTime       // When marked done
}
```

### Who Can Do What:
- **Admin** - Create tasks for any staff
- **Staff (Vanessa)** - Create personal tasks, complete assigned tasks
- **Client** - Cannot see tasks (internal only)

---

## 4️⃣ 🎫 **TICKETS** (Support Requests)

### What It Does:
- **Support System** - Request help from admin/management
- **Issue Tracking** - Report technical problems
- **Communication** - Reply to tickets, add attachments
- **Status Tracking** - Open → In Progress → Resolved

### When Vanessa Uses It:
- **As Needed** - When she has a problem or question
- Example issues:
  - "My clock-in button isn't working"
  - "Need access to new client system"
  - "Request time off for tomorrow"
  - "Computer running slow"

### APIs Used:
```
GET  /api/tickets              - Fetch staff's tickets
POST /api/tickets              - Create new ticket
PUT  /api/tickets/[id]         - Update ticket
POST /api/tickets/[id]/respond - Add response
```

### Data Structure:
```typescript
tickets {
  id: string
  title: string
  description: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  category: 'TECHNICAL' | 'HR' | 'CLIENT_REQUEST' | 'OTHER'
  staffUserId: string          // Vanessa's ID
  assignedTo: string           // Admin handling it
  responses: [...]             // Ticket thread
  attachments: string[]        // File URLs
  createdAt: DateTime
  resolvedAt: DateTime
}
```

### Who Sees What:
- **Staff (Vanessa)** - Her own tickets only
- **Client** - Their own tickets to admin
- **Admin** - All tickets from everyone

---

## 5️⃣ 📝 **THE FEED** (Social/Activity)

### What It Does:
- **Social Feed** - Internal staff social network
- **Activity Stream** - Auto-posts for achievements
- **Likes & Comments** - Interact with other staff posts
- **Achievements** - Share milestones (100% attendance, etc.)
- **Team Updates** - Announcements from management

### When Vanessa Uses It:
- **Throughout Day** - Check team updates
- **Auto-Posts Created:**
  - "Vanessa clocked in for the day! 🎯"
  - "Vanessa earned achievement: Perfect Attendance 🏆"
  - "Vanessa completed 10 tasks today! 💪"
  - "Vanessa clocked out after 9.0 hours! 🌟"

### APIs Used:
```
GET  /api/feed               - Fetch feed posts
POST /api/feed/post          - Create post
POST /api/feed/like          - Like a post
POST /api/feed/comment       - Comment on post
```

### WebSocket Events:
```javascript
'post:created'    - New post in feed
'post:reacted'    - Someone liked post
'post:commented'  - New comment added
```

### Data Structure:
```typescript
feed_posts {
  id: string
  content: string              // Post text
  type: 'STATUS' | 'ACHIEVEMENT' | 'ANNOUNCEMENT'
  staffUserId: string          // Who posted
  likes: number                // Like count
  comments: [...]              // Comments array
  isSystemGenerated: boolean   // Auto-generated?
  createdAt: DateTime
}
```

### Auto-Generated Posts:
The system automatically creates posts for:
- ✅ Clock in/out
- ✅ Achievements earned
- ✅ Performance milestones
- ✅ Level ups (gamification)

---

## 6️⃣ ⭐ **PERFORMANCE REVIEWS** (Monthly)

### What It Does:
- **Client Feedback** - Monthly reviews from clients
- **Rating System** - Scored on multiple criteria
- **Review History** - View past reviews
- **Trends** - Track improvement over time
- **Feedback Reading** - See what clients said

### When Vanessa Uses It:
- **First Month:** October 30 - November 30
- **Review Submitted:** Early November (by client)
- **Vanessa Views:** Read feedback and scores
- **Action:** Improve based on feedback

### Flow:
```
Day 30: Admin → Sends review request to client
Client → Submits review (ratings + feedback)
System → Notifies Vanessa
Vanessa → Views review in portal
System → Updates performance stats
```

### APIs Used:
```
GET /api/performance-reviews          - Fetch staff's reviews
GET /api/performance-reviews/count    - Count pending reviews
GET /api/client/performance-reviews   - Client submits review
GET /api/admin/performance-reviews    - Admin views all reviews
```

### Data Structure:
```typescript
performance_reviews {
  id: string
  staffUserId: string          // Vanessa
  clientUserId: string         // Who reviewed her
  month: number                // October = 10
  year: number                 // 2025
  
  // Ratings (1-5 scale)
  qualityOfWork: number
  communication: number
  reliability: number
  technicalSkills: number
  problemSolving: number
  overallRating: number        // Average
  
  // Feedback
  feedback: string
  strengths: string
  areasForImprovement: string
  
  // Status
  status: 'PENDING' | 'SUBMITTED' | 'REVIEWED'
  submittedAt: DateTime
}
```

### Review Criteria:
Clients rate staff on:
- Quality of Work (1-5 ⭐)
- Communication (1-5 ⭐)
- Reliability/Attendance (1-5 ⭐)
- Technical Skills (1-5 ⭐)
- Problem Solving (1-5 ⭐)
- Overall Rating (average)

### Why It Matters:
- **Performance Tracking** - Shows improvement over time
- **Bonuses** - High ratings = bonuses
- **Promotions** - Consistent 5-star reviews = promotion
- **Gamification** - Reviews affect leaderboard

---

## 7️⃣ 🏆 **LEADERBOARD** (Gamification)

### What It Does:
- **Ranking System** - Compare with other staff
- **Points & Levels** - Earn points for actions
- **Achievements** - Unlock achievements
- **Competition** - See who's #1
- **Motivation** - Game-like engagement

### When Vanessa Uses It:
- **Throughout Day** - Earn points automatically
- **End of Day** - Check leaderboard position
- **Weekly Reset** - New week, fresh competition

### How Points Are Earned:
```javascript
Clock in on time: +10 points
Complete task: +5 points
Perfect attendance (week): +50 points
5-star review: +100 points
Complete all daily tasks: +25 points
Zero late clock-ins (month): +200 points
```

### APIs Used:
```
GET /api/leaderboard          - Fetch rankings
GET /api/gamification/points  - Staff's point balance
POST /api/gamification/award  - Award points (admin only)
```

### Data Structure:
```typescript
gamification_points {
  staffUserId: string
  totalPoints: number
  level: number              // 1-100
  achievements: string[]     // ["PERFECT_WEEK", "TOP_PERFORMER"]
  rank: number              // Position on leaderboard
  pointsThisWeek: number
  pointsThisMonth: number
}
```

### Leaderboard View:
```
#1 🥇 John Smith    - 1,250 pts (Level 12)
#2 🥈 Sarah Lee     - 1,100 pts (Level 11)
#3 🥉 Mike Johnson  - 980 pts  (Level 10)
#4    Vanessa Garcia - 850 pts  (Level 9)
```

### Achievements:
- 🎯 Perfect Attendance (Week)
- ⭐ 5-Star Rating
- 💪 100 Tasks Completed
- ⏰ Never Late (Month)
- 🏆 Top Performer (Week)

---

## 8️⃣ 🤖 **AI ASSISTANT** (Help Anytime)

### What It Does:
- **Intelligent Chatbot** - Answer questions
- **Knowledge Base** - Company policies, procedures
- **Task Help** - How to do specific tasks
- **Troubleshooting** - Fix common problems

### When Vanessa Uses It:
- **First Day** - "How do I clock in?"
- **Throughout Day** - "What's the break policy?"
- **Stuck** - "My task is confusing, can you explain?"
- **Quick Answers** - "When do I get paid?"

### Example Conversations:
```
Vanessa: "How do I take a break?"
AI: "Click the 'Start Break' button in Time Tracking. 
     You have 3 scheduled breaks today:
     - Morning: 6:00 AM
     - Lunch: 8:00 AM  
     - Afternoon: 10:30 AM
     The system will automatically remind you!"

Vanessa: "What if I forget to clock out?"
AI: "Don't worry! Contact support via Tickets. 
     Admin can manually adjust your clock-out time.
     Just explain what happened."
```

### APIs Used:
```
POST /api/ai-assistant/chat   - Send message
GET  /api/ai-assistant/history - Conversation history
```

---

## 9️⃣ 📂 **CLIENT** (Work Overview)

### What It Does:
- **Client Info** - See who you're assigned to
- **Contact Details** - Client contact info
- **Work Scope** - What tasks/projects for this client
- **Documents** - Client-specific files

### When Vanessa Uses It:
- **Check Assignment** - Who is she working for?
- **View Tasks** - What work needed for this client?
- **Upload Files** - Submit work to client

### Data:
```typescript
Vanessa's Assignment:
  Company: StepTen Inc (Johnny Smith's company)
  Role: Customer Support Specialist
  Start Date: October 30, 2025
  Assignment Type: Full-time
  Client Contact: Johnny Smith (j@j.com)
```

---

## 🔟 📋 **ONBOARDING** (Completed)

### What It Does:
- **New Hire Process** - 7-step onboarding
- **Document Collection** - Gov IDs, contracts, etc.
- **Profile Setup** - Personal info, emergency contacts
- **Welcome Form** - Interests, hobbies, preferences
- **Contract Signing** - Digital signature

### Status for Vanessa:
✅ **100% COMPLETE** - All steps finished

Steps Completed:
1. ✅ Basic Information
2. ✅ Government IDs (SSS, TIN, PhilHealth, Pag-IBIG)
3. ✅ Personal Documents (Birth Cert, Valid ID)
4. ✅ Emergency Contact (Maria Garcia - Mother)
5. ✅ Welcome Form (Hobbies, interests, etc.)
6. ✅ Employment Contract (Reviewed & accepted)
7. ✅ Digital Signature (Signed contract)

---

## 1️⃣1️⃣ 👤 **STAFF** (Profile View)

### What It Does:
- **Personal Profile** - View your own details
- **Employment Info** - Salary, position, start date
- **Documents** - Access your uploaded documents
- **Schedule** - View work schedule
- **Leave Credits** - Check vacation/sick days

### Vanessa's Profile Shows:
```
Name: Vanessa Garcia
Email: v@v.com
Position: Customer Support Specialist
Salary: PHP 28,000/month
Start Date: October 30, 2025
Days Employed: 0 days

Work Schedule:
  Monday-Friday: 3:00 AM - 12:00 PM
  Saturday-Sunday: OFF

Leave Credits:
  Vacation: 0/15 days
  Sick: 0/15 days
  Total: 0/30 days

HMO: Active ✅
```

---

## 1️⃣2️⃣ 📤 **OFFBOARDING** (Future)

### What It Does:
- **Exit Process** - When staff leaves
- **Exit Interview** - Feedback form
- **Equipment Return** - Laptop, etc.
- **Final Payroll** - Last payment processing
- **Access Revocation** - Account disabled

### Status for Vanessa:
❌ **NOT APPLICABLE** - She just started!

This feature only used when employee resigns or is terminated.

---

## 📊 **FEATURE PRIORITY FOR DAY 1**

### MUST USE (Critical):
1. ⏱️ **Time Tracking** - Clock in at 3:00 AM (FIRST THING!)
2. ✅ **Tasks** - Check assigned work
3. 📊 **Analytics** - Background tracking (automatic)

### SHOULD CHECK (Important):
4. 📝 **The Feed** - See team activity
5. 👤 **Staff** - Review your profile
6. 📂 **Client** - Know who you're working for

### USE AS NEEDED:
7. 🎫 **Tickets** - Only if problems
8. 🤖 **AI Assistant** - When stuck
9. 🏆 **Leaderboard** - Check ranking (optional)

### MONTHLY:
10. ⭐ **Performance Reviews** - November (after 1 month)

### ALREADY DONE:
11. ✅ **Onboarding** - 100% complete

### NOT RELEVANT YET:
12. ❌ **Offboarding** - When leaving (future)

---

## 🎯 VANESSA'S FIRST DAY CHECKLIST

### 3:00 AM - Start of Shift
- [ ] Login to staff portal (v@v.com)
- [ ] Navigate to **Time Tracking**
- [ ] Click "Clock In"
- [ ] Schedule breaks:
  - Morning: 6:00 AM - 6:15 AM
  - Lunch: 8:00 AM - 9:00 AM
  - Afternoon: 10:30 AM - 10:45 AM

### 3:05 AM - Setup
- [ ] Check **Tasks** - See what's assigned
- [ ] Review **Client** info - Know who you're working for
- [ ] Check **The Feed** - Team updates

### Throughout Day (3 AM - 12 PM)
- [ ] Complete assigned tasks
- [ ] Take scheduled breaks on time
- [ ] Monitor **Analytics** (runs automatically)
- [ ] Use **AI Assistant** if stuck

### 12:00 PM - End of Shift
- [ ] Complete any remaining tasks
- [ ] Navigate to **Time Tracking**
- [ ] Click "Clock Out"
- [ ] Select reason: "END_OF_SHIFT"
- [ ] Review daily stats

### After First Day
- [ ] Check **Leaderboard** - See your ranking
- [ ] Review performance stats
- [ ] Read **The Feed** - Any achievements posted?

---

## 📞 SUPPORT

**If Vanessa has issues:**
1. Click **AI Assistant** - Ask questions
2. Create **Ticket** - Report problems
3. Contact Admin - stephen@shoreagents.com

---

**Ready for Vanessa's first shift!** 🚀  
**Next:** Test her login at http://localhost:3000/login/staff

