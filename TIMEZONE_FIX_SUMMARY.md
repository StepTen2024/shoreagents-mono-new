# 🕐 Timezone Fix Summary - Performance Metrics

## Problem Identified

The performance metrics were being saved and queried with incorrect dates due to timezone mismatches:

### **Issue #1: Server Timezone vs Staff Timezone**
- **Before:** API used `new Date()` which gets the current time in the **server's timezone**
- **After:** API now uses `getStaffLocalTime(timezone)` to get time in **staff's timezone (Asia/Manila)**
- **Impact:** Staff in Philippines (UTC+8) were seeing incorrect dates if the server was in a different timezone

### **Issue #2: Using `date` Field Instead of `shiftDate`**
- **Before:** Queries used the `date` field which has `@default(now())` and uses server time
- **After:** Queries now use `shiftDate` which is explicitly set to the staff's timezone during clock-in
- **Impact:** Performance metrics are now correctly associated with the staff's shift date, not calendar date

### **Issue #3: Database Timezone (This is CORRECT!)**
- The database stores all `DateTime` fields in **UTC** - this is standard and correct
- When JavaScript creates `new Date(utcString)`, it correctly interprets it as UTC
- When displaying with `toLocaleString()`, the browser automatically converts to the user's local timezone

## Files Modified

### 1. **`app/api/analytics/route.ts`** ✅
   - **Line 5:** Added import for `getStaffLocalTime` from timezone helpers
   - **Lines 21-31:** Fetch staff user with timezone from profile
   - **Lines 37-51:** Use staff timezone to determine "today" instead of server time
   - **Lines 53-62:** Query using `shiftDate` instead of `date` field
   - **Lines 64-78:** Get today's metrics using timezone-aware `shiftDate`
   - **Lines 95-115:** Return `shiftDate` and `shiftDayOfWeek` in API response
   - **Lines 120-141:** Same for today's metrics

### 2. **`app/api/admin/analytics/route.ts`** ✅
   - **Lines 77-86:** Use `shiftDate` for determining active staff
   - **Lines 139-141:** Use `shiftDate` for daily trends filtering
   - **Lines 243-247:** Use `shiftDate` for company active staff calculation
   - **Lines 283-285:** Use `shiftDate` for recent activity filtering
   - **Lines 324-328:** Use `shiftDate` for client active staff calculation

### 3. **`app/api/client/analytics/route.ts`** ✅
   - **Lines 83-86:** Already uses `shiftDate` for queries (no change needed)

## How It Works Now

### **Clock-In Process:**
1. Staff clocks in at 9:00 AM Manila time (Nov 13, 2025)
2. System detects staff timezone: `Asia/Manila` (UTC+8)
3. System calculates `shiftDate`: November 13, 2025 00:00:00 Manila time
4. Creates `time_entries` record with `shiftDate` = Nov 13
5. Creates `performance_metrics` record with `shiftDate` = Nov 13

### **Performance Tracking:**
1. Electron tracks metrics in real-time
2. Every 10 seconds, sends delta to API
3. API finds the metric using `shiftDate` (not calendar date!)
4. Increments the counters

### **Fetching Metrics:**
1. Frontend requests today's metrics
2. API gets staff timezone: `Asia/Manila`
3. API calculates "today" in staff timezone: Nov 13, 2025
4. Queries database: `WHERE shiftDate = Nov 13, 2025`
5. Returns metrics with `shiftDate` in ISO format (UTC)
6. Frontend displays date using `new Date(date).toLocaleString()` which auto-converts to browser's timezone

## What Dates Look Like

| Stage | Date Format | Example | Timezone |
|-------|-------------|---------|----------|
| **Staff Clocks In** | Manila Time | Nov 13, 2025 9:00 AM | Asia/Manila (UTC+8) |
| **shiftDate Calculated** | Midnight Manila | Nov 13, 2025 00:00:00 | Asia/Manila (UTC+8) |
| **Saved to Database** | UTC | Nov 12, 2025 16:00:00Z | UTC |
| **API Query** | Manila Time | Nov 13, 2025 00:00:00 | Asia/Manila (UTC+8) |
| **API Response** | ISO String (UTC) | "2025-11-12T16:00:00.000Z" | UTC |
| **Browser Display** | User's Timezone | Nov 13, 2025 (formatted) | User's Browser Timezone |

## Night Shift Handling

The system correctly handles night shifts that cross midnight:

**Example:** Staff starts at 11:00 PM Thursday, works until 7:00 AM Friday

- `shiftDate`: **Thursday** (Nov 13)
- `shiftDayOfWeek`: **"Thursday"**
- All metrics for that shift are saved under Thursday's date
- System detects night shift by checking if clock-in is before 6 AM and previous day had a shift starting after 6 PM

## Testing

To verify the fix is working:

1. **Check Logs:**
   ```
   📊 [Analytics API] Fetching metrics in timezone: Asia/Manila
   📅 [Analytics API] Today in Asia/Manila: 2025-11-13T00:00:00.000Z
   📊 [Analytics API] Found 1 metrics (last 7 days), today's metric: YES
   ```

2. **Check Database:**
   - Query: `SELECT id, shiftDate, shiftDayOfWeek FROM performance_metrics WHERE staffUserId = 'xxx'`
   - Verify `shiftDate` matches the staff's local date

3. **Check Frontend:**
   - Open Performance Dashboard
   - Verify dates shown match current date in Philippines
   - Check browser console for any date-related errors

## Recommendations

### ✅ **What's Now Correct:**
- All queries use `shiftDate` (timezone-aware)
- API determines "today" using staff timezone
- Night shifts are handled correctly
- Database stores UTC (standard practice)

### 🔧 **Potential Future Improvements:**
1. Add explicit timezone display in UI (e.g., "Nov 13, 2025 (Manila Time)")
2. Allow admins to view metrics in different timezones
3. Add timezone indicator to date columns in tables
4. Consider adding a `timezone` field to `performance_metrics` table for auditability

## Related Files

- `lib/timezone-helpers.ts` - Timezone conversion utilities
- `electron/services/performanceTracker.js` - Local metrics tracking
- `electron/services/syncService.js` - Syncs local metrics to API
- `prisma/schema.prisma` - Database schema (shiftDate field)

---

**Date Fixed:** November 13, 2025
**Fixed By:** AI Assistant
**Status:** ✅ Complete

