# Browser Activity Tracking - Page Title Monitoring

## Overview

The browser activity tracking feature monitors and displays browser activity by tracking **page titles** of websites visited in Chrome, Edge, Firefox, and Brave browsers. This provides insights into staff browsing patterns and productivity.

---

## ⚠️ CRITICAL LIMITATION

> ### **This Feature Tracks PAGE TITLES, NOT Actual URLs**
>
> **What you'll see:**  
> ✅ "YouTube"  
> ✅ "GitHub - Where the world builds software"  
> ✅ "Stack Overflow - Where Developers Learn"
>
> **What you WON'T see:**  
> ❌ "https://youtube.com/watch?v=..."  
> ❌ "https://github.com/username/repo"  
> ❌ "https://stackoverflow.com/questions/12345"
>
> **Why?** The `active-win` library (used for window detection) **cannot access actual browser URLs** due to browser privacy and security restrictions. It can only read window titles, which contain the page title but not the URL.
>
> **Note:** Getting actual URLs would require complex browser extensions or Chrome DevTools Protocol integration (requiring users to launch browsers with special debugging flags), which is not practical for most use cases.

---

## Features

### ✅ Implemented

1. **Real-time Page Title Detection**
   - Detects active browser windows (Chrome, Edge, Firefox, Brave)
   - Extracts **page titles** from browser windows (not actual URLs)
   - Tracks unique pages visited by title
   - Updates count in real-time

2. **Smart Filtering**
   - Skips "New Tab" pages (including variants like "New tab and 6 more pages")
   - Skips empty titles and browser-only windows
   - Removes browser suffixes (e.g., " - Google Chrome", " - Microsoft Edge")
   - Filters out non-content pages

3. **Live Display in Performance Dashboard**
   - Shows total count of unique pages visited
   - Displays scrollable list of all visited **page titles**
   - Globe icon next to each page
   - Hover effects for better UX
   - Clean display without "page:" prefix

4. **Data Storage**
   - In-memory tracking during session (Set data structure)
   - Page titles stored in `visitedUrls` Set in Performance Tracker
   - Count sent to API/database as integer
   - Page titles list included in metrics for display

---

## How It Works

### 1. **Detection Process**

```javascript
// Every 2 seconds, check active window
setInterval(() => {
  const window = activeWin.sync()
  
  // Is it a browser?
  if (isBrowser(window.owner.name)) {
    // Extract page title from window
    const pageTitle = extractUrlFromWindow(window)
    
    // New unique page?
    if (pageTitle && pageTitle !== currentUrl) {
      visitedUrls.add(pageTitle)
      metrics.urlsVisited = visitedUrls.size
    }
  }
}, 2000)
```

### 2. **Page Title Extraction Logic**

Located in: `electron/services/performanceTracker.js`

> **Note:** The method is named `extractUrlFromWindow()` for legacy reasons, but it actually extracts **page titles**, not URLs.

```javascript
extractUrlFromWindow(window) {
  // 1. Check for direct URL property (almost never available)
  // The active-win library does NOT provide actual URLs for privacy/security
  if (window.url) return window.url
  
  // 2. Extract page title from window title
  let title = window.title.trim()
  
  // 3. Clean browser suffixes from title
  // Removes: " - Google Chrome", " - Microsoft Edge", etc.
  
  // 4. Skip common non-content page titles
  // Skips: "New Tab", "New tab and X more pages", "Untitled", etc.
  
  // 5. Check if title contains actual URL patterns (rare)
  // Matches: https://... or http://... if present in title
  
  // 6. Return cleaned page title with "page:" prefix
  // Example: "page:YouTube" or "page:GitHub - Where the world builds software"
  return `page:${title.substring(0, 100)}`
}
```

### 3. **Data Flow**

```
Browser Window (Chrome/Edge/Firefox/Brave)
    ↓
Active Window Detection (active-win library)
    ↓
Extract Window Title (NOT URL - active-win limitation)
    ↓
Clean Title (remove browser suffixes, etc.)
    ↓
Filter Non-Content Pages (skip "New Tab", etc.)
    ↓
Add Page Title to Set (unique only)
    ↓
Update Metrics Count
    ↓
Send to Dashboard (every 5s via IPC)
    ↓
Display in Browser Activity Card (shows page titles)
```

