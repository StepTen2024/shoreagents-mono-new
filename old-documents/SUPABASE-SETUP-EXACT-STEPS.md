# Supabase Storage Setup - Exact Steps

## ⚠️ Important Note

**Prisma cannot create Supabase storage buckets.** Prisma only manages PostgreSQL database tables. Storage buckets must be created through Supabase UI or API.

This guide provides **exact copy-paste instructions** for manual setup.

---

## Option 1: Supabase Dashboard UI (Recommended - 5 minutes)

### Step 1: Create the Bucket

1. Go to your Supabase project: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
2. Click **Storage** in the left sidebar
3. Click **New bucket** button
4. Fill in:
   - **Name:** `staff` (exact spelling, lowercase)
   - **Public bucket:** ✅ CHECK THIS BOX
   - **File size limit:** Leave default or set to 5242880 (5MB)
   - **Allowed MIME types:** Leave empty or add: `image/jpeg,image/jpg,image/png,application/pdf`
5. Click **Create bucket**

### Step 2: Apply RLS Policies

1. In Supabase Dashboard, click **SQL Editor** in left sidebar
2. Click **New query**
3. **Copy and paste ALL 4 commands below** (one at a time or all together):

```sql
-- Policy 1: Allow authenticated users to view files
CREATE POLICY "Allow authenticated users to view staff files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'staff');

-- Policy 2: Allow staff to upload to their own folder
CREATE POLICY "Staff can upload to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'staff' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Allow staff to update their own files
CREATE POLICY "Staff can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'staff' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Allow staff to delete their own files
CREATE POLICY "Staff can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'staff' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

4. Click **RUN** button
5. Verify you see "Success. No rows returned"

### Step 3: Verify Setup

1. Go back to **Storage** → Click `staff` bucket
2. Click **Policies** tab
3. Verify you see 4 policies:
   - ✅ "Allow authenticated users to view staff files" (SELECT)
   - ✅ "Staff can upload to their own folder" (INSERT)
   - ✅ "Staff can update their own files" (UPDATE)
   - ✅ "Staff can delete their own files" (DELETE)

**Done!** Your storage is ready.

---

## Option 2: Supabase Management API (For Automation)

If you want to automate this, you can use the Supabase Management API or JavaScript SDK:

### Create Script: `scripts/setup-supabase-storage.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupStorage() {
  console.log('🔧 Setting up Supabase storage...')

  // 1. Create bucket (may fail if exists - that's ok)
  const { data: bucket, error: bucketError } = await supabase
    .storage
    .createBucket('staff', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
    })

  if (bucketError && !bucketError.message.includes('already exists')) {
    console.error('❌ Failed to create bucket:', bucketError)
    return
  }

  console.log('✅ Bucket created or already exists')

  // 2. Apply RLS policies via SQL
  const policies = [
    `CREATE POLICY "Allow authenticated users to view staff files"
     ON storage.objects FOR SELECT
     TO authenticated
     USING (bucket_id = 'staff');`,
    
    `CREATE POLICY "Staff can upload to their own folder"
     ON storage.objects FOR INSERT
     TO authenticated
     WITH CHECK (
       bucket_id = 'staff' AND
       (storage.foldername(name))[1] = auth.uid()::text
     );`,
    
    `CREATE POLICY "Staff can update their own files"
     ON storage.objects FOR UPDATE
     TO authenticated
     USING (
       bucket_id = 'staff' AND
       (storage.foldername(name))[1] = auth.uid()::text
     );`,
    
    `CREATE POLICY "Staff can delete their own files"
     ON storage.objects FOR DELETE
     TO authenticated
     USING (
       bucket_id = 'staff' AND
       (storage.foldername(name))[1] = auth.uid()::text
     );`
  ]

  // Note: You'll need to run these via Supabase SQL Editor or pg client
  console.log('⚠️  Run these SQL commands in Supabase SQL Editor:')
  console.log('=''.repeat(60))
  policies.forEach((policy, i) => {
    console.log(`\n-- Policy ${i + 1}:`)
    console.log(policy)
  })
  console.log('\n' + '='.repeat(60))

  console.log('\n✅ Setup instructions displayed. Run the SQL commands manually.')
}

