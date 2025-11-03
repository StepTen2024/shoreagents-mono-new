# ✅ NEW Simplified Storage Structure

## 🎯 What Changed

You suggested a **much better structure** and we've implemented it!

### ❌ Old Structure (Too Complex)
```
staff/
├── staff_valid_id/
│   └── {userId}/valid-id.pdf
├── staff_birth_cert/
│   └── {userId}/birth-cert.pdf
├── staff_nbi_clearance/
│   └── {userId}/nbi-clearance.pdf
├── staff_police_clearance/
│   └── {userId}/police-clearance.pdf
├── staff_id_photo/
│   └── {userId}/id-photo.jpg
├── staff_signature/
│   └── {userId}/signature.png
├── staff_sss/
│   └── {userId}/sss-doc.pdf
├── staff_tin/
│   └── {userId}/tin-doc.pdf
├── staff_philhealth/
│   └── {userId}/philhealth-doc.pdf
└── staff_pagibig/
    └── {userId}/pagibig-doc.pdf
```
**Problem:** 10+ separate top-level folders, hard to find all docs for one staff member

---

### ✅ NEW Structure (Simple & Organized)
```
staff/
└── staff_onboarding/
    ├── {userId-1}/
    │   ├── valid-id.pdf
    │   ├── birth-cert.pdf
    │   ├── nbi-clearance.pdf
    │   ├── police-clearance.pdf
    │   ├── bir-2316.pdf
    │   ├── certificate-employment.pdf
    │   ├── id-photo.jpg
    │   ├── signature.png
    │   ├── sss-doc.pdf
    │   ├── tin-doc.pdf
    │   ├── philhealth-doc.pdf
    │   └── pagibig-doc.pdf
    ├── {userId-2}/
    │   ├── valid-id.pdf
    │   ├── birth-cert.pdf
    │   └── (all their docs...)
    └── {userId-3}/
        └── (all their docs...)
```

**Benefits:**
- ✅ All documents for one staff member in ONE folder
- ✅ Easy to find: just look for their userId folder
- ✅ Easy to manage: delete folder = delete all docs
- ✅ Easy to download: download folder = get all docs
- ✅ Cleaner storage view in Supabase
- ✅ Simpler RLS policies

---

## 📋 Setup Instructions

Since you already have the `staff` bucket and `staff_onboarding` folder, you just need to update the RLS policies:

### Step 1: Run This SQL in Supabase SQL Editor

```sql
-- Drop old policies (if they exist)
DROP POLICY IF EXISTS "Allow authenticated users to view staff files" ON storage.objects;
DROP POLICY IF EXISTS "Staff can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Staff can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Staff can upload to their onboarding folder" ON storage.objects;
DROP POLICY IF EXISTS "Staff can update their onboarding files" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete their onboarding files" ON storage.objects;

-- NEW POLICIES for staff_onboarding/{userId}/ structure

-- Policy 1: Everyone can view (needed for profile pictures, admins viewing docs)
CREATE POLICY "Allow authenticated users to view staff files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'staff');

-- Policy 2: Upload - staff can ONLY upload to staff_onboarding/{their-uuid}/
CREATE POLICY "Staff can upload to their onboarding folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'staff' AND
  (storage.foldername(name))[1] = 'staff_onboarding' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy 3: Update - staff can ONLY update files in their own folder
CREATE POLICY "Staff can update their onboarding files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'staff' AND
  (storage.foldername(name))[1] = 'staff_onboarding' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy 4: Delete - staff can ONLY delete files in their own folder
CREATE POLICY "Staff can delete their onboarding files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'staff' AND
  (storage.foldername(name))[1] = 'staff_onboarding' AND
  (storage.foldername(name))[2] = auth.uid()::text
);
```

### Step 2: Verify Policies

Go to **Storage** → **staff** bucket → **Policies** tab

You should see 4 policies:
- ✅ "Allow authenticated users to view staff files" (SELECT)
- ✅ "Staff can upload to their onboarding folder" (INSERT)
- ✅ "Staff can update their onboarding files" (UPDATE)
- ✅ "Staff can delete their onboarding files" (DELETE)

---

## 🔧 Code Changes Made

We've updated:

1. ✅ `/app/api/onboarding/documents/upload/route.ts`
   - Changed from: `staff_valid_id/{userId}/doc.pdf`
   - Changed to: `staff_onboarding/{userId}/valid-id.pdf`

2. ✅ `/app/api/onboarding/signature/route.ts`
   - Changed from: `staff_signature/{userId}/signature.png`
   - Changed to: `staff_onboarding/{userId}/signature.png`

