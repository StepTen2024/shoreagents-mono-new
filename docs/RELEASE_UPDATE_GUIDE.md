# 🚀 How to Release a New Update

## Complete Step-by-Step Guide for Publishing Updates

---

## 📋 Pre-Release Checklist

Before you start, make sure:
- [ ] All changes are committed and tested
- [ ] You know what version number to use (e.g., 1.0.0 → 1.0.1)
- [ ] You have release notes ready (what's new, what's fixed)

---

## 🔢 Step 1: Update Version Numbers

Update the version in **THREE places**:

### 1.1 Update `package.json`
```json
{
  "version": "1.0.1"  // Change from 1.0.0 to 1.0.1
}
```

### 1.2 Update `electron-builder.yml`
```yaml
extraMetadata:
  name: shore-agents-desktop
  version: 1.0.1  # Change this
```

### 1.3 Update `components/staff/desktop-app-download.tsx`
```typescript
export function DesktopAppDownload() {
  const appVersion = "1.0.1"  // Change from 1.0.0 to 1.0.1
  const fileSize = "~250 MB"
  const downloadUrl = "https://github.com/StepTen2024/shoreagents-mono-new/releases/download/v1.0.1/ShoreAgentsAI-Setup-1.0.1.exe"
  // Change both version numbers in the URL ↑
```

**Version Numbering Guide:**
- **Patch** (1.0.0 → 1.0.1): Bug fixes
- **Minor** (1.0.0 → 1.1.0): New features
- **Major** (1.0.0 → 2.0.0): Breaking changes

---

## 🔨 Step 2: Build the Installer

Run the build command:

```bash
npm run electron:build:railway
```

**This creates in the `dist/` folder:**
- ✅ `ShoreAgentsAI-Setup-1.0.1.exe` - The installer
- ✅ `latest.yml` - Metadata file (CRITICAL for auto-updates!)

**Wait for it to complete** (takes a few minutes)

---

## 📦 Step 3: Create GitHub Release

### 3.1 Go to GitHub Releases
```
https://github.com/StepTen2024/shoreagents-mono-new/releases
```

### 3.2 Click "Draft a new release"

### 3.3 Fill in Release Details

**Choose a tag:**
- Type: `v1.0.1` (must start with 'v')
- Click: "Create new tag: v1.0.1 on publish"

**Release title:**
```
v1.0.1 - Bug Fixes and Improvements
```

**Release description (example):**
```markdown
## 🐛 Bug Fixes
- Fixed Settings page loading error
- Resolved auto-update checker issues
- Improved error handling

## ✨ Improvements
- Better update notifications
- Enhanced UI responsiveness

## 📥 Installation
Download `ShoreAgentsAI-Setup-1.0.1.exe` and run the installer.

Existing users will be notified automatically and can update from within the app.
```

### 3.4 Upload Files

**Drag and drop BOTH files from `dist/` folder:**
1. ✅ `ShoreAgentsAI-Setup-1.0.1.exe`
2. ✅ `latest.yml` ⚠️ **DO NOT FORGET THIS FILE!**

### 3.5 Publish Release

Click **"Publish release"** (not "Save as draft")

---

## 🌐 Step 4: Update Website Download Link

### 4.1 Commit Changes

```bash
# Add the version changes
git add package.json electron-builder.yml components/staff/desktop-app-download.tsx

# Commit
git commit -m "Release v1.0.1: Bug fixes and improvements"

# Push to deployed branch
git push origin deployed
```

### 4.2 Wait for Railway Deployment

Railway will automatically:
1. Detect the push
2. Build the new version
3. Deploy it (takes ~2-5 minutes)

### 4.3 Verify Website

Check: https://shoreagents.ai/login/staff

The download button should now point to v1.0.1

---

## ✅ Step 5: Test the Update

### 5.1 Test New Installation (Optional)

Download and install fresh to make sure it works:
1. Download from website
2. Install on a test machine
3. Launch and verify it works

### 5.2 Test Auto-Update (Important!)

**For users with v1.0.0 installed:**
1. Open the v1.0.0 app
2. Wait 10 seconds (auto-check)
3. Should see: "Update Available: v1.0.1"
4. Click "Download Now"
5. Watch progress bar
6. Click "Restart Now"
7. App updates to v1.0.1 ✨

---

## 📊 Quick Reference Table

