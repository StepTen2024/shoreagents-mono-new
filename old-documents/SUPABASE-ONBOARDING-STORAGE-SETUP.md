# Supabase Storage Setup for Staff Onboarding

## Overview

This guide walks you through setting up the Supabase storage bucket and RLS policies required for the staff onboarding document upload system.

---

## Step 1: Create the `staff` Bucket

1. Go to **Supabase Dashboard** → **Storage**
2. Click **New bucket**
3. Bucket name: `staff`
4. Set to **Public** bucket ✓
5. Click **Create bucket**

---

## Step 2: Apply RLS Policies

Go to **Supabase Dashboard** → **SQL Editor** and run the following commands:

### Policy 1: SELECT (View Files)
```sql
CREATE POLICY "Allow authenticated users to view staff files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'staff');
```

### Policy 2: INSERT (Upload Files)
```sql
CREATE POLICY "Staff can upload to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'staff' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 3: UPDATE (Replace Files)
```sql
CREATE POLICY "Staff can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'staff' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 4: DELETE (Remove Files)
```sql
CREATE POLICY "Staff can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'staff' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## Folder Structure

The system uses the following folder structure within the `staff` bucket:

```
staff/
├── staff_valid_id/{userId}/validId.pdf
├── staff_birth_cert/{userId}/birthCert.pdf
├── staff_nbi_clearance/{userId}/nbiClearance.pdf
├── staff_police_clearance/{userId}/policeClearance.pdf
├── staff_bir_2316/{userId}/birForm2316.pdf
├── staff_cert_employment/{userId}/certificateEmp.pdf
├── staff_id_photo/{userId}/idPhoto.jpg
├── staff_signature/{userId}/signature.png
├── staff_sss/{userId}/sssDoc.pdf
├── staff_tin/{userId}/tinDoc.pdf
├── staff_philhealth/{userId}/philhealthDoc.pdf
├── staff_pagibig/{userId}/pagibigDoc.pdf
├── staff_avatar/{userId}/avatar.jpg (for profile pics)
└── staff_cover/{userId}/cover.jpg (for profile covers)
```

**Total: 14 document folders + 2 profile image folders**

---

## Document Types Mapping

| Document Type (API) | Folder Name | DB Field | File Types |
|-------------------|-------------|----------|------------|
| `validId` | `staff_valid_id` | `validIdUrl` | PDF, JPG, PNG |
| `birthCert` | `staff_birth_cert` | `birthCertUrl` | PDF, JPG, PNG |
| `nbiClearance` | `staff_nbi_clearance` | `nbiClearanceUrl` | PDF, JPG, PNG |
| `policeClearance` | `staff_police_clearance` | `policeClearanceUrl` | PDF, JPG, PNG |
| `birForm2316` | `staff_bir_2316` | `birForm2316Url` | PDF, JPG, PNG |
| `certificateEmp` | `staff_cert_employment` | `certificateEmpUrl` | PDF, JPG, PNG |
| `idPhoto` | `staff_id_photo` | `idPhotoUrl` | JPG, PNG |
| `sssDoc` | `staff_sss` | `sssDocUrl` | PDF, JPG, PNG |
| `tinDoc` | `staff_tin` | `tinDocUrl` | PDF, JPG, PNG |
| `philhealthDoc` | `staff_philhealth` | `philhealthDocUrl` | PDF, JPG, PNG |
| `pagibigDoc` | `staff_pagibig` | `pagibigDocUrl` | PDF, JPG, PNG |
| Signature | `staff_signature` | `signatureUrl` | JPG, PNG |

---

## File Size Limits

- **Documents**: 5MB max per file
- **Signature**: 2MB max per file
- **Avatar/Cover**: 5MB max per file

---

## Security Rules

### Staff Users:
✅ Can upload files to their own folder (based on `auth.uid()`)  
✅ Can update/replace files in their own folder  
✅ Can delete files in their own folder  
✅ Can view any file in the bucket (needed for profile avatars)

### Admin/Management Users:
✅ Can view all files (authenticated)  
❌ Cannot upload/modify/delete staff files (not in their folder)

### Section Locking:
- Once a section is **APPROVED**, the API prevents further uploads to that section
- This is enforced in the API routes, not in RLS policies

---

## Verification Checklist

After running the SQL commands, verify:

- [ ] `staff` bucket exists
- [ ] Bucket is set to **Public**
- [ ] 4 RLS policies exist (SELECT, INSERT, UPDATE, DELETE)
- [ ] Test upload as staff user (should work)
- [ ] Test viewing uploaded file (should work)
- [ ] Test uploading to another user's folder (should fail)

---

## Testing the Upload System

### 1. Staff Side Test

1. Sign up as a staff member at `/login/staff/signup`
2. Login and navigate to `/onboarding`
3. Complete steps 1 & 2 (Personal Info + Gov IDs)
4. On Step 3 (Documents):
   - Upload a test PDF or image for "Valid ID"
   - Check for green checkmark ✓
   - Upload files for other documents
5. On Step 4 (Signature):
   - Upload a signature image
   - Verify preview appears

### 2. Admin Side Test

1. Login as admin at `/login/admin`
2. Go to `/admin/staff/onboarding`
3. Find the test staff member
4. Click "View" to see their onboarding details
5. Verify all uploaded documents show "View Document" links
6. Click links to open documents in new tab
7. Verify signature preview displays correctly

### 3. Supabase Storage Test

1. Go to **Supabase Dashboard** → **Storage** → `staff` bucket
2. Verify folder structure exists:
   - `staff_valid_id/{staffUserId}/`
   - `staff_signature/{staffUserId}/`
   - etc.
3. Click on a file to view it
4. Verify the public URL works

---

## Troubleshooting

### Error: "Failed to upload file"

**Possible causes:**
1. Bucket doesn't exist → Create `staff` bucket
2. RLS policies not applied → Run SQL commands above
3. File size too large → Check file is under 5MB
4. Wrong file type → Check accepted types (PDF/JPG/PNG)

### Error: "Unauthorized"

**Possible causes:**
1. User not authenticated → Check session
2. Wrong bucket → Verify API is using `staff` bucket
3. RLS policy issue → Re-run SQL commands

### Documents not showing in admin portal

**Possible causes:**
1. Files not uploaded successfully → Check Supabase storage
2. Database field not updated → Check `staff_onboarding` table
3. Wrong URL stored → Verify public URL format

### Upload works but files not visible

**Possible causes:**
1. Bucket is private → Set to **Public**
2. RLS SELECT policy missing → Re-run Policy 1
3. URL format incorrect → Check if URL includes bucket name

---

## Environment Variables Required

Make sure these are set in your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Current Implementation Status

✅ **Complete:**
- Database schema with all 12 document URL fields
- Staff onboarding wizard with document upload UI
- Document upload API (`/api/onboarding/documents/upload`)
- Signature upload API (`/api/onboarding/signature`)
- Admin verification portal with document viewing
- File upload progress indicators
- Upload success/error handling
- Section locking when approved

⏳ **Pending:**
- Manual Supabase bucket creation
- Manual RLS policy application
- End-to-end testing with real uploads

---

## Next Steps

1. ✅ Create `staff` bucket in Supabase
2. ✅ Apply all 4 RLS policies
3. ✅ Test staff document upload flow
4. ✅ Test admin document viewing
5. ✅ Verify public URLs work correctly
6. Test complete onboarding → profile creation flow
7. Test with multiple document types
8. Verify file size limits work
9. Test section locking after approval

---

**Created:** 2025-10-14  
**Status:** Implementation complete, awaiting Supabase configuration


