# Staff Bucket Setup - Supabase Storage

## Overview
The `staff` bucket is used to store avatar and cover photos for BPO workers (staff users).

## Bucket Structure

```
staff/
├── staff_avatar/
│   └── {userId}/
│       └── avatar.jpg
└── staff_cover/
    └── {userId}/
        └── cover.jpg
```

**Important:** The `staff` bucket uses subfolders like the `client` bucket:
- Avatar files: `staff/staff_avatar/{userId}/avatar.jpg`
- Cover files: `staff/staff_cover/{userId}/cover.jpg`
- `{userId}` = the `authUserId` field from `staff_users` table (Supabase auth.users.id)

## Required Configuration

### 1. Create Bucket

In Supabase Dashboard → Storage:
- Create bucket named `staff`
- Set to **Public** bucket
- MIME types: `image/*`

### 2. Apply RLS Policies

Run these SQL commands in Supabase SQL Editor:

```sql
-- Policy 1: SELECT (View Files)
CREATE POLICY "Allow authenticated users to view staff files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'staff');

-- Policy 2: INSERT (Upload Files)
CREATE POLICY "Staff can upload to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'staff' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: UPDATE (Replace Files)
CREATE POLICY "Staff can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'staff' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: DELETE (Remove Files)
CREATE POLICY "Staff can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'staff' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

## API Routes

### Avatar Upload
- **Endpoint:** `POST /api/staff/profile/avatar`
- **Bucket:** `staff`
- **Path:** `staff_avatar/{authUserId}/avatar.jpg`
- **Max Size:** 5MB
- **Types:** Images only

### Cover Photo Upload
- **Endpoint:** `POST /api/staff/profile/cover`
- **Bucket:** `staff`
- **Path:** `staff_cover/{authUserId}/cover.jpg`
- **Max Size:** 5MB
- **Types:** Images only

## Testing

### 1. Verify Bucket Exists
1. Go to Supabase Dashboard → Storage
2. Confirm `staff` bucket is created and public

### 2. Test Upload
1. Login as staff user: http://localhost:3000/login/staff
2. Navigate to profile: http://localhost:3000/profile
3. Click camera icon on avatar → upload image
4. Click "Change Cover" button → upload image
5. Check Supabase Storage → `staff` bucket → should see:
   - `staff_avatar/{userId}/avatar.jpg`
   - `staff_cover/{userId}/cover.jpg`

### 3. Verify RLS Policies
1. Go to Supabase Dashboard → Storage → `staff` bucket → Policies
2. Confirm 4 policies exist (SELECT, INSERT, UPDATE, DELETE)
3. Test: Try uploading as different user → should only allow uploads to own folder

## Comparison with Other Buckets

| Bucket | Structure | Example Path |
|--------|-----------|--------------|
| **management** | Simple | `management/{userId}/avatar.jpg` |
| **staff** | Subfolders | `staff/staff_avatar/{userId}/avatar.jpg` |
| **client** | Subfolders | `client/client_avatar/{userId}/avatar.jpg` |
| **company** | By org | `company/{organizationId}/logo.jpg` |

## Current Status

✅ **API Routes Created**
- `/api/staff/profile/avatar` - Avatar upload
- `/api/staff/profile/cover` - Cover upload
- `/api/profile` - Fetch staff profile

✅ **Profile Page Created**
- `/app/profile/page.tsx` - Staff profile with avatar/cover upload UI

⚠️ **Requires Verification**
- [ ] Confirm `staff` bucket exists in Supabase
- [ ] Confirm bucket is set to public
- [ ] Confirm RLS policies are applied
- [ ] Test avatar upload end-to-end
- [ ] Test cover photo upload end-to-end
- [ ] Verify files appear in correct folder structure

## Database Fields

The `staff_users` table includes:
- `avatar` (String?) - Stores full public URL from Supabase
- `coverPhoto` (String?) - Stores full public URL from Supabase

These are updated automatically when files are uploaded.

---

**Created:** 2025-10-14  
**Status:** Implementation complete, requires Supabase configuration verification

