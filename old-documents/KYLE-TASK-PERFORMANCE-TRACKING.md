# 📊 KYLE'S TASK: PERFORMANCE TRACKING SYSTEM - TESTING & FIXES

**Assigned To:** Kyle  
**Priority:** HIGH  
**Branch:** `full-stack-StepTen`  
**Status:** Needs Testing & Verification

---

## 🎯 YOUR MISSION:

**Make sure the Performance Tracking system is 100% working for staff members.** This includes:
- Staff can see their own performance metrics
- Metrics are being captured (either from Electron app or API)
- Dashboard displays correctly
- Data flows from database to UI properly

---

## 📊 DATABASE SCHEMA (THE SOURCE OF TRUTH)

### **Table:** `performance_metrics`

```sql
create table public.performance_metrics (
  id text not null,
  "staffUserId" text not null,
  date timestamp without time zone not null default CURRENT_TIMESTAMP,
  "mouseMovements" integer not null default 0,
  "mouseClicks" integer not null default 0,
  keystrokes integer not null default 0,
  "activeTime" integer not null default 0,
  "idleTime" integer not null default 0,
  "screenTime" integer not null default 0,
  downloads integer not null default 0,
  uploads integer not null default 0,
  bandwidth integer not null default 0,
  "clipboardActions" integer not null default 0,
  "filesAccessed" integer not null default 0,
  "urlsVisited" integer not null default 0,
  "tabsSwitched" integer not null default 0,
  "productivityScore" integer not null default 0,
  "createdAt" timestamp without time zone not null default CURRENT_TIMESTAMP,
  "updatedAt" timestamp without time zone not null,
  constraint performance_metrics_pkey primary key (id),
  constraint performance_metrics_staffUserId_fkey foreign KEY ("staffUserId") references staff_users (id) on update CASCADE on delete CASCADE
)
```

**⚠️ CRITICAL FIELD NAME:** `staffUserId` NOT `userId`

---

## 🚨 KNOWN ISSUE: SCHEMA MISMATCH

### **THE PROBLEM:**

The **database schema** uses `staffUserId`:
```sql
"staffUserId" text not null
```

But the **Prisma schema** uses `userId`:
```prisma
model PerformanceMetric {
  id                String    @id @default(uuid())
  userId            String    // ❌ WRONG! Should be staffUserId
  ...
}
```

And the **API routes** also use `userId`:
```typescript
where: {
  userId: session.user.id, // ❌ WRONG! Should be staffUserId
}
```

### **YOUR FIRST FIX:**

**Step 1:** Update Prisma Schema

**File:** `prisma/schema.prisma`

**Find this (lines 216-241):**
```prisma
model PerformanceMetric {
  id                String    @id @default(uuid())
  staffUserId       String  // ✅ ALREADY CORRECT
  ...
  staffUser         StaffUser @relation(fields: [staffUserId], references: [id], onDelete: Cascade)

  @@map("performance_metrics")
}
```

**Check if `staffUserId` is used consistently. It should be:**
```prisma
model PerformanceMetric {
  id                String    @id @default(uuid())
  staffUserId       String    // ✅ Use staffUserId
  date              DateTime  @default(now())
  mouseMovements    Int       @default(0)
  mouseClicks       Int       @default(0)
  keystrokes        Int       @default(0)
  activeTime        Int       @default(0)
  idleTime          Int       @default(0)
  screenTime        Int       @default(0)
  downloads         Int       @default(0)
  uploads           Int       @default(0)
  bandwidth         Int       @default(0)
  clipboardActions  Int       @default(0)
  filesAccessed     Int       @default(0)
  urlsVisited       Int       @default(0)
  tabsSwitched      Int       @default(0)
  productivityScore Int       @default(0)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  staffUser         StaffUser @relation(fields: [staffUserId], references: [id], onDelete: Cascade)

  @@map("performance_metrics")
}
```

**Step 2:** Run Prisma Generate

```bash
cd "/Users/stephenatcheler/Desktop/Electron - Staff/gamified-dashboard (1)"
pnpm prisma generate
```

This regenerates the Prisma Client with correct field names.

