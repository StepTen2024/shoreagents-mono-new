const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron')
const path = require('path')
const fs = require('fs')

// Setup file logging for production debugging
const logFilePath = path.join(app.getPath('userData'), 'screenshot-debug.log')
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' })

// Override console.log to also write to file in production
const originalLog = console.log
const originalError = console.error
const originalWarn = console.warn

console.log = function(...args) {
  const timestamp = new Date().toISOString()
  const message = `[${timestamp}] ${args.join(' ')}\n`
  logStream.write(message)
  originalLog.apply(console, args)
}

console.error = function(...args) {
  const timestamp = new Date().toISOString()
  const message = `[${timestamp}] ERROR: ${args.join(' ')}\n`
  logStream.write(message)
  originalError.apply(console, args)
}

console.warn = function(...args) {
  const timestamp = new Date().toISOString()
  const message = `[${timestamp}] WARN: ${args.join(' ')}\n`
  logStream.write(message)
  originalWarn.apply(console, args)
}

console.log('[Main] ============================================')
console.log('[Main] 📝 Logging initialized')
console.log('[Main] Log file location:', logFilePath)
console.log('[Main] ============================================')

// Import services
const performanceTracker = require('./services/performanceTracker')
const syncService = require('./services/syncService')
const breakHandler = require('./services/breakHandler')
const activityTracker = require('./activity-tracker')
const screenshotService = require('./services/screenshotService')
const permissions = require('./utils/permissions')
const config = require('./config/trackerConfig')
const autoUpdater = require('./services/autoUpdater')

let mainWindow = null
let tray = null

