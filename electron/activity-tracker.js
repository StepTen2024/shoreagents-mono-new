/**
 * Activity Tracker for Electron
 * Monitors keyboard and mouse activity using uiohook-napi
 * Shows dialog when no activity detected for 30 seconds
 */

const { uIOhook, UiohookKey } = require('uiohook-napi')
const { BrowserWindow } = require('electron')
const path = require('path')

// Helper function to get readable key name from keycode
function getKeyName(keycode) {
  const keyMap = {
    // Letters
    [UiohookKey.A]: 'A', [UiohookKey.B]: 'B', [UiohookKey.C]: 'C', [UiohookKey.D]: 'D',
    [UiohookKey.E]: 'E', [UiohookKey.F]: 'F', [UiohookKey.G]: 'G', [UiohookKey.H]: 'H',
    [UiohookKey.I]: 'I', [UiohookKey.J]: 'J', [UiohookKey.K]: 'K', [UiohookKey.L]: 'L',
    [UiohookKey.M]: 'M', [UiohookKey.N]: 'N', [UiohookKey.O]: 'O', [UiohookKey.P]: 'P',
    [UiohookKey.Q]: 'Q', [UiohookKey.R]: 'R', [UiohookKey.S]: 'S', [UiohookKey.T]: 'T',
    [UiohookKey.U]: 'U', [UiohookKey.V]: 'V', [UiohookKey.W]: 'W', [UiohookKey.X]: 'X',
    [UiohookKey.Y]: 'Y', [UiohookKey.Z]: 'Z',
    
    // Numbers
    [UiohookKey.Digit0]: '0', [UiohookKey.Digit1]: '1', [UiohookKey.Digit2]: '2',
    [UiohookKey.Digit3]: '3', [UiohookKey.Digit4]: '4', [UiohookKey.Digit5]: '5',
    [UiohookKey.Digit6]: '6', [UiohookKey.Digit7]: '7', [UiohookKey.Digit8]: '8',
    [UiohookKey.Digit9]: '9',
    
    // Numpad
    [UiohookKey.Numpad0]: 'Num0', [UiohookKey.Numpad1]: 'Num1', [UiohookKey.Numpad2]: 'Num2',
    [UiohookKey.Numpad3]: 'Num3', [UiohookKey.Numpad4]: 'Num4', [UiohookKey.Numpad5]: 'Num5',
    [UiohookKey.Numpad6]: 'Num6', [UiohookKey.Numpad7]: 'Num7', [UiohookKey.Numpad8]: 'Num8',
    [UiohookKey.Numpad9]: 'Num9',
    
    // Special keys
    [UiohookKey.Enter]: 'Enter', [UiohookKey.Backspace]: 'Backspace',
    [UiohookKey.Tab]: 'Tab', [UiohookKey.Space]: 'Space',
    [UiohookKey.Escape]: 'Esc', [UiohookKey.Delete]: 'Del',
    [UiohookKey.Home]: 'Home', [UiohookKey.End]: 'End',
    [UiohookKey.PageUp]: 'PgUp', [UiohookKey.PageDown]: 'PgDn',
    
    // Arrow keys
    [UiohookKey.ArrowUp]: '↑', [UiohookKey.ArrowDown]: '↓',
    [UiohookKey.ArrowLeft]: '←', [UiohookKey.ArrowRight]: '→',
    
    // Modifiers
    [UiohookKey.Shift]: 'Shift', [UiohookKey.ShiftLeft]: 'LShift', [UiohookKey.ShiftRight]: 'RShift',
    [UiohookKey.Ctrl]: 'Ctrl', [UiohookKey.CtrlLeft]: 'LCtrl', [UiohookKey.CtrlRight]: 'RCtrl',
    [UiohookKey.Alt]: 'Alt', [UiohookKey.AltLeft]: 'LAlt', [UiohookKey.AltRight]: 'RAlt',
    [UiohookKey.Meta]: 'Win', [UiohookKey.MetaLeft]: 'LWin', [UiohookKey.MetaRight]: 'RWin',
    
    // Function keys
    [UiohookKey.F1]: 'F1', [UiohookKey.F2]: 'F2', [UiohookKey.F3]: 'F3', [UiohookKey.F4]: 'F4',
    [UiohookKey.F5]: 'F5', [UiohookKey.F6]: 'F6', [UiohookKey.F7]: 'F7', [UiohookKey.F8]: 'F8',
    [UiohookKey.F9]: 'F9', [UiohookKey.F10]: 'F10', [UiohookKey.F11]: 'F11', [UiohookKey.F12]: 'F12',
    
    // Punctuation
    [UiohookKey.Comma]: ',', [UiohookKey.Period]: '.', [UiohookKey.Slash]: '/',
    [UiohookKey.Semicolon]: ';', [UiohookKey.Quote]: "'", [UiohookKey.BracketLeft]: '[',
    [UiohookKey.BracketRight]: ']', [UiohookKey.Backslash]: '\\', [UiohookKey.Minus]: '-',
    [UiohookKey.Equal]: '=', [UiohookKey.Backquote]: '`',
    
    // Other
    [UiohookKey.CapsLock]: 'Caps', [UiohookKey.NumLock]: 'NumLk',
    [UiohookKey.ScrollLock]: 'ScrLk', [UiohookKey.PrintScreen]: 'PrtSc',
    [UiohookKey.Pause]: 'Pause', [UiohookKey.Insert]: 'Ins',
  }
  
  return keyMap[keycode] || `Key${keycode}`
}

