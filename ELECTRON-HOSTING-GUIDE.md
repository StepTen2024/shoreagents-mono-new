# 📤 **ELECTRON INSTALLER HOSTING GUIDE**

**How to host your Windows installer so staff can download it directly from the login page**

---

## 🎯 **OVERVIEW**

After building your installer (`Shore Agents-Setup-1.0.0.exe`), you need to host it somewhere so the download button works.

**3 Options:**
1. **Supabase Storage** (Recommended - Easy)
2. **Railway Public Folder** (Good for simple hosting)
3. **External CDN** (CloudFlare, AWS S3, etc.)

---

## ✅ **OPTION 1: SUPABASE STORAGE (RECOMMENDED)**

### **Why Supabase?**
- ✅ You're already using Supabase for database
- ✅ Free tier includes 1GB storage
- ✅ Fast CDN delivery
- ✅ Easy to update files
- ✅ Direct download URLs

### **Step 1: Create Public Bucket**

1. **Go to Supabase Dashboard**
   - https://supabase.com/dashboard
   - Select your project

2. **Click "Storage"** (left sidebar)

3. **Create New Bucket:**
   - Click "New bucket"
   - Name: `downloads`
   - Set to **PUBLIC** (important!)
   - Click "Create bucket"

### **Step 2: Upload Installer**

1. **Click on "downloads" bucket**

2. **Upload file:**
   - Click "Upload file"
   - Select `Shore Agents-Setup-1.0.0.exe`
   - Wait for upload (2-3 minutes for ~250 MB)

3. **Get Public URL:**
   - After upload, click the file
   - Click "Get URL"
   - Copy the URL

**URL format:**
```
https://[your-project-ref].supabase.co/storage/v1/object/public/downloads/Shore-Agents-Setup-1.0.0.exe
```

### **Step 3: Update Download Component**

Edit `components/staff/desktop-app-download.tsx`:

**Change line 9 from:**
```typescript
const downloadUrl = "/downloads/Shore-Agents-Setup-1.0.0.exe"
```

**To your Supabase URL:**
```typescript
const downloadUrl = "https://ijxxtnakmexuavidzzvx.supabase.co/storage/v1/object/public/downloads/Shore-Agents-Setup-1.0.0.exe"
```

**Save and deploy!**

---

## ⚙️ **OPTION 2: RAILWAY PUBLIC FOLDER**

### **Why Railway?**
- ✅ App and files in same place
- ✅ No extra service needed
- ✅ Fast delivery

### **Step 1: Create Public Folder**

In your project root:

```bash
mkdir -p public/downloads
```

### **Step 2: Add Installer**

Copy your built installer:

```bash
cp dist/Shore-Agents-Setup-1.0.0.exe public/downloads/
```

### **Step 3: Update .gitignore**

**Important:** Don't commit large binary files to Git!

Edit `.gitignore` and add:
```
# Electron installers
public/downloads/*.exe
dist/*.exe
```

### **Step 4: Upload to Railway**

**Option A: Manual Upload (if Railway supports it)**
- Use Railway CLI or dashboard file manager
- Upload to `public/downloads/` folder

**Option B: Use External Storage**
- This method is tricky for large files
- Recommended to use Supabase instead

### **Step 5: Update Download Component**

Edit `components/staff/desktop-app-download.tsx`:

**Change line 9 to:**
```typescript
const downloadUrl = "/downloads/Shore-Agents-Setup-1.0.0.exe"
```

**This serves from Railway's public folder.**

---

## 🌐 **OPTION 3: EXTERNAL CDN**

### **CloudFlare R2 (Free 10GB)**

1. **Create CloudFlare account**
2. **Go to R2 Storage**
3. **Create bucket:** `shoreagents-downloads`
4. **Upload installer**
5. **Make public**
6. **Get URL**

### **AWS S3**

1. **Create S3 bucket**
2. **Upload installer**
3. **Set public read permissions**
4. **Use CloudFront for CDN**
5. **Get distribution URL**

### **Google Drive (Quick & Free)**

**Not recommended for production, but works for testing:**

1. Upload to Google Drive
2. Right-click → Share → Anyone with link
3. Get shareable link
4. Convert to direct download link

**Convert Google Drive link:**
```
From: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
To: https://drive.google.com/uc?export=download&id=FILE_ID
```

---

## 🎯 **RECOMMENDED SETUP (SUPABASE)**

**Here's the complete workflow:**

### **1. Build Installer**
```bash
npm run electron:build:railway
```

**Result:** `dist/Shore Agents-Setup-1.0.0.exe`

### **2. Upload to Supabase**
- Go to Supabase Storage
- Bucket: `downloads` (public)
- Upload installer
- Copy public URL

### **3. Update Component**

