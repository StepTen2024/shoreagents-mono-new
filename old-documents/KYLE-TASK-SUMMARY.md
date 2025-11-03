# 📋 KYLE'S TASK - QUICK BRIEF

**Task:** Fix & Test Performance Tracking System  
**Priority:** HIGH  
**Doc:** `KYLE-TASK-PERFORMANCE-TRACKING.md` (full details)

---

## 🎯 WHAT YOU NEED TO DO:

**Make the Performance Tracking system work for staff members.**

Right now:
- ❌ Might have schema mismatch (`userId` vs `staffUserId`)
- ❌ Unclear if data is being captured
- ❌ UI might not display metrics correctly
- ❌ Need to test entire flow

---

## 🚨 CRITICAL ISSUE TO FIX:

### **Database vs Code Mismatch:**

**Database uses:** `staffUserId`
**Code might use:** `userId`

**You need to:**
1. Check `prisma/schema.prisma` - ensure it uses `staffUserId`
2. Check all API routes - ensure they use `staffUserId`
3. Run `pnpm prisma generate` after any schema changes

---

## 📊 THE SYSTEM:

### **Database Table:**
```
performance_metrics
├── staffUserId (FK to staff_users)
├── date
├── mouseMovements, mouseClicks, keystrokes
├── activeTime, idleTime, screenTime
├── downloads, uploads, bandwidth
├── clipboardActions, filesAccessed, urlsVisited, tabsSwitched
└── productivityScore
```

### **API Routes:**
1. `/api/performance` - Staff view their own metrics
2. `/api/client/monitoring` - Clients view their staff metrics
3. `/api/admin/performance` - Admin view all metrics

### **UI Pages:**
1. `/performance` - Staff performance dashboard
2. `/client/monitoring` - Client monitoring dashboard

---

## ✅ YOUR CHECKLIST:

### **1. Check Schema (5 min)**
- [ ] Open `prisma/schema.prisma`
- [ ] Find `PerformanceMetric` model
- [ ] Verify it uses `staffUserId` (not `userId`)
- [ ] Run `pnpm prisma generate` if you made changes

### **2. Check API Routes (15 min)**
- [ ] `app/api/performance/route.ts` - Check all queries use `staffUserId`
- [ ] `app/api/client/monitoring/route.ts` - Check queries
- [ ] `app/api/admin/performance/route.ts` - Check queries

### **3. Create Test Data (10 min)**
- [ ] Open Supabase SQL Editor
- [ ] Get Freddy Mercury's ID: `SELECT id FROM staff_users WHERE email = 'fred@fred.com'`
- [ ] Run INSERT statements from doc to create test data

### **4. Test API (10 min)**
- [ ] Login as staff (fred@fred.com)
- [ ] Open DevTools → Network tab
- [ ] Visit `/performance`
- [ ] Check if API call succeeds (200 OK)
- [ ] Check response has data

### **5. Test UI (15 min)**
- [ ] Visit `http://localhost:3000/performance`
- [ ] Should see productivity score, metrics, charts
- [ ] Check browser console for errors
- [ ] Try refresh button

### **6. Test Client View (10 min)**
- [ ] Login as admin
- [ ] Visit `/client/monitoring`
- [ ] Should see staff cards with metrics
- [ ] Click card to see detailed dialog

---

## 🐛 COMMON PROBLEMS:

**Problem:** API returns 500 error  
**Solution:** Check terminal logs for Prisma errors. Likely field name mismatch.

**Problem:** No data showing  
**Solution:** Create test data in database (see doc for SQL).

**Problem:** "Column userId does not exist"  
**Solution:** Schema uses `staffUserId`. Fix Prisma schema and regenerate.

---

## 📝 WHEN YOU'RE DONE:

**Create a short report:**

1. **What you fixed** (list files changed)
2. **Test results** (screenshots of working dashboard)
3. **Any issues** (what still doesn't work)

**Ping Stephen when complete!**

---

## 📚 FULL DOCUMENTATION:

**Everything is in:** `KYLE-TASK-PERFORMANCE-TRACKING.md`

- Detailed schema info
- SQL queries to create test data
- Step-by-step testing procedures
- All files to check
- Common issues and solutions

---

**Estimated Time:** 1-2 hours  
**Questions?** Check the full doc or ask Stephen!

**Let's get this working!** 🚀

