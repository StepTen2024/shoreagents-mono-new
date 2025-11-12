/**
 * Auto-Updater Service
 * Handles automatic app updates using electron-updater with GitHub Releases
 */

const { autoUpdater } = require('electron-updater')
const { app, dialog, BrowserWindow } = require('electron')
const log = require('electron-log')

class AutoUpdaterService {
  constructor() {
    this.mainWindow = null
    this.updateCheckInterval = null
    
    // Configure logging
    log.transports.file.level = 'info'
    autoUpdater.logger = log
    
    // Configure auto-updater
    autoUpdater.autoDownload = false // Don't auto-download, ask user first
    autoUpdater.autoInstallOnAppQuit = true // Install on quit
    
    // Setup event listeners
    this.setupListeners()
  }
  
  /**
   * Initialize the auto-updater with the main window
   */
  initialize(mainWindow) {
    this.mainWindow = mainWindow
    console.log('[AutoUpdater] Initialized')
    
    // Check for updates on startup (after 10 seconds)
    setTimeout(() => {
      this.checkForUpdates()
    }, 10000)
    
    // Check for updates every 4 hours
    this.updateCheckInterval = setInterval(() => {
      this.checkForUpdates()
    }, 4 * 60 * 60 * 1000) // 4 hours in milliseconds
  }
  
  /**
   * Setup event listeners for auto-updater
   */
  setupListeners() {
    // Checking for updates
    autoUpdater.on('checking-for-update', () => {
      console.log('[AutoUpdater] Checking for updates...')
      this.sendStatusToWindow('Checking for updates...')
    })
    
    // Update available
    autoUpdater.on('update-available', (info) => {
      console.log('[AutoUpdater] Update available:', info.version)
      this.sendStatusToWindow('update-available', info)
      
      // Show dialog to user
      this.showUpdateAvailableDialog(info)
    })
    
    // No update available
    autoUpdater.on('update-not-available', (info) => {
      console.log('[AutoUpdater] App is up to date:', info.version)
      this.sendStatusToWindow('update-not-available', info)
    })
    
    // Download progress
    autoUpdater.on('download-progress', (progressObj) => {
      const logMessage = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`
      console.log('[AutoUpdater]', logMessage)
      this.sendStatusToWindow('download-progress', progressObj)
    })
    
    // Update downloaded
    autoUpdater.on('update-downloaded', (info) => {
      console.log('[AutoUpdater] Update downloaded:', info.version)
      this.sendStatusToWindow('update-downloaded', info)
      
      // Show dialog to install
      this.showUpdateReadyDialog(info)
    })
    
    // Error occurred
    autoUpdater.on('error', (err) => {
      console.error('[AutoUpdater] Error:', err)
      this.sendStatusToWindow('error', { message: err.message })
    })
  }
  
  /**
   * Send update status to renderer window
   */
  sendStatusToWindow(status, data = null) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('update-status', { status, data })
    }
  }
  
  /**
   * Check for updates manually
   */
  async checkForUpdates() {
    try {
      // Only check for updates in production
      if (!app.isPackaged) {
        console.log('[AutoUpdater] Skipping update check in development mode')
        return
      }
      
      console.log('[AutoUpdater] Checking for updates...')
      const result = await autoUpdater.checkForUpdates()
      console.log('[AutoUpdater] Check result:', result)
      return result
    } catch (error) {
      console.error('[AutoUpdater] Error checking for updates:', error)
      return null
    }
  }
  
  /**
   * Show dialog when update is available
   */
  showUpdateAvailableDialog(info) {
    const version = info.version
    const currentVersion = app.getVersion()
    
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `A new version (v${version}) is available!`,
      detail: `Current version: v${currentVersion}\n\nWould you like to download and install it?\n\nRelease Notes:\n${info.releaseNotes || 'No release notes available'}`,
      buttons: ['Download Now', 'Later'],
      defaultId: 0,
      cancelId: 1
    }).then((response) => {
      if (response.response === 0) {
        // User chose to download
        this.downloadUpdate()
      }
    })
  }
  
  /**
   * Show dialog when update is downloaded and ready
   */
  showUpdateReadyDialog(info) {
    dialog.showMessageBox(this.mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded successfully!',
      detail: `Version ${info.version} has been downloaded and is ready to install.\n\nThe app will restart to complete the installation.`,
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1
    }).then((response) => {
      if (response.response === 0) {
        // User chose to restart
        this.quitAndInstall()
      }
    })
  }
  
  /**
   * Download the update
   */
  async downloadUpdate() {
    try {
      console.log('[AutoUpdater] Starting download...')
      this.sendStatusToWindow('downloading')
      await autoUpdater.downloadUpdate()
      console.log('[AutoUpdater] Download started')
    } catch (error) {
      console.error('[AutoUpdater] Error downloading update:', error)
      
      dialog.showErrorBox('Update Error', 'Failed to download update. Please try again later.')
    }
  }
  
  /**
   * Quit and install the update
   */
  quitAndInstall() {
    console.log('[AutoUpdater] Quitting and installing update...')
    
    // Set a flag to prevent the window close handler from interfering
    app.isQuitting = true
    
    // Install the update (will quit and restart the app)
    autoUpdater.quitAndInstall(false, true)
  }
  
  /**
   * Clean up
   */
  destroy() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval)
      this.updateCheckInterval = null
    }
    console.log('[AutoUpdater] Destroyed')
  }
}

// Export singleton instance
module.exports = new AutoUpdaterService()