**What You'll See:**
- ✅ Page titles: "YouTube", "GitHub - Where the world builds software"
- ❌ NOT actual URLs: "https://youtube.com", "https://github.com"

---

## Implementation Details

### Files Modified

#### 1. **electron/services/performanceTracker.js**

**Added:**
- `visitedUrls` Set to store unique URLs
- `extractUrlFromWindow()` method
- `logVisitedUrls()` method for debugging
- Enhanced skip logic for "New tab" variants
- `visitedUrlsList` in `getMetrics()` and `getMetricsForAPI()`

**Key Code:**
```javascript
// Line 32: Initialize Set
this.visitedUrls = new Set()

// Line 283-288: Track new URLs
if (url && url !== this.currentUrl) {
  this.currentUrl = url
  this.visitedUrls.add(url)
  this.metrics.urlsVisited = this.visitedUrls.size
  this.logVisitedUrls()
}

// Line 392: Include in metrics
visitedUrlsList: Array.from(this.visitedUrls)

// Line 426-438: Debug logging
logVisitedUrls() {
  console.log('\n=== VISITED URLs ===')
  console.log(`Total unique URLs visited: ${this.visitedUrls.size}`)
  Array.from(this.visitedUrls).forEach((url, index) => {
    console.log(`  ${index + 1}. ${url}`)
  })
}
```

#### 2. **electron/main.js**

**Added:**
- IPC handler for `log-visited-urls`

```javascript
// Line 499-503
ipcMain.handle('log-visited-urls', () => {
  performanceTracker.logVisitedUrls()
  return { success: true }
})
```

#### 3. **electron/preload.js**

**Added:**
- `logVisitedUrls()` API exposure

```javascript
// Line 23
logVisitedUrls: () => ipcRenderer.invoke('log-visited-urls')
```

#### 4. **components/performance-dashboard.tsx**

**Added:**
- `visitedUrlsList?: string[]` to `PerformanceMetric` interface
- Browser Activity card with URL list display

```typescript
{/* Display list of visited URLs */}
{isElectron && (
  <div className="mt-4 space-y-2">
    <h3 className="text-sm font-semibold text-slate-300">Visited Pages:</h3>
    {displayMetrics.visitedUrlsList && displayMetrics.visitedUrlsList.length > 0 ? (
      <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
        {displayMetrics.visitedUrlsList.map((url: string, index: number) => {
          const displayUrl = url.startsWith('page:') ? url.substring(5) : url
          return (
            <div key={index} className="flex items-start gap-2 rounded-lg bg-slate-800/50 p-3 text-sm hover:bg-slate-800 transition-colors">
              <Globe className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <span className="text-slate-300 break-all">{displayUrl}</span>
            </div>
          )
        })}
      </div>
    ) : (
      <p className="text-sm text-slate-400 italic">No pages visited yet. Browse some websites to see them here.</p>
    )}
  </div>
)}
```

---

## Supported Browsers

| Browser | Detection | Status |
|---------|-----------|--------|
| Google Chrome | ✅ | Working |
| Microsoft Edge | ✅ | Working |
| Firefox | ✅ | Working |
| Brave Browser | ✅ | Working |

---

## Current Limitations

### ⚠️ Critical Limitation: Page Titles Only, NOT URLs

**This feature tracks PAGE TITLES, not actual URLs.**

| What You Get | What You DON'T Get |
|--------------|-------------------|
| ✅ "YouTube" | ❌ "https://youtube.com" |
| ✅ "GitHub - Where the world builds software" | ❌ "https://github.com/username/repo" |
| ✅ "Electronics, Cars, Fashion... \| eBay" | ❌ "https://ebay.com/itm/12345" |

**Why?** The `active-win` library (which detects active windows) **cannot access actual browser URLs** due to browser privacy and security restrictions. It can only read the **window title**, which contains the page title.

### ⚠️ Other Known Issues

1. **Multi-Tab Detection**
   - When multiple tabs are open, may show "YouTube and 3 more pages"
   - Only tracks the active/focused tab's title
   - Cannot see individual titles of background tabs
   - Tab count in title may vary by browser

2. **In-Memory Only (Not Persistent)**
   - Page titles are stored in memory during Electron session
   - **Lost when app restarts** - tracking starts fresh
   - Not yet persisted to database (see Future Enhancements)
   - No historical data available after restart

