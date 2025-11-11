const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron')
const path = require('path')

// Import services
const performanceTracker = require('./services/performanceTracker')
const syncService = require('./services/syncService')
const breakHandler = require('./services/breakHandler')
const activityTracker = require('./activity-tracker')
const screenshotService = require('./services/screenshotService')
const permissions = require('./utils/permissions')
const config = require('./config/trackerConfig')

let mainWindow = null
let tray = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Detect development mode: Check if we're not packaged (app.isPackaged is false)
  const isDev = !app.isPackaged
  
  // Load the app
  if (isDev) {
    console.log('[Main] Loading from dev server: http://localhost:3000')
    mainWindow.loadURL("http://localhost:3000") // Next.js dev server
    mainWindow.webContents.openDevTools()
  } else {
    // Production: Load from Railway server
    const productionUrl = config.API_BASE_URL
    console.log('[Main] Loading from production server:', productionUrl)
    mainWindow.loadURL(productionUrl)
  }

  // Prevent window from closing, hide instead
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })

  // Window ready
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Main] Window loaded successfully')
    
    // Send tracking status to renderer
    mainWindow.webContents.send('tracking-status', performanceTracker.getStatus())
  })
  
  // Listen for URL changes to detect user type changes
  mainWindow.webContents.on('did-navigate', async (event, url) => {
    console.log('[Main] Navigation detected:', url)
    
    // Wait a moment for the page to fully load
    setTimeout(async () => {
      const shouldDisableTracking = await checkIfUserIsClient()
      
      if (shouldDisableTracking && performanceTracker.getStatus().isTracking) {
        console.log('[Main] 🚫 User switched to non-staff portal - stopping performance tracking')
        performanceTracker.stop()
        activityTracker.destroy()
        screenshotService.destroy()
        // Also stop sync service for non-staff portals
        if (syncService.getStatus().isRunning) {
          console.log('[Main] Stopping sync service for non-staff portal...')
          syncService.stop()
        }
        updateTrayMenuForClient()
      } else if (!shouldDisableTracking && !performanceTracker.getStatus().isTracking) {
        console.log('[Main] ✅ User switched to staff portal - starting performance tracking')
        // Re-initialize tracking for staff
        await initializeTracking()
      }
    }, 1000) // Wait 1 second for page to load
  })
  
  // Also listen for page load completion
  mainWindow.webContents.on('did-finish-load', async () => {
    console.log('[Main] Page finished loading, checking user type...')
    
    // Wait a moment for the page to fully render
    setTimeout(async () => {
      const shouldDisableTracking = await checkIfUserIsClient()
      
      if (shouldDisableTracking && performanceTracker.getStatus().isTracking) {
        console.log('[Main] 🚫 Non-staff page loaded - stopping performance tracking')
        performanceTracker.stop()
        activityTracker.destroy()
        screenshotService.destroy()
        // Also stop sync service for non-staff portals
        if (syncService.getStatus().isRunning) {
          console.log('[Main] Stopping sync service for non-staff portal...')
          syncService.stop()
        }
        updateTrayMenuForClient()
      } else if (!shouldDisableTracking && !performanceTracker.getStatus().isTracking) {
        console.log('[Main] ✅ Staff page loaded - starting performance tracking')
        // Re-initialize tracking for staff
        await initializeTracking()
      }
    }, 500) // Wait 500ms for page to render
  })
}

function createTray() {
  // Create a simple icon (1x1 transparent pixel as fallback)
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Dashboard',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        }
      }
    },
    {
      label: 'Start Break',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('show-break-selector')
        }
      }
    },
    {
      label: 'View Performance',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.webContents.send('navigate-to', '/performance')
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Tracking: Active',
      id: 'tracking-status',
      enabled: false
    },
    {
      label: 'Pause Tracking',
      id: 'pause-tracking',
      click: () => {
        const isPaused = performanceTracker.getStatus().isPaused
        if (isPaused) {
          performanceTracker.resume()
          updateTrayMenu()
        } else {
          performanceTracker.pause()
          updateTrayMenu()
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setToolTip('Staff Monitor')
  tray.setContextMenu(contextMenu)
  
  // Click to show window
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
        mainWindow.focus()
      }
    }
  })

  console.log('[Main] System tray created')
}

