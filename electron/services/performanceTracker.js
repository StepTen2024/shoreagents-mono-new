/**
 * Performance Tracker Service
 * 
 * Tracks user activity metrics including mouse, keyboard, idle time, etc.
 */

const { screen, powerMonitor } = require('electron')
const config = require('../config/trackerConfig')

class PerformanceTracker {
  constructor() {
    this.metrics = this.initializeMetrics()
    this.isTracking = false
    this.isPaused = false
    this.trackingInterval = null
    this.lastMousePosition = { x: 0, y: 0 }
    this.lastActivityTime = Date.now()
    this.sessionStartTime = Date.now()
    this.lastIdleCheck = Date.now()
    
    // Optional dependencies (may not be available on all platforms)
    this.systemIdleTime = this.loadOptionalDependency('@paulcbetts/system-idle-time')
    this.activeWin = this.loadOptionalDependency('active-win')
    this.clipboardy = this.loadOptionalDependency('clipboardy')
    // Note: iohook removed (deprecated) - Input tracking handled by Activity Tracker (uiohook-napi)
    
    // Activity tracking state
    this.currentApp = null
    this.currentUrl = null
    this.lastClipboardContent = ''
    this.activeApps = new Set()
    this.visitedUrls = new Set()
    
    this.log('Performance Tracker initialized')
  }

  loadOptionalDependency(name) {
    try {
      return require(name)
    } catch (error) {
      this.log(`Optional dependency ${name} not available: ${error.message}`)
      return null
    }
  }

  initializeMetrics() {
    return {
      mouseMovements: 0,
      mouseClicks: 0,
      keystrokes: 0,
      activeTime: 0, // in seconds
      idleTime: 0, // in seconds
      screenTime: 0, // in seconds
      downloads: 0,
      uploads: 0,
      bandwidth: 0,
      clipboardActions: 0,
      filesAccessed: 0,
      urlsVisited: 0, // Count of unique URLs visited
      tabsSwitched: 0,
      productivityScore: 0,
      applicationsUsed: [],
      lastUpdated: Date.now()
    }
  }

  /**
   * Start tracking user activity
   * Note: Keyboard and mouse input tracking is handled by Activity Tracker (uiohook-napi)
   */
  start() {
    if (this.isTracking) {
      this.log('Tracker already running')
      return
    }

    // Check if we should be tracking (only for staff users)
    if (this.shouldDisableTracking()) {
      this.log('🚫 Performance tracking disabled - non-staff portal detected')
      return
    }

    this.isTracking = true
    this.sessionStartTime = Date.now()
    this.lastActivityTime = Date.now()
    this.log('Starting performance tracking...')
    this.log('Note: Input tracking is handled by Activity Tracker (uiohook-napi)')

    // Input tracking is now handled by Activity Tracker
    // this.setupInputTracking() - REMOVED (deprecated iohook)

    // Start main tracking loop
    this.trackingInterval = setInterval(() => {
      // Check if we should still be tracking
      if (this.shouldDisableTracking()) {
        this.log('🚫 Non-staff portal detected during tracking - stopping performance tracker')
        this.stop()
        return
      }
      
      this.updateMetrics()
    }, config.TRACKING_INTERVAL)

    // Track screen time
    this.startScreenTimeTracking()

    // Monitor clipboard (if available)
    if (this.clipboardy && config.TRACK_CLIPBOARD) {
      this.startClipboardMonitoring()
    }

    // Track active window/application (if available)
    if (this.activeWin && config.TRACK_APPLICATIONS) {
      this.startApplicationTracking()
    }

    this.log('Performance tracking started')
  }