class ActivityTracker {
  constructor() {
    this.lastActivityTime = Date.now()
    this.inactivityTimeout = 30000 // 30 seconds in milliseconds
    this.checkInterval = 5000 // Check every 5 seconds
    this.isTracking = false
    this.intervalId = null
    this.mainWindow = null
    this.dialogShown = false
    this.inactivityDialog = null
    this.dialogUpdateInterval = null
    this.performanceTracker = null
    this.inactivityStartTime = null // Track when inactivity started
    this.isOnBreak = false // Flag to disable inactivity dialog during breaks
    
    // Throttling for mouse movements
    this.lastMouseTrack = 0
    this.mouseMovementThrottle = 100 // milliseconds
  }

  /**
   * Initialize the activity tracker
   * @param {BrowserWindow} mainWindow - Reference to the main Electron window
   * @param {Object} performanceTracker - Reference to the performance tracker (optional)
   * @param {Object} screenshotService - Reference to the screenshot service (optional)
   */
  initialize(mainWindow, performanceTracker = null, screenshotService = null) {
    this.mainWindow = mainWindow
    this.performanceTracker = performanceTracker
    this.screenshotService = screenshotService
    
    if (this.performanceTracker) {
      console.log('[ActivityTracker] Integrated with performance tracker')
    }
    
    // Don't start tracking immediately - wait for explicit start call
    console.log('[ActivityTracker] Initialized but not started - waiting for explicit start')
  }

  /**
   * Start tracking user activity
   */
  startTracking() {
    if (this.isTracking) {
      console.log('[ActivityTracker] Already tracking')
      return
    }

    // Check if we should be tracking (only for staff users)
    if (this.shouldDisableTracking()) {
      console.log('[ActivityTracker] 🚫 Activity tracking disabled - non-staff portal detected')
      return
    }

    console.log('[ActivityTracker] Starting activity monitoring...')
    this.isTracking = true
    this.lastActivityTime = Date.now()
    this.dialogShown = false

    // Start uIOhook to listen for keyboard and mouse events
    try {
      // Mouse movement (throttled to avoid overwhelming the system)
      uIOhook.on('mousemove', (event) => {
        const now = Date.now()
        if (now - this.lastMouseTrack > this.mouseMovementThrottle) {
          this.onActivity('mousemove', event)
          this.lastMouseTrack = now
        }
      })
      
      // Mouse clicks
      uIOhook.on('mousedown', (event) => this.onActivity('mousedown', event))
      uIOhook.on('mouseup', (event) => this.onActivity('mouseup', event))
      uIOhook.on('click', (event) => this.onActivity('click', event))
      
      // Mouse wheel
      uIOhook.on('wheel', (event) => this.onActivity('wheel', event))

      // Keyboard events
      uIOhook.on('keydown', (event) => this.onActivity('keydown', event))
      uIOhook.on('keyup', (event) => this.onActivity('keyup', event))

      // Start the hook
      uIOhook.start()
      console.log('[ActivityTracker] uIOhook started successfully')

      // Start interval to check for inactivity
      this.intervalId = setInterval(() => this.checkInactivity(), this.checkInterval)
      console.log('[ActivityTracker] Inactivity checker started')
    } catch (error) {
      console.error('[ActivityTracker] Error starting uIOhook:', error)
    }
  }

