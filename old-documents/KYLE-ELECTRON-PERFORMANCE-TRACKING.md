# 🔥 KYLE'S TASK: Electron Performance Tracking - FINAL FIX & TEST

**ASSIGNED TO:** Kyle  
**TEST PROFILE:** `james@james.com` (Stephen can see this!)  
**PRIORITY:** HIGH  
**DATE:** October 15, 2025

---

## 🎯 YOUR MISSION

Get the **Electron Desktop App** performance tracking working properly and test it on **james@james.com** profile so Stephen can see real data!

---

## ✅ WHAT'S ALREADY DONE (DON'T TOUCH THIS!)

### **26+ API Routes Fixed** ✅
All API routes now use `staffUserId` instead of `userId`:
- ✅ `/api/performance` - GET & POST working
- ✅ `/api/time-tracking/*` - All 4 routes fixed
- ✅ `/api/tasks/[id]` - Fixed
- ✅ All admin routes - Fixed
- ✅ All client routes - Fixed

### **Time Tracking Working** ✅
- Clock In/Out working perfectly
- Status tracking working
- Hours calculation working

### **Performance API Working** ✅
- Syncing to database (201 Created)
- Retrieving data (200 OK)
- NaN bug fixed in frontend

### **Electron App Running** ✅
- Desktop app launches
- Connects to Next.js on port 3000
- Authentication working
- Live sync working

---

## 🚨 THE PROBLEM (WHY YOU'RE NEEDED)

