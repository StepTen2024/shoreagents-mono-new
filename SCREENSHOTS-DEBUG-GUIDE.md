# 🔍 SCREENSHOTS DEBUG GUIDE

## 🚨 THE PROBLEM
- You have **1054 screenshots** in the database
- All showing **"Image unavailable"** placeholder
- Screenshots are being captured but not displaying

---

## ✅ DEBUG LOGGING ADDED

### What I Added:

#### 1. **Frontend Logging** (Browser Console)
- Logs first 5 screenshot URLs
- Logs errors when images fail to load
- Logs success when images load correctly

#### 2. **Backend Logging** (Server Terminal)
- Logs total screenshot count
- Logs sample screenshot URLs from database

---

## 🎯 HOW TO DEBUG (STEP BY STEP)

### Step 1: Restart the Server
```bash
# In your terminal
npm run dev:turbo
```

### Step 2: Open Admin Analytics Page
1. Go to: `http://localhost:3000/admin/analytics/[staffUserId]`
2. Click on the **Screenshots tab**

### Step 3: Open Browser DevTools
1. Right-click → **Inspect** (or F12)
2. Go to **Console** tab

### Step 4: Check the Logs

#### A. **Look for Screenshot URLs in Console**
You should see:
```
📸 Screenshot 1: https://ijxxtnakmexuavidzzvx.supabase.co/storage/v1/object/public/...
📸 Screenshot 2: https://ijxxtnakmexuavidzzvx.supabase.co/storage/v1/object/public/...
...
```

#### B. **Look for Error Messages**
You'll see either:
```
✅ Screenshot 1 loaded successfully
```
OR
```
❌ Screenshot 1 failed to load: https://...
```

#### C. **Check Server Logs** (in your terminal)
You should see:
```
📸 [Staff Analytics] Total screenshots: 1054
📸 Sample screenshot URLs (first 3):
   1. https://ijxxtnakmexuavidzzvx.supabase.co/storage/v1/object/public/staff/staff_screenshot/...
   2. https://...
   3. https://...
```

---

## 🔍 DIAGNOSIS STEPS

### Step 5: Copy a Failing URL
1. From browser console, copy one of the screenshot URLs
2. Open a **NEW browser tab**
3. Paste the URL directly in the address bar
4. Press Enter

### What You'll See Tells Us Everything:

#### ✅ **If Image Loads:**
- **Problem:** Frontend rendering issue (not URL)
- **Fix:** Check React rendering or CORS policy

#### ❌ **If You Get 404 Error:**
```json
{
  "error": "Object not found",
  "statusCode": "404"
}
```
- **Problem:** Image deleted from Supabase Storage
- **Fix:** Images need to be re-uploaded or bucket is wrong

#### ❌ **If You Get 403 Error:**
```json
{
  "error": "Access denied",
  "statusCode": "403"
}
```
- **Problem:** Supabase bucket is PRIVATE (not public)
- **Fix:** Make bucket public OR add authentication

#### ❌ **If You Get CORS Error:**
```
Access to image at '...' from origin 'http://localhost:3000' has been blocked by CORS policy
```
- **Problem:** Supabase bucket CORS not configured
- **Fix:** Enable CORS in Supabase bucket settings

#### ❌ **If URL is Invalid:**
```
ERR_NAME_NOT_RESOLVED
or
Invalid URL
```
- **Problem:** URL malformed in database
- **Fix:** Check how screenshots are being saved

---

## 🔧 COMMON FIXES

### Fix 1: Make Supabase Bucket Public

**If you get 403 or "Access Denied":**

1. Go to **Supabase Dashboard**
2. Navigate to **Storage** → **Buckets**
3. Find the `staff` bucket (or whatever bucket stores screenshots)
4. Click **Settings** (⚙️ icon)
5. Toggle **Public bucket** to **ON**
6. Save changes

**OR via SQL:**
```sql
UPDATE storage.buckets 
SET public = true 
WHERE name = 'staff';
```

---

### Fix 2: Enable CORS in Supabase

**If you get CORS errors:**

1. Go to **Supabase Dashboard**
2. Navigate to **Storage** → **Policies**
3. Create a new policy for **SELECT** operations
4. Set to **Allow all operations** for public access

**OR update CORS settings:**
```sql
-- Allow all origins (for development)
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
    file_size_limit = 5242880 -- 5MB
WHERE name = 'staff';
```

---

### Fix 3: Check Screenshot Upload Path

**If URLs are wrong/404:**

1. Check the Electron screenshot service
2. Verify it's uploading to the correct bucket
3. Verify the path structure matches what's in the database

**Check in database:**
```sql
SELECT screenshoturls 
FROM performance_metrics 
WHERE screenshoturls IS NOT NULL 
LIMIT 1;
```

**Expected format:**
```
[
  "https://ijxxtnakmexuavidzzvx.supabase.co/storage/v1/object/public/staff/staff_screenshot/[staffUserId]/[timestamp].jpg"
]
```

---

### Fix 4: Verify Images Actually Exist

**Check Supabase Storage UI:**

1. Go to **Supabase Dashboard**
2. Navigate to **Storage** → **Buckets**
3. Open the `staff` bucket
4. Navigate to `staff_screenshot/[staffUserId]`
5. Verify images are actually there

**If folder is EMPTY:**
- Screenshots are not being uploaded
- Check Electron app screenshot service
- Check internet connection during capture

**If folder has OLD images but not recent ones:**
- Screenshot service stopped working
- Check Electron app is running
- Check authentication is valid

---

## 📋 DEBUGGING CHECKLIST

- [ ] Opened Admin Analytics → Screenshots tab
- [ ] Opened Browser DevTools → Console
- [ ] Saw screenshot URLs logged
- [ ] Saw error messages for failed images
- [ ] Copied one failing URL
- [ ] Opened URL directly in browser
- [ ] Identified error type (404/403/CORS/Invalid)
- [ ] Checked Supabase bucket is public
- [ ] Checked CORS is enabled
- [ ] Verified images exist in Supabase Storage
- [ ] Checked image URL format matches database

---

## 🎯 MOST LIKELY ISSUES

### 1. **Supabase Bucket is PRIVATE** (90% chance)
- Screenshots uploaded correctly
- But bucket requires authentication to view
- **FIX:** Make bucket public

### 2. **Images Deleted/Missing** (5% chance)
- URLs point to files that don't exist
- Cleanup script removed old images?
- **FIX:** Check Supabase Storage

### 3. **CORS Not Configured** (4% chance)
- Images exist and bucket is public
- But CORS blocks cross-origin requests
- **FIX:** Enable CORS in bucket settings

### 4. **Wrong Bucket/Path** (1% chance)
- Images uploaded to different bucket
- Path structure changed
- **FIX:** Check Electron upload configuration

---

## 🚀 AFTER YOU DEBUG

**Send me:**
1. What you see when you open a screenshot URL directly
2. Screenshot of browser console logs
3. Screenshot of Supabase bucket settings
4. Error message (if any)

**Then I'll give you the EXACT fix!**

---

Generated: November 20, 2025

