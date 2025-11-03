# Agent Branch Fixes to Cherry-Pick

**Status:** TO DO AFTER GUNTING COMPLETE  
**Date Identified:** October 23, 2025  
**Analyzed By:** StepTen via GitHub MCP

---

## 🎯 Strategy

**DO NOT merge agent branches directly** - They would delete all GUNTING work!

Instead, we'll **cherry-pick specific commits** with important bug fixes after GUNTING is 100% complete.

---

## 🟥 Agent003-Raze (James) - HIGH PRIORITY FIXES

### 1. Break System Schema Fixes
**File:** `prisma/schema.prisma`  
**Commit:** `59bd686 Update schema.prisma`

**Issue:** Field name inconsistencies causing database errors

**Fixes:**
```prisma
model Break {
  // OLD (broken):
  ispaused       Boolean?
  pauseused      Boolean?
  pausedat       DateTime?
  pausedduration Int?
  
  // NEW (fixed):
  isPaused       Boolean  @default(false)
  pauseUsed      Boolean  @default(false)
  pausedAt       DateTime?
  pausedDuration Int      @default(0)
}
```

**Why Important:**
- Fixes camelCase naming convention
- Adds proper defaults
- Prevents null errors
- Makes queries work correctly

---

### 2. Break Pause API Improvements
**File:** `app/api/breaks/[id]/pause/route.ts`  
**Commit:** Related to break fixes

**Improvements:**
```typescript
// Better validation
if (existingBreak.ispaused) {
  return NextResponse.json({ error: "Break already paused" }, { status: 400 })
}

if (existingBreak.pauseused) {
  return NextResponse.json({ error: "Break pause already used for this break" }, { status: 400 })
}

// Proper time calculation
const expectedDuration = existingBreak.type === 'LUNCH' ? 3600 : 900
const remainingTime = Math.max(0, expectedDuration - elapsedTime)

// Update with correct field names
const updatedBreak = await prisma.break.update({
  where: { id: breakId },
  data: {
    ispaused: true,
    pausedat: now,
    pauseused: true,
    pausedduration: remainingTime
  }
})
```

**Why Important:**
- Prevents double-pausing
- Calculates remaining time correctly
- Better error messages
- WebSocket integration

---

### 3. Ticket Auto-Assignment by Department
**File:** `app/api/tickets/route.ts`  
**Commit:** `9e54608 fix tickets`

**Improvement:**
```typescript
// Auto-assign to correct department
const department = mapCategoryToDepartment(category)
let managementUserId: string | null = null

if (department) {
  const manager = await prisma.managementUser.findFirst({
    where: { department },
  })

  if (manager) {
    managementUserId = manager.id
    console.log(`✅ Auto-assigned ticket to ${manager.name} (${department})`)
  }
}

// Include department in responses
managementUser: {
  select: {
    id: true,
    name: true,
    email: true,
    role: true,
    avatar: true,
    department: true, // Added this!
  },
}
```

**Why Important:**
- Tickets auto-route to correct department
- Better UI display
- Improved logging

---

### 4. Performance Metrics JSON Field Names
**File:** `prisma/schema.prisma`  
**Commit:** `59bd686 Update schema.prisma`

**Fix:**
```prisma
model PerformanceMetric {
  // Consistent camelCase naming
  applicationsUsed  Json?  @default("[]") @map("applicationsused")
  visitedUrls       Json?  @default("[]") @map("visitedurls")
  screenshotUrls    Json?  @default("[]") @map("screenshoturls")
}
```

**Why Important:**
- Consistent naming
- Proper TypeScript types
- Prevents field access errors

---

## 🟪 Other Agent Branches (Lower Priority)

### Agent002-Cipher (Aaron)
- Same fixes as Raze (merged from same base)

### Agent004-Kira (Lovell)  
- Same fixes as Raze (merged from same base)

### Agent005-Shadow (Kyle)
- Added: `app/api/client/tasks/bulk/route.ts` (bulk task operations)
- UI improvements (headers stick to top)

### Agent006-Echo (Emman)
- Client ticket UI improvements
- Various UI polish

---

## 📋 Cherry-Pick Action Plan

### Phase 1: After GUNTING Complete
1. ✅ Verify GUNTING is 100% done and tested
2. ✅ Merge GUNTING to main
3. ✅ Create new branch: `fix/agent-branch-cherry-picks`

### Phase 2: Schema Updates
```bash
# Cherry-pick schema fixes
git checkout fix/agent-branch-cherry-picks
git cherry-pick 59bd686  # James's schema update

# Regenerate Prisma client
npx prisma generate

# Test
npm run dev
```

### Phase 3: API Fixes
```bash
# Cherry-pick individual files
git checkout origin/agent003-raze -- app/api/breaks/[id]/pause/route.ts
git checkout origin/agent003-raze -- app/api/tickets/route.ts

# Test each fix
npm run dev
# Test break pause functionality
# Test ticket auto-assignment
```

### Phase 4: Test Everything
1. Test break pause/resume
2. Test ticket creation with auto-assignment
3. Test performance metrics
4. Run full regression test
5. Check for conflicts with GUNTING

### Phase 5: Merge
```bash
git add -A
git commit -m "fix: Cherry-pick critical fixes from agent branches

- Fix Break model field naming (isPaused, pauseUsed, etc.)
- Improve break pause API validation and time calculation
- Add ticket auto-assignment by department
- Fix performance metrics JSON field names

Cherry-picked from agent003-raze (James)"

git push origin fix/agent-branch-cherry-picks

# Create PR for review
```

---

## ⚠️ IMPORTANT NOTES

1. **DO NOT merge entire agent branches** - Would delete GUNTING
2. **Test after EACH cherry-pick** - Don't cherry-pick everything at once
3. **Resolve conflicts carefully** - GUNTING code takes precedence
4. **Regenerate Prisma client** after schema changes
5. **Run full test suite** before merging to main

---

## 🎯 Expected Outcome

After cherry-picking these fixes:
- ✅ Break pause system works perfectly
- ✅ Tickets auto-assign to correct departments
- ✅ Performance metrics have consistent field names
- ✅ No loss of GUNTING functionality
- ✅ Best of both worlds!

---

## 📞 Questions?

Ask StepTen in #gunting or #development

**Next Action:** Complete GUNTING first, then execute this plan! 🚀

