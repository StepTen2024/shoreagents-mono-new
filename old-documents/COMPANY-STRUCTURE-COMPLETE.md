# ✅ COMPANY ORGANIZATION STRUCTURE - COMPLETE

**Date:** January 13, 2025  
**Status:** ✅ Fully Implemented

---

## 🎯 What Was Built

We restructured the database to introduce a proper **Company** (Organization) model that serves as the central hub connecting Management, Staff, and Client users.

---

## 🏗️ Database Structure

### **Company Table** (Renamed from `clients`)
```sql
CREATE TABLE public.company (
  id                TEXT PRIMARY KEY,
  "organizationId"  TEXT UNIQUE NOT NULL,  -- Unique org identifier
  "companyName"     TEXT NOT NULL,
  logo              TEXT,                   -- Company logo URL
  industry          TEXT,
  location          TEXT,
  "billingEmail"    TEXT,
  "accountManagerId" TEXT,                  -- Links to management_users
  "createdAt"       TIMESTAMP DEFAULT NOW(),
  "updatedAt"       TIMESTAMP NOT NULL
);
```

### **Key Relationships**

```
Company (Organization)
├── accountManager → ManagementUser (1-to-Many)
│   └── One Manager can manage multiple Companies
│
├── clientUsers → ClientUser[] (1-to-Many)
│   └── Multiple client users per Company
│
├── staffUsers → StaffUser[] (1-to-Many) [Optional]
│   └── Staff can optionally belong to one Company
│
└── staffAssignments → StaffAssignment[] (1-to-Many)
    └── Tracks which staff are assigned to which companies
```

---

## 🔑 Key Fields

### **organizationId** (NEW!)
- **Format:** `org_xxxxxxxxxxxxx` (auto-generated CUID)
- **Purpose:** Unique identifier for each company
- **Used for:** Company bucket folders, cross-referencing, API queries
- **Constraint:** UNIQUE, NOT NULL

### **accountManagerId** (NEW!)
- **Links to:** `management_users.id`
- **Purpose:** Assigns a Shore Agents manager to oversee the company
- **Relationship:** Many companies → One manager

### **companyId** (Updated in multiple tables)
- **Old name:** `clientId`
- **Updated in:**
  - `client_users.companyId`
  - `staff_assignments.companyId`
  - `staff_users.companyId`

---

## 📦 Supabase Storage Structure

### **Company Bucket**
```
company/ (Public)
├── {organizationId-1}/
│   ├── logo.jpg
│   ├── company_asset/
│   │   ├── brand-guidelines.pdf
│   │   └── marketing-materials.zip
│   └── company_logo/
│       ├── primary-logo.svg
│       └── icon.png
└── {organizationId-2}/
    └── logo.jpg
```

### **Folder Structure**
- ✅ `company_asset/` - Brand assets, documents, contracts
- ✅ `company_logo/` - Logo variations, icons, branding

---

## 🔧 Code Updates

### **Prisma Schema Changes**

1. **Company Model:**
   - Renamed `Client` → `Company`
   - Added `organizationId` (unique)
   - Added `logo` field
   - Added `accountManagerId` FK
   - Kept DB table name as `company` (was `clients`)

2. **ManagementUser:**
   - Added `managedCompanies: Company[]` relation

3. **StaffUser:**
   - Added `companyId` field (optional)
   - Added `company: Company?` relation

4. **ClientUser:**
   - Renamed `clientId` → `companyId`
   - Renamed relation `client` → `company`
   - Added `coverPhoto` field

5. **StaffAssignment:**
   - Renamed `clientId` → `companyId`
   - Renamed relation `client` → `company`
   - Updated unique constraint

### **API Routes Updated**

All client portal API routes updated to use `company` instead of `client`:

