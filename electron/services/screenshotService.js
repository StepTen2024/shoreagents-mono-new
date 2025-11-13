/**
 * Screenshot Service
 * Automatically captures screenshots:
 * - Every 1 minute (scheduled)
 * - When user is inactive for 30+ seconds
 */

const { screen, desktopCapturer } = require('electron')

class ScreenshotService {
  constructor() {
    this.isEnabled = false
    this.sessionToken = null
    this.apiUrl = 'http://localhost:3000'
    this.screenshotCount = 0
    this.captureInterval = null
    this.isProcessing = false
    this.captureIntervalMs = 60000 // 1 minute
  }

  /**
   * Initialize the screenshot service
   */
  initialize(config = {}) {
    console.log('[ScreenshotService] Initializing automatic screenshot capture...')
    this.apiUrl = config.apiUrl || this.apiUrl
    return Promise.resolve()
  }

  /**
   * Start screenshot capture (scheduled + inactivity-based)
   */
  async start(sessionToken) {
    if (this.isEnabled) {
      console.log('[ScreenshotService] Already running')
      return
    }

    console.log('[ScreenshotService] Starting screenshot capture service')
    this.isEnabled = true
    this.sessionToken = sessionToken
    this.screenshotCount = 0

    // Capture immediately on start
    console.log('[ScreenshotService] 📸 Capturing initial screenshot...')
    await this.captureAllScreens('initial')

    // Set up scheduled capture every 1 minute
    this.captureInterval = setInterval(async () => {
      if (this.isEnabled) {
        console.log('[ScreenshotService] ⏰ Scheduled capture triggered (1 minute interval)')
        await this.captureAllScreens('scheduled')
      }
    }, this.captureIntervalMs)

    console.log('[ScreenshotService] ✅ Screenshot capture enabled:')
    console.log('   📅 Scheduled: Every 1 minute')
    console.log('   ⚠️  Inactivity: When idle for 30+ seconds')
  }

  /**
   * Trigger screenshot capture (called by activity tracker when inactivity detected)
   */
  async triggerCapture() {
    if (!this.isEnabled || this.isProcessing) {
      console.log('[ScreenshotService] Cannot trigger capture - disabled or already processing')
      return
    }

    console.log('[ScreenshotService] ⚠️  Inactivity detected - capturing screenshots')
    await this.captureAllScreens('inactivity')
  }

  /**
   * Capture screenshots from all displays
   * @param {string} captureType - Type of capture: 'scheduled', 'inactivity', or 'initial'
   */
  async captureAllScreens(captureType = 'manual') {
    if (this.isProcessing) {
      console.log('[ScreenshotService] Still processing previous capture, skipping...')
      return
    }

    this.isProcessing = true

    try {
      const displays = screen.getAllDisplays()
      const typeEmoji = captureType === 'scheduled' ? '⏰' : captureType === 'inactivity' ? '⚠️' : '📸'
      console.log(`[ScreenshotService] ${typeEmoji} Capturing ${displays.length} display(s) (${captureType})`)
      
      // Capture each display
      const capturePromises = displays.map((display, index) => 
        this.captureDisplay(display, index)
      )
      
      await Promise.all(capturePromises)
      
      console.log(`[ScreenshotService] ✅ Capture cycle complete (total screenshots: ${this.screenshotCount})`)
    } catch (err) {
      console.error('[ScreenshotService] Error capturing screens:', err)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Capture a specific display
   */
  async captureDisplay(display, displayIndex) {
    try {
      // Calculate reduced size (50% of original for optimization)
      const scaleFactor = 0.5
      const width = Math.floor(display.bounds.width * scaleFactor)
      const height = Math.floor(display.bounds.height * scaleFactor)

      // Get all screen sources with reduced resolution
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {
          width: width,
          height: height
        }
      })

      // Find the source that matches this display
      let source = null
      
      // Try to match by display ID first
      if (display.id) {
        source = sources.find(s => s.display_id === display.id.toString())
      }
      
      // Fall back to using index
      if (!source && sources[displayIndex]) {
        source = sources[displayIndex]
      }

      if (!source) {
        console.warn(`[ScreenshotService] Could not find source for display ${displayIndex}`)
        return
      }

      const image = source.thumbnail
      if (!image || image.isEmpty()) {
        console.warn(`[ScreenshotService] Empty image for display ${displayIndex}`)
        return
      }

      // Convert to JPEG with 70% quality (much smaller than PNG)
      const imageBuffer = image.toJPEG(70)
      
      // Generate filename with display info
      const timestamp = Date.now()
      const displayLabel = displayIndex === 0 ? 'primary' : `secondary_${displayIndex}`
      const filename = `screenshot_${displayLabel}_${timestamp}.jpg`
      
      const sizeKB = (imageBuffer.length / 1024).toFixed(1)
      console.log(`[ScreenshotService] Captured display ${displayIndex} (${displayLabel}): ${sizeKB} KB (${width}x${height})`)
      
      // Upload to server
      await this.uploadScreenshot(imageBuffer, filename, timestamp)
      
      this.screenshotCount++
    } catch (err) {
      console.error(`[ScreenshotService] Error capturing display ${displayIndex}:`, err)
    }
  }

  /**
   * Upload screenshot to server
   */
  async uploadScreenshot(imageBuffer, filename, timestamp) {
    try {
      // Create FormData with the image
      const formData = new FormData()
      const mimeType = filename.endsWith('.jpg') ? 'image/jpeg' : 'image/png'
      const blob = new Blob([imageBuffer], { type: mimeType })
      formData.append('screenshot', blob, filename)
      formData.append('timestamp', timestamp.toString())

      const sizeKB = (imageBuffer.length / 1024).toFixed(1)
      console.log(`[Screenshots API] Uploading screenshot: ${filename} (${sizeKB} KB)`)

      const response = await fetch(`${this.apiUrl}/api/screenshots`, {
        method: 'POST',
        headers: {
          'Cookie': this.sessionToken ? `authjs.session-token=${this.sessionToken}` : ''
        },
        body: formData
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Upload failed: ${response.status} - ${error}`)
      }

      const result = await response.json()
      console.log(`[Screenshots API] Upload successful: ${filename} (saved ${sizeKB} KB)`)
      
      return result
    } catch (error) {
      console.error('[ScreenshotService] Upload error:', error)
      throw error
    }
  }

  /**
   * Manually trigger capture now
   */
  async captureNow() {
    await this.captureAllScreens('manual')
    return { 
      success: true, 
      message: 'Screenshot capture triggered',
      count: this.screenshotCount
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isEnabled: this.isEnabled,
      mode: 'hybrid', // Scheduled (1 min) + Inactivity (30+ sec)
      scheduledInterval: `${this.captureIntervalMs / 1000} seconds`,
      inactivityTrigger: '30+ seconds',
      screenshotCount: this.screenshotCount,
      hasSessionToken: !!this.sessionToken,
      isMonitoring: this.isEnabled,
      isProcessing: this.isProcessing
    }
  }

  /**
   * Stop screenshot capture
   */
  stop() {
    console.log('[ScreenshotService] Stopping screenshot capture')
    this.isEnabled = false
    
    // Clear scheduled capture interval
    if (this.captureInterval) {
      clearInterval(this.captureInterval)
      this.captureInterval = null
      console.log('[ScreenshotService] Scheduled capture interval cleared')
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    console.log('[ScreenshotService] Cleaning up')
    this.stop()
    this.sessionToken = null
    this.screenshotCount = 0
  }
}

module.exports = new ScreenshotService()
