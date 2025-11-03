# LINEAR TASK CREATED: KYLE - PERFORMANCE TRACKING

## Task Details:
- **Task ID:** SHO-32
- **Title:** 🔧 Fix & Test Performance Tracking System
- **URL:** https://linear.app/shoreagents/issue/SHO-32/fix-and-test-performance-tracking-system
- **Assigned To:** Kyle
- **Status:** To Do
- **Priority:** 1 (High)
- **Project:** ShoreAgents Software
- **Team:** ShoreAgents
- **Created:** October 15, 2025

---

## Task Summary:

**Mission:** Make the Performance Tracking system 100% working for staff members.

**Critical Issue:** Database uses `staffUserId` but code might use `userId` (schema mismatch)

**Estimated Time:** 1-2 hours

---

## What Kyle Needs to Do:

### 1. **Check Schema** (5 min)
- Open `prisma/schema.prisma`
- Find `PerformanceMetric` model
- Verify uses `staffUserId` not `userId`
- Run `pnpm prisma generate`

### 2. **Check API Routes** (15 min)
- `app/api/performance/route.ts`
- `app/api/client/monitoring/route.ts`
- `app/api/admin/performance/route.ts`
- Replace any `userId` with `staffUserId`

### 3. **Create Test Data** (10 min)
- Use Supabase SQL Editor
- Get Freddy Mercury's ID
- Insert test performance metrics

### 4. **Test API** (10 min)
- Login as staff
- Check `/api/performance` returns data
- Verify 200 OK response

### 5. **Test UI** (15 min)
- Visit `/performance`
- Check dashboard displays
- Verify all metrics show

### 6. **Test Client View** (10 min)
- Login as admin
- Visit `/client/monitoring`
- Check staff cards display

---

## Documentation in Repo:

1. **`KYLE-TASK-SUMMARY.md`** - Quick 2-page brief
2. **`KYLE-TASK-PERFORMANCE-TRACKING.md`** - Full 31-page details
3. **`CLIENT-MONITORING-COMPLETE.md`** - Reference docs

---

## Database Table:

```sql
performance_metrics
├── staffUserId (FK to staff_users) ← CRITICAL FIELD
├── date
├── mouseMovements, mouseClicks, keystrokes
├── activeTime, idleTime, screenTime
├── downloads, uploads, bandwidth
├── clipboardActions, filesAccessed, urlsVisited, tabsSwitched
└── productivityScore
```

---

## API Endpoints:

1. **`/api/performance`** - Staff view their own metrics
2. **`/api/client/monitoring`** - Clients view staff metrics
3. **`/api/admin/performance`** - Admin view all metrics

---

## Success Criteria:

- ✅ Schema uses `staffUserId` consistently
- ✅ All API routes use `staffUserId`
- ✅ Test data in database
- ✅ API returns 200 OK with data
- ✅ UI displays metrics correctly
- ✅ No console errors
- ✅ Client monitoring works

---

## When Complete:

**Kyle should:**
1. Create short report (what fixed, test results, issues)
2. Ping Stephen
3. Update Linear task status

---

**Branch:** `full-stack-StepTen`  
**Server:** Running on http://localhost:3000  
**Linear Task:** https://linear.app/shoreagents/issue/SHO-32

