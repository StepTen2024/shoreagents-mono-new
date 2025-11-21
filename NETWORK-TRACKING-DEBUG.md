# 🚨 NETWORK TRACKING DEBUG GUIDE

## The Problem
- Lovell uploaded 5 files and downloaded 8 files
- Admin Analytics shows: **0 downloads, 0 uploads, 0 bandwidth**
- Data not in Supabase database either

## The Implementation Status

✅ **Code EXISTS:**
- `electron/services/networkTracker.js` ✅ CREATED
- Integration in `electron/main.js` ✅ DONE
- `performanceTracker.getMetricsForAPI()` ✅ INCLUDES network metrics
- Database columns `downloads`, `uploads`, `bandwidth` ✅ EXIST

❌ **BUT: Data NOT Being Saved!**

---

## 🔍 DEBUG STEPS

### Step 1: Check Electron Console Logs

**WHERE TO LOOK:**
- Staff must be using the **Electron Desktop App** (not web browser)
- Open the Electron app
- Go to the Electron app menu → `View` → `Toggle Developer Tools`
- Look at the **Console tab**

**WHAT TO LOOK FOR:**

1. **Is Network Tracker Starting?**
   ```
   ✅ GOOD: [NetworkTracker] Starting network tracking...
   ✅ GOOD: [NetworkTracker] Download tracking enabled
   ✅ GOOD: [NetworkTracker] Bandwidth tracking enabled
   ✅ GOOD: [Main] Network tracking started (downloads, uploads, bandwidth)
   ```
   
   ```
   ❌ BAD: No mention of "[NetworkTracker]" at all
   ```

2. **Is Network Activity Being Detected?**
   ```
   ✅ GOOD: [NetworkTracker] 📥 Download started: filename.pdf
   ✅ GOOD: [NetworkTracker] ✅ Download completed: filename.pdf (1.5 MB)
   ✅ GOOD: [NetworkTracker] 📤 Upload detected: POST to example.com (2.3 MB)
   ```
   
   ```
   ❌ BAD: No download/upload logs even after downloading files
   ```

3. **Are Metrics Being Synced?**
   ```
   ✅ GOOD: [PerformanceTracker] 📥 Downloads: 8 ✅
   ✅ GOOD: [PerformanceTracker] 📤 Uploads: 5 ✅
   ✅ GOOD: [PerformanceTracker] 📊 Bandwidth: 15.3 MB ✅
   ✅ GOOD: [SyncService] Sync successful
   ```
   
   ```
   ❌ BAD: [PerformanceTracker] 📥 Downloads: 0 ⚠️ ZERO
   ❌ BAD: [PerformanceTracker] 📤 Uploads: 0 ⚠️ ZERO
   ❌ BAD: [PerformanceTracker] 📊 Bandwidth: 0 Bytes ⚠️ ZERO
   ```

---

### Step 2: Test Network Tracking

**TEST DOWNLOADS:**
1. While Electron app is open and clocked in
2. Download a file (any file from the internet)
3. Check console immediately - should see:
   ```
   [NetworkTracker] 📥 Download started: filename.pdf
   [NetworkTracker] ✅ Download completed: filename.pdf (1.5 MB)
   ```

**TEST UPLOADS:**
1. While Electron app is open and clocked in
2. Upload a large file (> 10KB) to any website
3. Check console immediately - should see:
   ```
   [NetworkTracker] 📤 Upload detected: POST to hostname (2.3 MB)
   ```

---

### Step 3: Check if Tracking is Disabled

**POSSIBLE CAUSE: Tracking Only Works for Staff Portal**

The code has a check: `shouldDisableTracking()`

If Lovell is on the **Client Portal** or **Admin Portal** instead of **Staff Portal**, tracking is **DISABLED!**

**CHECK THE URL IN ELECTRON APP:**
```
✅ GOOD: http://localhost:3000/dashboard (Staff Portal)
✅ GOOD: http://localhost:3000/time-tracking (Staff Portal)
❌ BAD: http://localhost:3000/client/... (Client Portal - NO TRACKING)
❌ BAD: http://localhost:3000/admin/... (Admin Portal - NO TRACKING)
```