Edit `components/staff/desktop-app-download.tsx`:

```typescript
const downloadUrl = "https://YOUR-PROJECT.supabase.co/storage/v1/object/public/downloads/Shore-Agents-Setup-1.0.0.exe"
```

### **4. Deploy**
```bash
git add .
git commit -m "Add installer download link"
git push origin main
```

Railway auto-deploys!

### **5. Test**
- Go to: `https://your-railway-url.railway.app/login/staff`
- See download banner at top
- Click "Download for Windows"
- Installer downloads ✅

---

## 🔄 **UPDATING THE INSTALLER**

**When you release new version:**

### **1. Update Version**

Edit `package.json`:
```json
"version": "1.0.1"  ← Increment
```

### **2. Rebuild**
```bash
npm run electron:build:railway
```

**New file:** `Shore Agents-Setup-1.0.1.exe`

### **3. Upload New File**
- Upload to Supabase (or your chosen storage)
- Keep old version available for rollback

### **4. Update Component**

Edit `components/staff/desktop-app-download.tsx`:

```typescript
const appVersion = "1.0.1"  ← Update
const downloadUrl = "https://YOUR-PROJECT.supabase.co/storage/v1/object/public/downloads/Shore-Agents-Setup-1.0.1.exe"  ← Update
```

### **5. Deploy**
```bash
git add .
git commit -m "Update desktop app to v1.0.1"
git push origin main
```

**Staff see new version on login page!**

---

## 📊 **STORAGE COMPARISON**

| Option | Setup Time | Cost | Speed | Updates | Recommended |
|--------|-----------|------|-------|---------|-------------|
| **Supabase Storage** | 5 min | Free (1GB) | Fast CDN | Easy | ✅ **YES** |
| **Railway Public** | 10 min | Included | Fast | Medium | ⚠️ OK |
| **CloudFlare R2** | 15 min | Free (10GB) | Very Fast | Easy | ✅ Good |
| **AWS S3** | 20 min | ~$0.02/GB | Very Fast | Easy | ✅ Good |
| **Google Drive** | 2 min | Free | Slow | Easy | ❌ Testing only |

**Best choice: Supabase Storage** - You're already using it, free, fast, easy!

---

## 🔐 **SECURITY NOTES**

### **Public Access**
- Installer file must be publicly accessible
- No authentication required for download
- This is normal and safe

### **File Integrity**
**Optional: Add SHA256 checksum**

After building, generate checksum:
```bash
# macOS/Linux
shasum -a 256 dist/Shore-Agents-Setup-1.0.0.exe

# Windows (PowerShell)
Get-FileHash dist/Shore-Agents-Setup-1.0.0.exe -Algorithm SHA256
```

**Display checksum on download page** for advanced users to verify.

---

## 📱 **MOBILE/MAC SUPPORT (FUTURE)**

**Currently:** Windows only

**To add macOS:**
```bash
npm run electron:build:mac
```
**Result:** `.dmg` file for macOS

**To add Linux:**
```bash
npm run electron:build:linux
```
**Result:** `.AppImage` file for Linux

**Update component to show platform-specific downloads:**
```typescript
// Detect user's OS
const os = navigator.platform
const isMac = os.includes('Mac')
const isWindows = os.includes('Win')
const isLinux = os.includes('Linux')

// Show appropriate download button
```

---

## ✅ **QUICK START (SUPABASE)**

**5-minute setup:**

1. **Supabase Dashboard** → Storage → New bucket: `downloads` (public)
2. **Upload** `Shore Agents-Setup-1.0.0.exe`
3. **Copy URL** from Supabase
4. **Edit** `components/staff/desktop-app-download.tsx` line 9
5. **Replace** with your Supabase URL
6. **Deploy:** `git push origin main`
7. **Test:** Visit login page → Click download ✅

**Done!** 🎉

---

## 🐛 **TROUBLESHOOTING**

### **Download button doesn't work**
- Check URL in browser directly
- Verify file is publicly accessible
- Check browser console for errors

### **File not found (404)**
- Verify Supabase bucket is public
- Check file name matches exactly
- Verify URL is correct

### **Slow downloads**
- Use CDN (Supabase has built-in CDN)
- Consider CloudFlare R2 for better global distribution
- Check file isn't being proxied through Railway

### **Download shows "unsafe file"**
- Normal for unsigned Windows apps
- Staff click "Keep" or "Download anyway"
- Consider code signing certificate ($$$) for production

---

## 📚 **RESOURCES**

**Supabase Storage Docs:**
https://supabase.com/docs/guides/storage

**Railway Static Files:**
https://docs.railway.app/guides/public-networking

**CloudFlare R2:**
https://developers.cloudflare.com/r2/

---

**Recommended: Use Supabase Storage - easiest and fastest to set up!**


