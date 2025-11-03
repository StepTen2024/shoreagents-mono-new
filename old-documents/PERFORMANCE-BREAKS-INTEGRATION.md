# 🎯 Performance Tracking + Breaks Integration

**Issue:** Break time should NOT count as "idle time" in performance metrics!

---

## 🔍 The Problem

Currently, when staff take breaks:
- Electron app still tracks them as "idle"
- Performance dashboard shows misleading productivity scores
- Break time inflates "idleTime" metric

**Example:**
- Staff works 8 hours
- Takes 1.5 hours of breaks (lunch + 2 coffee breaks)
- Electron tracks 1.5 hours as "idle"
- Dashboard shows: "NaN% Productivity" or low score

---

## ✅ The Solution

### 1. Exclude Break Periods from Performance Tracking

When calculating productivity, **exclude time periods when staff were on break**.

### 2. Performance API Changes

**File:** `app/api/performance/route.ts`

#### Current Formula:
```typescript
const totalTime = metric.activeTime + metric.idleTime
const activePercent = totalTime > 0 ? (metric.activeTime / totalTime) * 100 : 0
```

#### New Formula (with Break Exclusion):
```typescript
// Get breaks for this date
const breaks = await prisma.break.findMany({
  where: {
    staffUserId: staffUser.id,
    actualStart: {
      gte: startOfDay(metric.date),
      lte: endOfDay(metric.date)
    }
  }
})

// Calculate total break time in seconds
const totalBreakTime = breaks.reduce((sum, b) => {
  if (b.actualStart && b.actualEnd) {
    return sum + ((b.actualEnd.getTime() - b.actualStart.getTime()) / 1000)
  }
  return sum
}, 0)

// Adjust idle time by subtracting break time
const adjustedIdleTime = Math.max(0, metric.idleTime - totalBreakTime)
const totalTime = metric.activeTime + adjustedIdleTime
const activePercent = totalTime > 0 ? (metric.activeTime / totalTime) * 100 : 0
```

### 3. Electron Performance Tracker Changes

**File:** `electron/services/performanceTracker.js`

#### Option A: Pause Tracking During Breaks
When staff starts a break, **pause** performance tracking:
- Stop recording mouse movements, keystrokes, etc.
- Resume when break ends

#### Option B: Tag Break Periods
Continue tracking but **tag** the time periods:
- Add `onBreak` boolean to performance data
- Filter out break periods during calculation

**Recommended:** Option A (pause tracking) - cleaner and more accurate.

---

## 🔧 Implementation Steps

### Step 1: Update Performance API (Backend)

Update `/api/performance` GET endpoint to exclude break time from idle time calculation.

```typescript
// gamified-dashboard (1)/app/api/performance/route.ts
export async function GET(request: NextRequest) {
  const staffUser = await getStaffUser()
  
  // ... existing code to get metrics ...
  
  // For each metric, get breaks for that day
  const metricsWithBreaks = await Promise.all(
    metrics.map(async (metric) => {
      const startOfDay = new Date(metric.date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(metric.date)
      endOfDay.setHours(23, 59, 59, 999)
      
      const breaks = await prisma.break.findMany({
        where: {
          staffUserId: staffUser.id,
          actualStart: { gte: startOfDay, lte: endOfDay }
        }
      })
      
      const totalBreakTime = breaks.reduce((sum, b) => {
        if (b.actualStart && b.actualEnd) {
          return sum + ((b.actualEnd.getTime() - b.actualStart.getTime()) / 1000)
        }
        return sum
      }, 0)
      
      return {
        ...metric,
        breakTime: totalBreakTime,
        adjustedIdleTime: Math.max(0, metric.idleTime - totalBreakTime)
      }
    })
  )
  
  return NextResponse.json({ metrics: metricsWithBreaks })
}
```

### Step 2: Update Performance Dashboard (Frontend)

Update productivity calculation to use `adjustedIdleTime`:

```typescript
// gamified-dashboard (1)/components/performance-dashboard.tsx
const totalTime = metric.activeTime + (metric.adjustedIdleTime || metric.idleTime)
const activePercent = totalTime > 0 ? (metric.activeTime / totalTime) * 100 : 0
```

### Step 3: Electron Break Detection (Advanced)

Add IPC handlers for break start/end:

```javascript
// electron/main.js
ipcMain.handle('break:start', async () => {
  performanceTracker.pauseTracking()
  console.log('[Break] Tracking paused')
})

ipcMain.handle('break:end', async () => {
  performanceTracker.resumeTracking()
  console.log('[Break] Tracking resumed')
})
```

Update web app to notify Electron:

```typescript
// When staff starts a break
if (window.electron) {
  window.electron.invoke('break:start')
}

// When staff ends a break
if (window.electron) {
  window.electron.invoke('break:end')
}
```

---

## 📊 Expected Results

### Before Integration:
```
Staff Shift: 8:00 AM - 5:00 PM (9 hours)
Active Time: 6 hours
Idle Time: 3 hours (includes 1.5 hours of breaks!)
Productivity: 66.7% ❌ WRONG
```

### After Integration:
```
Staff Shift: 8:00 AM - 5:00 PM (9 hours)
Active Time: 6 hours
Idle Time: 1.5 hours (breaks excluded!)
Break Time: 1.5 hours
Adjusted Idle: 1.5 hours
Net Work Time: 7.5 hours (9 hours - 1.5 breaks)
Productivity: 80% ✅ CORRECT (6 active / 7.5 net)
```

---

## 🎯 Priority

**MEDIUM-HIGH**

This should be implemented soon to ensure:
1. Accurate productivity scores
2. Fair staff performance tracking
3. No false "idle" alerts during legitimate breaks

---

## 🚀 Next Steps

1. **Backend:** Update `/api/performance` to exclude break time
2. **Frontend:** Update dashboard to use adjusted metrics
3. **Electron:** Add break start/end IPC handlers
4. **Testing:** Verify break time no longer counts as idle
5. **Documentation:** Update performance docs

---

## 📝 Testing Checklist

- [ ] Clock in
- [ ] Work for 30 min (should show active time)
- [ ] Start break for 15 min (should NOT count as idle)
- [ ] End break
- [ ] Work for 30 min more
- [ ] Check performance dashboard
  - [ ] Break time shown separately
  - [ ] Idle time does NOT include break time
  - [ ] Productivity % accurate

---

**Status:** 📝 Documented, ready to implement after UI integration