  /**
   * Stop tracking user activity
   */
  stopTracking() {
    if (!this.isTracking) {
      return
    }

    console.log('[ActivityTracker] Stopping activity monitoring...')
    this.isTracking = false

    try {
      // Stop uIOhook
      uIOhook.stop()
      console.log('[ActivityTracker] uIOhook stopped')
    } catch (error) {
      console.error('[ActivityTracker] Error stopping uIOhook:', error)
    }

    // Clear interval
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log('[ActivityTracker] Inactivity checker stopped')
    }
  }

  /**
   * Set break mode to disable inactivity dialog during breaks
   */
  setBreakMode(isOnBreak) {
    this.isOnBreak = isOnBreak
    if (isOnBreak) {
      console.log('[ActivityTracker] Break mode enabled - inactivity dialog disabled')
      // Close any existing dialog when break starts
      this.closeInactivityDialog()
    } else {
      console.log('[ActivityTracker] Break mode disabled - inactivity dialog enabled')
    }
  }

  /**
   * Called when any activity is detected
   * @param {string} eventType - Type of activity event
   * @param {Object} eventData - Event data from uIOhook
   */
  onActivity(eventType = 'generic', eventData = null) {
    const now = Date.now()
    
    // If we were inactive, record the idle time duration
    if (this.inactivityStartTime !== null) {
      const idleDuration = (now - this.inactivityStartTime) / 1000 // Convert to seconds
      console.log(`[ActivityTracker] Recording idle time: ${idleDuration.toFixed(2)} seconds`)
      
      // Add idle time to performance tracker using the helper method
      if (this.performanceTracker && typeof this.performanceTracker.addIdleTime === 'function') {
        this.performanceTracker.addIdleTime(idleDuration)
      } else if (this.performanceTracker && this.performanceTracker.metrics) {
        // Fallback for older version
        this.performanceTracker.metrics.idleTime += idleDuration
        console.log(`[ActivityTracker] Total idle time now: ${this.performanceTracker.metrics.idleTime.toFixed(2)} seconds`)
      }
      
      // Reset inactivity start time
      this.inactivityStartTime = null
    }
    
    this.lastActivityTime = now
    
    // Update performance tracker metrics
    if (this.performanceTracker && !this.performanceTracker.isPaused) {
      this.updatePerformanceMetrics(eventType, eventData)
    } else if (!this.performanceTracker) {
      console.warn('[ActivityTracker] Performance tracker not initialized')
    } else if (this.performanceTracker.isPaused) {
      console.log(`[ActivityTracker] ⏸️ Performance tracker is PAUSED - ignoring ${eventType} event`)
    }
    
    // Send debug event to renderer for temporary debugging
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      const debugData = {
        type: eventType,
        timestamp: new Date().toLocaleTimeString(),
        data: null
      }
      
      if (eventData) {
        debugData.data = {
          x: eventData.x,
          y: eventData.y,
          button: eventData.button,
          keycode: eventData.keycode
        }
        
        // Add readable key name for keyboard events
        if ((eventType === 'keydown' || eventType === 'keyup') && eventData.keycode) {
          debugData.data.keyName = getKeyName(eventData.keycode)
        }
      }
      
      this.mainWindow.webContents.send('activity-debug', debugData)
    }
    
    // Close dialog if it was shown
    if (this.dialogShown) {
      this.closeInactivityDialog()
      console.log('[ActivityTracker] Activity resumed')
    }
  }

  /**
   * Update performance tracker with activity data
   * @param {string} eventType - Type of activity event
   * @param {Object} eventData - Event data
   */
  updatePerformanceMetrics(eventType, eventData) {
    if (!this.performanceTracker || !this.performanceTracker.metrics) {
      console.warn('[ActivityTracker] Performance tracker not available')
      return
    }

    try {
      const metrics = this.performanceTracker.metrics

      switch (eventType) {
        case 'mousemove':
          metrics.mouseMovements++
          break
        
        case 'click':
          // Only count 'click' events, not mousedown/mouseup to avoid double counting
          metrics.mouseClicks++
          break
        
        case 'keydown':
          metrics.keystrokes++
          break
        
        // mousedown, mouseup, wheel, keyup don't increment counters but still count as activity
        default:
          // Generic activity, no specific metric to update
          break
      }

      // Update last activity time in performance tracker
      this.performanceTracker.lastActivityTime = Date.now()
    } catch (error) {
      console.error('[ActivityTracker] Error updating performance metrics:', error)
    }
  }

  /**
   * Check if user has been inactive
   */
  checkInactivity() {
    // Check if we should still be tracking
    if (this.shouldDisableTracking()) {
      console.log('[ActivityTracker] 🚫 Non-staff portal detected during activity tracking - stopping activity tracker')
      this.stopTracking()
      return
    }
    
    // Don't show inactivity dialog during breaks
    if (this.isOnBreak) {
      return
    }
    
    const now = Date.now()
    const timeSinceLastActivity = now - this.lastActivityTime

    if (timeSinceLastActivity >= this.inactivityTimeout && !this.dialogShown) {
      this.showInactivityDialog(timeSinceLastActivity)
    }
  }

  /**
   * Show dialog when inactivity is detected
   * @param {number} inactiveTime - Time in milliseconds since last activity
   */
  showInactivityDialog(inactiveTime) {
    this.dialogShown = true
    const inactiveSeconds = Math.floor(inactiveTime / 1000)

    console.log(`[ActivityTracker] Inactivity detected: ${inactiveSeconds} seconds`)

    // Trigger screenshot capture on inactivity
    if (this.screenshotService && typeof this.screenshotService.triggerCapture === 'function') {
      console.log('[ActivityTracker] Triggering screenshot capture due to inactivity')
      this.screenshotService.triggerCapture().catch(err => {
        console.error('[ActivityTracker] Error triggering screenshot:', err)
      })
    }

    if (this.inactivityDialog && !this.inactivityDialog.isDestroyed()) {
      // Dialog already showing
      return
    }

    // Create custom dialog window
    this.inactivityDialog = new BrowserWindow({
      width: 500,
      height: 350,
      frame: false,
      resizable: false,
      transparent: false,
      alwaysOnTop: true,
      center: true,
      backgroundColor: '#1e293b',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'inactivity-dialog-preload.js')
      }
    })

    // Remove menu
    this.inactivityDialog.setMenu(null)

    // Load HTML content
    const htmlContent = this.getInactivityDialogHTML(inactiveSeconds)
    this.inactivityDialog.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`)

    // Track when dialog appeared to count from 0
    // Also use this as the start time for idle time tracking so it matches what user sees
    this.dialogAppearTime = Date.now()
    this.inactivityStartTime = this.dialogAppearTime
    console.log(`[ActivityTracker] Started tracking idle time from dialog appearance: ${new Date(this.inactivityStartTime).toLocaleTimeString()}`)

    // Update counter every second
    this.dialogUpdateInterval = setInterval(() => {
      if (this.inactivityDialog && !this.inactivityDialog.isDestroyed()) {
        const now = Date.now()
        // Count from when dialog appeared, not from last activity
        const dialogElapsedSeconds = Math.floor((now - this.dialogAppearTime) / 1000)
        
        // Send update to dialog
        this.inactivityDialog.webContents.send('update-counter', dialogElapsedSeconds)
      } else {
        this.clearDialogUpdateInterval()
      }
    }, 1000)

    // Handle window close
    this.inactivityDialog.on('closed', () => {
      this.clearDialogUpdateInterval()
      this.inactivityDialog = null
      this.dialogShown = false
      this.dialogAppearTime = null
    })

    // Listen for button clicks from the dialog
    const { ipcMain } = require('electron')
    
    ipcMain.once('inactivity-dialog:im-here', () => {
      console.log('[ActivityTracker] User clicked: I\'m Here')
      this.onActivity()
      this.closeInactivityDialog()
    })

    ipcMain.once('inactivity-dialog:take-break', () => {
      console.log('[ActivityTracker] User clicked: Take a Break')
      this.handleBreakRequest()
      this.closeInactivityDialog()
    })
  }

  /**
   * Close the inactivity dialog
   */
  closeInactivityDialog() {
    this.clearDialogUpdateInterval()
    
    // If we're closing the dialog and still have an inactivity start time,
    // record the idle time now
    if (this.inactivityStartTime !== null) {
      const now = Date.now()
      const idleDuration = (now - this.inactivityStartTime) / 1000
      console.log(`[ActivityTracker] Recording idle time on dialog close: ${idleDuration.toFixed(2)} seconds`)
      
      // Add idle time to performance tracker using the helper method
      if (this.performanceTracker && typeof this.performanceTracker.addIdleTime === 'function') {
        this.performanceTracker.addIdleTime(idleDuration)
      } else if (this.performanceTracker && this.performanceTracker.metrics) {
        // Fallback for older version
        this.performanceTracker.metrics.idleTime += idleDuration
        console.log(`[ActivityTracker] Total idle time now: ${this.performanceTracker.metrics.idleTime.toFixed(2)} seconds`)
      }
      
      this.inactivityStartTime = null
    }
    
    if (this.inactivityDialog && !this.inactivityDialog.isDestroyed()) {
      this.inactivityDialog.close()
    }
    
    this.inactivityDialog = null
    this.dialogShown = false
    this.dialogAppearTime = null
  }

  /**
   * Clear the dialog update interval
   */
  clearDialogUpdateInterval() {
    if (this.dialogUpdateInterval) {
      clearInterval(this.dialogUpdateInterval)
      this.dialogUpdateInterval = null
    }
  }

  /**
   * Get HTML content for inactivity dialog
   * @param {number} initialSeconds - Initial inactive seconds
   * @returns {string} HTML content
   */
  getInactivityDialogHTML(initialSeconds) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      overflow: hidden;
    }
    
    .dialog-container {
      text-align: center;
      padding: 40px;
      width: 100%;
    }
    
    .icon {
      font-size: 64px;
      margin-bottom: 20px;
      animation: pulse 2s ease-in-out infinite;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }
    
    h1 {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 10px;
      color: #fbbf24;
    }
    
    .message {
      font-size: 16px;
      color: #cbd5e1;
      margin-bottom: 20px;
      line-height: 1.5;
    }
    
    .counter {
      font-size: 48px;
      font-weight: 700;
      color: #f59e0b;
      margin: 20px 0;
      text-shadow: 0 0 20px rgba(245, 158, 11, 0.5);
    }
    
    .counter-label {
      font-size: 14px;
      color: #94a3b8;
      margin-bottom: 30px;
    }
    
    .button-container {
      display: flex;
      gap: 15px;
      justify-content: center;
      margin-top: 30px;
    }
    
    button {
      padding: 12px 32px;
      font-size: 16px;
      font-weight: 600;
      border: none;
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
    }
    
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
    }
    
    button:active {
      transform: translateY(0);
    }
    
    .btn-primary {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
    }
    
    .btn-primary:hover {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    }
    
    .btn-secondary {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
    }
    
    .btn-secondary:hover {
      background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
    }
  </style>
</head>
<body>
  <div class="dialog-container">
    <div class="icon">⚠️</div>
    <h1>No Activity Detected</h1>
    <p class="message">You have been inactive for</p>
    <div class="counter" id="counter">0s</div>
    <p class="counter-label">Are you still there?</p>
    
    
  </div>
  
  <script>
    const counterElement = document.getElementById('counter');
    
    // Listen for counter updates
    window.electronAPI.onUpdateCounter((seconds) => {
      counterElement.textContent = window.electronAPI.formatTime(seconds);
    });
    
    function handleImHere() {
      window.electronAPI.sendImHere();
    }
    
    function handleTakeBreak() {
      window.electronAPI.sendTakeBreak();
    }
  </script>
</body>
</html>
    `
  }

  /**
   * Handle when user wants to take a break
   */
  handleBreakRequest() {
    console.log('[ActivityTracker] User requested break')
    
    // Send message to renderer to start a break
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('activity-tracker:break-requested')
    }
    
    // Reset activity timer
    this.onActivity()
  }

  /**
   * Get current activity status
   * @returns {Object} Status object with last activity time and inactivity duration
   */
  getStatus() {
    const now = Date.now()
    const timeSinceLastActivity = now - this.lastActivityTime

    return {
      isTracking: this.isTracking,
      lastActivityTime: this.lastActivityTime,
      inactivityDuration: timeSinceLastActivity,
      isInactive: timeSinceLastActivity >= this.inactivityTimeout,
      inactiveSeconds: Math.floor(timeSinceLastActivity / 1000)
    }
  }

  /**
   * Set custom inactivity timeout
   * @param {number} milliseconds - Timeout in milliseconds
   */
  setInactivityTimeout(milliseconds) {
    console.log(`[ActivityTracker] Setting inactivity timeout to ${milliseconds}ms`)
    this.inactivityTimeout = milliseconds
  }

  /**
   * Check if tracking should be disabled based on current URL
   * Only staff portal users should have tracking enabled
   */
  shouldDisableTracking() {
    try {
      if (!this.mainWindow) {
        return false // Default to allowing tracking if we can't determine
      }
      
      const currentUrl = this.mainWindow.webContents.getURL()
      
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
      console.error('[ActivityTracker] Error checking URL:', error)
      return false // Default to allowing tracking if we can't determine
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    console.log('[ActivityTracker] Destroying activity tracker...')
    this.stopTracking()
    this.closeInactivityDialog()
    this.mainWindow = null
  }
}

// Export singleton instance
const activityTracker = new ActivityTracker()

module.exports = activityTracker
