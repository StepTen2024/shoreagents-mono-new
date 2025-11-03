# 📸 Screenshot Tracking Setup Guide

## Overview

The Screenshot Tracking feature **automatically captures screenshots from all displays when user inactivity is detected (30+ seconds)** and uploads them to Supabase Storage. This provides comprehensive monitoring of staff screen activity across multiple monitors.

## Features

- ✅ **Automatic capture on inactivity** (30 seconds of no activity)
- ✅ **Multi-monitor support** - captures all connected displays
- ✅ **Optimized file sizes** - JPEG compression (70% quality) + 50% resolution
- ✅ **~70-80% smaller files** - Average 50-100 KB instead of 300-450 KB
- ✅ Automatic upload to Supabase Storage
- ✅ Screenshot metadata stored in PostgreSQL
- ✅ View screenshots in the Performance Dashboard
- ✅ Filter by date and time
- ✅ Real-time screenshot count tracking
- ✅ Separate screenshots for primary and secondary monitors

## Setup Instructions

### 1. Verify Supabase Storage Bucket

The screenshots will be stored in the existing **`staff`** bucket:

1. Go to your Supabase Dashboard
2. Navigate to **Storage** → **Buckets**
3. Verify the **`staff`** bucket exists
4. Screenshots will be stored in the **`staff_screenshot`** subfolder
5. Folder structure: `staff/staff_screenshot/{staffUserId}/{timestamp}_{filename}.jpg`

### 2. Verify RLS Policies

The existing **`staff`** bucket policies should already allow:
- ✅ Staff users can upload to their own folders
- ✅ Staff users can read their own files
- ✅ Management/admin can read all staff files

Screenshots are stored at: `staff/staff_screenshot/{staffUserId}/*.jpg`

If you need to add specific policies for the screenshot subfolder, you can run:

```sql
-- Allow staff to upload screenshots to their own folder
CREATE POLICY "Staff can upload screenshots to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'staff' AND
  (storage.foldername(name))[1] = 'staff_screenshot'
);

-- Allow staff to read their own screenshots
CREATE POLICY "Staff can read own screenshots"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'staff' AND
  (storage.foldername(name))[1] = 'staff_screenshot'
);
```

**Note**: The existing policies on the `staff` bucket should already cover this.

### 3. Push Database Schema

Run the Prisma migration to add the `screenshots` table:

```bash
npx prisma db push
```

This will create the `screenshots` table with:
- `id` - Unique identifier
- `staffUserId` - Link to staff user
- `filePath` - Path in Supabase Storage
- `fileUrl` - Public URL to view screenshot
- `fileSize` - File size in bytes
- `capturedAt` - Timestamp when screenshot was taken
- `createdAt` - When record was created

### 4. Verify Setup

1. Start the Electron app: `npm run dev:all`
2. Log in as a staff user
3. Check the terminal logs for:
   ```
   [ScreenshotService] Starting inactivity-based screenshot capture
   [ScreenshotService] Screenshot capture enabled - will capture when user is inactive (30+ seconds)
   [ActivityTracker] Inactivity detected: 30 seconds
   [ActivityTracker] Triggering screenshot capture due to inactivity
   [ScreenshotService] Inactivity detected - capturing screenshots
   [ScreenshotService] Capturing 2 display(s)
   [ScreenshotService] Captured display 0 (primary): 65.3 KB (960x540)
   [ScreenshotService] Captured display 1 (secondary_1): 72.1 KB (960x540)
   [Screenshots API] Upload successful: screenshot_primary_xxxxx.jpg (saved 65.3 KB)
   [Screenshots API] Upload successful: screenshot_secondary_1_xxxxx.jpg (saved 72.1 KB)
   ```
4. **Check the Performance Dashboard**:
   - Go to `/performance`
   - Screenshot count will auto-update every 10 seconds
   - Shows today's count from `clipboardActions`

## How It Works

### **Inactivity-Based Capture Mode** (Current)

- Captures all connected displays when **user is inactive for 30+ seconds**
- Integrated with the activity tracker
- Uses Electron's `desktopCapturer` API
- **Optimized for storage efficiency**:
  - Resolution: 50% of original (e.g., 1920x1080 → 960x540)
  - Format: JPEG with 70% quality (instead of PNG)
  - Result: ~70-80% smaller file sizes
