# 🔍 **TRACKING DIAGNOSTIC GUIDE**

**Purpose:** Identify exactly what's working and what's broken in staff tracking  
**Last Updated:** November 7, 2025

---

## 📸 **WHAT TO SCREENSHOT**

On the staff PC, open **Electron DevTools** (View → Toggle Developer Tools → Console tab) and take screenshots of these logs:

---

## 🎯 **1. STARTUP LOGS (First 5 seconds after clock-in)**

Look for these messages:

```
🎯 [ActivityTracker] Setting up uIOhook event listeners...
   ✅ Mouse movement listener registered
   ✅ Mouse click listeners registered
   ✅ Mouse wheel listener registered
   ✅ Keyboard listeners registered (keydown + keyup)
🚀 [ActivityTracker] Starting uIOhook...
✅ [ActivityTracker] uIOhook started successfully - NOW TRACKING INPUT!
✅ [ActivityTracker] Inactivity checker started
```

**✅ GOOD:** All listeners registered  
**❌ BAD:** Error messages or missing registrations

---

## ⌨️ **2. KEYSTROKE DETECTION (While typing)**

As soon as staff types, you should see:

```
⌨️  [ActivityTracker] RAW keydown event received! Keycode: 65
⌨️  [ActivityTracker] KEYSTROKE DETECTED! Total: 1 ✅
⌨️  [ActivityTracker] RAW keydown event received! Keycode: 83
⌨️  [ActivityTracker] KEYSTROKE DETECTED! Total: 2 ✅
```

**✅ GOOD:** Logs appear with every keystroke  
**❌ BAD:** No logs when typing = **KEYSTROKES NOT TRACKED**

---

## 🖱️ **3. MOUSE CLICK DETECTION (When clicking)**

Every mouse click should log:

```
🖱️  [ActivityTracker] Mouse click detected! Total: 5 ✅
```

**✅ GOOD:** Logs appear with every click  
**❌ BAD:** No logs when clicking = **MOUSE CLICKS NOT TRACKED**

---

## 🔍 **4. 5-SECOND STATUS CHECK (Automatic)**

After 5 seconds of clock-in, look for:

```
═══════════════════════════════════════════════════════
🔍 [ActivityTracker] 5-SECOND STATUS CHECK
═══════════════════════════════════════════════════════
Is Tracking: ✅ YES
Performance Tracker Available: ✅ YES
Current Metrics:
  🖱️  Mouse movements: 150
  🖱️  Mouse clicks: 8
  ⌨️  Keystrokes: 23 ✅
═══════════════════════════════════════════════════════
```

**✅ GOOD:** All metrics > 0 after activity  
**❌ BAD:** Keystrokes = 0 = **NOT TRACKING KEYBOARD**

---

## 📊 **5. METRICS SUMMARY (Every 10 seconds)**

Before sending to API, look for:

```
═══════════════════════════════════════════════════════
📊 [PerformanceTracker] METRICS FOR API
═══════════════════════════════════════════════════════
🖱️  Mouse Movements: 210 ✅
🖱️  Mouse Clicks: 30 ✅
⌨️  Keystrokes: 0 ❌ ZERO - NOT TRACKING
✅ Active Time: 0 min (5 sec) ❌ ZERO
😴 Idle Time: 0 min (0 sec) ⚠️ ZERO (expected if active)
🖥️  Screen Time: 0 min (5 sec) ❌ ZERO
🌐 URLs Visited Count: 0 ❌ ZERO
🌐 URLs Array: 0 items ❌ EMPTY ARRAY
📱 Apps Used: 1 apps ✅
   Apps: Slack
🔄 Tab Switches: 10 ⚠️ ZERO
📊 Productivity Score: 0
📋 Clipboard Actions: 0
═══════════════════════════════════════════════════════
```

**SCREENSHOT THIS!** It shows exactly what's working (✅) and what's broken (❌)

---

## 🚀 **6. API SYNC LOGS (Every 10 seconds)**

When sending to server:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 [SyncService] SENDING METRICS TO API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 URL: http://localhost:3000/api/analytics
📊 Metrics Summary:
   🖱️  Mouse: 210 movements, 30 clicks
   ⌨️  Keystrokes: 0
   ✅ Active Time: 0 min
   🖥️  Screen Time: 0 min
   🌐 URLs: 0 count, 0 array items
   📱 Apps: 1 apps
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ [SyncService] Session cookie found, proceeding with sync
✅ [SyncService] Metrics sent successfully! Status: 200
📊 [SyncService] Server confirmed update:
   🖱️  Mouse: 210 movements, 30 clicks
   ⌨️  Keystrokes: 0
   🌐 URLs: 0
