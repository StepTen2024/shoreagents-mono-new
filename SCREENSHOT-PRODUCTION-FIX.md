# 📸 Screenshot Production Fix

## Problem
Screenshots were working in local development but **NOT in the built Electron installer**. The app would capture screenshots but fail to upload them to the server.

## Root Cause
The screenshot service was relying **only on session cookies** for authentication, which can be unreliable in packaged Electron apps due to:
1. Cookie domain/path restrictions
2. Secure cookie flags (`__Secure-` prefix)
3. Cookie serialization issues in production builds

## Solution ✅

Updated the screenshot service to use **direct `staffUserId` authentication** instead of relying solely on session cookies.

### Changes Made

#### 1. Added Staff User ID Storage
```javascript
class ScreenshotService {
  constructor() {
    this.staffUserId = null // NEW: Store staff user ID
    // ... other properties
  }
}
```

#### 2. Fetch Staff User ID on Service Start
```javascript
async fetchStaffUserId() {
  // Calls GET /api/staff/profile with session token
  // Extracts and stores staffUserId from response
}
```

#### 3. Send Staff User ID with Screenshots
```javascript
// In uploadScreenshot()
formData.append('staffUserId', this.staffUserId)
```

#### 4. Enhanced Logging
Added comprehensive logging to debug production issues:
- API URL being used (localhost vs production)
- Staff user ID fetch status
- Upload URL and authentication method
- Session token presence

### How It Works Now

**Before (Cookie-only):**
```
Screenshot Upload → API checks session cookie → Fails in production ❌
```

**After (Direct Auth):**
```
1. Service starts → Fetch staffUserId using session token
2. Screenshot Upload → Send staffUserId in form data
3. API checks staffUserId field first (more reliable) ✅
4. Falls back to session cookie if no staffUserId
```

## API Support

The `/api/screenshots` endpoint already supported `staffUserId` parameter:

```typescript
// app/api/screenshots/route.ts (lines 21-26)
if (staffUserId) {
  // If staffUserId is provided directly (from Electron app), use it
  staffUser = await prisma.staff_users.findUnique({
    where: { id: staffUserId }
  })
}
```

## Testing

### Local Development Test
1. Start dev server: `npm run dev`
2. Run Electron app: `npm run electron-dev`
3. Check console logs:
   - `[ScreenshotService] ✅ Staff user ID fetched: xxx`
   - `[Screenshots API] Sending with staffUserId: xxx`

### Production Build Test
1. Build the app: `npm run build && npm run electron-build`
2. Install and run: `dist/ShoreAgentsAI-Setup-1.0.x.exe`
3. Login as staff user
4. Check console logs (F12 or View → Toggle Developer Tools)
5. Look for:
   ```
   [ScreenshotService] API URL (after): https://shoreagents-mono-new-production.up.railway.app
   [ScreenshotService] ✅ Staff user ID fetched: xxx
   [Screenshots API] Full upload URL: https://...
   [Screenshots API] Sending with staffUserId: xxx
   [Screenshots API] ✅ Upload successful: screenshot_primary_xxx.jpg
   ```

### Verify in Supabase
1. Go to Supabase Storage → `staff` bucket
2. Check `staff_screenshot/{staffUserId}/` folder
3. Screenshots should appear with timestamps

## Storage Location

Screenshots are saved to **Supabase Cloud Storage**:
- **Bucket**: `staff`
- **Path**: `staff_screenshot/{staffUserId}/{timestamp}_{display}.jpg`
- **No local storage** - all screenshots are uploaded directly

### Example Paths:
```
staff/staff_screenshot/user-123/screenshot_primary_1731600000000.jpg
staff/staff_screenshot/user-123/screenshot_secondary_1_1731600000000.jpg
```

## Configuration

The API URL is automatically determined:

**Development** (`electron/config/trackerConfig.js`):
```javascript
http://localhost:3000
```

**Production** (`electron/config/trackerConfig.js`):
```javascript
https://shoreagents-mono-new-production.up.railway.app
```

## Logging Reference

### Success Logs
```
[ScreenshotService] Starting screenshot capture service
[ScreenshotService] Fetching staff user ID from API...
[ScreenshotService] ✅ Staff user ID fetched: clxxx...
[ScreenshotService] 📸 Capturing initial screenshot...
[ScreenshotService] Captured display 0 (primary): 65.3 KB (960x540)
[Screenshots API] Full upload URL: https://shoreagents-mono-new-production.up.railway.app/api/screenshots
[Screenshots API] Sending with staffUserId: clxxx...
[Screenshots API] Response status: 200
[Screenshots API] ✅ Upload successful: screenshot_primary_1731600000000.jpg (saved 65.3 KB)
```

### Error Logs to Watch For
```
❌ [ScreenshotService] Failed to fetch staff user ID: 401
   → Session token invalid or expired

❌ [Screenshots API] No staffUserId - will rely on session cookie
   → Staff ID fetch failed, falling back to cookies

❌ [Screenshots API] Upload failed: 401
   → Both staffUserId and session cookie failed

❌ [Screenshots API] Upload failed: 404
   → Staff user not found in database
```

## Troubleshooting

### Screenshots Not Uploading in Production

1. **Check API URL**:
   ```
   Look for: [ScreenshotService] API URL (after): https://...
   Should NOT be: http://localhost:3000
   ```

2. **Check Staff User ID**:
   ```
   Look for: [ScreenshotService] ✅ Staff user ID fetched: clxxx...
   If missing: Session authentication failed
   ```

3. **Check Upload Logs**:
   ```
   Look for: [Screenshots API] Response status: 200
   If 401: Authentication failed
   If 404: Staff user not found
   If 500: Server error (check Railway logs)
   ```

4. **Verify Network Connection**:
   - Ensure app can reach Railway server
   - Check firewall settings
   - Test API endpoint manually

## Files Modified

- `electron/services/screenshotService.js` - Main fix implementation

## Next Steps

After rebuilding and distributing the new installer:
1. ✅ Screenshots should work in production
2. ✅ More reliable authentication
3. ✅ Better debugging with enhanced logs
4. ✅ Automatic fallback to cookies if needed

## Version
Fixed in: v1.0.2 (pending)
Last updated: Nov 14, 2024

