# 🚀 FEATURE APIs QUICK REFERENCE

**All the features in your sidebar & their APIs**

---

## ⏱️ TIME TRACKING

**Purpose:** Clock in/out, track hours, manage breaks

```bash
# Time Entries
GET  /api/time-tracking              # Get all entries + stats
POST /api/time-tracking/clock-in     # Start shift
POST /api/time-tracking/clock-out    # End shift  
GET  /api/time-tracking/status       # Current status

# Breaks
GET  /api/breaks/scheduled           # Get scheduled breaks
POST /api/breaks/scheduled           # Schedule breaks
POST /api/breaks/start               # Start a break
POST /api/breaks/end                 # End a break
POST /api/breaks/pause               # Pause break (once per break)
POST /api/breaks/resume              # Resume break
```

**WebSocket Events:**
- `time:clockin` - User clocked in
- `time:clockout` - User clocked out
- `break:auto-start-trigger` - Server triggers break
- `break:started` - Break timer started
- `break:ended` - Break completed

---

## 📊 ANALYTICS

**Purpose:** Track productivity, activity, performance metrics

```bash
# Staff View (own metrics)
GET  /api/analytics                  # Get own metrics
POST /api/analytics                  # Submit performance data
GET  /api/analytics/today            # Today's metrics only

# Client View (assigned staff)
GET  /api/client/analytics           # Assigned staff metrics (aggregated)

# Admin View (all staff)
GET  /api/admin/analytics            # All staff metrics
GET  /api/admin/staff-analytics/[id] # Specific staff details
```

**Metrics Tracked:**
- Mouse movements & clicks
- Keystrokes
- Active time vs idle time
- Screen time
- URLs visited (page titles)
- Applications used
- Downloads/uploads
- Productivity score (0-100)
- Screenshots (optional)

---

## ✅ TASKS

**Purpose:** Task management, to-do lists

```bash
GET    /api/tasks                    # Get staff's tasks
POST   /api/tasks                    # Create new task
PUT    /api/tasks/[id]               # Update task
DELETE /api/tasks/[id]               # Delete task
```

**WebSocket Events:**
- `task:created` - New task assigned
- `task:updated` - Task status changed
- `task:deleted` - Task removed

**Task Statuses:**
- `TODO` - Not started
- `IN_PROGRESS` - Working on it
- `DONE` - Completed

---

## 🎫 TICKETS

**Purpose:** Support requests, issue tracking

```bash
GET  /api/tickets                    # Get staff's tickets
POST /api/tickets                    # Create ticket
PUT  /api/tickets/[id]               # Update ticket
POST /api/tickets/[id]/respond       # Add response
```

**Ticket Types:**
- `TECHNICAL` - Tech issues
- `HR` - HR questions
- `CLIENT_REQUEST` - Client-related
- `OTHER` - Misc

**Statuses:**
- `OPEN` → `IN_PROGRESS` → `RESOLVED` → `CLOSED`

---

## ⭐ PERFORMANCE REVIEWS

**Purpose:** Monthly client feedback, ratings

```bash
# Staff View
GET /api/performance-reviews         # Get own reviews
GET /api/performance-reviews/count   # Count pending

# Client View
GET  /api/client/performance-reviews # Get assigned staff
POST /api/client/performance-reviews # Submit review

# Admin View
GET /api/admin/performance-reviews   # All reviews
```

**Review Criteria (1-5 stars):**
- Quality of Work
- Communication
- Reliability
- Technical Skills
- Problem Solving
- Overall Rating (average)

---

## 📝 THE FEED

**Purpose:** Social feed, activity stream, announcements

```bash
GET  /api/feed                       # Get feed posts
POST /api/feed/post                  # Create post
POST /api/feed/like                  # Like a post
POST /api/feed/comment               # Comment on post
```

**WebSocket Events:**
- `post:created` - New post published
- `post:reacted` - Someone liked
- `post:commented` - New comment

**Auto-Generated Posts:**
- Clock in/out events
- Achievements earned
- Performance milestones
- Level ups

---

## 🏆 LEADERBOARD

**Purpose:** Gamification, rankings, achievements

```bash
GET  /api/leaderboard                # Get rankings
GET  /api/gamification/points        # Staff's points
POST /api/gamification/award         # Award points (admin)
GET  /api/gamification/achievements  # Get achievements
```

**Point System:**
- Clock in on time: +10 pts
- Complete task: +5 pts
- Perfect attendance (week): +50 pts
- 5-star review: +100 pts
- Zero late clock-ins (month): +200 pts

**Achievements:**
- 🎯 Perfect Attendance
- ⭐ 5-Star Rating
- 💪 100 Tasks Completed
- ⏰ Never Late
- 🏆 Top Performer

---

## 🤖 AI ASSISTANT

**Purpose:** Intelligent help, knowledge base

```bash
POST /api/ai-assistant/chat          # Send message
GET  /api/ai-assistant/history       # Conversation history
```

**Capabilities:**
- Answer policy questions
- Help with task guidance
- Troubleshoot issues
- Provide quick answers
- Access knowledge base

---

## 📂 CLIENT

**Purpose:** View client assignments, contact info