---

### Step 4: Check Database

**VERIFY DATA IN SUPABASE:**

1. Go to Supabase → `performance_metrics` table
2. Find Lovell's latest record: `WHERE "staffUserId" = 'lovell-id' ORDER BY date DESC LIMIT 1`
3. Check columns:
   - `downloads` - should be > 0
   - `uploads` - should be > 0
   - `bandwidth` - should be > 0

**IF ALL ARE 0:**
- Network tracking is NOT working in Electron app
- OR data is not being synced from Electron to database

---

## 🔧 MOST LIKELY ISSUES

### Issue #1: Lovell Using Web Browser (Not Electron App)
**SYMPTOM:** No network tracking logs at all
**FIX:** Lovell must use the **Electron Desktop App**, not web browser
**WHY:** Network tracking (`session.defaultSession.webRequest`) only works in Electron, not browsers

### Issue #2: Lovell on Wrong Portal (Client/Admin)
**SYMPTOM:** Tracking shows "disabled" or no logs
**FIX:** Lovell must use **Staff Portal** (`/dashboard`, `/time-tracking`)
**WHY:** Code checks URL and disables tracking for client/admin portals

### Issue #3: Network Tracker Not Starting
**SYMPTOM:** No `[NetworkTracker]` logs in console
**FIX:** Check if `initializeTracking()` is being called in `main.js`
**WHY:** Network tracker needs to be explicitly started

### Issue #4: Session/Permissions Issue
**SYMPTOM:** `[NetworkTracker]` starts but no downloads/uploads detected
**FIX:** Check Electron app has permission to intercept network requests
**WHY:** Some systems block Electron's `webRequest` API

---

## 📋 ACTION ITEMS FOR USER

**IMMEDIATE:**
1. **Confirm:** Is Lovell using the **Electron Desktop App** or **Web Browser**?
2. **Confirm:** Is Lovell on the **Staff Portal** URL?
3. **Check:** Open Electron DevTools → Console → Search for `[NetworkTracker]`
4. **Test:** Download a file → Check if `📥 Download started` appears in console

**NEXT:**
- Send me a screenshot of the Electron console
- Tell me what URL Lovell is on in the Electron app
- Tell me if any `[NetworkTracker]` logs appear

---

## 🚀 IF EVERYTHING WORKS IN ELECTRON

**If console shows:**
```
✅ [NetworkTracker] 📥 Download completed: file.pdf (1.5 MB)
✅ [NetworkTracker] Total downloads: 8, Bandwidth: 15.3 MB
✅ [SyncService] Sync successful
```

**But Admin Analytics shows 0:**
- Then the issue is in the **Admin UI or API**, not Electron
- We need to check `app/api/admin/staff-analytics/[staffUserId]/route.ts`
- And ensure it's reading `downloads`, `uploads`, `bandwidth` from database

---

## 🎯 EXPECTED BEHAVIOR

**When Staff Downloads a File:**
1. Electron `session.defaultSession.on('will-download')` fires
2. NetworkTracker increments `downloads` counter
3. NetworkTracker adds file size to `bandwidth`
4. PerformanceTracker includes these in `getMetricsForAPI()`
5. SyncService sends delta to `/api/analytics`
6. API saves to `performance_metrics` table
7. Admin Analytics reads from `performance_metrics` table
8. Admin sees real numbers in UI

**Currently Happening:**
- Step 1-4: UNKNOWN (need to check Electron console)
- Step 5-6: UNKNOWN (need to check API logs)
- Step 7-8: Admin sees 0 ❌

---

## 📞 NEXT STEPS

**USER: Please check and report back:**
1. Is Lovell using Electron app or web browser?
2. What URL is shown in Lovell's Electron app?
3. What do you see in Electron console when you search for "NetworkTracker"?
4. Download a test file - do you see any logs?

**THEN:** I can pinpoint the exact issue and fix it.

---

Generated: November 20, 2025