setupStorage()
```

Then run:
```bash
npx tsx scripts/setup-supabase-storage.ts
```

**Note:** This still requires manual SQL execution because bucket policies aren't exposed in the JS SDK yet.

---

## Option 3: One-Click SQL Script

If you just want ONE script to run in Supabase SQL Editor, here it is:

### 📋 Copy This Entire Block:

```sql
-- ==============================================
-- STAFF ONBOARDING STORAGE SETUP
-- ==============================================
-- Run this in Supabase SQL Editor
-- Bucket must be created via UI first!
-- ==============================================

-- Drop existing policies if re-running (optional)
DROP POLICY IF EXISTS "Allow authenticated users to view staff files" ON storage.objects;
DROP POLICY IF EXISTS "Staff can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Staff can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete their own files" ON storage.objects;

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

-- Verify policies were created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%staff%'
ORDER BY policyname;
```

**Instructions:**
1. First create `staff` bucket via UI (Step 1 above)
2. Copy entire SQL block above
3. Paste into Supabase SQL Editor
4. Click RUN
5. Should see 4 policies listed at the end

---

## Quick Verification Checklist

After setup, verify:

### 1. Check Bucket Exists
```bash
# In browser DevTools console on your app:
const { data } = await supabase.storage.listBuckets()
console.log(data.find(b => b.name === 'staff'))
// Should show: { id: '...', name: 'staff', public: true, ... }
```

### 2. Check Policies Exist
```sql
-- Run in Supabase SQL Editor:
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%staff%';
```

Should return 4 rows.

### 3. Test Upload (Optional)
1. Sign up/login as staff user
2. Go to `/onboarding`
3. Try uploading a file in Step 3
4. Should see green checkmark
5. Check Supabase Storage → `staff` bucket → Should see file

---

## Exact Folder Structure Created

Once staff upload files, you'll see this structure in Supabase Storage:

```
staff/  (bucket)
├── staff_valid_id/
│   └── {authUserId}/
│       └── validId.pdf
├── staff_birth_cert/
│   └── {authUserId}/
│       └── birthCert.pdf
├── staff_nbi_clearance/
│   └── {authUserId}/
│       └── nbiClearance.pdf
├── staff_police_clearance/
│   └── {authUserId}/
│       └── policeClearance.pdf
├── staff_id_photo/
│   └── {authUserId}/
│       └── idPhoto.jpg
├── staff_signature/
│   └── {authUserId}/
│       └── signature.png
├── staff_sss/
│   └── {authUserId}/
│       └── sssDoc.pdf
├── staff_tin/
│   └── {authUserId}/
│       └── tinDoc.pdf
├── staff_philhealth/
│   └── {authUserId}/
│       └── philhealthDoc.pdf
├── staff_pagibig/
│   └── {authUserId}/
│       └── pagibigDoc.pdf
├── staff_avatar/
│   └── {authUserId}/
│       └── avatar.jpg
└── staff_cover/
    └── {authUserId}/
        └── cover.jpg
```

Folders are created automatically on first upload.

---

## Troubleshooting

### "Bucket already exists"
✅ This is fine! Just skip to RLS policies step.

### "Permission denied" when uploading
❌ RLS policies not applied correctly. Re-run SQL commands.

### "Bucket not found"
❌ Bucket name must be exactly `staff` (lowercase). Create it via UI.

### Files not showing in admin portal
❌ Check if files actually uploaded to Supabase Storage. Check database `staff_onboarding` table for URLs.

### "Storage API URL is not set"
❌ Check environment variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
```

---

## Time Estimates

- **Bucket creation via UI:** 1 minute
- **RLS policies via SQL:** 2 minutes
- **Verification:** 2 minutes
- **Total:** ~5 minutes

---

## Summary: Exact Steps

1. ✅ **Go to Supabase Dashboard → Storage**
2. ✅ **Click "New bucket"**
3. ✅ **Name: `staff`, Public: ✅, Click Create**
4. ✅ **Go to SQL Editor**
5. ✅ **Copy-paste all 4 policies (see Option 3 above)**
6. ✅ **Click RUN**
7. ✅ **Verify 4 policies exist in Storage → staff → Policies tab**
8. ✅ **Done!**

---

**That's it!** No Prisma needed, no complex setup. Just UI + SQL.


