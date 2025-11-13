# Auto-Update Quick Start ⚡

## ✅ What's Been Implemented

Your Electron desktop app now has **automatic update functionality**! Here's what was added:

### 1. Auto-Updater Service (`electron/services/autoUpdater.js`)
- Checks for updates automatically every 4 hours
- Downloads updates with progress tracking
- Notifies users with dialogs
- Installs updates on app restart

### 2. Integration with Main Process
- Auto-updater initialized on app startup
- IPC handlers for manual update checks
- Update status sent to renderer process

### 3. UI Components
- React component for update notifications (`components/staff/update-notification.tsx`)
- Progress bars for download tracking
- User-friendly dialogs for update prompts

### 4. Configuration
- GitHub Releases configured as update source
- Automatic metadata generation
- Security and signature verification

## 🚀 How to Publish Your First Update

### Step 1: Update Version Numbers

Update version in **THREE** places:

**1. `package.json`:**
```json
{
  "version": "1.0.1"  // Change from 1.0.0 to 1.0.1
}
```

**2. `electron-builder.yml`:**
```yaml
extraMetadata:
  version: 1.0.1  # Change this
```

**3. `components/staff/desktop-app-download.tsx`:**
```typescript
const appVersion = "1.0.1"  // Update this
const downloadUrl = "https://github.com/StepTen2024/shoreagents-mono-new/releases/download/v1.0.1/ShoreAgentsAI-Setup-1.0.1.exe"
```

### Step 2: Build the Installer

```bash
npm run electron:build:railway
```

This creates two files in the `dist/` folder:
- ✅ `ShoreAgentsAI-Setup-1.0.1.exe` - The installer
- ✅ `latest.yml` - Update metadata (**CRITICAL** for auto-updates!)

### Step 3: Create GitHub Release

1. Go to: https://github.com/StepTen2024/shoreagents-mono-new/releases
2. Click **"Draft a new release"**
3. **Tag**: `v1.0.1` (must start with 'v' and match package.json)
4. **Title**: `v1.0.1 - Feature Name or Bug Fix`
5. **Description**: Write release notes (what's new, what's fixed)
6. **Upload BOTH files** from `dist/`:
   - `ShoreAgentsAI-Setup-1.0.1.exe`
   - `latest.yml` ⚠️ **DO NOT FORGET THIS FILE!**
7. Click **"Publish release"**

### Step 4: Test the Update

1. Install the old version (v1.0.0)
2. Launch the app
3. Within 10 seconds, you should see an update notification
4. Click "Download Now"
5. Watch the progress bar
6. Click "Restart Now" when download completes
7. App restarts with new version ✨

## 📋 Publishing Checklist

Before each release:

- [ ] Update version in `package.json`
- [ ] Update version in `electron-builder.yml`
- [ ] Update version and URL in `desktop-app-download.tsx`
- [ ] Run `npm run electron:build:railway`
- [ ] Create GitHub release with tag `v{version}`
- [ ] Upload `.exe` file
- [ ] Upload `latest.yml` file ⚠️ **CRITICAL**
- [ ] Write clear release notes
- [ ] Test update from previous version

## 🎯 Quick Commands

```bash
# Build installer (production)
npm run electron:build:railway

# Build and publish to GitHub (requires GH_TOKEN)
npm run electron:publish

# Run in development mode
npm run dev:all
```

## 🔧 Advanced: Automatic Publishing

To publish directly from the build command:

### 1. Create GitHub Token
- Go to: https://github.com/settings/tokens
- Generate new token (classic)
- Select scope: `repo` (full control)
- Copy the token

### 2. Set Environment Variable

**Windows PowerShell:**
```powershell
$env:GH_TOKEN="ghp_your_token_here"
npm run electron:publish
```

**Or create `.env` file:**
```
GH_TOKEN=ghp_your_token_here
```

Then run:
```bash
npm run electron:publish
```

This will:
1. Build the installer
2. Create a GitHub release
3. Upload both files automatically
4. No manual upload needed! 🎉

## 💡 How Users Experience Updates

### Automatic (Default):
1. App checks for updates every 4 hours
2. Dialog appears when update is available
3. User clicks "Download Now"
4. Progress bar shows download
5. User clicks "Restart Now" to install
6. Done! ✅

### Manual Check:
Users can also manually check from the UI component you can add to any page:

```tsx
import { UpdateNotification } from "@/components/staff/update-notification"

// In your component:
<UpdateNotification />
```

## 📊 Update Frequency

The app checks for updates:
- ✅ 10 seconds after startup
- ✅ Every 4 hours while running
- ✅ When user manually clicks "Check for Updates"

You can change this in `electron/services/autoUpdater.js`:
```javascript
// Change from 4 hours to 2 hours
this.updateCheckInterval = setInterval(() => {
  this.checkForUpdates()
}, 2 * 60 * 60 * 1000)
```

## ⚠️ Common Issues

### "Update not detected"
- Make sure `latest.yml` is uploaded to GitHub release
- Check that tag format is `v1.0.1` (with 'v' prefix)
- Verify version in `package.json` matches the tag

### "Download fails"
- Check GitHub release is public
- Verify files are properly uploaded
- Check user's internet connection

### "Update doesn't install"
- User may need admin rights on Windows
- Check antivirus isn't blocking the installer
- Try running installer manually

## 🎓 Learn More

For detailed documentation, see: `docs/AUTO_UPDATE_GUIDE.md`

## 🎉 You're All Set!

Your app now has professional auto-update functionality just like Chrome, VS Code, and other modern apps!

**Next Steps:**
1. Build and publish your first update (follow Step-by-Step above)
2. Test the update process
3. Add the `<UpdateNotification />` component to your settings page
4. Celebrate! 🎊

