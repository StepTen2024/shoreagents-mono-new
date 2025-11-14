/**
 * Screenshot Service
 * Automatically captures screenshots:
 * - Every 1 minute (scheduled)
 * - When user is inactive for 30+ seconds
 */

const { screen, desktopCapturer, net } = require('electron')
const FormData = require('form-data') // Node.js FormData (not browser FormData)

class ScreenshotService {
  constructor() {
    this.isEnabled = false
    this.sessionToken = null
    this.staffUserId = null // Store staff user ID for direct authentication
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
    console.log('[ScreenshotService] Config received:', config)
    console.log('[ScreenshotService] Current API URL (before):', this.apiUrl)
    this.apiUrl = config.apiUrl || this.apiUrl
    console.log('[ScreenshotService] API URL (after):', this.apiUrl)
    return Promise.resolve()
  }

  /**
   * Fetch staff user ID from the API using session token
   */
  async fetchStaffUserId() {
    return new Promise((resolve, reject) => {
      try {
        console.log('[ScreenshotService] Fetching staff user ID from API...')
        
        const request = net.request({
          method: 'GET',
          url: `${this.apiUrl}/api/staff/profile`
        })

        // Set cookie header if we have a session token
        if (this.sessionToken) {
          request.setHeader('Cookie', `authjs.session-token=${this.sessionToken}`)
        }

        let responseData = ''

        request.on('response', (response) => {
          response.on('data', (chunk) => {
            responseData += chunk.toString()
          })

          response.on('end', () => {
            if (response.statusCode >= 200 && response.statusCode < 300) {
              try {
                const result = JSON.parse(responseData)
                if (result.staffUser && result.staffUser.id) {
                  this.staffUserId = result.staffUser.id
                  console.log('[ScreenshotService] ✅ Staff user ID fetched:', this.staffUserId)
                  resolve(this.staffUserId)
                } else {
                  console.error('[ScreenshotService] ❌ No staff user ID in response')
                  resolve(null)
                }
              } catch (parseError) {
                console.error('[ScreenshotService] Error parsing profile response:', parseError)
                resolve(null)
              }
            } else {
              console.error('[ScreenshotService] ❌ Failed to fetch staff user ID:', response.statusCode)
              resolve(null)
            }
          })
        })

        request.on('error', (error) => {
          console.error('[ScreenshotService] Request error:', error)
          resolve(null)
        })

        request.end()
      } catch (error) {
        console.error('[ScreenshotService] Error fetching staff user ID:', error)
        resolve(null)
      }
    })
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

    // Fetch staff user ID for reliable authentication
    await this.fetchStaffUserId()

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
   * Upload screenshot to server using Electron's net module (Node.js compatible)
   */
  async uploadScreenshot(imageBuffer, filename, timestamp) {
    return new Promise((resolve, reject) => {
      try {
        const sizeKB = (imageBuffer.length / 1024).toFixed(1)
        const uploadUrl = `${this.apiUrl}/api/screenshots`
        console.log(`[Screenshots API] ======================================`)
        console.log(`[Screenshots API] Uploading screenshot: ${filename} (${sizeKB} KB)`)
        console.log(`[Screenshots API] API URL: ${this.apiUrl}`)
        console.log(`[Screenshots API] Full upload URL: ${uploadUrl}`)
        console.log(`[Screenshots API] Has session token: ${!!this.sessionToken}`)
        console.log(`[Screenshots API] ======================================`)
        
        // Create Node.js FormData
        const formData = new FormData()
        const mimeType = filename.endsWith('.jpg') ? 'image/jpeg' : 'image/png'
        
        // Append the buffer directly (Node.js FormData can handle buffers)
        formData.append('screenshot', imageBuffer, {
          filename: filename,
          contentType: mimeType
        })
        formData.append('timestamp', timestamp.toString())
        
        // ✅ Send staffUserId for direct authentication (more reliable than cookies)
        if (this.staffUserId) {
          formData.append('staffUserId', this.staffUserId)
          console.log('[Screenshots API] Sending with staffUserId:', this.staffUserId)
        } else {
          console.log('[Screenshots API] No staffUserId - will rely on session cookie')
        }

        // Use Electron's net module for HTTP request
        const request = net.request({
          method: 'POST',
          url: uploadUrl
        })

        // Set cookie header if we have a session token
        if (this.sessionToken) {
          request.setHeader('Cookie', `authjs.session-token=${this.sessionToken}`)
        }

        // Set form-data headers (including boundary)
        const headers = formData.getHeaders()
        Object.keys(headers).forEach(key => {
          request.setHeader(key, headers[key])
        })

        let responseData = ''

        request.on('response', (response) => {
          console.log(`[Screenshots API] Response status: ${response.statusCode}`)

          response.on('data', (chunk) => {
            responseData += chunk.toString()
          })

          response.on('end', () => {
            if (response.statusCode >= 200 && response.statusCode < 300) {
              try {
                const result = JSON.parse(responseData)
                console.log(`[Screenshots API] ✅ Upload successful: ${filename} (saved ${sizeKB} KB)`)
                resolve(result)
              } catch (parseError) {
                console.error('[Screenshots API] Error parsing response:', parseError)
                resolve({ success: true }) // Still consider it success if upload worked
              }
            } else {
              console.error(`[Screenshots API] ❌ Upload failed: ${response.statusCode}`)
              console.error(`[Screenshots API] Error response: ${responseData}`)
              reject(new Error(`Upload failed: ${response.statusCode} - ${responseData}`))
            }
          })

          response.on('error', (error) => {
            console.error('[Screenshots API] Response error:', error)
            reject(error)
          })
        })

        request.on('error', (error) => {
          console.error('[Screenshots API] Request error:', error)
          reject(error)
        })

        // Write the form data to the request
        formData.pipe(request)

      } catch (error) {
        console.error('[ScreenshotService] Upload error:', error)
        reject(error)
      }
    })
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
      hasStaffUserId: !!this.staffUserId,
      staffUserId: this.staffUserId,
      apiUrl: this.apiUrl,
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
    this.staffUserId = null
    this.screenshotCount = 0
  }
}

module.exports = new ScreenshotService()