  /**
   * Stop tracking user activity
   */
  stop() {
    if (!this.isTracking) {
      return
    }

    this.isTracking = false
    
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval)
      this.trackingInterval = null
    }

    // Stop application tracking
    if (this.applicationTrackingInterval) {
      clearInterval(this.applicationTrackingInterval)
      this.applicationTrackingInterval = null
    }

    // Stop clipboard monitoring
    if (this.clipboardInterval) {
      clearInterval(this.clipboardInterval)
      this.clipboardInterval = null
    }

    this.log('Performance tracking stopped')
  }

  /**
   * Pause tracking temporarily
   */
  pause() {
    this.isPaused = true
    this.log('⏸️ PERFORMANCE TRACKING PAUSED')
    console.log('[PerformanceTracker] isPaused set to:', this.isPaused)
  }

  /**
   * Resume tracking after pause
   */
  resume() {
    this.isPaused = false
    this.lastActivityTime = Date.now()
    this.log('▶️ PERFORMANCE TRACKING RESUMED')
    console.log('[PerformanceTracker] isPaused set to:', this.isPaused)
  }

  /**
   * Input tracking is now handled by Activity Tracker (uiohook-napi)
   * This method is kept for compatibility but does nothing
   * @deprecated - Use Activity Tracker for input tracking
   */
  setupInputTracking() {
    this.log('Input tracking is handled by Activity Tracker (uiohook-napi)')
  }

  /**
   * Update metrics periodically
   * Note: Idle time is now tracked by Activity Tracker when inactivity is detected
   */
  updateMetrics() {
    if (this.isPaused) {
      return
    }

    const now = Date.now()
    const timeSinceLastUpdate = (now - this.metrics.lastUpdated) / 1000 // seconds

    // Update screen time
    this.metrics.screenTime += timeSinceLastUpdate

    // Active time tracking
    // Note: Idle time is now tracked by Activity Tracker when inactivity dialog is shown
    // We only track active time here to avoid double-counting
    const idleSeconds = this.getSystemIdleTime()
    const isIdle = idleSeconds >= config.IDLE_THRESHOLD

    if (!isIdle) {
      // Only add to active time if user is not idle
      // Idle time will be added by Activity Tracker when inactivity is detected
      this.metrics.activeTime += timeSinceLastUpdate
    }
    // If idle, don't add time to either counter yet - wait for Activity Tracker to handle it

    // Calculate productivity score
    this.metrics.productivityScore = this.calculateProductivityScore()

    this.metrics.lastUpdated = now
  }

  /**
   * Get system idle time in seconds
   */
  getSystemIdleTime() {
    if (this.systemIdleTime) {
      try {
        return this.systemIdleTime.getIdleTime()
      } catch (error) {
        // Fallback: calculate based on last activity
        return Math.floor((Date.now() - this.lastActivityTime) / 1000)
      }
    }
    
    // Fallback: calculate based on last activity
    return Math.floor((Date.now() - this.lastActivityTime) / 1000)
  }

  /**
   * Start screen time tracking
   */
  startScreenTimeTracking() {
    // Track when display is turned off (system sleep/lock)
    powerMonitor.on('suspend', () => {
      this.log('System suspended')
      this.pause()
    })

    powerMonitor.on('resume', () => {
      this.log('System resumed')
      this.resume()
    })

    powerMonitor.on('lock-screen', () => {
      this.log('Screen locked')
      this.pause()
    })

    powerMonitor.on('unlock-screen', () => {
      this.log('Screen unlocked')
      this.resume()
    })
  }

  /**
   * Monitor clipboard activity
   */
  async startClipboardMonitoring() {
    try {
      // Get initial clipboard content
      this.lastClipboardContent = await this.clipboardy.read()

      // Check for clipboard changes periodically
      this.clipboardInterval = setInterval(async () => {
        if (this.isPaused) return
        
        // Check if we should still be tracking
        if (this.shouldDisableTracking()) {
          this.log('🚫 Non-staff portal detected during clipboard monitoring - stopping clipboard monitoring')
          clearInterval(this.clipboardInterval)
          this.clipboardInterval = null
          return
        }

        try {
          const currentContent = await this.clipboardy.read()
          if (currentContent !== this.lastClipboardContent) {
            this.metrics.clipboardActions++
            this.lastClipboardContent = currentContent
          }
        } catch (error) {
          // Ignore clipboard read errors
        }
      }, 1000) // Check every second
    } catch (error) {
      this.log(`Clipboard monitoring error: ${error.message}`)
    }
  }

  /**
   * Track active applications
   */
  startApplicationTracking() {
    this.applicationTrackingInterval = setInterval(async () => {
      if (this.isPaused) return
      
      // Check if we should still be tracking
      if (this.shouldDisableTracking()) {
        this.log('🚫 Non-staff portal detected during application tracking - stopping application tracking')
        clearInterval(this.applicationTrackingInterval)
        this.applicationTrackingInterval = null
        return
      }

      try {
        const window = await this.activeWin()
        if (window && window.owner && window.owner.name) {
          const appName = window.owner.name
          
          if (appName !== this.currentApp) {
            this.currentApp = appName
            this.metrics.tabsSwitched++
            this.activeApps.add(appName)
            this.metrics.applicationsUsed = Array.from(this.activeApps)
            console.log(`[PerformanceTracker] App switched to: ${appName}`)
          }

          // Track URLs for browsers (count only)
          const browserApps = ['Google Chrome', 'Chrome', 'Microsoft Edge', 'Edge', 'Brave Browser', 'Brave', 'Firefox', 'Mozilla Firefox']
          if (browserApps.some(browser => appName.includes(browser))) {
            console.log(`[PerformanceTracker] Browser detected: ${appName}, Title: ${window.title || 'no title'}`)
            const url = this.extractUrlFromWindow(window)
            console.log(`[PerformanceTracker] Extracted URL: ${url}`)
            if (url && url !== this.currentUrl) {
              this.currentUrl = url
              this.visitedUrls.add(url)
              this.metrics.urlsVisited = this.visitedUrls.size
              console.log(`[PerformanceTracker] URL visited: ${url} (Total: ${this.metrics.urlsVisited})`)
              // Log all visited URLs
              this.logVisitedUrls()
            }
          }
        }
      } catch (error) {
        console.error('[PerformanceTracker] Error in application tracking:', error)
      }
    }, 2000) // Check every 2 seconds
  }

  /**
   * Extract URL from browser window
   * @param {Object} window - Active window object from active-win
   * @returns {string|null} URL or null
   */
  extractUrlFromWindow(window) {
    // Try direct URL property first (some browsers provide this)
    if (window.url) {
      return window.url
    }

    // Try to extract from window title
    if (window.title) {
      let title = window.title.trim()
      
      // Remove browser suffix (e.g., " - Google Chrome", " - Personal - Microsoft​ Edge")
      const browserSuffixes = [
        ' - Google Chrome',
        ' - Chrome',
        ' - Microsoft Edge',
        ' - Microsoft​ Edge', // with zero-width space
        ' - Edge',
        ' - Mozilla Firefox',
        ' - Firefox',
        ' - Brave',
        ' - Brave Browser'
      ]
      
      for (const suffix of browserSuffixes) {
        if (title.endsWith(suffix)) {
          title = title.substring(0, title.length - suffix.length).trim()
          break
        }
      }
      
      // Remove "Personal - " prefix (Edge adds this)
      if (title.endsWith(' - Personal')) {
        title = title.substring(0, title.length - ' - Personal'.length).trim()
      }
      
      // Skip common non-page titles
      const skipTitles = ['New Tab', 'New tab', 'Untitled', '', 'Chrome', 'Edge', 'Firefox', 'Brave']
      
      // Check for exact match
      if (skipTitles.includes(title)) {
        return null
      }
      
      // Check if title starts with skip patterns (for cases like "New tab and 6 more pages")
      const skipStartsWith = ['New Tab', 'New tab']
      if (skipStartsWith.some(pattern => title.startsWith(pattern))) {
        return null
      }
      
      // Skip if it's just a number (like "1 more page")
      if (/^\d+\s+more\s+page/i.test(title)) {
        return null
      }

      // Check if title contains URL-like patterns
      const urlPattern = /https?:\/\/[^\s]+/
      const urlMatch = title.match(urlPattern)
      if (urlMatch) {
        return urlMatch[0]
      }

      // Use the cleaned page title as identifier
      if (title.length > 0) {
        return `page:${title.substring(0, 100)}` // Limit length
      }
    }

    return null
  }

  /**
   * Calculate productivity score (0-100)
   */
  calculateProductivityScore() {
    const totalTime = this.metrics.activeTime + this.metrics.idleTime
    if (totalTime === 0) return 0

    // Active time percentage (40% weight)
    const activePercent = (this.metrics.activeTime / totalTime) * 40

    // Keystroke activity (30% weight) - normalized to 5000 keystrokes as 100%
    const keystrokeScore = Math.min((this.metrics.keystrokes / 5000) * 30, 30)

    // Mouse activity (30% weight) - normalized to 1000 clicks as 100%
    const mouseScore = Math.min((this.metrics.mouseClicks / 1000) * 30, 30)

    return Math.round(activePercent + keystrokeScore + mouseScore)
  }

  /**
   * Get current metrics (with raw seconds for real-time display)
   */
  getMetrics() {
    return {
      ...this.metrics,
      // Keep raw seconds for real-time display (frontend will format)
      activeTime: this.metrics.activeTime,
      idleTime: this.metrics.idleTime,
      screenTime: this.metrics.screenTime,
      // Include visited URLs array
      visitedUrlsList: Array.from(this.visitedUrls),
    }
  }

  /**
   * Get metrics for API (formatted - converts seconds to minutes)
   */
  getMetricsForAPI() {
    const metrics = this.metrics
    
    return {
      mouseMovements: metrics.mouseMovements,
      mouseClicks: metrics.mouseClicks,
      keystrokes: metrics.keystrokes,
      // Convert seconds to minutes for API/database storage
      activeTime: Math.round(metrics.activeTime / 60),
      idleTime: Math.round(metrics.idleTime / 60),
      screenTime: Math.round(metrics.screenTime / 60),
      downloads: metrics.downloads,
      uploads: metrics.uploads,
      bandwidth: metrics.bandwidth,
      clipboardActions: metrics.clipboardActions,
      filesAccessed: metrics.filesAccessed,
      urlsVisited: metrics.urlsVisited,
      tabsSwitched: metrics.tabsSwitched,
      productivityScore: metrics.productivityScore,
      // Include visited URLs array for database storage
      visitedUrlsList: Array.from(this.visitedUrls),
      visitedUrls: Array.from(this.visitedUrls), // Store as JSON in database
      // Include applications used array for database storage
      applicationsUsed: metrics.applicationsUsed || [],
    }
  }

  /**
   * Log all visited URLs to console
   */
  logVisitedUrls() {
    console.log('\n=== VISITED URLs ===')
    console.log(`Total unique URLs visited: ${this.visitedUrls.size}`)
    if (this.visitedUrls.size > 0) {
      console.log('\nURLs List:')
      Array.from(this.visitedUrls).forEach((url, index) => {
        console.log(`  ${index + 1}. ${url}`)
      })
    } else {
      console.log('No URLs visited yet')
    }
    console.log('===================\n')
  }

  /**
   * Add idle time manually (called by Activity Tracker)
   * @param {number} seconds - Idle time in seconds to add
   */
  addIdleTime(seconds) {
    if (seconds > 0) {
      this.metrics.idleTime += seconds
      this.log(`Added ${seconds.toFixed(2)}s to idle time. Total: ${this.metrics.idleTime.toFixed(2)}s`)
    }
  }

  /**
   * Reset metrics (usually at midnight)
   */
  resetMetrics() {
    this.log('Resetting daily metrics')
    this.metrics = this.initializeMetrics()
    this.activeApps.clear()
    this.sessionStartTime = Date.now()
  }

  /**
   * Check if it's time to reset (midnight)
   */
  shouldResetMetrics() {
    const now = new Date()
    const lastUpdate = new Date(this.metrics.lastUpdated)
    
    return now.getDate() !== lastUpdate.getDate()
  }

  /**
   * Get tracking status
   */
  getStatus() {
    return {
      isTracking: this.isTracking,
      isPaused: this.isPaused,
      sessionDuration: Math.floor((Date.now() - this.sessionStartTime) / 1000),
      lastUpdate: this.metrics.lastUpdated,
      inputTrackingBy: 'Activity Tracker (uiohook-napi)',
      hasSystemIdleTime: !!this.systemIdleTime,
      hasActiveWin: !!this.activeWin,
      hasClipboardy: !!this.clipboardy,
    }
  }

  /**
   * Check if tracking should be disabled based on current URL
   * Only staff portal users should have tracking enabled
   */
  shouldDisableTracking() {
    try {
      // This will be called from the main process context
      // We need to get the current URL from the main window
      const { BrowserWindow } = require('electron')
      const mainWindow = BrowserWindow.getAllWindows()[0]
      
      if (!mainWindow) {
        return false // Default to allowing tracking if we can't determine
      }
      
      const currentUrl = mainWindow.webContents.getURL()
      
      // Check for non-staff portals
      const isClient = currentUrl.includes('/client')
      const isAdmin = currentUrl.includes('/admin')
      const isLoginPage = currentUrl.includes('/login')
      
      if (isLoginPage) {
        return true // Don't track on login pages
      }
      
      if (isClient || isAdmin) {
        return true // Don't track on client or admin portals
      }
      
      return false // Allow tracking for staff portal
    } catch (error) {
      console.error('[PerformanceTracker] Error checking URL:', error)
      return false // Default to allowing tracking if we can't determine
    }
  }

  log(message) {
    if (config.DEBUG) {
      console.log(`[PerformanceTracker] ${message}`)
    }
  }
}

module.exports = new PerformanceTracker()