**On Mac (Stephen's machine):**
- ❌ Can't track mouse/keyboard (no Accessibility permissions)
- ❌ Missing native dependencies (`iohook` not built for ARM64)
- ❌ All metrics show zeros
- ❌ Can't verify if tracking actually works

**Your Job:**
- ✅ Test on **Windows** where tracking DOES work
- ✅ Verify mouse, keyboard, URLs, apps are tracked
- ✅ Use **james@james.com** profile for testing
- ✅ Fix any Electron-side bugs you find
- ✅ Document what works/doesn't work

---

## 🔧 SETUP INSTRUCTIONS

### **1. Pull Latest Code**
```bash
cd "/Users/stephenatcheler/Desktop/Electron - Staff/gamified-dashboard (1)"
git pull origin full-stack-StepTen
```

### **2. Install Dependencies**
```bash
pnpm install
```

### **3. Check Environment**
Make sure `.env` has:
```
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=your_supabase_url
```

### **4. Start Next.js Server**
```bash
pnpm dev
```
Wait for: `✓ Ready in XXs`

### **5. Start Electron Desktop App**
```bash
pnpm electron
```

### **6. Login as James**
- **Email:** `james@james.com`
- **Password:** (Get from Stephen or check database)

---

## 🧪 TESTING CHECKLIST

### **Test 1: Performance Tracking**
1. ✅ Open Electron app
2. ✅ Login as `james@james.com`
3. ✅ Go to **Performance** page
4. ✅ Click "Sync Now"
5. ✅ Verify metrics are NOT all zeros:
   - Mouse movements > 0
   - Mouse clicks > 0
   - Keystrokes > 0
   - Active time > 0
6. ✅ Check terminal for sync logs: `[SyncService] Metrics sent successfully: 201`
7. ✅ Check browser/database for data

### **Test 2: Time Tracking**
1. ✅ Go to **Time Tracking** page
2. ✅ Click "Clock In"
3. ✅ Verify timer starts
4. ✅ Wait 5 minutes
5. ✅ Click "Clock Out"
6. ✅ Verify hours calculated correctly

### **Test 3: Real-World Usage**
1. ✅ Leave Electron app running for 30+ minutes
2. ✅ Use your computer normally (browse, code, etc.)
3. ✅ Check Performance page every 10 minutes
4. ✅ Verify metrics are increasing:
   - Mouse movements increasing
   - Keystrokes increasing
   - URLs visited showing up
   - Apps used showing up

### **Test 4: Data Persistence**
1. ✅ Close Electron app
2. ✅ Reopen Electron app
3. ✅ Login as `james@james.com`
4. ✅ Go to Performance page
5. ✅ Verify yesterday's data is still there

---

## 🐛 KNOWN ISSUES (FIX IF YOU ENCOUNTER)

### **Issue 1: `iohook` Not Installing**
**Symptom:** `Cannot find module iohook.node`

**Fix:**
```bash
pnpm remove iohook
pnpm add iohook@0.9.3 --save-optional
pnpm rebuild iohook
```

### **Issue 2: Permissions on Mac**
**Skip this!** Mac can't track without Accessibility permissions. Test on Windows!

### **Issue 3: Port 3000 Already in Use**
```bash
# Kill existing processes
pkill -f "next dev"
pkill -f "pnpm dev"

# Restart
pnpm dev
```

### **Issue 4: Electron Shows Blank Screen**
1. Make sure Next.js server is running first
2. Wait 20 seconds after starting server
3. Then start Electron

---

## 📊 EXPECTED RESULTS

**After 30 minutes of use on Windows:**
- **Mouse Movements:** 5,000+ 
- **Mouse Clicks:** 500+
- **Keystrokes:** 1,000+
- **Active Time:** 25+ minutes
- **Idle Time:** 5 minutes
- **Apps Used:** 3-5 apps
- **URLs Visited:** 10-20 URLs
- **Productivity Score:** 60-85%

**NOT this (Mac results):**
- Mouse Movements: 0
- Mouse Clicks: 0
- Keystrokes: 0
- Everything: 0
- NaN% productivity (this is fixed now)

---

## 🔍 TROUBLESHOOTING

### **No Data Syncing?**
1. Check terminal for: `[SyncService] Metrics sent successfully: 201`
2. If you see `401 Unauthorized`, re-login
3. If you see `500 Error`, check server terminal for stack trace

### **Still Seeing Zeros?**
1. Check Windows permissions for Electron app
2. Make sure `iohook` is installed correctly
3. Check `electron/services/performanceTracker.js` for errors

### **Can't Login as James?**
Ask Stephen for the password or create a new test account.

---

## 📝 WHAT TO DOCUMENT

### **Create a file: `KYLE-TESTING-RESULTS.md`**

Include:
1. **Windows Version:** (e.g., Windows 11)
2. **Test Date & Time:** 
3. **Test Duration:** (e.g., 2 hours)
4. **Metrics Captured:**
   - Mouse movements: XXX
   - Keystrokes: XXX
   - etc.
5. **Screenshots:** Include 2-3 screenshots of Performance page
6. **Bugs Found:** List any issues
7. **Bugs Fixed:** List what you fixed
8. **Status:** ✅ Working / ⚠️ Partial / ❌ Not Working

---

## 🚀 WHEN YOU'RE DONE

1. **Create your results file:** `KYLE-TESTING-RESULTS.md`
2. **Take screenshots** of Performance page with real data
3. **Commit changes:**
   ```bash
   git add .
   git commit -m "Kyle: Performance tracking tested on Windows - [STATUS]"
   git push origin full-stack-StepTen
   ```
4. **Update Linear task** with results
5. **Notify Stephen** - "Oi mate, tracking is working! Check james@james profile!"

---

## 📚 REFERENCE FILES

- **Performance API:** `app/api/performance/route.ts`
- **Performance UI:** `components/performance-dashboard.tsx`
- **Electron Tracker:** `electron/services/performanceTracker.js`
- **Electron Main:** `electron/main.js`
- **Auth Helper:** `lib/auth-helpers.ts`

---

## ⚠️ IMPORTANT REMINDERS

1. **Use james@james.com** - Stephen needs to see this data!
2. **Test on Windows** - Mac can't track properly
3. **Run for 30+ minutes** - Need real usage data
4. **Don't break anything else** - Only fix Electron tracking bugs
5. **Document everything** - Stephen wants proof it works!

---

## 💪 YOU GOT THIS KYLE!

**All the hard API work is done. Your job is to:**
- Verify Electron tracking works on Windows
- Fix any Electron-side bugs
- Prove we can track real staff activity

**Stephen is counting on you!** 🔥

---

## 🆘 NEED HELP?

- Check server logs: Terminal running `pnpm dev`
- Check Electron logs: Terminal running `pnpm electron`
- Check browser console: Open DevTools in Electron window (Cmd+Option+I / F12)
- Ask Stephen if stuck

**Let's fucking go! 🚀**

