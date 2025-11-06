# 🖥️ ELECTRON DESKTOP APP SETUP GUIDE

**Purpose:** Convert the web application into a native desktop application for macOS, Windows, and Linux.

---

## 📊 CURRENT STATUS

### ✅ **What's Already Done:**
1. Created Electron configuration files:
   - `electron/main.js` - Main process (window management)
   - `electron/preload.js` - Secure bridge between main and renderer
2. Added npm scripts to `package.json`:
   - `pnpm electron` - Launch desktop app
   - `pnpm electron:build` - Build production app
3. Configured window settings (1400x900, dev tools enabled)
4. Set up URL routing (development: localhost:3000, production: static files)

### ❌ **Current Issue:**
Electron installation failed with error:
```
Error: Electron failed to install correctly, please delete node_modules/electron and try installing again
```

**Root Cause:** Build scripts weren't approved during installation (pnpm security feature)

---

## 🔧 HOW TO FIX ELECTRON

### **Step 1: Approve Build Scripts**

pnpm has a security feature that requires manual approval of build scripts. Run:

```bash
cd "/Users/stephenatcheler/Desktop/Electron - Staff/gamified-dashboard (1)"
pnpm approve-builds electron electron-winstaller
```

**What this does:**
- Shows an interactive menu
- Use SPACE to select `electron` and `electron-winstaller`
- Press ENTER to approve
- This allows these packages to run their post-install scripts

### **Step 2: Reinstall Dependencies**

```bash
pnpm install
```

This will:
- Download the Electron binary (~150MB)
- Set up platform-specific dependencies
- Complete the installation properly

### **Step 3: Verify Installation**

```bash
pnpm electron --version
```

Should output: `v38.2.2` (or similar)

### **Step 4: Launch the App**

**Terminal 1** - Keep Next.js dev server running:
```bash
pnpm dev
```

**Terminal 2** - Launch Electron:
```bash
pnpm electron
```

---

## 🎯 WHAT YOU'LL SEE

When Electron launches successfully:

1. **Desktop Window Opens:**
   - Size: 1400px × 900px
   - Title: "Staff Monitor" (or your app name)
   - Native window controls (minimize, maximize, close)

2. **Your Web App Loads:**
   - Displays `http://localhost:3000` content
   - Full functionality of the web app
   - All pages work (Dashboard, Tasks, Breaks, etc.)

3. **Developer Tools:**
   - Opens automatically (in development mode)
   - Chrome DevTools for debugging
   - Console, Network, Elements tabs available

4. **Native Desktop Behavior:**
   - Can be minimized to dock/taskbar
   - Responds to OS keyboard shortcuts
   - Integrates with system (notifications, etc.)

---

## 📁 FILE STRUCTURE

```
gamified-dashboard (1)/
├── electron/
│   ├── main.js           # Main process (window management)
│   └── preload.js        # Secure API bridge
├── app/                  # Next.js app (runs in renderer)
├── components/           # React components
├── package.json          # Contains electron scripts
└── out/                  # Static export (production build)
```

---

## ⚙️ ELECTRON CONFIGURATION EXPLAINED

### **electron/main.js**
```javascript
const { app, BrowserWindow } = require('electron')

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,              // Window width
    height: 900,              // Window height
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, // Security: disable node in renderer
      contextIsolation: true, // Security: isolate contexts
    },
  })

  // Load the app
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:3000") // Dev: localhost
    mainWindow.webContents.openDevTools()       // Show dev tools
  } else {
    mainWindow.loadFile("../out/index.html")    // Prod: static files
  }
}

app.whenReady().then(createWindow)
```

**What it does:**
- Creates the application window
- Loads your Next.js app (dev or production)
- Manages window lifecycle (open, close, etc.)

### **electron/preload.js**
```javascript
const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform, // Expose OS platform
  // Add more APIs here as needed
})
```

**What it does:**
- Securely exposes Electron APIs to your React app
- Bridge between main process and renderer process
- Can add custom APIs (file access, notifications, etc.)

---

## 🚀 DEVELOPMENT WORKFLOW

### **Daily Development:**

1. **Start Next.js dev server:**
   ```bash
   pnpm dev
   ```
   - Runs on http://localhost:3000
   - Hot reload enabled
   - Make changes to React components

2. **Launch Electron window:**
   ```bash
   pnpm electron
   ```
   - Opens desktop app
   - Loads localhost:3000
   - Refresh to see changes (Cmd+R / Ctrl+R)

3. **Develop normally:**
   - Edit files in `app/`, `components/`, etc.
   - Changes hot-reload in browser
   - Refresh Electron window to see updates

### **Tips:**
- Keep both terminals open side-by-side
- Use browser for rapid development
- Use Electron to test desktop-specific features
- Check Electron DevTools for renderer errors

---

## 📦 BUILDING FOR PRODUCTION

### **Step 1: Build Next.js Static Export**

```bash
pnpm build
```

Generates: `out/` directory with static HTML/CSS/JS

### **Step 2: Build Electron App**

```bash
pnpm electron:build
```

Creates platform-specific installers:
- **macOS:** `.dmg` and `.app` files
- **Windows:** `.exe` installer
- **Linux:** `.AppImage`, `.deb`, `.rpm`

Output location: `dist/` directory

### **Step 3: Test Production Build**

```bash
# Set production mode
NODE_ENV=production pnpm electron
```

Should load from `out/` directory instead of localhost

---

## 🎨 FUTURE ENHANCEMENTS

Once Electron is working, we can add:

### **1. System Tray Integration**
```javascript
const { Tray, Menu } = require('electron')

let tray = new Tray('icon.png')
tray.setContextMenu(Menu.buildFromTemplate([
  { label: 'Start Break', click: () => { /* ... */ } },
  { label: 'View Tasks', click: () => { /* ... */ } },
  { label: 'Quit', click: () => app.quit() }
]))
```