3. ✅ All filenames are now consistent with kebab-case:
   - `valid-id.pdf`
   - `birth-cert.pdf`
   - `nbi-clearance.pdf`
   - `police-clearance.pdf`
   - `bir-2316.pdf`
   - `certificate-employment.pdf`
   - `id-photo.jpg`
   - `signature.png`
   - `sss-doc.pdf`
   - `tin-doc.pdf`
   - `philhealth-doc.pdf`
   - `pagibig-doc.pdf`

---

## 🧪 Testing

### Test Upload Flow

1. Sign up as a new staff member
2. Go to `/onboarding`
3. Upload a document in Step 3
4. Check Supabase Storage → `staff` → `staff_onboarding` → You should see a new folder with the staff member's UUID
5. Inside that folder, you should see the uploaded file

### Example Result

If staff member's UUID is `abc-123-def-456`, you'll see:

```
staff/
└── staff_onboarding/
    └── abc-123-def-456/
        ├── valid-id.pdf      ← uploaded
        ├── birth-cert.pdf    ← uploaded
        └── signature.png     ← uploaded
```

### Verify in Database

Check `staff_onboarding` table - URLs should look like:

```
https://xxx.supabase.co/storage/v1/object/public/staff/staff_onboarding/abc-123-def-456/valid-id.pdf
```

---

## 🔍 How RLS Policies Work

### Folder Path Array

When a file is stored at: `staff/staff_onboarding/abc-123-def-456/valid-id.pdf`

The `storage.foldername(name)` returns: `['staff_onboarding', 'abc-123-def-456']`

So:
- `[1]` = `'staff_onboarding'` (first folder)
- `[2]` = `'abc-123-def-456'` (userId)

### Policy Check

```sql
(storage.foldername(name))[1] = 'staff_onboarding' AND
(storage.foldername(name))[2] = auth.uid()::text
```

This ensures:
1. File must be in `staff_onboarding` folder
2. Second folder must match the logged-in user's UUID

**Result:** Staff can ONLY upload to their own folder!

---

## 📊 Benefits Summary

| Feature | Old Structure | New Structure |
|---------|---------------|---------------|
| Folders per staff | 12 separate folders | 1 folder |
| Find all docs | Search 12 places | Look in 1 place |
| Download all docs | Download 12 folders | Download 1 folder |
| Delete all docs | Delete from 12 places | Delete 1 folder |
| RLS complexity | Check folder name | Check 2 levels |
| Storage view | Cluttered (100+ folders) | Clean (1 folder per staff) |

---

## 🎯 What You Need to Do

1. ✅ **Run the SQL above** in Supabase SQL Editor (Step 1)
2. ✅ **Verify 4 policies exist** (Step 2)
3. ✅ **Test by uploading a file** through the onboarding wizard
4. ✅ **Check Supabase Storage** to see the new folder structure

That's it! The code is already updated.

---

## 🤔 What About Existing Files?

If you already uploaded files with the old structure, you have 2 options:

### Option 1: Start Fresh (Recommended for Testing)
- Delete all files in `staff` bucket
- Test uploads will use new structure

### Option 2: Keep Old Files
- Old files will stay in old folders (still accessible via URLs)
- New uploads will use new structure
- Eventually migrate old files to new structure manually or via script

For a new system (not in production yet), **Option 1 is simplest**.

---

## 📱 File Names Reference

When you see these in Supabase Storage:

| File Name | Document Type | Purpose |
|-----------|---------------|---------|
| `valid-id.pdf` | Valid ID | Government-issued ID |
| `birth-cert.pdf` | Birth Certificate | PSA Birth Certificate |
| `nbi-clearance.pdf` | NBI Clearance | National Bureau of Investigation |
| `police-clearance.pdf` | Police Clearance | Local police clearance |
| `bir-2316.pdf` | BIR Form 2316 | Tax certificate |
| `certificate-employment.pdf` | COE | Certificate of Employment |
| `id-photo.jpg` | ID Photo | 2x2 photo |
| `signature.png` | Signature | E-signature |
| `sss-doc.pdf` | SSS Document | Social Security System ID |
| `tin-doc.pdf` | TIN Document | Tax ID Number document |
| `philhealth-doc.pdf` | PhilHealth Document | PhilHealth ID |
| `pagibig-doc.pdf` | Pag-IBIG Document | Pag-IBIG (HDMF) ID |

---

**Status:** ✅ Code updated, ready for new RLS policies!