3. **Browser-Specific Title Variations**
   - Edge sometimes adds "Personal - " prefix
   - Different browsers format titles differently
   - Some cleanup logic may need refinement
   - Title truncation at 100 characters

4. **Limited to Active Window**
   - Only tracks when browser is the **active** window
   - Background browsing is not detected
   - Requires browser to be in focus for 2+ seconds

---

## Console Debugging

### View Visited Page Titles in Console

Page titles are automatically logged to console whenever a new page is detected:

```
=== VISITED URLs ===
Total unique URLs visited: 7

URLs List:
  1. page:staff software | ShoreAgents | Supabase
  2. page:Electronics, Cars, Fashion, Collectibles & More | eBay and 5 more pages
  3. page:YouTube and 3 more pages
  4. page:Booking.com | Official site | The best hotels, flights, car rentals & accommodations
===================
```

> **Note:** Despite the log title saying "VISITED URLs", these are actually **page titles** with a "page:" prefix, not actual URLs. The naming is kept for backwards compatibility.

### Manual Logging

**From Browser DevTools (Electron app):**
```javascript
await window.electron.performance.logVisitedUrls()
```

**From Electron Main Process:**
```javascript
performanceTracker.logVisitedUrls()
```

---

## Future Enhancements

### 🚀 Planned Features

#### 1. **Database Persistence**

Add to Prisma schema to persist page titles:
```prisma
model PerformanceMetric {
  // ... existing fields ...
  urlsVisited       Int       @default(0)
  visitedUrlsList   Json?     // Store array of page titles (not actual URLs)
  // Example: ["page:YouTube", "page:GitHub - Where the world builds software"]
}
```

Update API route to save/retrieve `visitedUrlsList`.

**Note:** This would store **page titles**, not actual URLs (there is no practical way to get actual URLs without complex browser extensions or requiring users to launch browsers with special debugging flags).

#### 2. **Page Analytics**

- **Time spent per page/site** (based on page titles)
- **Most visited pages**
- **Productivity categorization** (work-related vs. non-work based on titles)
- **Pattern recognition** (e.g., group all "YouTube" titled pages)
- **Domain extraction from titles** (attempt to identify domains from page titles)

#### 3. **Domain Grouping**

Group by domain instead of individual pages:
```
youtube.com (12 pages)
github.com (8 pages)
stackoverflow.com (5 pages)
```

#### 4. **Privacy Controls**