```

**✅ GOOD:** Status 200 + server confirmed values  
**❌ BAD:** Status 401/400/500 = API ERROR

---

## 🐛 **COMMON ISSUES & WHAT TO SCREENSHOT**

### **Issue 1: Keystrokes Always 0**

**Screenshot these logs:**
1. ✅ 5-second status check showing keystrokes = 0
2. ❌ No "KEYSTROKE DETECTED" logs when typing
3. ✅ Keyboard listeners registered message

**Possible causes:**
- uIOhook not capturing keyboard (permissions issue)
- Keyboard events not reaching Activity Tracker
- Performance Tracker not receiving updates

---

### **Issue 2: Active Time Always 0**

**Screenshot:**
1. Screen Time value (should match active time)
2. Active Time in metrics summary
3. 5-second status check

**Possible causes:**
- Time not accumulating (always reset)
- Seconds-to-minutes conversion issue
- Performance Tracker paused

---

### **Issue 3: URLs Not Tracking**

**Screenshot:**
1. Apps list (should show Chrome/Edge/Firefox)
2. URLs Visited Count = 0
3. URLs Array = empty

**Possible causes:**
- Browser not detected as active window
- URL extraction failing
- `active-win` module not working

---

### **Issue 4: Screen Time Always 0**

**Screenshot:**
1. Screen Time in metrics summary
2. Active Time in metrics summary
3. 5-second status check

**Possible causes:**
- `updateMetrics()` not running
- Performance Tracker stopped
- Tracking interval not firing

---

## 📋 **WHAT TO SEND BACK**

Take screenshots of:

1. **Startup logs** (first 5 seconds)
2. **5-second status check**
3. **Keystroke detection test** (type something, show if logs appear)
4. **Mouse click test** (click, show if logs appear)
5. **Metrics summary** (with ✅/❌ indicators)
6. **API sync logs** (showing what was sent)

---

## 🔧 **QUICK TESTS**

### **Test 1: Keystroke Tracking**
1. Clock in
2. Open Notepad or any text editor
3. Type: "hello world"
4. Check console for "⌨️ KEYSTROKE DETECTED" logs
5. **Screenshot:** Log output (or lack of logs)

### **Test 2: Mouse Click Tracking**
1. Clock in
2. Click 5 times anywhere
3. Check console for "🖱️ Mouse click detected" logs
4. **Screenshot:** Log output showing click count

### **Test 3: URL Tracking**
1. Clock in
2. Open Chrome
3. Visit 3 websites (e.g., Google, GitHub, Slack)
4. Wait 10 seconds for sync
5. Check "📊 METRICS FOR API" log
6. **Screenshot:** URLs Array section

### **Test 4: Full Sync Check**
1. Do all activity (type, click, browse)
2. Wait 10-15 seconds
3. Find the "🚀 SENDING METRICS TO API" log
4. **Screenshot:** Entire log block showing all metrics

---

## ✅ **EXPECTED GOOD OUTPUT**

After 30 seconds of activity (typing, clicking, browsing), you should see:

```
📊 [PerformanceTracker] METRICS FOR API
═══════════════════════════════════════════════════════
🖱️  Mouse Movements: 350 ✅
🖱️  Mouse Clicks: 45 ✅
⌨️  Keystrokes: 120 ✅
✅ Active Time: 0 min (25 sec) ✅  (converts to 0 min, normal for <60 sec)
😴 Idle Time: 0 min (0 sec) ⚠️ ZERO (expected if active)
🖥️  Screen Time: 0 min (30 sec) ✅
🌐 URLs Visited Count: 3 ✅
🌐 URLs Array: 3 items ✅
   URLs: page:Google, page:GitHub, page:Slack
📱 Apps Used: 2 apps ✅
   Apps: Chrome, Slack
🔄 Tab Switches: 8 ✅
📊 Productivity Score: 65
📋 Clipboard Actions: 2
═══════════════════════════════════════════════════════
```

**All ✅ = WORKING PERFECTLY**

---

## 🚨 **EMERGENCY DEBUG**

If **NOTHING** is being tracked (all zeros):

1. Check if uIOhook started: `✅ uIOhook started successfully - NOW TRACKING INPUT!`
2. Check if Performance Tracker exists: `Performance Tracker Available: ✅ YES`
3. Check if tracking is enabled: `Is Tracking: ✅ YES`
4. Check for errors: Look for any `❌` or `Error` messages

**Screenshot ALL of these checks!**

---

## 📞 **SEND SCREENSHOTS TO**

Send all screenshots showing:
- What has ✅ (working)
- What has ❌ (broken)
- Any error messages

This will help diagnose exactly what's failing without needing direct access to the PC.

---

**Good luck with debugging! 🎉**