---

## 🔧 API ROUTES TO FIX

### **1. Staff Performance API**

**File:** `app/api/performance/route.ts`

**Current Issues:**
- ❌ Uses `userId` instead of `staffUserId`
- ❌ Joins with `User` model instead of `StaffUser`

**What to Check:**

Lines 18-26 (GET endpoint):
```typescript
const metrics = await prisma.performanceMetric.findMany({
  where: {
    staffUserId: session.user.id, // ✅ Check if this is staffUserId
    date: {
      gte: sevenDaysAgo,
    },
  },
  orderBy: { date: "desc" },
})
```

Lines 34-42 (Today's metrics):
```typescript
const todayMetric = await prisma.performanceMetric.findFirst({
  where: {
    staffUserId: session.user.id, // ✅ Check if this is staffUserId
    date: {
      gte: today,
      lt: tomorrow,
    },
  },
})
```

Lines 135-143 (POST endpoint - check existing):
```typescript
const existingMetric = await prisma.performanceMetric.findFirst({
  where: {
    staffUserId: session.user.id, // ✅ Check if this is staffUserId
    date: {
      gte: today,
      lt: tomorrow,
    },
  },
})
```

Lines 170-188 (POST endpoint - create new):
```typescript
metric = await prisma.performanceMetric.create({
  data: {
    staffUserId: session.user.id, // ✅ Check if this is staffUserId
    mouseMovements: mouseMovements || 0,
    // ... rest of fields
  },
})
```

**⚠️ If any of these use `userId`, change them to `staffUserId`!**

### **2. Client Monitoring API**

**File:** `app/api/client/monitoring/route.ts`

Lines 73-81:
```typescript
const performanceMetrics = await prisma.performanceMetric.findMany({
  where: {
    staffUserId: { in: staffIds }, // ✅ Check if this is staffUserId
    date: {
      gte: today,
      lt: tomorrow
    }
  }
})
```

Lines 84-86:
```typescript
const metricsMap = new Map()
performanceMetrics.forEach(metric => {
  metricsMap.set(metric.staffUserId, metric) // ✅ Check if this is staffUserId
})
```

### **3. Admin Performance API**

**File:** `app/api/admin/performance/route.ts`

Lines 23-25 (Filter by staff):
```typescript
if (staffId) {
  where.staffUserId = staffId // ✅ Check if this is staffUserId
}
```

Lines 29-36 (Filter by client):
```typescript
const assignments = await prisma.staffAssignment.findMany({
  where: {
    clientId,
    isActive: true
  },
  select: { userId: true } // ⚠️ This might be correct if StaffAssignment uses userId
})
where.staffUserId = { in: assignments.map(a => a.userId) } // ✅ Check this
```

Lines 57-70 (Fetch metrics):
```typescript
const metrics = await prisma.performanceMetric.findMany({
  where,
  include: {
    staffUser: { // ✅ Should be staffUser not user
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true
      }
    }
  },
  orderBy: { date: "desc" },
})
```

---

## 🧪 TESTING PROCEDURES

### **Test 1: Check Database Directly**

**In Supabase SQL Editor:**

```sql
-- Check if performance_metrics table exists
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'performance_metrics';

-- Check if there's any data
SELECT * FROM performance_metrics LIMIT 5;

-- Check staffUserId foreign key
SELECT 
  pm.id,
  pm."staffUserId",
  su.name,
  su.email,
  pm."productivityScore",
  pm.date
FROM performance_metrics pm
JOIN staff_users su ON pm."staffUserId" = su.id
ORDER BY pm.date DESC
LIMIT 10;
```

### **Test 2: Create Test Data (If No Data Exists)**

**In Supabase SQL Editor:**

```sql
-- First, get a valid staffUserId (use Freddy Mercury from yesterday's test)
SELECT id, name, email FROM staff_users WHERE email = 'fred@fred.com';

-- Insert test performance data (replace 'STAFF_USER_ID_HERE' with actual ID)
INSERT INTO performance_metrics (
  id,
  "staffUserId",
  date,
  "mouseMovements",
  "mouseClicks",
  keystrokes,
  "activeTime",
  "idleTime",
  "screenTime",
  downloads,
  uploads,
  bandwidth,
  "clipboardActions",
  "filesAccessed",
  "urlsVisited",
  "tabsSwitched",
  "productivityScore",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'STAFF_USER_ID_HERE',  -- Replace with actual staff user ID
  NOW(),
  15420,  -- Mouse movements
  3245,   -- Mouse clicks
  12890,  -- Keystrokes
  385,    -- Active time (minutes)
  55,     -- Idle time (minutes)
  440,    -- Screen time (minutes)
  12,     -- Downloads
  8,      -- Uploads
  145,    -- Bandwidth (MB)
  42,     -- Clipboard actions
  28,     -- Files accessed
  67,     -- URLs visited
  134,    -- Tabs switched
  87,     -- Productivity score
  NOW(),
  NOW()
);
```

**Create data for last 7 days:**

```sql
-- Create performance metrics for the last 7 days
INSERT INTO performance_metrics (
  id, "staffUserId", date,
  "mouseMovements", "mouseClicks", keystrokes,
  "activeTime", "idleTime", "screenTime",
  downloads, uploads, bandwidth,
  "clipboardActions", "filesAccessed", "urlsVisited", "tabsSwitched",
  "productivityScore", "createdAt", "updatedAt"
)
SELECT 
  gen_random_uuid(),
  'STAFF_USER_ID_HERE',  -- Replace
  NOW() - (n || ' days')::interval,
  (random() * 20000)::int,
  (random() * 5000)::int,
  (random() * 15000)::int,
  (300 + random() * 200)::int,
  (30 + random() * 100)::int,
  (400 + random() * 100)::int,
  (random() * 20)::int,
  (random() * 15)::int,
  (random() * 200)::int,
  (random() * 50)::int,
  (random() * 40)::int,
  (random() * 100)::int,
  (random() * 200)::int,
  (60 + random() * 30)::int,
  NOW() - (n || ' days')::interval,
  NOW() - (n || ' days')::interval
FROM generate_series(0, 6) AS n;
```

### **Test 3: Test API Endpoint Directly**

**In browser or Postman:**

1. **Login as staff user** (fred@fred.com or any staff)

2. **Test GET endpoint:**
   ```
   GET http://localhost:3000/api/performance
   ```

   **Expected Response:**
   ```json
   {
     "metrics": [
       {
         "id": "...",
         "date": "2025-10-15T...",
         "mouseMovements": 15420,
         "mouseClicks": 3245,
         "keystrokes": 12890,
         "activeTime": 385,
         "idleTime": 55,
         "screenTime": 440,
         "productivityScore": 87,
         ...
       }
     ],
     "today": {
       // Today's metrics or null
     }
   }
   ```

   **If you get error:**
   - Check terminal logs for Prisma errors
   - Look for "userId" vs "staffUserId" errors
   - Verify session.user.id is valid

3. **Test POST endpoint:**
   ```
   POST http://localhost:3000/api/performance
   Content-Type: application/json

   {
     "mouseMovements": 1000,
     "mouseClicks": 200,
     "keystrokes": 500,
     "activeTime": 60,
     "idleTime": 10,
     "screenTime": 70,
     "downloads": 2,
     "uploads": 1,
     "bandwidth": 50,
     "clipboardActions": 5,
     "filesAccessed": 3,
     "urlsVisited": 10,
     "tabsSwitched": 15,
     "productivityScore": 85
   }
   ```

   **Expected Response:**
   ```json
   {
     "success": true,
     "metric": {
       "id": "...",
       // ... metric data
     }
   }
   ```

### **Test 4: Test UI Dashboard**

1. **Login as staff:**
   - Email: `fred@fred.com`
   - Password: (whatever was set yesterday)

2. **Navigate to Performance:**
   - URL: `http://localhost:3000/performance`
   - Or click "Performance" in sidebar

3. **Check What Displays:**
   - ✅ Today's productivity score (large number with color)
   - ✅ Quick metrics (mouse clicks, keystrokes, active time)
   - ✅ Live metrics section (if Electron running)
   - ✅ 7-day chart or history
   - ✅ Detailed breakdown dialog

4. **If Nothing Shows:**
   - Open browser DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for API call to `/api/performance`
   - If 401 error: auth issue
   - If 500 error: Prisma/database issue (check terminal)
   - If 200 but empty: no data in database

### **Test 5: Test Client Monitoring View**

1. **Login as client/admin:**
   - Or use admin account

2. **Navigate to:**
   - `http://localhost:3000/client/monitoring`

3. **Check What Displays:**
   - ✅ Summary header (total staff, active, avg productivity)
   - ✅ Grid of staff cards
   - ✅ Each card shows productivity score
   - ✅ Click card opens detailed dialog
   - ✅ Dialog shows all metrics

4. **If Nothing Shows:**
   - Check if `StaffAssignment` records exist
   - Check if staff have `performance_metrics` for today
   - Open DevTools and check Console/Network tabs

---

## 🎨 UI COMPONENTS TO CHECK

### **1. Staff Performance Dashboard**

**File:** `components/performance-dashboard.tsx`

**What to Verify:**
- ✅ Fetches from `/api/performance`
- ✅ Displays today's metrics
- ✅ Shows 7-day history
- ✅ Handles empty state (no metrics)
- ✅ Shows loading state
- ✅ Displays error messages
- ✅ Electron integration (if available)

**Key Lines to Check:**
- Line 77-89: `fetchMetrics()` function
- Line 40-48: State variables
- Line 102-131: Manual sync button
- Line 200+: Rendering logic

### **2. Client Monitoring Page**

**File:** `app/client/monitoring/page.tsx`

**What to Verify:**
- ✅ Fetches from `/api/client/monitoring`
- ✅ Shows all assigned staff
- ✅ Displays productivity scores with color coding
- ✅ Opens dialog with detailed metrics
- ✅ Handles empty state
- ✅ Refresh button works

---

## 🔄 PRODUCTIVITY SCORE CALCULATION

**Formula (from CLIENT-MONITORING-COMPLETE.md):**

```typescript
const calculateProductivityScore = (metric: any) => {
  if (!metric) return 0
  
  const totalTime = metric.activeTime + metric.idleTime
  if (totalTime === 0) return 0
  
  // Active time percentage (0-100)
  const activePercent = (metric.activeTime / totalTime) * 100
  
  // Keystrokes score (0-100, capped at 5000 keystrokes)
  const keystrokesScore = Math.min((metric.keystrokes / 5000) * 100, 100)
  
  // Clicks score (0-100, capped at 1000 clicks)
  const clicksScore = Math.min((metric.mouseClicks / 1000) * 100, 100)
  
  // Average of all three metrics
  return Math.round((activePercent + keystrokesScore + clicksScore) / 3)
}
```

**Test This:**
1. Create a metric with known values
2. Calculate expected score manually
3. Verify API returns same score

**Example:**
- activeTime: 400 min, idleTime: 100 min → activePercent = 80%
- keystrokes: 2500 → keystrokesScore = 50%
- mouseClicks: 500 → clicksScore = 50%
- **Expected Score:** (80 + 50 + 50) / 3 = 60

---

## 📁 KEY FILES TO REVIEW

### **Backend (API Routes):**
1. `app/api/performance/route.ts` - Staff performance endpoint
2. `app/api/client/monitoring/route.ts` - Client monitoring endpoint
3. `app/api/admin/performance/route.ts` - Admin performance endpoint

### **Frontend (UI Components):**
1. `components/performance-dashboard.tsx` - Staff performance UI
2. `app/client/monitoring/page.tsx` - Client monitoring UI
3. `app/performance/page.tsx` - Staff performance page (if exists)

### **Database:**
1. `prisma/schema.prisma` - Prisma schema
2. Supabase: `performance_metrics` table

### **Documentation:**
1. `CLIENT-MONITORING-COMPLETE.md` - Client monitoring docs
2. `USER-STRUCTURE-COMPLETE.md` - User structure overview
3. `ELECTRON_SETUP.md` - Electron app setup (for future)

---

## 🐛 COMMON ISSUES & SOLUTIONS

### **Issue 1: "Column 'userId' does not exist"**

**Symptom:** Prisma error in terminal

**Cause:** Schema uses `staffUserId` but code uses `userId`

**Fix:**
1. Update Prisma schema to use `staffUserId`
2. Run `pnpm prisma generate`
3. Update all API routes to use `staffUserId`

### **Issue 2: No Data Showing in UI**

**Symptom:** Dashboard is empty

**Causes:**
- No performance_metrics records in database
- Wrong staffUserId being queried
- API returning empty array

**Fix:**
1. Check database with SQL queries above
2. Create test data using INSERT statements
3. Verify API endpoint returns data (browser DevTools Network tab)

### **Issue 3: API Returns 401 Unauthorized**

**Symptom:** API call fails with 401

**Cause:** Authentication issue

**Fix:**
1. Verify user is logged in
2. Check `session.user.id` is valid
3. Ensure user is a staff user (not client/admin)

### **Issue 4: API Returns 500 Error**

**Symptom:** API call fails with 500

**Causes:**
- Prisma validation error (wrong field names)
- Database connection issue
- Type mismatch

**Fix:**
1. Check terminal for exact error
2. Look for Prisma errors about fields
3. Verify Prisma schema matches database

### **Issue 5: Productivity Score Always 0**

**Symptom:** All scores show 0%

**Causes:**
- All metrics are 0 in database
- Calculation logic broken
- productivityScore not being calculated

**Fix:**
1. Check database values: `SELECT * FROM performance_metrics;`
2. Verify calculation function exists
3. Ensure `productivityScore` is being set on create/update

---

## ✅ SUCCESS CRITERIA

**You're done when:**

1. ✅ **Database Check:**
   - `performance_metrics` table exists
   - Has correct schema with `staffUserId` field
   - Has test data for at least one staff user

2. ✅ **API Check:**
   - `GET /api/performance` returns 200 OK
   - Returns array of metrics
   - Returns today's metric (or null if none)
   - `POST /api/performance` creates/updates metrics

3. ✅ **UI Check:**
   - Staff can view their performance dashboard
   - Shows productivity score with color coding
   - Displays all metrics (mouse, keyboard, time, etc.)
   - No console errors
   - Loading and empty states work

4. ✅ **Client Monitoring Check:**
   - Client can view assigned staff metrics
   - Shows summary stats (total staff, avg productivity)
   - Grid displays all staff cards
   - Clicking card shows detailed dialog

5. ✅ **Data Flow Check:**
   - Can create new metric via POST
   - New metric appears in GET response
   - UI updates after creating metric
   - Productivity score calculates correctly

---

## 📝 REPORTING BACK

**When you're done, create a summary document with:**

1. **What you fixed:**
   - List of files changed
   - What was wrong and how you fixed it

2. **Test results:**
   - Screenshots of working dashboard
   - Sample API responses
   - Database query results

3. **Known issues (if any):**
   - Things that still don't work
   - Blockers you encountered

4. **Next steps:**
   - What should be done next
   - Electron app integration (future)

---

## 🚀 NEXT PHASE (AFTER THIS WORKS)

Once basic performance tracking works, we can add:

1. **Electron App Integration:**
   - Real-time tracking from desktop app
   - Automatic metric sync
   - Background tracking

2. **Enhanced Analytics:**
   - Weekly/monthly trends
   - Comparison charts
   - Goal setting

3. **Notifications:**
   - Low productivity alerts
   - Daily summary emails
   - Achievement badges

4. **Admin Analytics:**
   - Team productivity reports
   - Comparative analysis
   - Export to CSV/PDF

---

## 💡 TIPS

- **Start with database:** Make sure data exists before testing UI
- **Test API first:** Use browser DevTools or Postman
- **Check terminal:** Prisma errors show up in server logs
- **Use SQL:** Direct database queries help debug
- **Ask questions:** If stuck, document what's not working

---

**Good luck, Kyle! This is a critical system. Take your time and test thoroughly.** 🔥

**Questions? Check the docs linked above or ask Stephen/team for help!**