| Step | Action | Files/Location |
|------|--------|----------------|
| 1 | Update versions | `package.json`, `electron-builder.yml`, `desktop-app-download.tsx` |
| 2 | Build installer | Run `npm run electron:build:railway` |
| 3 | Create GitHub Release | Tag: `v1.0.1`, Upload `.exe` + `latest.yml` |
| 4 | Update website | Commit & push to `deployed` branch |
| 5 | Test | Try update from previous version |

---

## 🚨 Common Mistakes to Avoid

| ❌ Mistake | ✅ Solution |
|-----------|-----------|
| Forgot to update version in all 3 places | Use search to find all instances |
| Didn't upload `latest.yml` | Auto-updates won't work at all |
| Used wrong tag format (1.0.1 instead of v1.0.1) | Always use 'v' prefix |
| Saved as draft instead of publishing | Click "Publish release" |
| Forgot to push website changes | Users download old version |
| Version numbers don't match | Be consistent everywhere |

---

## 🔍 Troubleshooting

### "Auto-update not detecting new version"

**Check:**
1. Is `latest.yml` uploaded to GitHub release? ✅
2. Is the release published (not draft)? ✅
3. Does the tag start with 'v' (v1.0.1)? ✅
4. Wait 10 seconds after opening app for auto-check

### "Download link gives 404"

**Check:**
1. Did you push the version update to deployed branch? ✅
2. Did Railway finish deploying? ✅
3. Does the URL in `desktop-app-download.tsx` match the GitHub release tag? ✅

### "Users not seeing update"

**Check:**
1. Are they running the Electron app (not web browser)? ✅
2. Is their current version older than the new release? ✅
3. Try manual check: Settings → Check for Updates

---

## 📝 Release Notes Template

Copy this template for your release notes:

```markdown
## 🎉 What's New
- [New feature 1]
- [New feature 2]

## 🐛 Bug Fixes
- Fixed [issue 1]
- Resolved [issue 2]

## ✨ Improvements
- Enhanced [area 1]
- Improved [area 2]

## 📥 Installation

**New Users:**
Download `ShoreAgentsAI-Setup-1.0.1.exe` and run the installer.

**Existing Users:**
Your app will automatically notify you about this update!
Go to Settings → Check for Updates, or wait for the automatic check.

## 🔗 Links
- [Full Changelog](https://github.com/StepTen2024/shoreagents-mono-new/compare/v1.0.0...v1.0.1)
- [Documentation](https://github.com/StepTen2024/shoreagents-mono-new/docs)
```

---

## 🎯 Summary: The Complete Flow

```
Developer                     GitHub                     Users
    |                            |                         |
    |--1. Update versions------->|                         |
    |--2. Build installer------->|                         |
    |--3. Create release-------->|                         |
    |   (Upload .exe + yml)      |                         |
    |--4. Push website update--->|                         |
    |                            |                         |
    |                            |----Auto-check---------->|
    |                            |<---Download update------|
    |                            |----New .exe------------>|
    |                            |                    [Install]
    |                            |                    ✅ Updated!
```

---

## 🎓 First Update Example

Let's say you're releasing your first update (1.0.0 → 1.0.1):

**Before (Current Production):**
- Version: 1.0.0
- Users have: v1.0.0 installed

**Steps:**
1. ✏️ Update versions to 1.0.1 in all files
2. 🔨 Run `npm run electron:build:railway`
3. 📦 Create GitHub release `v1.0.1`
4. 📤 Upload `ShoreAgentsAI-Setup-1.0.1.exe` + `latest.yml`
5. 🚀 Push changes to deployed branch
6. ✅ Wait for Railway deployment

**After (New Release):**
- Website: Downloads v1.0.1
- Users: See update notification
- Auto-update: v1.0.0 → v1.0.1 ✨

---

## 💡 Pro Tips

1. **Test before releasing:** Always test the installer locally first
2. **Write good release notes:** Users appreciate knowing what changed
3. **Be consistent with versions:** Update all 3 places at once
4. **Keep old releases:** Don't delete previous versions
5. **Tag format matters:** Always use `v1.0.1` format
6. **Check the files:** Verify both .exe and .yml are uploaded
7. **Monitor the first update:** Watch logs when users first update

---

## 📞 Need Help?

- Check auto-update logs: Press F12 in Electron app, look for `[AutoUpdater]` messages
- Check website logs: Railway dashboard → View Logs
- Test locally: `npm run dev:all` to test changes before building

---

## 🎉 Congratulations!

You now have a professional auto-update system!

Your users will receive updates automatically, just like VS Code, Slack, and other professional apps.

Next update? Just follow this guide again! 🚀

