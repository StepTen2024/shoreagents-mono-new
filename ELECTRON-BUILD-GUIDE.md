# 🚀 **ELECTRON WINDOWS INSTALLER BUILD GUIDE**

**Build and distribute Shore Agents Desktop App to your Windows team**

---

## 📋 **OVERVIEW**

**What You're Building:**
- Windows `.exe` installer
- Connects to Railway server (not localhost)
- Auto-update capability
- Desktop shortcuts
- Start menu entry

**Distribution:**
- Send `.exe` file to team
- They double-click to install
- No technical knowledge needed!

---

## ✅ **PREREQUISITES**

### **1. Railway Deployed** ✅
Your Next.js app must be running on Railway first.

**Get your Railway URL:**
```
https://your-app-name.railway.app
```

### **2. Node.js Installed**
Check version:
```bash
node --version  # Should be 18.x or higher
```

### **3. Project Dependencies Installed**
```bash
npm install
```

---

## 🔧 **STEP 1: PREPARE BUILD RESOURCES**

### **Create Icon (Optional but Recommended)**

Create a `build` folder in project root and add `icon.ico`:

```bash
mkdir build
```

**Option A: Use Online Converter**
1. Create 512x512 PNG of your logo
2. Go to https://convertio.co/png-ico/
3. Convert to ICO format
4. Save as `build/icon.ico`

**Option B: Use Default**
- Electron will use default icon if none provided
- Can add icon later

---

## 🚀 **STEP 2: BUILD FOR WINDOWS**

### **Method 1: Build with Railway URL (Recommended)**

**Update the build script with YOUR Railway URL:**

Open `package.json` and find line 22:
```json
"electron:build:railway": "cross-env API_BASE_URL=https://your-app.railway.app electron-builder --win --x64"
```

**Replace with YOUR Railway URL:**
```json
"electron:build:railway": "cross-env API_BASE_URL=https://shoreagents-production.railway.app electron-builder --win --x64"
```

**Then build:**
```bash
npm run electron:build:railway
```

**Build time:** 5-10 minutes (first build is slower)

---

### **Method 2: Build with Environment Variable**

**Set Railway URL:**
```bash
# Windows Command Prompt
set API_BASE_URL=https://shoreagents-production.railway.app
npm run electron:build

# Windows PowerShell
$env:API_BASE_URL="https://shoreagents-production.railway.app"
npm run electron:build

# macOS/Linux (for building from Mac)
export API_BASE_URL=https://shoreagents-production.railway.app
npm run electron:build
```

---

## 📦 **STEP 3: FIND THE INSTALLER**

**After successful build, find your installer:**

```
dist/Shore Agents-Setup-1.0.0.exe
```

**File size:** ~200-300 MB (includes Electron + all dependencies)

---

## 📤 **STEP 4: DISTRIBUTE TO TEAM**

### **Option A: Direct File Share (Easiest)**

**Upload installer to:**
- Google Drive
- Dropbox
- OneDrive
- Company file server

**Share link with team:**
> "Download Shore Agents-Setup-1.0.0.exe from [link] and double-click to install"

---

### **Option B: Create Portable Version**

**If you want a version that doesn't need installation:**

Update `electron-builder.yml`:
```yaml
win:
  target:
    - target: portable
      arch:
        - x64
```

Build again:
```bash
npm run electron:build:railway
```

**Result:** `dist/Shore Agents-1.0.0.exe` (portable, no install needed)

---

## 👥 **STEP 5: TEAM INSTALLATION**

### **For Team Members (Windows):**

