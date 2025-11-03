# 🔧 ADMIN SNAKE_CASE FIX PLAN

> **Complete list of Admin files with camelCase → snake_case relation fixes needed**

---

## 📊 SUMMARY

- **Total Files to Fix**: 15
- **API Routes**: 9
- **Admin Pages**: 6
- **Priority**: HIGH (Breaking Production)

---

## 🚨 CRITICAL PRIORITY (Currently Failing)

### 1. `/app/api/admin/clients/route.ts` ❌ **FAILING**
**Lines 27-50**

**Current (WRONG):**
```typescript
const companies = await prisma.company.findMany({
  include: {
    clientUsers: {          // ❌ Line 28
      select: { ... }
    },
    staffUsers: {           // ❌ Line 36
      select: { ... }
    },
    accountManager: {       // ❌ Line 43
      select: { ... }
    }
  }
})
```

**Fix To:**
```typescript
const companies = await prisma.company.findMany({
  include: {
    client_users: {         // ✅ FIXED
      select: { ... }
    },
    staff_users: {          // ✅ FIXED
      select: { ... }
    },
    management_users: {     // ✅ FIXED (relation via accountManagerId)
      select: { ... }
    }
  }
})
```

---

### 2. `/app/api/admin/staff-analytics/[staffUserId]/route.ts` ❌ **FAILING**
**Lines 50-86**

**Current (WRONG):**
```typescript
const staffMember = await prisma.staff_users.findUnique({
  where: { id: staffUserId },
  include: {
    company: { ... },
    profile: {                  // ❌ Line 50
      select: { ... }
    },
    performanceMetrics: {       // ❌ Line 57
      where: { ... }
    },
    timeEntries: {              // ❌ Line 68
      where: { ... }
    }
  }
})
```

**Fix To:**
```typescript
const staffMember = await prisma.staff_users.findUnique({
  where: { id: staffUserId },
  include: {
    company: { ... },
    staff_profiles: {           // ✅ FIXED
      select: { ... }
    },
    performance_metrics: {      // ✅ FIXED
      where: { ... }
    },
    time_entries: {             // ✅ FIXED
      where: { ... }
    }
  }
})
```

**Also Line 240:**
```typescript
// OLD
profile: staffMember.profile,           // ❌

// FIX TO
profile: staffMember.staff_profiles,    // ✅
```

---

### 3. `/app/admin/staff/[id]/page.tsx` ❌ **FAILING**
**Lines 37-72**

**Current (WRONG):**
```typescript
const staffUser = await prisma.staff_users.findUnique({
  where: { id },
  include: {
    company: { ... },
    onboarding: {               // ❌ Line 37
      select: { ... }
    },
    profile: {                  // ❌ Line 43
      select: { ... }
    },
    welcomeForm: {              // ❌ Line 50
      select: { ... }
    }
  }
})
```

**Fix To:**
```typescript
const staffUser = await prisma.staff_users.findUnique({
  where: { id },
  include: {
    company: { ... },
    staff_onboarding: {         // ✅ FIXED
      select: { ... }
    },
    staff_profiles: {           // ✅ FIXED
      select: { ... }
    },
    staff_welcome_forms: {      // ✅ FIXED
      select: { ... }
    }
  }
})
```

---

### 4. `/app/api/admin/tickets/route.ts` ⚠️ **MIXED**
**Lines 63, 189**

**Current (PARTIALLY WRONG):**
```typescript
// Line 63 - ✅ CORRECT
include: {
  ticket_responses: { ... }   // This one is already correct!
}

// Line 189 - ❌ WRONG
include: {
  responses: { ... }          // This needs fixing
}
```

**Fix Line 189 To:**
```typescript
include: {
  ticket_responses: { ... }   // ✅ FIXED
}
```

---

## 🔧 HIGH PRIORITY (Type-Related)

### 5. `/app/admin/clients/[id]/page.tsx`
**Lines 18-50**

**Current (WRONG):**
```typescript
const company = await prisma.company.findUnique({
  where: { id },
  include: {
    clientUsers: { ... },       // ❌ Line 18
    staffUsers: { ... },        // ❌ Line 28
    accountManager: { ... }     // ❌ Line 41
  }
})
```

**Fix To:**
```typescript
const company = await prisma.company.findUnique({
  where: { id },
  include: {
    client_users: { ... },      // ✅ FIXED
    staff_users: { ... },       // ✅ FIXED
    management_users: { ... }   // ✅ FIXED
  }
})
```

**Also Update ALL references in the component:**
- Line 195: `company.accountManager` → `company.management_users`
- Line 224: `company.staffUsers` → `company.staff_users`
- Line 228: `company.clientUsers` → `company.client_users`
- Line 253: `company.staffUsers` → `company.staff_users`
- Line 259: `company.staffUsers` → `company.staff_users`
- Line 265: `company.staffUsers` → `company.staff_users`
- Line 287: `company.clientUsers` → `company.client_users`
- Line 293: `company.clientUsers` → `company.client_users`
- Line 299: `company.clientUsers` → `company.client_users`