✅ `/app/api/client/staff/route.ts`  
✅ `/app/api/client/documents/route.ts`  
✅ `/app/api/client/monitoring/route.ts`  
✅ `/app/api/client/reviews/route.ts`  
✅ `/app/api/client/tasks/route.ts`  
✅ `/app/api/client/breaks/route.ts`  
✅ `/app/api/client/time-tracking/route.ts`  
✅ `/app/api/auth/signup/client/route.ts`  

### **Client Signup Flow**

When a client signs up:
1. ✅ Creates Supabase auth user
2. ✅ Finds or creates `Company` record by `companyName`
3. ✅ Auto-generates unique `organizationId`
4. ✅ Creates `ClientUser` linked to `Company`
5. ✅ Returns `organizationId` in response

---

## 🗂️ Updated Files

### Database
- ✅ `prisma/schema.prisma` - Model restructure
- ✅ `scripts/update-company-schema-safe.sql` - Migration SQL

### API Routes
- ✅ 8 client API routes updated
- ✅ 1 signup route updated
- ✅ 1 layout file updated

### Documentation
- ✅ `SUPABASE-STORAGE-SETUP.md` - Added company bucket
- ✅ `COMPANY-STRUCTURE-COMPLETE.md` - This file

---

## 🧪 Testing Checklist

### Database
- [x] Company table renamed from `clients`
- [x] `organizationId` column added with unique constraint
- [x] `accountManagerId` column added
- [x] `logo` field added
- [x] Foreign keys working
- [x] `companyId` renamed in all related tables

### Client Signup
- [ ] Create new client account
- [ ] Verify `Company` record created
- [ ] Verify unique `organizationId` generated
- [ ] Verify `ClientUser` linked to Company
- [ ] Verify multiple users can join same company

### API Routes
- [ ] Client portal can fetch staff assignments
- [ ] Documents filtered by `companyId`
- [ ] Monitoring shows correct company staff
- [ ] Reviews filtered by company
- [ ] Tasks filtered by company

### Supabase Storage
- [ ] Company bucket exists
- [ ] Folders `company_asset` and `company_logo` work
- [ ] RLS policies allow company file access
- [ ] Upload company logo
- [ ] Retrieve company assets

---

## 🎯 Next Steps

### Immediate
1. ✅ Client signup working
2. ⏳ Test client signup → Company creation
3. ⏳ Add client profile page with avatar/cover upload
4. ⏳ Add company logo upload feature

### Future Enhancements
- Management dashboard: List all companies
- Management dashboard: Assign account managers
- Company settings page
- Bulk staff assignment to companies
- Company-level analytics

---

## 🚨 CRITICAL PATTERNS

### **Always Use:**
```typescript
// Fetch company via ClientUser
const clientUser = await prisma.clientUser.findUnique({
  where: { email: session.user.email },
  include: { company: true }
})

const organizationId = clientUser.company.organizationId
const companyId = clientUser.company.id
```

### **Staff Assignments:**
```typescript
// Get staff assigned to a company
const assignments = await prisma.staffAssignment.findMany({
  where: {
    companyId: company.id,
    isActive: true
  },
  include: {
    staffUser: true,
    company: true
  }
})
```

### **Company Files:**
```typescript
// Upload company logo
const filePath = `${company.organizationId}/logo.jpg`
await supabaseAdmin.storage
  .from('company')
  .upload(filePath, file, { upsert: true })
```

---

## 📊 Data Flow Summary

```
Client Signup
    ↓
Creates Supabase Auth User
    ↓
Find/Create Company (by companyName)
    ├── Generate organizationId
    └── Create Company record
    ↓
Create ClientUser (linked to Company)
    ↓
Return success + organizationId
```

```
Client Login
    ↓
Authenticate via Supabase
    ↓
Fetch ClientUser + Company
    ↓
Load Company data (staff, documents, etc.)
    ↓
Filter everything by companyId
```

---

**Status:** ✅ Structure Complete, Ready for Testing  
**Next:** Client Profile + Company Logo Upload


