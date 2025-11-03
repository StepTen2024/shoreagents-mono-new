# 🔍 Client Upload Debug Guide

## Problem: Upload Hanging on Client Dashboard

### Quick Diagnosis Steps

#### Step 1: Test the Diagnostic Endpoint

While logged in as a client user, visit:
```
http://localhost:3000/api/client/test-upload
```

This will show you:
- ✅ Authentication status
- ✅ Supabase configuration
- ✅ Client bucket status
- ✅ File listing capability

---

#### Step 2: Check Supabase Environment Variables

Verify in your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # ⚠️ CRITICAL!
```

**The upload WILL HANG if `SUPABASE_SERVICE_ROLE_KEY` is missing!**

---

#### Step 3: Verify Client Bucket Exists in Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Storage** → **Buckets**
4. Verify you have these buckets:
   - ✅ `management` (Public)
   - ✅ `staff` (Public)
   - ✅ `client` (Public) ← **This one!**
   - ✅ `company` (Public)

**If `client` bucket is missing, create it:**

```
Name: client
Public: ✅ Yes (checked)
File Size Limit: 10MB
Allowed MIME types: image/*
```

---

#### Step 4: Apply RLS Policies

If the bucket exists but uploads still hang, run this in **Supabase SQL Editor**:

```sql
-- RLS Policies for CLIENT Bucket

-- 1. SELECT: Authenticated users can view files
CREATE POLICY "Allow authenticated users to view client files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'client');

-- 2. INSERT: Users can upload to their own folder
CREATE POLICY "Users can upload to their own folder in client"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. UPDATE: Users can update their own files
CREATE POLICY "Users can update their own files in client"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'client' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. DELETE: Users can delete their own files
CREATE POLICY "Users can delete their own files in client"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'client' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

---

#### Step 5: Check Browser Console

When uploading, open **DevTools** → **Console** and look for:

**Good Signs:**
```
POST /api/client/profile/avatar 200 OK
```

**Bad Signs (Hanging):**
```
POST /api/client/profile/avatar (pending...)  ← Stuck!
```

**Error Messages:**
```
Failed to upload: Bucket not found
Failed to upload: Service role key required
CORS error
```

---

#### Step 6: Test Management Upload (Working Comparison)

If management portal uploads work, compare:

**Management (Working):**
- Bucket: `management` ✅
- Route: `/api/admin/profile/avatar` ✅
- RLS Policies: Applied ✅

**Client (Hanging):**
- Bucket: `client` ❓
- Route: `/api/client/profile/avatar` ✅
- RLS Policies: ❓

**They should be IDENTICAL except for bucket name and user table!**

---

## Common Causes of Hanging

### 1. Missing Service Role Key
**Symptom:** Request hangs indefinitely

**Fix:**
```bash
# Add to .env.local
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Test:**
```bash
npm run dev
# Visit http://localhost:3000/api/client/test-upload
```

---

### 2. Bucket Doesn't Exist
**Symptom:** Request hangs or returns "Bucket not found"

**Fix:**
1. Go to Supabase Storage
2. Create `client` bucket (Public)
3. Restart your app

---

### 3. Wrong authUserId
**Symptom:** Upload fails with permission error

**Fix:**
Check if `clientUser.authUserId` matches the Supabase auth UID:

```typescript
// In /api/client/profile/avatar/route.ts
console.log("Client authUserId:", clientUser.authUserId)
console.log("Session user ID:", session.user.id)

// These MUST match!
```

---

### 4. CORS Issues
**Symptom:** Network error in browser console

**Fix:**
Ensure Supabase project has correct URL configured:
- **Allowed URLs** in Supabase settings should include `http://localhost:3000`

---

### 5. Timeout Issues
**Symptom:** Request hangs for 30+ seconds then fails

**Fix:**
Check your Supabase project status:
- Is it paused? (Free tier auto-pauses after inactivity)
- Network connectivity?
- Supabase status page: https://status.supabase.com

---

## Quick Fix Checklist

Run through this checklist:

- [ ] `.env.local` has `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `client` bucket exists in Supabase Storage
- [ ] `client` bucket is **Public**
- [ ] RLS policies applied (run SQL script)
- [ ] Restart Next.js dev server after `.env.local` changes
- [ ] Clear browser cache
- [ ] Test with `/api/client/test-upload`
- [ ] Check browser console for errors
- [ ] Verify Supabase project is active (not paused)

---

## Still Hanging?

### Enable Verbose Logging

Add to `/app/api/client/profile/avatar/route.ts`:

```typescript
export async function POST(req: NextRequest) {
  try {
    console.log("📸 Avatar upload started")
    
    const session = await auth()
    console.log("✅ Session:", session?.user?.id)
    
    const clientUser = await prisma.clientUser.findUnique({
      where: { authUserId: session.user.id }
    })
    console.log("✅ Client user found:", clientUser?.id)
    
    const formData = await req.formData()
    const file = formData.get('file') as File
    console.log("✅ File received:", file?.name, file?.size)
    
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    console.log("✅ Buffer created:", buffer.length, "bytes")
    
    const filePath = `${clientUser.authUserId}/avatar.jpg`
    console.log("📁 Uploading to:", filePath)
    
    console.log("🚀 Starting Supabase upload...")
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('client')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      })
    
    console.log("✅ Upload complete:", uploadData)
    console.log("❌ Upload error:", uploadError)
    
    // ... rest of code
  }
}
```

Then check terminal logs when uploading.

---

## Expected Working Flow

**Client Uploads Avatar:**

1. User clicks "Change Avatar" button
2. Frontend: File input opens
3. Frontend: User selects image
4. Frontend: `handleAvatarUpload()` creates FormData
5. Frontend: Sends POST to `/api/client/profile/avatar`
6. Backend: Authenticates user
7. Backend: Finds `clientUser` in database
8. Backend: Converts file to buffer
9. Backend: Uploads to Supabase Storage `client` bucket
10. Backend: Gets public URL
11. Backend: Updates `clientUser.avatar` in database
12. Backend: Returns success JSON
13. Frontend: Shows "Avatar uploaded successfully!"
14. Frontend: `router.refresh()` reloads page with new avatar

**Any step failing = hanging or error!**

---

## Compare Working vs Broken

### Management (Working) ✅

```typescript
// Route: /api/admin/profile/avatar/route.ts
const managementUser = await prisma.managementUser.findUnique({
  where: { authUserId: session.user.id }
})

const filePath = `${managementUser.authUserId}/avatar.jpg`

await supabaseAdmin.storage
  .from('management')  // ← Bucket name
  .upload(filePath, buffer, { upsert: true })

await prisma.managementUser.update({
  where: { id: managementUser.id },
  data: { avatar: publicUrl }
})
```

### Client (Hanging?) ❓

```typescript
// Route: /api/client/profile/avatar/route.ts
const clientUser = await prisma.clientUser.findUnique({
  where: { authUserId: session.user.id }
})

const filePath = `${clientUser.authUserId}/avatar.jpg`

await supabaseAdmin.storage
  .from('client')  // ← Bucket name (only difference!)
  .upload(filePath, buffer, { upsert: true })

await prisma.clientUser.update({
  where: { id: clientUser.id },
  data: { avatar: publicUrl }
})
```

**They're IDENTICAL! So the issue MUST be Supabase setup (bucket/policies) or env vars.**

---

## Final Test

If everything above passes, manually test the upload API:

```bash
# 1. Log in as client user and get session cookie
# 2. Create a test image file
# 3. Use curl or Postman:

curl -X POST http://localhost:3000/api/client/profile/avatar \
  -H "Cookie: your-session-cookie" \
  -F "file=@test-avatar.jpg"
```

Expected response:
```json
{
  "success": true,
  "url": "https://your-project.supabase.co/storage/v1/object/public/client/user-id/avatar.jpg"
}
```

---

**Last Updated:** 2025-10-14  
**Status:** Diagnostic tools added