```bash
GET /api/client/profile              # Client's own profile
GET /api/admin/clients               # All clients (admin)
GET /api/staff/assignments           # Staff's assignments
```

**Assignment Data:**
- Company name
- Client contact
- Role/position
- Start date
- Assignment type (full-time/part-time)
- Documents

---

## 👤 STAFF

**Purpose:** Personal profile, employment info

```bash
GET /api/staff/profile               # Staff's own profile
GET /api/admin/staff                 # All staff (admin)
PUT /api/staff/profile               # Update profile
```

**Profile Includes:**
- Personal info (name, email, DOB)
- Employment details (salary, position, start date)
- Work schedule (weekly schedule)
- Leave credits (vacation/sick days)
- Documents (gov IDs, contracts, etc.)
- Emergency contact

---

## 📋 ONBOARDING

**Purpose:** New hire process (7 steps)

```bash
GET  /api/onboarding/[staffId]       # Get onboarding status
POST /api/onboarding/[staffId]/step  # Update step
POST /api/onboarding/[staffId]/complete # Complete onboarding
```

**Steps:**
1. Basic Information
2. Government IDs
3. Personal Documents
4. Emergency Contact
5. Welcome Form
6. Employment Contract
7. Digital Signature

---

## 📤 OFFBOARDING

**Purpose:** Exit process when leaving

```bash
POST /api/offboarding/initiate       # Start offboarding
GET  /api/offboarding/[staffId]      # Get offboarding status
POST /api/offboarding/complete       # Complete exit
```

**Process:**
- Exit interview
- Equipment return
- Final payroll
- Access revocation
- Document archival

---

## 🎬 DAILY WORKFLOW API SEQUENCE

### Staff Logs In (3:00 AM)

```bash
1. POST /api/auth/signin              # Login
2. GET  /api/staff/profile            # Load profile
3. GET  /api/time-tracking/status     # Check if clocked in
4. POST /api/time-tracking/clock-in   # Clock in
5. POST /api/breaks/scheduled         # Schedule breaks
6. GET  /api/tasks                    # Load tasks
7. GET  /api/feed                     # Load activity feed
```

### During Work (3 AM - 12 PM)

```bash
# Every 10 seconds (Electron app)
POST /api/analytics                   # Submit metrics

# When taking break
POST /api/breaks/start                # Start break
POST /api/breaks/end                  # End break

# When completing task
PUT  /api/tasks/[id]                  # Mark complete

# If issue arises
POST /api/tickets                     # Create support ticket
```

### Staff Logs Out (12:00 PM)

```bash
1. POST /api/time-tracking/clock-out  # End shift
2. GET  /api/analytics/today          # View day stats
3. GET  /api/leaderboard              # Check ranking
4. POST /api/auth/signout             # Logout
```

---

## 🔐 AUTHENTICATION

**All APIs require authentication**

### Auth Flow:
```bash
POST /api/auth/signin                 # Login (returns session)
GET  /api/auth/session                # Check session
POST /api/auth/signout                # Logout
GET  /api/auth/providers              # Get auth providers
```

### Session Management:
- NextAuth handles sessions
- Cookies store session token
- Middleware checks auth on all routes
- Role-based access control (RBAC)

---

## 📡 WEBSOCKET EVENTS

**Real-time updates via Socket.IO**

### Connection:
```javascript
const socket = io('http://localhost:3000', {
  path: '/api/socketio'
})

// Identify user
socket.emit('identify', {
  userId: 'user-id',
  userName: 'User Name'
})
```

### Time Tracking Events:
- `time:clockin` - Broadcast when user clocks in
- `time:clockout` - Broadcast when user clocks out
- `break:auto-start-trigger` - Server triggers break

### Task Events:
- `task:created` - New task assigned
- `task:updated` - Task status changed
- `task:deleted` - Task removed

### Feed Events:
- `post:created` - New post in feed
- `post:reacted` - Someone liked post
- `post:commented` - New comment

### Notification Events:
- `notification:received` - New notification
- `users:online` - Online users count

---

## 🎯 PRIORITY FOR DAY 1

### Critical APIs (Must Work):
1. ⏱️ **Time Tracking** - Clock in/out
2. 📊 **Analytics** - Performance tracking
3. ✅ **Tasks** - Task management

### Important APIs:
4. 📝 **The Feed** - Activity stream
5. 👤 **Staff** - Profile view
6. 📂 **Client** - Assignment info

### As Needed:
7. 🎫 **Tickets** - Support requests
8. 🤖 **AI Assistant** - Help system
9. 🏆 **Leaderboard** - Rankings

---

## 🧪 TESTING APIS

### Test Clock-In Flow:
```bash
# 1. Login as Vanessa
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "v@v.com", "password": "password"}'

# 2. Check status
curl http://localhost:3000/api/time-tracking/status \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"

# 3. Clock in
curl -X POST http://localhost:3000/api/time-tracking/clock-in \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"

# 4. Get stats
curl http://localhost:3000/api/time-tracking \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```

---

**Server:** http://localhost:3000  
**WebSocket:** ws://localhost:3000/api/socketio  
**Status:** ✅ Running & Ready