**Benefits:**
- Always accessible from system tray
- Quick actions without opening window
- Minimize to tray instead of closing

### **2. Desktop Notifications**
```javascript
const { Notification } = require('electron')

new Notification({
  title: 'Break Reminder',
  body: 'Time for your morning break!',
  icon: 'break-icon.png'
}).show()
```

**Use Cases:**
- Break reminders (5 min before scheduled break)
- Task deadlines approaching
- New support ticket assigned
- Leaderboard position changes

### **3. Global Keyboard Shortcuts**
```javascript
const { globalShortcut } = require('electron')

globalShortcut.register('CommandOrControl+Shift+B', () => {
  // Start break with keyboard shortcut
})
```

**Shortcuts:**
- `Cmd+Shift+B` - Start break
- `Cmd+Shift+T` - Create new task
- `Cmd+Shift+D` - Open dashboard

### **4. Auto-Launch on Startup**
```javascript
app.setLoginItemSettings({
  openAtLogin: true, // Start app when computer boots
  openAsHidden: true // Start minimized to tray
})
```

**Benefits:**
- Automatic time tracking
- Never forget to log work
- Seamless user experience

### **5. Always-on-Top Break Window**
```javascript
const breakWindow = new BrowserWindow({
  alwaysOnTop: true, // Stay above other windows
  frame: false,      // Frameless window
  fullscreen: true,  // Full screen
  skipTaskbar: true  // Don't show in taskbar
})
```

**Use Cases:**
- Force break compliance
- Full-screen break timer
- Can't minimize during mandatory breaks

### **6. Menu Bar App (macOS)**
```javascript
const { Menu } = require('electron')

const menuTemplate = [
  {
    label: 'File',
    submenu: [
      { label: 'New Task', accelerator: 'CmdOrCtrl+N' },
      { label: 'Start Break', accelerator: 'CmdOrCtrl+B' },
      { type: 'separator' },
      { label: 'Quit', accelerator: 'CmdOrCtrl+Q', role: 'quit' }
    ]
  },
  {
    label: 'View',
    submenu: [
      { label: 'Dashboard', click: () => { /* navigate */ } },
      { label: 'Tasks', click: () => { /* navigate */ } },
      { label: 'Performance', click: () => { /* navigate */ } }
    ]
  }
]

Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate))
```

### **7. Offline Mode**
```javascript
// Cache data when online
const cachedData = await fetch('/api/tasks').then(r => r.json())
localStorage.setItem('tasks', JSON.stringify(cachedData))

// Use cached data when offline
if (!navigator.onLine) {
  const tasks = JSON.parse(localStorage.getItem('tasks'))
  // Work with cached tasks
}
```

### **8. File System Access**
```javascript
const { dialog } = require('electron')

// Export data to CSV
const result = await dialog.showSaveDialog({
  defaultPath: 'performance-report.csv',
  filters: [{ name: 'CSV', extensions: ['csv'] }]
})

// User can save reports locally
```

---

## 🔐 SECURITY BEST PRACTICES

### **Current Settings (Already Implemented):**
```javascript
webPreferences: {
  nodeIntegration: false,    // ✅ Node.js disabled in renderer
  contextIsolation: true,    // ✅ Contexts are isolated
  enableRemoteModule: false, // ✅ Remote module disabled
  sandbox: true              // ✅ Renderer in sandbox
}
```

### **Additional Security (Future):**
1. **Content Security Policy (CSP)**
2. **Code Signing** (for distribution)
3. **Auto-updates** with signature verification
4. **Secure IPC** (inter-process communication)

---

## 🐛 TROUBLESHOOTING

### **Issue: Electron window is blank**
**Solution:**
- Check if Next.js dev server is running (`pnpm dev`)
- Check console for errors
- Verify localhost:3000 works in browser first

### **Issue: "Cannot find module 'electron'"**
**Solution:**
```bash
rm -rf node_modules
pnpm install
```

### **Issue: Changes not showing in Electron**
**Solution:**
- Hard refresh: `Cmd+Shift+R` (macOS) or `Ctrl+Shift+R` (Windows)
- Restart Electron window
- Clear cache: `Cmd+Shift+Delete`

### **Issue: Build fails**
**Solution:**
- Ensure Next.js builds successfully first: `pnpm build`
- Check `out/` directory exists
- Verify `package.json` build config

---

## 📚 RESOURCES

- **Electron Docs:** https://www.electronjs.org/docs
- **Next.js + Electron:** https://github.com/vercel/next.js/tree/canary/examples/with-electron
- **electron-builder:** https://www.electron.build/
- **Security Guide:** https://www.electronjs.org/docs/tutorial/security

---

## 🎯 SUCCESS CRITERIA

Electron is successfully working when:

1. ✅ `pnpm electron` opens a desktop window
2. ✅ Window loads your Next.js app from localhost:3000
3. ✅ All pages are accessible (Dashboard, Tasks, Breaks, etc.)
4. ✅ Break system works (full-screen overlay displays)
5. ✅ Authentication works in Electron window
6. ✅ DevTools open and show no errors
7. ✅ Window can be minimized, maximized, closed
8. ✅ Data persists between sessions

---

## 🚀 NEXT STEPS AFTER ELECTRON WORKS

1. **Test all features** in desktop app
2. **Add system tray** integration
3. **Implement break notifications**
4. **Add keyboard shortcuts**
5. **Set up auto-launch**
6. **Create app icons**
7. **Build production installers**
8. **Distribute to team!**

---

**Ready to fix Electron? Run the commands in Step 1-4 above!** 🎉

