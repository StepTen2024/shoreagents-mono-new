# 🔍 Screenshot Debugging Guide for Production/Installer

## 🎯 What Changed

Added **comprehensive logging** to the screenshot service AND **automatic file logging** to debug the production installer.

## 📂 How to Access the Log File

### **Method 1: Open from Browser Console** (Easiest!)

1. Open the installed app
2. Press `Ctrl+Shift+I` to open Developer Tools
3. In the Console tab, run:
```javascript
window.electron.debug.openLogFile()
```
4. The log file will open in your default text editor!

### **Method 2: Get the Log File Path**

In the browser console, run:
```javascript
window.electron.debug.getLogFilePath()
```

This will show you the path, typically:
```
C:\Users\YourName\AppData\Roaming\your-app-name\screenshot-debug.log
```

### **Method 3: Manual Location**

Navigate to:
```
%APPDATA%\your-app-name\screenshot-debug.log
```

---

## 📝 What to Look For in the Log File

The log file contains **ALL console output** from the Electron app with timestamps. Look for these key sections:

### 1. **Service Start** (Should appear when app launches)

```
[ScreenshotService] ============================================
[ScreenshotService] 🚀 STARTING SCREENSHOT SERVICE
[ScreenshotService] API URL: https://shoreagents.ai  ← MUST be production URL!
[ScreenshotService] Has Session Token: true/false
[ScreenshotService] Environment: production
[ScreenshotService] ============================================
```

**✅ What to Check:**
- API URL should be `https://shoreagents.ai` (NOT `http://localhost:3000`)
- Environment should be `production`

---

### 2. **Staff User ID Fetch** (Should appear after login)

```
[ScreenshotService] ============================================
[ScreenshotService] 🔑 Fetching Staff User ID
[ScreenshotService] URL: https://shoreagents.ai/api/staff/profile
[ScreenshotService] Session Token: xxxxxxxxxxxx...
[ScreenshotService] ============================================
[ScreenshotService] Profile API Response Status: 200
[ScreenshotService] ============================================
[ScreenshotService] ✅ STAFF USER ID FETCHED SUCCESSFULLY
[ScreenshotService] Staff User ID: <your-id>
[ScreenshotService] Staff Name: <your-name>
[ScreenshotService] ============================================
```

**✅ What to Check:**
- Response status should be `200`
- Staff User ID should be present
- If you see `❌ Failed to fetch staff user ID`, check:
  - Is the session cookie being sent correctly?
  - Is the `/api/staff/profile` endpoint working in production?
  - Are there any CORS or authentication issues?

---

### 3. **Screenshot Upload** (Should appear every 1 minute)

```
[Screenshots API] ============================================
[Screenshots API] 📤 UPLOAD ATTEMPT
[Screenshots API] URL: https://shoreagents.ai/api/screenshots
[Screenshots API] File: screenshot_primary_1234567890.jpg
[Screenshots API] Size: 45.2 KB
[Screenshots API] Has Session Token: true
[Screenshots API] Has Staff User ID: true
[Screenshots API] Staff User ID: <your-id>
[Screenshots API] ============================================
[Screenshots API] ✅ Including staffUserId in request
[Screenshots API] 📥 Response received - Status: 200
[Screenshots API] ✅ SUCCESS - screenshot_primary_1234567890.jpg uploaded (45.2 KB)
```

**✅ What to Check:**
- URL should be `https://shoreagents.ai/api/screenshots`
- `Has Staff User ID` should be `true`
- Response status should be `200`

---

### 4. **Common Error Patterns**

#### ❌ Network Error
```
[Screenshots API] ============================================
[Screenshots API] ❌ REQUEST ERROR
[Screenshots API] Error type: <error-type>
[Screenshots API] Error message: <error-message>
[Screenshots API] Error code: <error-code>
[Screenshots API] ============================================
```

**Possible causes:**
- SSL certificate issues
- Network connectivity problems
- Firewall blocking requests
- DNS resolution failures

#### ❌ Authentication Error (401/403)
```
[Screenshots API] ============================================
[Screenshots API] ❌ UPLOAD FAILED
[Screenshots API] Status Code: 401 or 403
[Screenshots API] Response Body: { "error": "Unauthorized" }
[Screenshots API] ============================================
```

**Possible causes:**
- Session token expired or invalid
- Staff User ID not found in database
- API authentication middleware blocking request

#### ❌ Server Error (500)
```
[Screenshots API] ============================================
[Screenshots API] ❌ UPLOAD FAILED
[Screenshots API] Status Code: 500
[Screenshots API] Response Body: { "error": "Internal server error" }
[Screenshots API] ============================================
```

**Possible causes:**
- Supabase service role key not set in production
- Database connection issues
- Supabase storage bucket not configured

---

## 🧪 Testing Steps

1. **Build the installer:**
   ```bash
   npm run electron-build
   ```

2. **Install and run the app**

3. **Login with your credentials**

4. **Open Developer Tools:**
   - Press `Ctrl+Shift+I` (Windows/Linux)
   - Look at the Console tab

5. **Watch for the log patterns above**

6. **Take a screenshot of any errors** and share them

---

## 🔑 Key Things to Verify

1. ✅ **API URL is correct**: `https://shoreagents.ai` (not localhost)
2. ✅ **Staff User ID is fetched**: Check the fetch logs after login
3. ✅ **Upload attempts are being made**: Should happen every 60 seconds
4. ✅ **Response status is 200**: Check upload response logs
5. ✅ **No network errors**: Check for `REQUEST ERROR` logs

---

## 🚨 If Screenshots Still Don't Work

Share these specific logs:
1. The **Service Start** log (to verify API URL)
2. The **Staff User ID Fetch** log (to verify authentication)
3. The **Screenshot Upload** log (to verify request/response)
4. Any **error logs** with the full error message

This will help pinpoint exactly where the issue is occurring!