function createWindow() {
  // Set window icon
  const iconPath = path.join(__dirname, '../build/shoreagents-icon.png')
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    icon: iconPath,
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
    console.log('[Main] ========================================')
    console.log('[Main] LOADING PRODUCTION APP')
    console.log('[Main] Production URL:', productionUrl)
    console.log('[Main] API_BASE_URL from config:', productionUrl)
    console.log('[Main] process.env.API_BASE_URL:', process.env.API_BASE_URL)
    console.log('[Main] ========================================')
    
    // Load with proper user agent
    mainWindow.loadURL(productionUrl, {
      userAgent: 'ShoreAgentsAI-Desktop/1.0.0 (Electron)'
    })
    
    // Open dev tools in production to debug
    mainWindow.webContents.openDevTools()
  }

  // Prevent window from closing, hide instead
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow.hide()
    }
  })

  // Window ready
  mainWindow.webContents.on('did-finish-load', async () => {
    console.log('[Main] Window loaded successfully')
    
    // Send tracking status to renderer
    mainWindow.webContents.send('tracking-status', performanceTracker.getStatus())
    
    // Check for session cookie after page load (in case user just logged in)
    setTimeout(async () => {
      try {
        const cookies = await mainWindow.webContents.session.cookies.get({
          url: config.API_BASE_URL
        })
        
        const sessionCookie = cookies.find(c => 
          c.name === 'authjs.session-token' || 
          c.name === 'next-auth.session-token' ||
          c.name === '__Secure-authjs.session-token' ||
          c.name === '__Secure-next-auth.session-token'
        )
        
        if (sessionCookie) {
          console.log('[Main] 🔄 Updating session token in services')
          syncService.setSessionToken(sessionCookie.value)
          await screenshotService.updateSessionToken(sessionCookie.value)
          console.log('[Main] ✅ Session token updated in sync and screenshot services')
        }
      } catch (err) {
        console.error('[Main] Error updating session cookie:', err)
      }
    }, 2000) // Wait 2 seconds for cookies to be set
  })
  
  // Handle loading errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('[Main] Failed to load:', errorDescription)
    console.error('[Main] Error code:', errorCode)
    console.error('[Main] URL:', validatedURL)
    
    // If loading failed, try to reload after a delay
    if (errorCode !== -3) { // -3 is ERR_ABORTED which is normal for navigation
      console.log('[Main] Retrying in 3 seconds...')
      setTimeout(() => {
        if (!mainWindow.isDestroyed()) {
          mainWindow.reload()
        }
      }, 3000)
    }
  })
  
  // Log console messages from the renderer
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer Console] ${message}`)
  })
  
  // Check what content is being loaded
  mainWindow.webContents.on('dom-ready', () => {
    console.log('[Main] DOM is ready')
    console.log('[Main] Current URL:', mainWindow.webContents.getURL())
    
    // Check if page shows error
    mainWindow.webContents.executeJavaScript(`
      document.body.innerText.substring(0, 200)
    `).then(text => {
      console.log('[Main] Page content preview:', text)
    }).catch(err => {
      console.error('[Main] Could not read page content:', err)
    })
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
  // Use the app icon for system tray
  const iconPath = path.join(__dirname, '../build/shoreagents-icon.png')
  const icon = nativeImage.createFromPath(iconPath)
  tray = new Tray(icon)
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Dashboard',
      click: () => {
        if (mainWindow) {
          // Restore if minimized
          if (mainWindow.isMinimized()) {
            mainWindow.restore()
          }
          mainWindow.show()
          mainWindow.focus()
          
          // Bring to front on Windows
          if (process.platform === 'win32') {
            mainWindow.setAlwaysOnTop(true)
            mainWindow.setAlwaysOnTop(false)
          }
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
  
  // Click to toggle window visibility
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible() && !mainWindow.isMinimized()) {
        // Window is visible and not minimized - hide it
        console.log('[Main] Tray clicked - hiding window')
        mainWindow.hide()
      } else {
        // Window is hidden or minimized - restore and show it
        console.log('[Main] Tray clicked - showing window')
        
        // Restore if minimized
        if (mainWindow.isMinimized()) {
          mainWindow.restore()
        }
        
        // Show and focus
        mainWindow.show()
        mainWindow.focus()
        
        // Bring to front on Windows
        if (process.platform === 'win32') {
          mainWindow.setAlwaysOnTop(true)
          mainWindow.setAlwaysOnTop(false)
        }
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
          // Restore if minimized
          if (mainWindow.isMinimized()) {
            mainWindow.restore()
          }
          mainWindow.show()
          mainWindow.focus()
          
          // Bring to front on Windows
          if (process.platform === 'win32') {
            mainWindow.setAlwaysOnTop(true)
            mainWindow.setAlwaysOnTop(false)
          }
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
          // Restore if minimized
          if (mainWindow.isMinimized()) {
            mainWindow.restore()
          }
          mainWindow.show()
          mainWindow.focus()
          
          // Bring to front on Windows
          if (process.platform === 'win32') {
            mainWindow.setAlwaysOnTop(true)
            mainWindow.setAlwaysOnTop(false)
          }
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
  
  // Get session cookie for sync service and screenshot service
  try {
    const cookies = await mainWindow.webContents.session.cookies.get({
      url: config.API_BASE_URL
    })
    
    console.log('[Main] 🔍 Looking for session cookie...')
    console.log('[Main] Available cookies:', cookies.map(c => c.name).join(', '))
    
    const sessionCookie = cookies.find(c => 
      c.name === 'authjs.session-token' || 
      c.name === 'next-auth.session-token' ||
      c.name === '__Secure-authjs.session-token' ||
      c.name === '__Secure-next-auth.session-token'
    )
    
    if (sessionCookie) {
      console.log(`[Main] ✅ Found session cookie: ${sessionCookie.name}`)
      
      // Start sync service with session token
      syncService.start(sessionCookie.value)
      console.log('[Main] Sync service started with authentication')
      
      // Initialize and start screenshot service
      await screenshotService.initialize({
        apiUrl: config.API_BASE_URL
      })
      await screenshotService.start(sessionCookie.value)
      console.log('[Main] Screenshot service started with authentication')
    } else {
      console.warn('[Main] ⚠️  No session cookie found - services will start but may fail authentication')
      console.warn('[Main] User needs to login first')
      
      // Start services anyway - they'll get the cookie after login
      syncService.start()
      console.log('[Main] Sync service started (waiting for authentication)')
      
      await screenshotService.initialize({
        apiUrl: config.API_BASE_URL
      })
      await screenshotService.start() // Start without token, will get it after login
      console.log('[Main] Screenshot service started (waiting for authentication)')
    }
  } catch (err) {
    console.error('[Main] Error starting services:', err)
    // Start services anyway
    syncService.start()
    await screenshotService.initialize({
      apiUrl: config.API_BASE_URL
    })
    await screenshotService.start() // Start even without token
    console.log('[Main] Screenshot service started (fallback mode)')
  }
  
  // Update tray menu with current status
  updateTrayMenu()
  
  // Send metrics to renderer every 1 second (for real-time active time display)
  setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const metrics = performanceTracker.getMetrics()
      const status = performanceTracker.getStatus()
      mainWindow.webContents.send('metrics-update', { metrics, status })
    }
  }, 1000) // 1 second for smooth active time updates
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
    await syncService.forceSync()
    return syncService.getStatus()
  })
  
  // Load metrics from database (for baseline after logout/login)
  ipcMain.handle('load-metrics-from-database', async (event, databaseMetrics) => {
    console.log('[Main] Loading metrics from database into performance tracker')
    await performanceTracker.loadFromDatabase(databaseMetrics)
    return { success: true }
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
  
  // Reset metrics and sync state (called on clock-in)
  ipcMain.handle('reset-metrics', () => {
    console.log('🔄 [Main] ============================================================')
    console.log('🔄 [Main] CLOCK-IN DETECTED - RESETTING ALL TRACKING SYSTEMS')
    console.log('🔄 [Main] ============================================================')
    
    // Reset performance tracker (sets all metrics to zero)
    performanceTracker.resetMetrics()
    
    // Reset sync service (clears last synced snapshot, forces fresh baseline)
    syncService.reset()
    
    // Reset activity tracker (clears activity timestamps and state)
    activityTracker.reset()
    
    console.log('🔄 [Main] ============================================================')
    console.log('🔄 [Main] ALL SYSTEMS RESET - READY FOR NEW SESSION')
    console.log('🔄 [Main] ============================================================')
    
    return { success: true, message: 'All tracking systems reset successfully' }
  })
  
  // Clear all cookies (for debugging auth issues)
  ipcMain.handle('clear-cookies', async () => {
    try {
      const { session } = require('electron')
      const cookies = await session.defaultSession.cookies.get({})
      console.log(`[Main] Clearing ${cookies.length} cookies...`)
      
      for (const cookie of cookies) {
        const url = `${cookie.secure ? 'https' : 'http'}://${cookie.domain}${cookie.path}`
        await session.defaultSession.cookies.remove(url, cookie.name)
        console.log(`[Main] ❌ Removed cookie: ${cookie.name} from ${cookie.domain}`)
      }
      
      console.log('[Main] ✅ All cookies cleared!')
      return { success: true, cleared: cookies.length }
    } catch (error) {
      console.error('[Main] Error clearing cookies:', error)
      return { success: false, error: error.message }
    }
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
  
  ipcMain.handle('screenshot:update-token', async (event, sessionToken) => {
    console.log('[Main] Updating screenshot service session token via IPC')
    await screenshotService.updateSessionToken(sessionToken)
    return { success: true }
  })
  
  // Set staff user ID directly (more reliable than fetching from API)
  ipcMain.handle('screenshot:set-staff-user-id', async (event, staffUserId) => {
    console.log('[Main] Setting screenshot service staff user ID via IPC:', staffUserId)
    screenshotService.setStaffUserId(staffUserId)
    return { success: true }
  })
  
  // Screenshot diagnostic
  ipcMain.handle('screenshot:run-diagnostic', async () => {
    const { runDiagnostic } = require('./utils/screenshotDiagnostic')
    return await runDiagnostic()
  })
  
  // Get log file path
  ipcMain.handle('get-log-file-path', () => {
    return logFilePath
  })
  
  // Open log file
  ipcMain.handle('open-log-file', () => {
    const { shell } = require('electron')
    shell.openPath(logFilePath)
    return { success: true, path: logFilePath }
  })
  
  // Auto-updater handlers
  ipcMain.handle('updater:check-for-updates', async () => {
    return await autoUpdater.checkForUpdates()
  })
  
  ipcMain.handle('updater:download-update', async () => {
    return await autoUpdater.downloadUpdate()
  })
  
  ipcMain.handle('updater:quit-and-install', () => {
    console.log('[Main] Preparing to quit and install update...')
    
    // Set quitting flag
    app.isQuitting = true
    
    // Stop all services
    console.log('[Main] Stopping all services...')
    try {
      performanceTracker.stop()
      syncService.stop()
      activityTracker.destroy()
      screenshotService.destroy()
      autoUpdater.destroy()
    } catch (error) {
      console.error('[Main] Error stopping services:', error)
    }
    
    // Destroy system tray
    if (tray) {
      try {
        tray.destroy()
        tray = null
        console.log('[Main] System tray destroyed')
      } catch (error) {
        console.error('[Main] Error destroying tray:', error)
      }
    }
    
    // Close all windows
    BrowserWindow.getAllWindows().forEach(win => {
      try {
        win.destroy()
      } catch (error) {
        console.error('[Main] Error closing window:', error)
      }
    })
    
    // Give time for cleanup, then install
    setTimeout(() => {
      console.log('[Main] Installing update...')
      autoUpdater.quitAndInstall()
    }, 500)
    
    return { success: true }
  })
  
  console.log('[Main] IPC handlers registered')
}