function updateTrayMenu() {
  if (!tray) return
  
  const status = performanceTracker.getStatus()
  
  // Recreate the menu with updated labels
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Dashboard',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        }
      }
    },
    {
      label: 'Start Break',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('show-break-selector')
        }
      }
    },
    {
      label: 'View Performance',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.webContents.send('navigate-to', '/performance')
        }
      }
    },
    { type: 'separator' },
    {
      label: status.isPaused ? 'Tracking: Paused' : 'Tracking: Active',
      enabled: false
    },
    {
      label: status.isPaused ? 'Resume Tracking' : 'Pause Tracking',
      click: () => {
        if (status.isPaused) {
          performanceTracker.resume()
        } else {
          performanceTracker.pause()
        }
        updateTrayMenu()
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true
        app.quit()
      }
    }
  ])
  
  tray.setContextMenu(contextMenu)
}

// Kiosk mode functions removed - breaks now use regular UI

/**
 * Check if the current user should have performance tracking disabled
 * Only STAFF portal users should have tracking enabled
 * CLIENT and ADMIN portal users should NOT have tracking
 */
async function checkIfUserIsClient() {
  try {
    if (!mainWindow) {
      console.log('[Main] No main window available for user detection')
      return false
    }
    
    // Get the current URL from the main window
    const currentUrl = mainWindow.webContents.getURL()
    console.log('[Main] Current URL:', currentUrl)
    
    // Check for the three portal types
    const isClient = currentUrl.includes('/client')
    const isAdmin = currentUrl.includes('/admin')
    const isLoginPage = currentUrl.includes('/login')
    
    if (isLoginPage) {
      console.log('[Main] 🔐 Login page detected - waiting for user authentication')
      return false // Don't start tracking on login pages
    }
    
    if (isClient) {
      console.log('[Main] 🚫 CLIENT PORTAL detected - NO TRACKING')
      return true
    } else if (isAdmin) {
      console.log('[Main] ⚙️ ADMIN PORTAL detected - NO TRACKING')
      return true // Admin also doesn't need performance tracking
    } else {
      console.log('[Main] ✅ STAFF PORTAL detected - TRACKING ENABLED')
      return false
    }
  } catch (error) {
    console.error('[Main] Error checking user type:', error)
    // Default to staff if we can't determine
    return false
  }
}

/**
 * Create a minimal tray menu for client/admin users (no performance tracking options)
 */
function updateTrayMenuForClient() {
  if (!tray) return
  
  // Determine if it's admin or client based on current URL
  const currentUrl = mainWindow ? mainWindow.webContents.getURL() : ''
  const isAdmin = currentUrl.includes('/admin')
  const portalType = isAdmin ? 'Admin' : 'Client'
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Dashboard',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        }
      }
    },
    { type: 'separator' },
    {
      label: `${portalType} Mode - No Tracking`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true
        app.quit()
      }
    }
  ])
  
  tray.setContextMenu(contextMenu)
  tray.setToolTip(`${portalType} Dashboard`)
}

