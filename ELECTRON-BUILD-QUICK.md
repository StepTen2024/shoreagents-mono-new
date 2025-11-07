# ⚡ **ELECTRON BUILD - QUICK REFERENCE**

---

## 🎯 **YOUR RAILWAY URL**

**Replace `YOUR-APP` with your actual Railway app name:**

```
https://YOUR-APP.railway.app
```

**Example:**
```
https://shoreagents-production.railway.app
```

---

## 🚀 **BUILD COMMAND (3 STEPS)**

### **Step 1: Update package.json (ONE TIME)**

Open `package.json`, line 22, replace `your-app.railway.app` with YOUR URL:

```json
"electron:build:railway": "cross-env API_BASE_URL=https://shoreagents-production.railway.app electron-builder --win --x64"
```

### **Step 2: Build**

```bash
npm run electron:build:railway
```

**Wait:** 5-10 minutes

### **Step 3: Find Installer**

```
dist/Shore Agents-Setup-1.0.0.exe  ← This is your installer!
```

---

## 📤 **DISTRIBUTE**

### **Upload to:**
- Google Drive
- Dropbox
- OneDrive

### **Send to team:**
> "Download Shore Agents-Setup-1.0.0.exe and double-click to install"

---

## 👥 **TEAM INSTALLS**

1. Download `.exe` file
2. Double-click
3. Click "More info" → "Run anyway" (if Windows SmartScreen appears)
4. Install
5. Launch app
6. Login
7. Done! ✅

---

## ✅ **VERIFY IT WORKS**

**After team installs:**
1. They clock in
2. Wait 10 seconds
3. Check logs show Railway URL (not localhost)
4. Check all metrics tracking ✅

**Good log:**
```
📍 URL: https://shoreagents-production.railway.app/api/analytics ✅
```

**Bad log:**
```
📍 URL: http://localhost:3000/api/analytics ❌ REBUILD!
```

---

## 🔄 **UPDATE APP LATER**

**When you make changes:**

1. Update version in `package.json`: `"version": "1.0.1"`
2. Rebuild: `npm run electron:build:railway`
3. New file: `Shore Agents-Setup-1.0.1.exe`
4. Send to team
5. They install over old version

---

## 📁 **FILES CREATED**

```
dist/
└── Shore Agents-Setup-1.0.0.exe  ← SEND THIS TO TEAM
```

**Size:** ~250 MB (includes everything team needs)

---

## 🐛 **TROUBLESHOOTING**

**Build fails?**
```bash
npm install
npm run electron:build:railway
```

**Team can't connect?**
- Check Railway URL in package.json is correct
- Rebuild and redistribute

**Windows Defender blocks?**
- Normal for unsigned apps
- Click "More info" → "Run anyway"

**Keystrokes = 0?**
- Antivirus blocking
- Disable antivirus temporarily
- Add app to whitelist

---

## 📋 **QUICK CHECKLIST**

- [ ] Railway deployed and running
- [ ] Updated package.json with Railway URL
- [ ] Ran `npm run electron:build:railway`
- [ ] Found installer in `dist/` folder
- [ ] Tested on Windows machine
- [ ] Verified connects to Railway (not localhost)
- [ ] Uploaded to file share
- [ ] Sent link to team

---

**That's it! Your team gets a professional Windows app that connects to your Railway server!** 🎉

**Full guide:** See `ELECTRON-BUILD-GUIDE.md` for detailed instructions.