1. **Download** `Shore Agents-Setup-1.0.0.exe`
2. **Double-click** the file
3. **Windows SmartScreen** may appear:
   - Click "More info"
   - Click "Run anyway"
   - *(This happens because app isn't code-signed)*
4. **Choose install location** (default is fine)
5. **Wait** for installation (1-2 minutes)
6. **Desktop shortcut** created automatically
7. **Click shortcut** to launch
8. **Login** with their staff credentials
9. **Clock in** and start working!

**App connects to:** Your Railway server automatically ✅

---

## 🔍 **STEP 6: VERIFY IT WORKS**

### **Test Before Distributing:**

**On your computer (or test Windows machine):**

1. Install the built `.exe`
2. Launch Shore Agents
3. Login as test staff user
4. Clock in
5. Wait 10 seconds
6. Check Electron console logs:
   - Should show verification logs ✅
   - Should show Railway URL in API calls ✅
   - Should NOT show localhost ❌

**Example good log:**
```
🚀 [SyncService] SENDING METRICS TO API
📍 URL: https://shoreagents-production.railway.app/api/analytics
✅ [SyncService] Metrics sent successfully!
```

**Example bad log:**
```
❌ URL: http://localhost:3000/api/analytics  ← WRONG!
```

If you see localhost, rebuild with Railway URL!

---

## 🐛 **TROUBLESHOOTING**

### **Issue: Build Fails**

**Error: "electron-builder not found"**
```bash
npm install electron-builder --save-dev
npm run electron:build:railway
```

**Error: "Cannot find module uiohook-napi"**
```bash
npm install
npm run electron:build:railway
```

---

### **Issue: Installer Runs but Can't Connect**

**Symptoms:**
- App opens but shows errors
- Clock in fails
- "Network error" messages

**Cause:** Electron still pointing to localhost

**Fix:**
1. Check build command includes API_BASE_URL
2. Rebuild with correct Railway URL
3. Test again

**Verify URL in code:**
```bash
# Check what URL is embedded
cat electron/config/trackerConfig.js | grep API_BASE_URL
```

---

### **Issue: Windows Defender Blocks Install**

**Symptoms:**
- "Windows protected your PC" message
- Can't install

**Fix:**
1. Click "More info"
2. Click "Run anyway"
3. This is normal for unsigned apps

**Optional: Code Sign App (Advanced)**
- Requires Windows code signing certificate ($$$)
- Not necessary for internal team use
- Eliminates SmartScreen warnings

---

### **Issue: Large File Size**

**Typical size:** 200-300 MB

**Why so large:**
- Includes entire Electron runtime
- Includes Node.js
- Includes all npm modules
- This is normal!

**Reduce size (optional):**
1. Remove unused dependencies
2. Use `asarUnpack` in electron-builder.yml
3. Enable compression (already configured)

---

## 🔄 **UPDATING THE APP**

### **When You Make Changes:**

**Update version in package.json:**
```json
{
  "version": "1.0.1"  ← Increment this
}
```

**Rebuild:**
```bash
npm run electron:build:railway
```

**Distribute new version:**
- New file: `Shore Agents-Setup-1.0.1.exe`
- Send to team
- They install over old version (settings preserved)

---

## 📊 **BUILD CHECKLIST**

Use this every time you build:

- [ ] Railway app is deployed and running
- [ ] Railway URL is correct in build script
- [ ] `npm install` completed successfully
- [ ] Icon added to `build/icon.ico` (optional)
- [ ] Run build command: `npm run electron:build:railway`
- [ ] Build completes without errors (5-10 min)
- [ ] Find installer in `dist/` folder
- [ ] Test installer on Windows machine
- [ ] Verify it connects to Railway (not localhost)
- [ ] Check 10-second verification logs
- [ ] Confirm all metrics tracking
- [ ] Upload installer to file share
- [ ] Send link to team
- [ ] Have 1-2 team members test first
- [ ] Roll out to entire team

---

## 🎯 **QUICK START (TL;DR)**

**1. Update package.json with YOUR Railway URL:**
```json
"electron:build:railway": "cross-env API_BASE_URL=https://YOUR-APP.railway.app electron-builder --win --x64"
```

**2. Build:**
```bash
npm run electron:build:railway
```

**3. Find installer:**
```
dist/Shore Agents-Setup-1.0.0.exe
```

**4. Upload to Google Drive/Dropbox**

**5. Send to team:**
> "Download and install Shore Agents-Setup-1.0.0.exe"

**6. They install and login!** ✅

---

## 📁 **BUILD OUTPUT**

After successful build, you'll see:

```
dist/
├── Shore Agents-Setup-1.0.0.exe          ← INSTALLER (send this to team)
├── Shore Agents-Setup-1.0.0.exe.blockmap ← Update metadata
├── win-unpacked/                         ← Unpacked files (for debugging)
│   ├── Shore Agents.exe
│   ├── resources/
│   │   └── app.asar                      ← Your app code
│   └── ... (Electron runtime files)
└── builder-effective-config.yaml         ← Build config used
```

**File to distribute:** `Shore Agents-Setup-1.0.0.exe` ✅

---

## 🔒 **SECURITY NOTES**

### **API URL is Embedded**
- Railway URL is hardcoded in the built app
- If Railway URL changes, rebuild and redistribute
- Team can't change URL (security feature)

### **Authentication**
- Team logs in with their credentials
- Session managed by Railway server
- Electron stores session cookie securely

### **Data Privacy**
- All tracking data sent to Railway server
- HTTPS encryption (Railway provides SSL)
- No local data storage except metrics queue

---

## ✅ **PRODUCTION READY**

Your built installer includes:
- ✅ Railway connection configured
- ✅ Delta calculation (accurate metrics)
- ✅ 10-second verification logs
- ✅ Windows-specific fixes
- ✅ Antivirus troubleshooting
- ✅ All tracking features
- ✅ Auto-start on Windows login (configurable)
- ✅ System tray icon
- ✅ Desktop shortcuts

**Your team gets a professional Windows app! 🎉**

---

## 📞 **SUPPORT**

### **If Team Has Issues:**

**Installation:**
- "Click More info → Run anyway" (SmartScreen)
- "Run as Administrator" if needed

**Connection:**
- Check Railway server is running
- Verify Railway URL is accessible
- Check firewall/proxy settings

**Tracking:**
- Wait 10 seconds after clock-in
- Screenshot verification logs
- Check for antivirus blocking

---

**Ready to build? Update package.json with your Railway URL and run:**

```bash
npm run electron:build:railway
```

**Build time: 5-10 minutes | File size: ~250 MB | Distribution: Upload and share link!** 🚀