async function initializeTracking() {
  console.log('[Main] Initializing tracking services...')
  
  // Wait a moment for the page to be fully loaded before checking
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Check if user should have tracking disabled (client/admin portals)
  const shouldDisableTracking = await checkIfUserIsClient()
  
  if (shouldDisableTracking) {
    console.log('[Main] 🚫 NON-STAFF PORTAL DETECTED - Performance tracking disabled')
    console.log('[Main] No sync service needed for client/admin portals')
    
    // Stop any existing tracking first
    if (performanceTracker.getStatus().isTracking) {
      console.log('[Main] Stopping existing performance tracking...')
      performanceTracker.stop()
      activityTracker.destroy()
      screenshotService.destroy()
    }
    
    // Stop sync service for non-staff users (no performance data to sync)
    if (syncService.getStatus().isRunning) {
      console.log('[Main] Stopping sync service for non-staff user...')
      syncService.stop()
    }
    
    // Update tray menu (minimal for clients)
    updateTrayMenuForClient()
    
    return
  }
  
  console.log('[Main] ✅ STAFF USER DETECTED - Performance tracking enabled')
  
  // Check permissions
  const permissionStatus = await permissions.checkAllPermissions()
  console.log('[Main] Permission status:', permissionStatus)
  
  if (!permissionStatus.ready) {
    console.warn('[Main] Some permissions are missing')
    const instructions = permissions.getPermissionInstructions()
    console.log('[Main] Permission instructions:', instructions)
    
    // Send to renderer to show dialog
    if (mainWindow) {
      mainWindow.webContents.send('permissions-needed', instructions)
    }
  }
  
  // Initialize break handler
  breakHandler.initialize(performanceTracker)
  
  // Start performance tracking
  performanceTracker.start()
  console.log('[Main] Performance tracking started')
  
  // Initialize activity tracker with performance tracker and screenshot service integration
  activityTracker.initialize(mainWindow, performanceTracker, screenshotService)
  
  // Start activity tracking (only for staff users)
  activityTracker.startTracking()
  console.log('[Main] Activity tracking started (integrated with performance tracker and screenshot service)')
  
  // Start sync service (it will automatically get session cookie from Electron's cookie store)
  syncService.start()
  console.log('[Main] Sync service started')
  
  // Initialize screenshot service (detection mode)
  await screenshotService.initialize({
    apiUrl: config.API_BASE_URL
  })
  console.log('[Main] Screenshot service initialized (detection mode)')
  
  // Start screenshot capture (will try to get session token from cookies)
  try {
    const cookies = await mainWindow.webContents.session.cookies.get({})
    const sessionCookie = cookies.find(c => 
      c.name === 'authjs.session-token' || 
      c.name === 'next-auth.session-token'
    )
    if (sessionCookie) {
      await screenshotService.start(sessionCookie.value)
      console.log('[Main] Screenshot service started')
    }
  } catch (err) {
    console.error('[Main] Error starting screenshot service:', err)
  }
  
  // Update tray menu with current status
  updateTrayMenu()
  
  // Send metrics to renderer every 5 seconds
  setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const metrics = performanceTracker.getMetrics()
      const status = performanceTracker.getStatus()
      mainWindow.webContents.send('metrics-update', { metrics, status })
    }
  }, 5000)
}

