const { contextBridge, ipcRenderer } = require('electron')

// Expose Electron APIs to renderer process
contextBridge.exposeInMainWorld('electron', {
  // Platform info
  platform: process.platform,
  
  // Performance Tracking API
  performance: {
    // Get current metrics
    getCurrentMetrics: () => ipcRenderer.invoke('get-current-metrics'),
    
    // Get tracking status
    getStatus: () => ipcRenderer.invoke('get-tracking-status'),
    
    // Pause tracking
    pause: () => ipcRenderer.invoke('pause-tracking'),
    
    // Resume tracking
    resume: () => ipcRenderer.invoke('resume-tracking'),
    
    // Log visited URLs to console
    logVisitedUrls: () => ipcRenderer.invoke('log-visited-urls'),
    
    // Listen for metrics updates
    onMetricsUpdate: (callback) => {
      const subscription = (event, data) => callback(data)
      ipcRenderer.on('metrics-update', subscription)
      
      // Return unsubscribe function
      return () => {
        ipcRenderer.removeListener('metrics-update', subscription)
      }
    },
    
    // Listen for tracking status changes
    onStatusChange: (callback) => {
      const subscription = (event, status) => callback(status)
      ipcRenderer.on('tracking-status', subscription)
      
      return () => {
        ipcRenderer.removeListener('tracking-status', subscription)
      }
    },
  },
  
  // Sync Service API
  sync: {
    // Get sync status
    getStatus: () => ipcRenderer.invoke('get-sync-status'),
    
    // Force immediate sync
    forceSync: () => ipcRenderer.invoke('force-sync'),
    
    // Start sync service with session token
    start: (sessionToken) => ipcRenderer.invoke('start-sync-service', sessionToken),
    
    // Stop sync service
    stop: () => ipcRenderer.invoke('stop-sync-service'),
    
    // Reset metrics and sync state (call on clock-in)
    reset: () => ipcRenderer.invoke('reset-metrics'),
  },
  
  // Break Handler API
  breaks: {
    // Get break status
    getStatus: () => ipcRenderer.invoke('get-break-status'),
    
    // Start break with kiosk mode
    start: (breakData) => ipcRenderer.invoke('start-break', breakData),
    
    // End break and exit kiosk mode
    end: () => ipcRenderer.invoke('end-break'),
    
    // Notify main process of break start (legacy)
    notifyBreakStart: (breakData) => {
      ipcRenderer.send('break-started', breakData)
    },
    
    // Notify main process of break end (legacy)
    notifyBreakEnd: (breakData) => {
      ipcRenderer.send('break-ended', breakData)
    },
    
    // Listen for break selector requests
    onShowBreakSelector: (callback) => {
      const subscription = () => callback()
      ipcRenderer.on('show-break-selector', subscription)
      
      return () => {
        ipcRenderer.removeListener('show-break-selector', subscription)
      }
    },
  },
  
  // Navigation API
  navigation: {
    // Listen for navigation requests
    onNavigateTo: (callback) => {
      const subscription = (event, path) => callback(path)
      ipcRenderer.on('navigate-to', subscription)
      
      return () => {
        ipcRenderer.removeListener('navigate-to', subscription)
      }
    },
  },
  
  // Permissions API
  permissions: {
    // Listen for permission requests
    onPermissionsNeeded: (callback) => {
      const subscription = (event, instructions) => callback(instructions)
      ipcRenderer.on('permissions-needed', subscription)
      
      return () => {
        ipcRenderer.removeListener('permissions-needed', subscription)
      }
    },
  },
  
  // Activity Tracker API
  activityTracker: {
    // Get activity status
    getStatus: () => ipcRenderer.invoke('get-activity-status'),
    
    // Start activity tracking
    start: () => ipcRenderer.invoke('activity-tracker:start'),
    
    // Stop activity tracking
    stop: () => ipcRenderer.invoke('activity-tracker:stop'),
    
    // Set break mode to disable inactivity dialog during breaks
    setBreakMode: (isOnBreak) => ipcRenderer.invoke('activity-tracker:set-break-mode', isOnBreak),
    
    // Set inactivity timeout (in milliseconds)
    setTimeout: (milliseconds) => ipcRenderer.invoke('activity-tracker:set-timeout', milliseconds),
    
    // Listen for break requests from activity tracker
    onBreakRequested: (callback) => {
      const subscription = () => callback()
      ipcRenderer.on('activity-tracker:break-requested', subscription)
      
      return () => {
        ipcRenderer.removeListener('activity-tracker:break-requested', subscription)
      }
    },
    
    // Listen for debug activity events (temporary for debugging)
    onActivityDebug: (callback) => {
      const subscription = (event, data) => callback(data)
      ipcRenderer.on('activity-debug', subscription)
      
      return () => {
        ipcRenderer.removeListener('activity-debug', subscription)
      }
    },
  },
  
  // Screenshot Service API
  screenshots: {
    // Get screenshot detection status
    getStatus: () => ipcRenderer.invoke('screenshot:get-status'),
    
    // Manually capture screenshot from clipboard
    captureNow: () => ipcRenderer.invoke('screenshot:capture-now'),
    
    // Run screenshot diagnostic
    runDiagnostic: () => ipcRenderer.invoke('screenshot:run-diagnostic'),
  },
  
  // Auto-Updater API
  updater: {
    // Check for updates
    checkForUpdates: () => ipcRenderer.invoke('updater:check-for-updates'),
    
    // Download update
    downloadUpdate: () => ipcRenderer.invoke('updater:download-update'),
    
    // Quit and install update
    quitAndInstall: () => ipcRenderer.invoke('updater:quit-and-install'),
    
    // Listen for update status changes
    onUpdateStatus: (callback) => {
      const subscription = (event, data) => callback(data)
      ipcRenderer.on('update-status', subscription)
      
      return () => {
        ipcRenderer.removeListener('update-status', subscription)
      }
    },
  },
  
  // Utility to check if running in Electron
  isElectron: true,
  
  // Debug/Admin API
  debug: {
    // Clear all cookies (for fixing auth issues)
    clearCookies: () => ipcRenderer.invoke('clear-cookies'),
  },
})

console.log('[Preload] Electron APIs exposed to renderer')