- **Blacklist URLs** (don't track certain sites)
- **Whitelist mode** (only track approved domains)
- **Anonymize sensitive URLs**

---

## Testing Guide

### 1. **Test URL Detection**

1. Start Electron app
2. Open Chrome/Edge
3. Visit various websites:
   - YouTube
   - GitHub
   - eBay
   - Any other site
4. Switch between tabs
5. Check console for URL logging

### 2. **Test Filtering**

1. Open "New Tab" pages → Should NOT be counted
2. Open "New tab and 5 more pages" → Should NOT be counted
3. Close tab immediately → May or may not count (timing dependent)

### 3. **Test Dashboard Display**

1. Open Electron app
2. Navigate to Performance page
3. Scroll to "Browser Activity" card
4. Verify:
   - Count matches number of unique URLs
   - List shows all visited pages
   - No "page:" prefix visible
   - Scrollable if > 10 URLs
   - Hover effects work

### 4. **Test Live Updates**

1. Keep Performance page open
2. Visit new website in browser
3. Wait 5-10 seconds
4. Verify count and list update automatically

---

## Configuration

### Tracking Interval

Located in: `electron/services/performanceTracker.js`

```javascript
// Line 292: Check every 2 seconds
}, 2000)
```

**To adjust:**
- Decrease (e.g., 1000ms) = faster detection, more CPU usage
- Increase (e.g., 5000ms) = slower detection, less CPU usage

### Browser List

Located in: `electron/services/performanceTracker.js`

```javascript
// Line 276
const browserApps = [
  'Google Chrome', 'Chrome',
  'Microsoft Edge', 'Edge',
  'Brave Browser', 'Brave',
  'Firefox', 'Mozilla Firefox'
]
```

**To add browser:**
```javascript
const browserApps = [
  // ... existing ...
  'Opera', 'Opera GX',
  'Vivaldi'
]
```

### Skip Patterns

Located in: `electron/services/performanceTracker.js`

```javascript
// Line 338: Exact matches
const skipTitles = ['New Tab', 'New tab', 'Untitled', '', 'Chrome', 'Edge', 'Firefox', 'Brave']

// Line 346: Starts with
const skipStartsWith = ['New Tab', 'New tab']
```

**To add skip pattern:**
```javascript
const skipStartsWith = [
  'New Tab', 'New tab',
  'Untitled',
  'Extensions', // Skip extension pages
]
```

---

## Troubleshooting

### Issue: URLs not being detected

**Solution:**
1. Check if browser is in the supported list
2. Verify `active-win` dependency is installed: `npm list active-win`
3. Check console for errors
4. Try manual logging: `window.electron.performance.logVisitedUrls()`

### Issue: "New tab" pages are being counted

**Solution:**
1. Verify line 346-349 in `performanceTracker.js`
2. Check if browser adds different text (e.g., "New Tab" vs "New tab")
3. Add variation to `skipStartsWith` array

### Issue: URLs not showing in dashboard

**Solution:**
1. Confirm running in Electron (not web browser)
2. Check `isElectron` is true in component
3. Verify `displayMetrics.visitedUrlsList` exists in console
4. Check browser console for React errors

### Issue: Duplicate URLs with slight variations

**Solution:**
1. Browser suffix cleanup may be incomplete
2. Add variation to `browserSuffixes` array (line 313)
3. Check for special characters (zero-width spaces, etc.)

---

## Performance Impact

| Metric | Impact | Notes |
|--------|--------|-------|
| CPU Usage | < 1% | Checks every 2 seconds |
| Memory | ~1KB per URL | Set data structure |
| Network | None | Local tracking only |
| Battery | Negligible | Minimal background activity |

---

## API Reference

### Electron IPC Methods

```typescript
// Get current metrics (includes visitedUrlsList - array of page titles)
const metrics = await window.electron.performance.getCurrentMetrics()
console.log(metrics.visitedUrlsList)
// Example: ["page:YouTube", "page:GitHub - Where the world builds software"]

// Log page titles to console
await window.electron.performance.logVisitedUrls()

// Subscribe to real-time updates
const unsubscribe = window.electron.performance.onMetricsUpdate((data) => {
  console.log('Visited Pages:', data.metrics.visitedUrlsList)
  // These are page TITLES, not URLs
})
```

### Performance Tracker Methods

```javascript
// Get metrics with page titles array
performanceTracker.getMetrics()
// Returns: { 
//   ..., 
//   visitedUrlsList: [
//     'page:YouTube', 
//     'page:GitHub - Where the world builds software',
//     'page:Stack Overflow - Where Developers Learn'
//   ]
// }

// Get metrics for API (formatted)
performanceTracker.getMetricsForAPI()
// Returns: { 
//   ..., 
//   urlsVisited: 7,  // Count
//   visitedUrlsList: ['page:...', 'page:...']  // Array of page titles
// }

// Log to console
performanceTracker.logVisitedUrls()

// Access raw Set of page titles
performanceTracker.visitedUrls // Set<string> - page titles with "page:" prefix
```

---

## Version History

### Version 1.0 (Current)
- ✅ Real-time **page title** detection from browser windows
- ✅ Smart filtering of non-content pages (New Tab, etc.)
- ✅ Live display in dashboard
- ✅ Console debugging tools
- ✅ Multi-browser support (Chrome, Edge, Firefox, Brave)
- ⚠️ **Limitation:** Tracks page titles only, NOT actual URLs

### Future Versions (Planned)
- 🔜 Database persistence of page titles
- 🔜 Page analytics and categorization
- 🔜 Time spent per page/domain
- 🔜 Domain grouping and pattern recognition
- 🔜 Privacy controls and filtering

---

## Related Files

- `electron/services/performanceTracker.js` - Main tracking logic
- `electron/main.js` - IPC handlers
- `electron/preload.js` - API exposure
- `components/performance-dashboard.tsx` - UI display
- `app/api/performance/route.ts` - API endpoint
- `prisma/schema.prisma` - Database schema

---

## Support

For issues or questions about URL tracking:
1. Check console logs for errors
2. Use `logVisitedUrls()` for debugging
3. Review this documentation
4. Check related files for implementation details

---

**Last Updated:** October 15, 2025  
**Status:** ✅ Production Ready (Page Title Tracking Only)  
**Limitation:** ⚠️ Tracks page titles, NOT actual URLs - this is a technical limitation of the `active-win` library