// Setup IPC handlers
function setupIPC() {
  // Get current metrics
  ipcMain.handle('get-current-metrics', () => {
    return performanceTracker.getMetrics()
  })
  
  // Get tracking status
  ipcMain.handle('get-tracking-status', () => {
    return performanceTracker.getStatus()
  })
  
  // Pause tracking
  ipcMain.handle('pause-tracking', () => {
    performanceTracker.pause()
    updateTrayMenu()
    return { success: true, isPaused: true }
  })
  
  // Resume tracking
  ipcMain.handle('resume-tracking', () => {
    performanceTracker.resume()
    updateTrayMenu()
    return { success: true, isPaused: false }
  })
  
  // Log visited URLs to console
  ipcMain.handle('log-visited-urls', () => {
    performanceTracker.logVisitedUrls()
    return { success: true }
  })
  
  // Get sync status
  ipcMain.handle('get-sync-status', () => {
    return syncService.getStatus()
  })
  
  // Force sync
  ipcMain.handle('force-sync', async () => {
    await syncService.forcSync()
    return syncService.getStatus()
  })
  
  // Start sync service with session token
  ipcMain.handle('start-sync-service', (event, sessionToken) => {
    console.log('[Main] Starting sync service with session token')
    syncService.start(sessionToken)
    return { success: true }
  })
  
  // Stop sync service
  ipcMain.handle('stop-sync-service', () => {
    syncService.stop()
    return { success: true }
  })
  
  // Get break status
  ipcMain.handle('get-break-status', () => {
    return breakHandler.getStatus()
  })
  
  // Start break (no kiosk mode)
  ipcMain.handle('start-break', (event, breakData) => {
    console.log('[Main] 🚀 BREAK START REQUESTED:', breakData)
    
    // Start break in break handler
    const breakInfo = breakHandler.startBreak(breakData)
    console.log('[Main] Break handler result:', breakInfo)
    
    // Pause performance tracking
    console.log('[Main] Pausing performance tracking...')
    performanceTracker.pause()
    console.log('[Main] Performance tracking paused')
    
    // Set break mode to disable inactivity dialog during breaks
    console.log('[Main] Setting break mode...')
    activityTracker.setBreakMode(true)
    console.log('[Main] Break mode enabled - inactivity dialog disabled')
    
    updateTrayMenu()
    
    return { success: true, break: breakInfo }
  })
  
  // End break (no kiosk mode)
  ipcMain.handle('end-break', () => {
    console.log('[Main] 🛑 BREAK END REQUESTED')
    
    // End break in break handler
    const breakInfo = breakHandler.endBreak()
    console.log('[Main] Break handler result:', breakInfo)
    
    // Resume performance tracking
    console.log('[Main] Resuming performance tracking...')
    performanceTracker.resume()
    console.log('[Main] Performance tracking resumed')
    
    // Disable break mode to re-enable inactivity dialog
    console.log('[Main] Disabling break mode...')
    activityTracker.setBreakMode(false)
    console.log('[Main] Break mode disabled - inactivity dialog enabled')
    
    updateTrayMenu()
    
    return { success: true, break: breakInfo }
  })
  
  // Activity tracker handlers
  ipcMain.handle('get-activity-status', () => {
    return activityTracker.getStatus()
  })
  
  ipcMain.handle('activity-tracker:start', () => {
    activityTracker.startTracking()
    return { success: true }
  })
  
  ipcMain.handle('activity-tracker:stop', () => {
    activityTracker.stopTracking()
    return { success: true }
  })
  
  ipcMain.handle('activity-tracker:set-timeout', (event, milliseconds) => {
    activityTracker.setInactivityTimeout(milliseconds)
    return { success: true }
  })
  
  ipcMain.handle('activity-tracker:set-break-mode', (event, isOnBreak) => {
    activityTracker.setBreakMode(isOnBreak)
    return { success: true }
  })
  
  // Screenshot service handlers
  ipcMain.handle('screenshot:get-status', () => {
    return screenshotService.getStatus()
  })
  
  ipcMain.handle('screenshot:capture-now', async () => {
    return await screenshotService.captureNow()
  })
  
  console.log('[Main] IPC handlers registered')
}

// App lifecycle
app.whenReady().then(async () => {
  console.log('[Main] App ready, initializing...')
  
  // Setup IPC first
  setupIPC()
  
  // Create window
  createWindow()
  
  // Create system tray
  createTray()
  
  // Initialize tracking services
  await initializeTracking()
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else if (mainWindow) {
      mainWindow.show()
    }
  })
})

app.on('window-all-closed', function () {
  // Don't quit the app when all windows are closed
  // Keep running in background (system tray)
  if (process.platform !== 'darwin') {
    // On Windows/Linux, keep running in tray
    console.log('[Main] All windows closed, running in background')
  }
})

app.on('before-quit', () => {
  app.isQuitting = true
  
  // Stop tracking services
  console.log('[Main] Stopping tracking services...')
  performanceTracker.stop()
  syncService.stop()
  activityTracker.destroy()
  screenshotService.destroy()
})

// Handle crashes and errors
process.on('uncaughtException', (error) => {
  console.error('[Main] Uncaught exception:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Main] Unhandled rejection at:', promise, 'reason:', reason)
})

console.log('[Main] Electron main process started')