**Also Update Type Definitions (Lines 25-27):**
```typescript
// OLD
staffUsers: { id: string; name: string; email: string }[]
clientUsers: { id: string; name: string; email: string; role: string }[]
accountManager: { id: string; name: string; email: string; department: string } | null

// FIX TO
staff_users: { id: string; name: string; email: string }[]
client_users: { id: string; name: string; email: string; role: string }[]
management_users: { id: string; name: string; email: string; department: string } | null
```

---

### 6. `/app/admin/clients/page.tsx`
**Type Definitions Only (Lines 25-27)**

**Current (WRONG):**
```typescript
interface Company {
  // ... other fields
  staffUsers: { id: string; name: string; email: string }[]
  clientUsers: { id: string; name: string; email: string; role: string }[]
  accountManager: { id: string; name: string; email: string; department: string } | null
}
```

**Fix To:**
```typescript
interface Company {
  // ... other fields
  staff_users: { id: string; name: string; email: string }[]
  client_users: { id: string; name: string; email: string; role: string }[]
  management_users: { id: string; name: string; email: string; department: string } | null
}
```

**Also Update ALL references:**
- Line 48: `clientUsers` → `client_users`
- Line 87: `clientUsers` → `client_users`
- Line 105: `clientUsers` → `client_users`
- Line 157: `clientUsers` → `client_users`
- Line 159: `clientUsers` → `client_users`
- Line 206: `staffUsers` → `staff_users`
- Line 212: `clientUsers` → `client_users`
- Line 286: `staffUsers` → `staff_users`
- Line 290: `clientUsers` → `client_users`
- Line 295: `accountManager` → `management_users`
- Line 298: `accountManager` → `management_users`
- Line 299: `accountManager` → `management_users`

---

### 7. `/app/admin/time-tracking/[id]/page.tsx`
**Line 43**

**Current (WRONG):**
```typescript
const timeEntry = await prisma.time_entries.findUnique({
  where: { id },
  include: {
    staff_users: { ... },       // ✅ This is correct
    profile: {                  // ❌ Line 43
      select: { ... }
    }
  }
})
```

**Fix To:**
```typescript
const timeEntry = await prisma.time_entries.findUnique({
  where: { id },
  include: {
    staff_users: { ... },       // ✅ Already correct
    staff_profiles: {           // ✅ FIXED
      select: { ... }
    }
  }
})
```

---

## 📝 MEDIUM PRIORITY (Works but needs consistency)

### 8. `/app/api/admin/staff-analytics/route.ts`
**Lines 51, 82**

**Current (MOSTLY CORRECT but inconsistent):**
```typescript
// Line 42 - ✅ Already uses performance_metrics correctly

// Line 82 - Check nested includes
include: {
  // Verify all nested relations use snake_case
}
```

---

### 9. `/app/api/admin/reviews/trigger-creation/route.ts`
**Lines 21, 27**

**Current (WRONG):**
```typescript
const staffUsers = await prisma.staff_users.findMany({
  where: {
    profile: {              // ❌ Line 21
      startDate: { ... }
    }
  },
  include: {
    profile: true           // ❌ Line 27
  }
})
```

**Fix To:**
```typescript
const staffUsers = await prisma.staff_users.findMany({
  where: {
    staff_profiles: {       // ✅ FIXED
      startDate: { ... }
    }
  },
  include: {
    staff_profiles: true    // ✅ FIXED
  }
})
```

---

### 10. `/app/api/admin/analytics/route.ts`
**Lines 42, 57-59**

**Current (WRONG):**
```typescript
// Line 42
include: {
  performanceMetrics: { ... }       // ❌
}

// Lines 57-59
include: {
  staffUsers: {                     // ❌
    include: {
      performanceMetrics: { ... }   // ❌
    }
  }
}
```

**Fix To:**
```typescript
// Line 42
include: {
  performance_metrics: { ... }      // ✅ FIXED
}

// Lines 57-59
include: {
  staff_users: {                    // ✅ FIXED
    include: {
      performance_metrics: { ... }  // ✅ FIXED
    }
  }
}
```

**Also Update Variable References:**
- Lines 73-313: All `staffUsers` → `staff_users`
- Line 42+: All `performanceMetrics` → `performance_metrics`
- Line 187: `company.staffUsers` → `company.staff_users`
- Line 313: `company.staffUsers` → `company.staff_users`
- Line 314: `company.staffUsers` → `company.staff_users`

---

### 11. `/app/api/admin/staff/offboarding/route.ts`
**Line 33 (Check)**

**Error suggests**: `prisma` object might be undefined or import issue

**Verify:**
```typescript
// Make sure this exists at top:
import { prisma } from "@/lib/prisma"

// Check line 33 includes
include: {
  // Verify all relations use snake_case
  staff_offboarding: true  // ✅ Should be correct
}
```

