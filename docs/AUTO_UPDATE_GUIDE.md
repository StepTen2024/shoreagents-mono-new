# Auto-Update System Guide

## Overview

The ShoreAgentsAI desktop app includes an automatic update system using `electron-updater` that checks for and installs new versions from GitHub Releases.

## How It Works

1. **Automatic Checks**: The app automatically checks for updates:
   - 10 seconds after startup
   - Every 4 hours while running

2. **User Notification**: When an update is available, users see a dialog with:
   - New version number
   - Release notes
   - Options to download now or later

3. **Download**: Users can download the update in the background

4. **Installation**: After download, users can restart to install or install later

5. **Background Installation**: Update installs automatically when the app quits

## For Developers

### Building and Publishing a New Version

#### 1. Update Version Number

Update the version in `package.json`:

```json
{
  "version": "1.0.1"  // Increment this
}
```

Also update in `electron-builder.yml`:

```yaml
extraMetadata:
  version: 1.0.1
```

And in `components/staff/desktop-app-download.tsx`:

```typescript
const appVersion = "1.0.1"  // Update this
const downloadUrl = "https://github.com/StepTen2024/shoreagents-mono-new/releases/download/v1.0.1/ShoreAgentsAI-Setup-1.0.1.exe"
```

#### 2. Build the Installer

Build the Windows installer with the production API URL:

```bash
npm run electron:build:railway
```

This creates:
- `dist/ShoreAgentsAI-Setup-1.0.1.exe` - The installer
- `dist/latest.yml` - Update metadata file (REQUIRED for auto-updates)

#### 3. Create GitHub Release

1. Go to your GitHub repository
2. Click "Releases" → "Draft a new release"
3. Create a new tag: `v1.0.1` (must match package.json version)
4. Set release title: `v1.0.1 - Release Title`
5. Add release notes describing what's new
6. Upload BOTH files from the `dist` folder:
   - `ShoreAgentsAI-Setup-1.0.1.exe`
   - `latest.yml` (CRITICAL - without this, auto-update won't work)
7. Publish the release

#### 4. Test the Update

1. Install the previous version of the app
2. Launch it
3. Wait for the update notification (or manually check)
4. Test the download and installation process

### Important Files

- **`electron/services/autoUpdater.js`** - Auto-update service
- **`electron-builder.yml`** - Build configuration with GitHub publish settings
- **`package.json`** - Version number
- **`dist/latest.yml`** - Generated metadata file (must be uploaded to GitHub)

### GitHub Personal Access Token (for Publishing)

To automatically publish to GitHub from the build command:

1. Create a GitHub Personal Access Token:
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Generate new token (classic)
   - Select scopes: `repo` (full control)
   
2. Set environment variable:
   ```bash
   # Windows PowerShell
   $env:GH_TOKEN="your_github_token_here"
   
   # Or add to .env file (don't commit this!)
   GH_TOKEN=your_github_token_here
   ```

3. Build and publish in one command:
   ```bash
   npm run electron:build:railway -- --publish always
   ```

### Version Numbering

Follow Semantic Versioning (semver):
- **Major**: Breaking changes (1.0.0 → 2.0.0)
- **Minor**: New features (1.0.0 → 1.1.0)
- **Patch**: Bug fixes (1.0.0 → 1.0.1)

### Update Channels

You can create different update channels (stable, beta, alpha):

```yaml
# electron-builder.yml
publish:
  - provider: github
    owner: StepTen2024
    repo: shoreagents-mono-new
    releaseType: release  # or "prerelease" for beta channel
```

Then in code:
```javascript
// electron/services/autoUpdater.js
autoUpdater.channel = 'beta'  // Users on beta channel get pre-releases
```

## For Users

### Manual Update Check

Users can manually check for updates:
1. Open the app
2. Go to Settings (if available)
3. Click "Check for Updates"

Or wait for automatic checks (every 4 hours).

### Update Notification

When an update is available:
1. A dialog will appear with update details
2. Click "Download Now" to start downloading
3. Download progress is shown
4. When complete, click "Restart Now" to install
5. App will restart with the new version

### Troubleshooting

**Update check fails:**
- Check internet connection
- Ensure firewall allows the app
- Check GitHub status (github.com/status)

**Update download fails:**
- Check available disk space
- Try again later
- Download manually from GitHub Releases

**Update doesn't install:**
- Close all app instances
- Run the installer manually from Downloads folder

## Configuration Options

### Check Interval

Modify in `electron/services/autoUpdater.js`:

```javascript
// Check every 4 hours (default)
this.updateCheckInterval = setInterval(() => {
  this.checkForUpdates()
}, 4 * 60 * 60 * 1000)
```

### Auto-Download

Change in `electron/services/autoUpdater.js`:

```javascript
// Don't auto-download (default - ask user first)
autoUpdater.autoDownload = false

// Or auto-download updates (not recommended)
autoUpdater.autoDownload = true
```

### Auto-Install

Change in `electron/services/autoUpdater.js`:

```javascript
// Auto-install on quit (default)
autoUpdater.autoInstallOnAppQuit = true

// Or require manual installation
autoUpdater.autoInstallOnAppQuit = false
```

## Security

- Updates are downloaded over HTTPS from GitHub
- Electron verifies the digital signature of updates
- Only releases from your GitHub repository are accepted
- Users see release notes before installing

## Testing Updates Locally

1. Build version 1.0.0 and install it
2. Update version to 1.0.1 in all files
3. Build version 1.0.1
4. Create a GitHub release with v1.0.1
5. Launch the installed 1.0.0 app
6. It should detect and offer to update to 1.0.1

## Best Practices

1. **Always test updates** before publishing
2. **Write clear release notes** for users
3. **Include both .exe and latest.yml** in releases
4. **Use semantic versioning** consistently
5. **Test the update path** from previous version
6. **Keep update checks reasonable** (don't spam users)
7. **Handle update failures gracefully**

## Monitoring

Check logs for update-related issues:

```javascript
// In Electron console
console.log('[AutoUpdater] ...')

// Check electron-log file (on user's machine)
// Windows: %USERPROFILE%\AppData\Roaming\ShoreAgentsAI\logs\
```

## Resources

- [electron-updater Documentation](https://www.electron.build/auto-update)
- [electron-builder Publishing](https://www.electron.build/configuration/publish)
- [Semantic Versioning](https://semver.org/)

