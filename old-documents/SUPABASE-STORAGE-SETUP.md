# 🗄️ SUPABASE STORAGE SETUP

## ⚠️ CRITICAL: Bucket Structure

### **We Have 4 BUCKETS (Not 6, Not 9!)**

```
✅ management  (Public) - Shore Agents staff avatars/covers
✅ staff       (Public) - BPO Workers avatars/covers  
✅ client      (Public) - Client users avatars/covers
✅ company     (Public) - Company logos, brand assets, documents
```

---

## 📁 Folder Structure INSIDE Buckets

### **Files are organized by USER ID inside each bucket:**

```
management/
├── {userId-1}/
│   ├── avatar.jpg
│   ├── cover.jpg
│   ├── documents/
│   │   ├── contract.pdf
│   │   └── id-proof.jpg
│   └── signature.png
└── {userId-2}/
    ├── avatar.jpg
    └── cover.jpg

staff/
├── {userId-1}/
│   ├── avatar.jpg
│   ├── cover.jpg
│   └── documents/
│       └── resume.pdf
└── {userId-2}/
    └── avatar.jpg

client/
├── client_avatar/
│   ├── {userId-1}/
│   │   └── avatar.jpg
│   └── {userId-2}/
│       └── avatar.jpg
├── client_cover/
│   ├── {userId-1}/
│   │   └── cover.jpg
│   └── {userId-2}/
│       └── cover.jpg
└── documents/
    └── {userId-1}/
        └── contract.pdf

company/
├── {organizationId-1}/
│   ├── logo.jpg
│   ├── company_asset/
│   │   ├── brand-guidelines.pdf
│   │   └── style-guide.png
│   └── company_logo/
│       ├── primary-logo.svg
│       └── secondary-logo.png
└── {organizationId-2}/
    └── logo.jpg
```

---

## 🔧 Code Usage

### ❌ **WRONG - DON'T DO THIS:**
```typescript
// NO! These are NOT bucket names!
.from('management_avatar')  // ❌ Wrong!
.from('staff_cover')        // ❌ Wrong!
```

### ✅ **CORRECT - DO THIS:**
```typescript
// Upload management user avatar
const filePath = `${userId}/avatar.jpg`
await supabaseAdmin.storage
  .from('management')  // ✅ Bucket name
  .upload(filePath, file)

// Upload staff user cover
const filePath = `${userId}/cover.jpg`
await supabaseAdmin.storage
  .from('staff')  // ✅ Bucket name
  .upload(filePath, file)
```

---

## 📋 File Path Pattern

```javascript
// Management user
bucket: 'management'
path: `${userId}/avatar.jpg`
full: `management/${userId}/avatar.jpg`

// Staff user  
bucket: 'staff'
path: `${userId}/avatar.jpg`
full: `staff/${userId}/avatar.jpg`

// Client user avatar
bucket: 'client'
path: `client_avatar/${userId}/avatar.jpg`
full: `client/client_avatar/${userId}/avatar.jpg`

// Client user cover
bucket: 'client'
path: `client_cover/${userId}/cover.jpg`
full: `client/client_cover/${userId}/cover.jpg`

// Company assets (uses organizationId!)
bucket: 'company'
path: `${organizationId}/logo.jpg`
full: `company/${organizationId}/logo.jpg`
```

---

## 🔐 RLS Policies (Applied to ALL 4 Buckets)

### **Policy 1: SELECT (View Files)**
```sql
CREATE POLICY "Allow authenticated users to view [bucket] files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = '[bucket]');  -- Replace [bucket] with: management, staff, or client
```

### **Policy 2: INSERT (Upload Files)**
```sql
CREATE POLICY "Users can upload to their own folder in [bucket]"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = '[bucket]' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### **Policy 3: UPDATE (Replace Files)**
```sql
CREATE POLICY "Users can update their own files in [bucket]"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = '[bucket]' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### **Policy 4: DELETE (Remove Files)**
```sql
CREATE POLICY "Users can delete their own files in [bucket]"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = '[bucket]' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## 🎯 Current Implementation Status

### ✅ **Management Bucket**
- [x] Bucket created
- [x] RLS policies applied
- [x] Avatar upload working
- [x] Cover upload working
- [x] Used by: Shore Agents Management staff

### ✅ **Staff Bucket**
- [x] Bucket created
- [x] RLS policies applied
- [ ] Avatar upload (pending staff signup)
- [ ] Cover upload (pending staff signup)
- [ ] Used by: BPO Workers

### ✅ **Client Bucket**
- [x] Bucket created
- [x] RLS policies applied
- [ ] Avatar upload (pending client signup)
- [ ] Cover upload (pending client signup)
- [ ] Used by: Client users

### ✅ **Company Bucket**
- [x] Bucket created
- [x] Folders: `company_asset`, `company_logo`
- [x] RLS policies applied
- [ ] Logo upload (pending implementation)
- [ ] Brand assets upload (pending implementation)
- [ ] Used by: Organizations (indexed by organizationId)

---

## 🚨 REMEMBER:

1. **4 Buckets Total:** `management`, `staff`, `client`, `company`
2. **Folders by type:**
   - `management/staff/client` = Use `userId` (auth.uid())
   - `company` = Use `organizationId` (unique per company)
3. **File paths:**
   - Users: `{bucket}/{userId}/{filename}`
   - Companies: `company/{organizationId}/{filename}`
4. **NOT bucket names:** `management_avatar`, `company_logo`, etc. are just folder names!

---

## 📝 Example API Code

```typescript
// Management user avatar upload
const filePath = `${managementUser.authUserId}/avatar.jpg`
await supabaseAdmin.storage
  .from('management')
  .upload(filePath, buffer, { upsert: true })

// Get URL
const { data: { publicUrl } } = supabaseAdmin.storage
  .from('management')
  .getPublicUrl(filePath)
```

---

**Last Updated:** 2025-01-13  
**Status:** ✅ Working correctly