---

### 12. `/app/admin/staff/onboarding/[staffUserId]/page.tsx`
**Check Type Definitions**

Currently using transformations (Lines 75-79):
```typescript
onboarding: staffUser.staff_onboarding ? {
  // transforming snake_case to camelCase
} : null,
profile: staffUser.staff_profiles ? {
  // transforming
} : null
```

**This is actually OKAY** - it's transforming for the frontend.
Just verify the Prisma query uses `staff_onboarding` and `staff_profiles` (which it does).

---

### 13. `/app/admin/onboarding/[staffUserId]/page.tsx`
**Same as #12** - Already handles transformation correctly.

---

### 14. `/app/admin/staff/onboarding/page.tsx`
**Lines 30-82**

**Current (CORRECT in query, but check transformation):**
```typescript
// Query uses correct snake_case
include: {
  staff_onboarding: { ... }  // ✅ Line 30, 43, 49, 59 all correct
}

// Transformation at line 82
onboarding: staff.staff_onboarding  // ✅ Correct
```

**Status**: Already correct!

---

### 15. `/app/admin/onboarding/page.tsx`
**Lines 30-77**

**Current (CORRECT):**
```typescript
include: {
  staff_onboarding: { ... }  // ✅ Already correct
}
```

**Status**: Already correct!

---

## 📋 COMPLETE FIX CHECKLIST

### Files that MUST be fixed (Breaking Production):

- [ ] `/app/api/admin/clients/route.ts` - Lines 28, 36, 43
- [ ] `/app/api/admin/staff-analytics/[staffUserId]/route.ts` - Lines 50, 57, 68, 240
- [ ] `/app/admin/staff/[id]/page.tsx` - Lines 37, 43, 50
- [ ] `/app/api/admin/tickets/route.ts` - Line 189

### Files that need consistency fixes:

- [ ] `/app/admin/clients/[id]/page.tsx` - Lines 18, 28, 41, + all references
- [ ] `/app/admin/clients/page.tsx` - Type definitions + all references
- [ ] `/app/admin/time-tracking/[id]/page.tsx` - Line 43
- [ ] `/app/api/admin/reviews/trigger-creation/route.ts` - Lines 21, 27
- [ ] `/app/api/admin/analytics/route.ts` - Lines 42, 57-59, + all references
- [ ] `/app/api/admin/staff/offboarding/route.ts` - Verify imports

### Files that are CORRECT (No changes needed):

- ✅ `/app/admin/staff/onboarding/page.tsx` 
- ✅ `/app/admin/onboarding/page.tsx`
- ✅ `/app/api/admin/staff/onboarding/[staffUserId]/verify/route.ts`
- ✅ `/app/api/admin/staff/onboarding/[staffUserId]/complete/route.ts`
- ✅ `/app/api/admin/staff/onboarding/[staffUserId]/route.ts`
- ✅ `/app/api/admin/staff/onboarding/route.ts`

---

## 🎯 IMPLEMENTATION ORDER

### Phase 1: Critical Production Fixes (Do First)
1. `/app/api/admin/clients/route.ts`
2. `/app/api/admin/staff-analytics/[staffUserId]/route.ts`
3. `/app/admin/staff/[id]/page.tsx`
4. `/app/api/admin/tickets/route.ts` (line 189 only)

### Phase 2: Page Component Fixes
5. `/app/admin/clients/[id]/page.tsx`
6. `/app/admin/clients/page.tsx`
7. `/app/admin/time-tracking/[id]/page.tsx`

### Phase 3: Additional API Routes
8. `/app/api/admin/reviews/trigger-creation/route.ts`
9. `/app/api/admin/analytics/route.ts`
10. `/app/api/admin/staff/offboarding/route.ts` (verify only)

---

## 📖 RELATION MAPPING REFERENCE

| ❌ camelCase (Wrong) | ✅ snake_case (Correct) |
|---------------------|------------------------|
| `clientUsers` | `client_users` |
| `staffUsers` | `staff_users` |
| `accountManager` | `management_users` |
| `onboarding` | `staff_onboarding` |
| `profile` | `staff_profiles` |
| `welcomeForm` | `staff_welcome_forms` |
| `performanceMetrics` | `performance_metrics` |
| `timeEntries` | `time_entries` |
| `responses` (tickets) | `ticket_responses` |
| `gamificationProfile` | `gamification_profiles` |
| `employmentContract` | `employment_contracts` |
| `jobAcceptance` | `job_acceptances` |

---

## 🚀 READY TO FIX?

**Estimated Time**: 30-45 minutes for all fixes

**Should I proceed with:**
1. ✅ **Phase 1 only** (Critical production fixes - 4 files)
2. ✅ **All Phases** (Complete fix - 10 files)
3. ✅ **Show me one file at a time for approval**

Let me know and I'll start fixing! 🛠️

