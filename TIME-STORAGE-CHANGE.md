# ⏱️ Time Storage Change: Minutes → Seconds

**Date:** November 14, 2025  
**Status:** ✅ IMPLEMENTED

---

## 🎯 Problem

Active time and idle time were **NOT being saved** to the database because of a rounding issue with Prisma's `Int` fields.

### The Issue:

1. **Electron sends deltas every 10 seconds**: `{ activeTime: 10 }` (seconds)
2. **API converted to minutes**: `10 / 60 = 0.166` minutes
3. **Added to database**: `0 + 0.166 = 0.166` minutes
4. **Prisma rounded immediately**: `0.166 → 0` minutes ❌
5. **Next sync**: Database still had `0`, so we lost the previous 10 seconds!

### Example Timeline (BEFORE FIX):
```
Sync 1: 10s → 0.166min → DB: 0 + 0.166 = 0 (rounded) ❌
Sync 2: 10s → 0.166min → DB: 0 + 0.166 = 0 (rounded) ❌
Sync 3: 10s → 0.166min → DB: 0 + 0.166 = 0 (rounded) ❌
Result: 60 seconds of activity → 0 minutes saved! ❌
```

**Only when accumulating 30+ seconds in ONE sync would it round to 1 minute.**

---

## ✅ Solution

**Store time values in SECONDS (not minutes)** in the database.

- **Before:** `activeTime Int` stored minutes
- **After:** `activeTime Int` stores seconds

### Why This Works:

1. No decimal conversion needed (seconds → seconds)
2. No rounding loss
3. Perfect accuracy
4. Simpler code

### Example Timeline (AFTER FIX):
```
Sync 1: 10s → DB: 0s + 10s = 10s ✅
Sync 2: 10s → DB: 10s + 10s = 20s ✅
Sync 3: 10s → DB: 20s + 10s = 30s ✅
Result: 60 seconds saved perfectly! ✅
```

---

## 📋 Changes Made

### 1. **Database Schema** (`prisma/schema.prisma`)

```prisma
model performance_metrics {
  // ... other fields
  activeTime   Int @default(0) // ⏱️ Stored in SECONDS (not minutes!)
  idleTime     Int @default(0) // ⏱️ Stored in SECONDS (not minutes!)
  screenTime   Int @default(0) // ⏱️ Stored in SECONDS (not minutes!)
  // ... other fields
}
```

**No migration needed** - the field type (`Int`) stays the same, just the unit changes.

### 2. **API** (`app/api/analytics/route.ts`)

**BEFORE:**
```typescript
// Convert seconds to minutes
const activeTimeMinutes = activeTime / 60  // 0.166 min
activeTime: existingMetric.activeTime + activeTimeMinutes  // Lost in rounding!
```

**AFTER:**
```typescript
// Simply add seconds to seconds
const totalActiveSeconds = existingMetric.activeTime + (activeTime || 0)
activeTime: totalActiveSeconds  // No rounding loss! ✅
```

### 3. **Frontend** (`components/performance-dashboard.tsx`)

**Already correct!** The `formatTime` function expects seconds:

```typescript
const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours}h ${mins}m ${secs}s`
}
```

### 4. **Migration Script** (`scripts/migrate-time-to-seconds.js`)

Converts existing data from minutes to seconds by multiplying by 60.

---

## 🚀 Deployment Steps

### Step 1: Update Code
```bash
# Already done! Changes are in:
# - app/api/analytics/route.ts
# - prisma/schema.prisma
```

### Step 2: Run Migration (⚠️ Important!)
```bash
# Convert existing data from minutes to seconds
node scripts/migrate-time-to-seconds.js
```

**⚠️ WARNING:** Run this migration **ONLY ONCE**! Running it twice will multiply values by 60 again.

### Step 3: Restart Application
```bash
# Restart the Next.js server
npm run dev

# Or rebuild the Electron app
npm run electron-build
```

---

## 📊 How Data Flows Now

### **Electron App**
```javascript
// Tracks in seconds
performanceTracker.metrics.activeTime = 45  // seconds

// Sends delta every 10s
POST /api/analytics { activeTime: 10 }  // seconds
```

### **API Server**
```typescript
// Receives seconds
const activeTime = 10  // seconds from Electron

// Adds seconds to existing seconds
const total = existingMetric.activeTime + activeTime
// 0s + 10s = 10s ✅

// Saves total seconds
activeTime: total  // 10 seconds
```

### **Database**
```sql
-- Stores seconds
activeTime: 10  -- seconds (not minutes!)
```

### **Frontend Display**
```typescript
// Converts seconds to readable format
formatTime(10)  // "0h 0m 10s"
formatTime(125) // "0h 2m 5s"
formatTime(3665) // "1h 1m 5s"
```

---

## ✅ Benefits

1. **Perfect Accuracy**: No rounding loss
2. **Simpler Code**: No conversion math
3. **Consistent Units**: Seconds everywhere (Electron → API → DB)
4. **Better Logging**: "10s + 10s = 20s" is clearer than "0.166min + 0.166min = 0min"

---

## 🧪 Testing

### Verify Active Time Tracking:

1. **Start the app** and wait 60 seconds
2. **Check logs** for:
```
✅ Active Time: 0s + 10s = 10s (0 min 10s)
✅ Active Time: 10s + 10s = 20s (0 min 20s)
✅ Active Time: 20s + 10s = 30s (0 min 30s)
✅ Active Time: 30s + 10s = 40s (0 min 40s)
✅ Active Time: 40s + 10s = 50s (0 min 50s)
✅ Active Time: 50s + 10s = 60s (1 min 0s) ← After 1 minute!
```

3. **Check database**:
```sql
SELECT activeTime, idleTime, screenTime FROM performance_metrics ORDER BY date DESC LIMIT 1;
-- Should show values like: 60, 0, 60 (all in seconds!)
```

4. **Check frontend**: Should display as "1h 0m 0s" after 1 minute

---

## 📝 Notes

- **Backwards Compatible**: Old code expecting minutes will need updates
- **Frontend**: Already handles seconds correctly (`formatTime` function)
- **Electron**: Already sends seconds, no changes needed
- **Migration**: Must be run to convert existing data

---

## 🐛 If Something Goes Wrong

### Active time still showing 0?

1. Check API logs for:
```
✅ Active Time: 0s + 10s = 10s (0 min 10s)
```

2. Check database:
```sql
SELECT * FROM performance_metrics ORDER BY "updatedAt" DESC LIMIT 1;
```

3. Make sure migration ran:
```bash
node scripts/migrate-time-to-seconds.js
```

### Time showing weird values?

- **If values are 60x too large**: Migration ran twice! Divide by 60 to fix.
- **If values are 60x too small**: Migration didn't run! Run the migration script.

---

## 🎉 Result

**Active time and idle time now track perfectly!** Every second is counted accurately with no rounding loss.

```
Before: 60 seconds → 0 minutes saved ❌
After:  60 seconds → 60 seconds saved ✅
```