// ============================================================================
// SINGLE INSTANCE LOCK - Prevent multiple app instances
// ============================================================================
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  // Another instance is already running, quit this one
  console.log('[Main] Another instance is already running. Quitting...')
  app.quit()
} else {
  // This is the first instance
  // Handle attempts to create a second instance
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    console.log('[Main] ============================================================')
    console.log('[Main] Second instance detected - restoring existing window')
    console.log('[Main] ============================================================')
    
    // Someone tried to run a second instance, restore our window instead
    if (mainWindow) {
      // If window is minimized, restore it
      if (mainWindow.isMinimized()) {
        console.log('[Main] Restoring minimized window')
        mainWindow.restore()
      }
      
      // Show and focus the window
      console.log('[Main] Showing and focusing window')
      mainWindow.show()
      mainWindow.focus()
      
      // Bring to front on Windows
      if (process.platform === 'win32') {
        mainWindow.setAlwaysOnTop(true)
        mainWindow.setAlwaysOnTop(false)
      }
    } else {
      console.log('[Main] Main window not available, creating new window')
      createWindow()
    }
  })
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
  
  // Initialize auto-updater (works in both staff and client modes)
  autoUpdater.initialize(mainWindow)
  
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
  autoUpdater.destroy()
})

// Handle crashes and errors
process.on('uncaughtException', (error) => {
  console.error('[Main] Uncaught exception:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Main] Unhandled rejection at:', promise, 'reason:', reason)
})

console.log('[Main] Electron main process started')