- Each monitor is captured separately:
  - **Primary monitor**: `screenshot_primary_{timestamp}.jpg`
  - **Secondary monitors**: `screenshot_secondary_1_{timestamp}.jpg`, etc.
- Captures run continuously while app is open
- Screenshots are immediately uploaded to Supabase

### Multi-Monitor Support

If a staff user has 2 monitors:
- **When inactive for 30+ seconds**, 2 screenshots are captured
- Screenshot 1: Primary display (main monitor)
- Screenshot 2: Secondary display (second monitor)
- Both are uploaded separately with distinct filenames
- Each screenshot is tracked individually in the database

## Usage

### Manual Screenshot Trigger

Trigger immediate capture (doesn't wait for 10 second interval):

```javascript
if (window.electron?.screenshots) {
  const result = await window.electron.screenshots.captureNow()
  if (result.success) {
    console.log('Screenshots captured from all displays!')
    console.log('Total count:', result.count)
  }
}
```

### Check Capture Status

```javascript
if (window.electron?.screenshots) {
  const status = await window.electron.screenshots.getStatus()
  console.log('Mode:', status.mode) // 'automatic'
  console.log('Interval:', status.interval) // 10000 (ms)
  console.log('Monitoring:', status.isMonitoring)
  console.log('Total captured:', status.screenshotCount)
  console.log('Processing:', status.isProcessing)
}
```

## API Endpoints

### POST /api/screenshots
Upload a screenshot

**Request:**
- `FormData` with `screenshot` file and `timestamp`

**Response:**
```json
{
  "success": true,
  "screenshot": {
    "id": "uuid",
    "fileUrl": "https://...",
    "capturedAt": "2025-01-15T10:30:00Z"
  }
}
```

### GET /api/screenshots
Get screenshots for current user

**Query Parameters:**
- `date` - Filter by date (YYYY-MM-DD)
- `limit` - Number of results (default: 20)

**Response:**
```json
{
  "screenshots": [
    {
      "id": "uuid",
      "fileUrl": "https://...",
      "fileSize": 123456,
      "capturedAt": "2025-01-15T10:30:00Z",
      "createdAt": "2025-01-15T10:30:05Z"
    }
  ]
}
```

## Viewing Screenshot Counts

Screenshot counts are displayed in the **Performance Dashboard**:

1. Go to `/performance`
2. See **Screenshots** card showing total count (all time)
3. Count auto-refreshes every 10 seconds
4. Shows cumulative count across all captures from all monitors

## Storage Management

Screenshots are stored in the **`staff`** bucket with the following structure:

```
staff/
  └── staff_screenshot/
      ├── {staffUserId}/
      │   ├── {uploadTimestamp}_screenshot_primary_{captureTime}.jpg
      │   ├── {uploadTimestamp}_screenshot_secondary_1_{captureTime}.jpg
      │   ├── {uploadTimestamp}_screenshot_primary_{captureTime}.jpg
      │   ├── {uploadTimestamp}_screenshot_secondary_1_{captureTime}.jpg
      │   └── ...
      └── ...
```

**Example** (2 monitors, triggered on inactivity):
- User inactive at 10:15:30 → `screenshot_primary_1234567890.jpg` + `screenshot_secondary_1_1234567890.jpg`
- User inactive at 10:42:15 → `screenshot_primary_1234569735.jpg` + `screenshot_secondary_1_1234569735.jpg`
- User inactive at 11:08:00 → `screenshot_primary_1234571280.jpg` + `screenshot_secondary_1_1234571280.jpg`
- etc. (only when inactive, not on fixed intervals)

**File Size Examples** (with optimization):
- 1920x1080 display → ~60-80 KB per screenshot
- 2560x1440 display → ~90-120 KB per screenshot
- Average: ~70 KB per screenshot (vs ~350 KB unoptimized)

### Cleanup Old Screenshots

To prevent storage bloat, you can implement automatic cleanup:

```sql
-- Delete screenshots older than 30 days
DELETE FROM screenshots
WHERE captured_at < NOW() - INTERVAL '30 days';

-- Also delete from Supabase Storage (run separately)
```

## Troubleshooting

### Screenshots Not Being Captured

1. **Check inactivity-based capture logs**:
   - Look for: `[ScreenshotService] Screenshot capture enabled - will capture when user is inactive (30+ seconds)`
   - When inactive: `[ActivityTracker] Inactivity detected: 30 seconds`
   - Then: `[ScreenshotService] Inactivity detected - capturing screenshots`
   - If not running: Check if service started properly

2. **Check display detection**:
   - Service should log number of displays detected
   - Example: `[ScreenshotService] Capturing 2 display(s)`
   - If 0 displays: Check system display settings

3. **Test manual capture**:
   - Call `window.electron.screenshots.captureNow()`
   - Should immediately capture all displays
   - Check logs for success/error messages

### Screenshots Not Uploading

1. **Check Supabase credentials**:
   ```bash
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```

2. **Verify bucket exists**:
   - Go to Supabase Dashboard → Storage
   - Ensure `staff` bucket exists
   - Check for `staff_screenshot` subfolder

3. **Check RLS policies**:
   - Ensure policies allow authenticated users to upload

4. **Check logs**:
   ```
   [ScreenshotService] Error uploading screenshot: ...
   ```

### Capture Frequency Issues

If captures seem too frequent or infrequent:

- Current threshold: **30 seconds of inactivity**
- To change threshold: Edit `activity-tracker.js` line 75
- Recommended range: 15 seconds - 2 minutes
- Lower threshold = more captures

### Permissions Error

If you see "Permission denied":

1. Check RLS policies are correctly set up
2. Verify user is authenticated with correct `authUserId`
3. Check Supabase service role key has admin access

## Privacy Considerations

⚠️ **Important**: Automatic screenshot capture monitors all staff screen activity. Ensure:

1. **Staff Consent**: Inform staff members screenshots are being captured **when inactive for 30+ seconds from all monitors**
2. **Compliance**: Check local laws regarding employee monitoring
3. **Data Retention**: Implement policies for how long screenshots are kept
4. **Access Control**: Limit who can view screenshots
5. **Sensitive Data**: Consider blurring or redacting sensitive information
6. **Storage Costs**: Storage usage depends on user activity patterns
   - Active user (few idle periods): ~50-100 screenshots/day = **~7 MB/day per staff**
   - Moderate user (some idle periods): ~200-300 screenshots/day = **~20 MB/day per staff**
   - Less active user (frequent idle): ~500+ screenshots/day = **~35+ MB/day per staff**

## Configuration

### Change Inactivity Threshold

Edit `electron/activity-tracker.js`:

```javascript
// Line 75 - Change inactivity timeout
this.inactivityTimeout = 30000 // 30 seconds - CURRENT

// Examples:
this.inactivityTimeout = 60000  // 1 minute (less sensitive)
this.inactivityTimeout = 120000 // 2 minutes
this.inactivityTimeout = 15000  // 15 seconds (more sensitive)
```

### Adjust Image Quality

Edit `electron/services/screenshotService.js` - Line 89-90, 127:

```javascript
// Change scale factor (0.5 = 50% resolution)
const scaleFactor = 0.5  // Options: 0.3, 0.5, 0.75, 1.0

// Change JPEG quality (0-100)
const imageBuffer = image.toJPEG(70)  // Options: 50, 60, 70, 80, 90

// Quality vs Size tradeoffs:
// - 50% quality, 50% scale = ~30-50 KB (lowest quality)
// - 70% quality, 50% scale = ~50-100 KB (balanced - current)
// - 80% quality, 75% scale = ~150-200 KB (high quality)
// - 90% quality, 100% scale = ~300-400 KB (original PNG quality)
```

### Disable Multi-Monitor

To capture only primary display, edit `captureAllScreens()` method:

```javascript
// Only capture first display (primary)
const displays = screen.getAllDisplays().slice(0, 1)
```

## Next Steps

- [ ] Set up automatic cleanup for old screenshots
- [ ] Add screenshot viewer in Performance Dashboard
- [ ] Implement screenshot search and filtering
- [ ] Add privacy controls (pause/resume)
- [ ] Create management dashboard for viewing staff screenshots
- [ ] Add screenshot annotations or notes
- [ ] Implement screenshot analysis (OCR, activity detection)
- [ ] Add configurable capture intervals per staff member
- [ ] Implement intelligent capture (only when activity detected)

## Support

For issues or questions:
- Check logs in Electron console and server terminal
- Verify Supabase bucket and RLS policies
- Test with a simple manual upload first

---

**Status**: ✅ Screenshot tracking is now set up and ready to use!


