# ⚡ **QUICK TRACKING TEST - 5 MINUTES**

**Use this to verify Electron tracking is 100% working**

---

## 🚀 **STEP 1: Clock In (Wait 10 Seconds)**

1. Clock in as staff
2. **IMMEDIATELY** move mouse and type something
3. **Wait 10 seconds** (important!)
4. **Screenshot the logs** - You'll see 2 reports:

### **Report 1: ActivityTracker (5 seconds)**
```
╔═══════════════════════════════════════════════════════╗
║  🔍 [ActivityTracker] 5-SECOND STATUS CHECK          ║
╚═══════════════════════════════════════════════════════╝
📊 Tracking Status:
   Is Tracking: ✅ YES
   Performance Tracker Available: ✅ YES

📈 Current Metrics (After 5 Seconds):
   🖱️  Mouse movements: 45 ✅
   🖱️  Mouse clicks: 3 ✅
   ⌨️  Keystrokes: 12 ✅ WORKING!
```

### **Report 2: PerformanceTracker (10 seconds)**
```
╔═══════════════════════════════════════════════════════╗
║  🔍 [PerformanceTracker] 10-SECOND VERIFICATION      ║
╚═══════════════════════════════════════════════════════╝
📊 Tracking Status:
   Is Tracking: ✅ YES
   Is Paused: ✅ NOT PAUSED

⚙️  Intervals Status:
   Main Tracking Interval: ✅ Running
   Clipboard Interval: ✅ Running
   App Tracking Interval: ✅ Running

📈 Current Metrics After 10 Seconds:
   🖱️  Mouse movements: 87 ✅
   🖱️  Mouse clicks: 5 ✅
   ⌨️  Keystrokes: 23 ✅ WORKING!
   ✅ Active time: 9.83s ✅
   🖥️  Screen time: 10.01s ✅
   🌐 URLs visited: 0 ⚠️ ZERO - Open browser
   📱 Apps tracked: 1 ✅

🚨 CRITICAL ISSUES:
   ✅ NO ISSUES FOUND - All tracking working!
```

---

## ✅ **WHAT YOU WANT TO SEE (ALL GREEN)**

| Metric | After 10s | Status |
|--------|-----------|--------|
| Is Paused | ✅ NOT PAUSED | MUST be false |
| Main Interval | ✅ Running | MUST be running |
| Mouse movements | 50-200 | MUST have value |
| Mouse clicks | 3-10 | MUST have value |
| **Keystrokes** | **10-50** | **CRITICAL - MUST work** |
| **Active time** | **8-10s** | **CRITICAL - MUST accumulate** |
| **Screen time** | **~10s** | **CRITICAL - MUST accumulate** |
| Apps tracked | 1+ | MUST have value |

---

## 🚨 **IF YOU SEE RED (BROKEN)**

### **Problem: Keystrokes = 0 ❌**

**Cause:** macOS Accessibility Permissions NOT granted

**Fix:**
1. System Preferences → Security & Privacy
2. Privacy tab → Accessibility (left sidebar)
3. Click lock icon (enter password)
4. Add Electron app to list (or check the box if already there)
5. **Restart Electron completely**
6. Try again

---

### **Problem: Active Time = 0 ❌**

**Cause:** Performance Tracker paused OR intervals not running

**Check logs for:**
```
Is Paused: ❌ PAUSED - FIX THIS!
```

**OR:**
```
Main Tracking Interval: ❌ NOT RUNNING
```

**Fix:** This is a code bug - send screenshot to developer

---

### **Problem: Screen Time = 0 ❌**

**Cause:** Same as Active Time (updateMetrics() not running)

**Fix:** Same as Active Time - send screenshot

---

### **Problem: URLs = 0 ⚠️**

**Cause:** Not necessarily broken - just no browser opened yet

**Test:**
1. Open Chrome/Edge/Brave/Firefox
2. Visit a few websites
3. Wait 2 seconds
4. Check logs - should see:
```
[PerformanceTracker] URL visited: page:Google
🌐 URLs visited: 1 ✅
```

**If still 0:** App tracking interval not running - send screenshot

---

## 📸 **STEP 2: Screenshot After 10 Seconds**

**Take screenshot showing:**
- ✅ Both verification reports (5s + 10s)
- ✅ All green checkmarks OR
- ❌ Any red X marks with issue descriptions

**Send to developer if ANY red X appears**

---

## ⏱️ **STEP 3: Test For 5 Minutes**

1. Continue working (type, click, browse)
2. After 5 minutes, check database
3. **Expected values:**

```sql
mouseMovements: 500-2000     ✅
mouseClicks: 50-200          ✅
keystrokes: 200-1000         ✅ (CRITICAL)
activeTime: 4-5 min          ✅ (CRITICAL)
screenTime: 5 min            ✅ (CRITICAL)
urlsVisited: 3-10            ✅ (if browsed)
applicationsused: ["App1", "App2"]  ✅
```

---

## 🎯 **PASS/FAIL CRITERIA**

### **✅ PASS = Ready for Production**
- All 10-second checks green ✅
- Keystrokes > 0 ✅
- Active time > 0 ✅
- Screen time > 0 ✅
- Database values after 5 minutes look correct ✅

### **❌ FAIL = Needs Fix**
- Any 10-second check shows red ❌
- Keystrokes = 0 (permissions issue)
- Active time = 0 (code bug)
- Screen time = 0 (code bug)

---

## 🔧 **MOST COMMON ISSUE: ACCESSIBILITY PERMISSIONS**

**90% of failures are due to missing permissions!**

**macOS Steps:**
1. Open System Preferences
2. Click "Security & Privacy"
3. Click "Privacy" tab
4. Select "Accessibility" from left list
5. Click lock icon (bottom left)
6. Enter your password
7. Look for your Electron app in the list
8. If not there: Click "+" button and add it
9. If there but unchecked: Check the box
10. **RESTART ELECTRON APP COMPLETELY**

**After restart:**
- Wait 10 seconds
- Keystrokes should now show > 0 ✅

---

## 📊 **SUMMARY CHECKLIST**

### **Before Starting:**
- [ ] Accessibility permissions granted
- [ ] Electron app restarted after permission grant

### **After Clock-In (10 seconds):**
- [ ] See 5-second verification log
- [ ] See 10-second verification log
- [ ] All checkmarks are green ✅
- [ ] NO red X marks ❌

### **After 5 Minutes:**
- [ ] Database has keystrokes > 0
- [ ] Database has activeTime > 0
- [ ] Database has screenTime > 0
- [ ] Database has mouse activity

### **Result:**
- [ ] ✅ **ALL PASS** → Deploy to production!
- [ ] ❌ **ANY FAIL** → Screenshot logs and report issue

---

**Use this guide for every test! 5 minutes = instant feedback!** 🚀

