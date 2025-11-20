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
    this.staffUserId = null // ✅ Store staff user ID for direct authentication
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
   * Fetch staff user ID from the API using session token
   */
  async fetchStaffUserId() {
    if (!this.sessionToken) {
      console.warn('[ScreenshotService] ⚠️ No session token - cannot fetch staff user ID')
      return false
    }

    try {
      const profileUrl = `${this.apiUrl}/api/staff/profile`
      console.log('[ScreenshotService] ============================================')
      console.log('[ScreenshotService] 🔑 Fetching Staff User ID')
      console.log('[ScreenshotService] URL:', profileUrl)
      console.log('[ScreenshotService] Session Token:', this.sessionToken ? `${this.sessionToken.substring(0, 20)}...` : 'NONE')
      console.log('[ScreenshotService] ============================================')
      
      const request = net.request({
        method: 'GET',
        url: profileUrl
      })

      // Use correct cookie name based on environment
      const isProduction = this.apiUrl.includes('https://')
      const cookieName = isProduction ? '__Secure-authjs.session-token' : 'authjs.session-token'
      console.log('[ScreenshotService] Using cookie name:', cookieName, '(isProduction:', isProduction, ')')
      request.setHeader('Cookie', `${cookieName}=${this.sessionToken}`)

      return new Promise((resolve, reject) => {
        let responseData = ''

        request.on('response', (response) => {
          console.log('[ScreenshotService] Profile API Response Status:', response.statusCode)
          
          response.on('data', (chunk) => {
            responseData += chunk.toString()
          })

          response.on('end', () => {
            if (response.statusCode === 200) {
              try {
                const result = JSON.parse(responseData)
                if (result.success && result.staffUser) {
                  this.staffUserId = result.staffUser.id
                  console.log('[ScreenshotService] ============================================')
                  console.log('[ScreenshotService] ✅ STAFF USER ID FETCHED SUCCESSFULLY')
                  console.log('[ScreenshotService] Staff User ID:', this.staffUserId)
                  console.log('[ScreenshotService] Staff Name:', result.staffUser.name || 'N/A')
                  console.log('[ScreenshotService] ============================================')
                  resolve(true)
                } else {
                  console.error('[ScreenshotService] ============================================')
                  console.error('[ScreenshotService] ❌ Invalid response format from profile API')
                  console.error('[ScreenshotService] Response:', result)
                  console.error('[ScreenshotService] ============================================')
                  resolve(false)
                }
              } catch (error) {
                console.error('[ScreenshotService] ============================================')
                console.error('[ScreenshotService] ❌ Error parsing profile API response')
                console.error('[ScreenshotService] Parse Error:', error.message)
                console.error('[ScreenshotService] Raw Response:', responseData)
                console.error('[ScreenshotService] ============================================')
                resolve(false)
              }
            } else {
              console.error('[ScreenshotService] ============================================')
              console.error('[ScreenshotService] ❌ Failed to fetch staff user ID')
              console.error('[ScreenshotService] Status Code:', response.statusCode)
              console.error('[ScreenshotService] Response Body:', responseData)
              console.error('[ScreenshotService] ============================================')
              resolve(false)
            }
          })
        })

        request.on('error', (error) => {
          console.error('[ScreenshotService] ============================================')
          console.error('[ScreenshotService] ❌ Network error fetching staff user ID')
          console.error('[ScreenshotService] Error:', error.message)
          console.error('[ScreenshotService] Error Code:', error.code)
          console.error('[ScreenshotService] ============================================')
          resolve(false)
        })

        request.end()
      })
    } catch (error) {
      console.error('[ScreenshotService] ❌ Error in fetchStaffUserId:', error)
      return false
    }
  }

  /**
   * Start screenshot capture (scheduled + inactivity-based)
   */
  async start(sessionToken = null) {
    if (this.isEnabled) {
      console.log('[ScreenshotService] Already running')
      return
    }

    console.log('[ScreenshotService] ============================================')
    console.log('[ScreenshotService] 🚀 STARTING SCREENSHOT SERVICE')
    console.log('[ScreenshotService] API URL:', this.apiUrl)
    console.log('[ScreenshotService] Has Session Token:', !!sessionToken)
    console.log('[ScreenshotService] Environment:', process.env.NODE_ENV || 'production')
    console.log('[ScreenshotService] ============================================')
    
    this.isEnabled = true
    this.sessionToken = sessionToken
    this.screenshotCount = 0

    // Fetch staff user ID if we have a session token
    if (sessionToken) {
      const success = await this.fetchStaffUserId()
      if (!success) {
        console.warn('[ScreenshotService] ⚠️ Failed to fetch staff user ID - screenshots may not work!')
      }
    } else {
      console.warn('[ScreenshotService] ⚠️ Starting without session token - will need to update after login')
    }

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

    console.log('[ScreenshotService] ============================================')
    console.log('[ScreenshotService] ✅ Screenshot capture enabled:')
    console.log('   📅 Scheduled: Every 1 minute')
    console.log('   ⚠️  Inactivity: When idle for 30+ seconds')
    console.log(`   🔑 Staff User ID: ${this.staffUserId || 'Not set (will rely on session cookie)'}`)
    console.log(`   🌐 Upload URL: ${this.apiUrl}/api/screenshots`)
    console.log('[ScreenshotService] ============================================')
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
        
        console.log(`[Screenshots API] ============================================`)
        console.log(`[Screenshots API] 📤 UPLOAD ATTEMPT`)
        console.log(`[Screenshots API] URL: ${uploadUrl}`)
        console.log(`[Screenshots API] File: ${filename}`)
        console.log(`[Screenshots API] Size: ${sizeKB} KB`)
        console.log(`[Screenshots API] Has Session Token: ${!!this.sessionToken}`)
        console.log(`[Screenshots API] Has Staff User ID: ${!!this.staffUserId}`)
        if (this.staffUserId) {
          console.log(`[Screenshots API] Staff User ID: ${this.staffUserId}`)
        }
        console.log(`[Screenshots API] ============================================`)
        
        // Create Node.js FormData
        const formData = new FormData()
        const mimeType = filename.endsWith('.jpg') ? 'image/jpeg' : 'image/png'
        
        // Append the buffer directly (Node.js FormData can handle buffers)
        formData.append('screenshot', imageBuffer, {
          filename: filename,
          contentType: mimeType
        })
        formData.append('timestamp', timestamp.toString())
        
        // ✅ Send staffUserId for direct authentication (works in installer!)
        if (this.staffUserId) {
          formData.append('staffUserId', this.staffUserId)
          console.log('[Screenshots API] ✅ Including staffUserId in request')
        } else {
          console.warn('[Screenshots API] ⚠️ No staffUserId - relying on session cookie (may not work in installer!)')
        }

        // Use Electron's net module for HTTP request
        const request = net.request({
          method: 'POST',
          url: uploadUrl
        })

        // Set cookie header if we have a session token
        if (this.sessionToken) {
          const isProduction = this.apiUrl.includes('https://')
          const cookieName = isProduction ? '__Secure-authjs.session-token' : 'authjs.session-token'
          request.setHeader('Cookie', `${cookieName}=${this.sessionToken}`)
        }

        // Set form-data headers (including boundary)
        const headers = formData.getHeaders()
        Object.keys(headers).forEach(key => {
          request.setHeader(key, headers[key])
        })

        let responseData = ''

        request.on('response', (response) => {
          console.log(`[Screenshots API] 📥 Response received - Status: ${response.statusCode}`)
          console.log(`[Screenshots API] Response headers:`, response.headers)

          response.on('data', (chunk) => {
            responseData += chunk.toString()
          })

          response.on('end', () => {
            console.log(`[Screenshots API] Response body length: ${responseData.length} chars`)
            
            if (response.statusCode >= 200 && response.statusCode < 300) {
              try {
                const result = JSON.parse(responseData)
                console.log(`[Screenshots API] ✅ SUCCESS - ${filename} uploaded (${sizeKB} KB)`)
                console.log(`[Screenshots API] Response data:`, result)
                resolve(result)
              } catch (parseError) {
                console.error('[Screenshots API] ⚠️ Error parsing success response:', parseError)
                console.error('[Screenshots API] Raw response:', responseData)
                resolve({ success: true }) // Still consider it success if upload worked
              }
            } else {
              console.error(`[Screenshots API] ============================================`)
              console.error(`[Screenshots API] ❌ UPLOAD FAILED`)
              console.error(`[Screenshots API] Status Code: ${response.statusCode}`)
              console.error(`[Screenshots API] Status Message: ${response.statusMessage}`)
              console.error(`[Screenshots API] Response Body: ${responseData}`)
              console.error(`[Screenshots API] ============================================`)
              reject(new Error(`Upload failed: ${response.statusCode} - ${responseData}`))
            }
          })

          response.on('error', (error) => {
            console.error('[Screenshots API] ❌ Response stream error:', error)
            console.error('[Screenshots API] Error details:', error.message, error.stack)
            reject(error)
          })
        })

        request.on('error', (error) => {
          console.error(`[Screenshots API] ============================================`)
          console.error(`[Screenshots API] ❌ REQUEST ERROR`)
          console.error(`[Screenshots API] Error type: ${error.name}`)
          console.error(`[Screenshots API] Error message: ${error.message}`)
          console.error(`[Screenshots API] Error code: ${error.code}`)
          console.error(`[Screenshots API] Full error:`, error)
          console.error(`[Screenshots API] ============================================`)
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
   * Update session token and fetch staff user ID (called after login)
   */
  async updateSessionToken(sessionToken) {
    console.log('[ScreenshotService] ============================================')
    console.log('[ScreenshotService] 🔄 UPDATING SESSION TOKEN')
    console.log('[ScreenshotService] Has New Token:', !!sessionToken)
    console.log('[ScreenshotService] ============================================')
    
    this.sessionToken = sessionToken
    
    if (sessionToken) {
      const success = await this.fetchStaffUserId()
      if (success) {
        console.log('[ScreenshotService] ✅ Session token updated and staff user ID fetched')
      } else {
        console.error('[ScreenshotService] ❌ Failed to fetch staff user ID after token update')
      }
    } else {
      console.warn('[ScreenshotService] ⚠️ Session token cleared')
      this.staffUserId = null
    }
  }

  /**
   * Set staff user ID directly (called from renderer after login)
   * This is more reliable than fetching from API in production
   */
  setStaffUserId(staffUserId) {
    console.log('[ScreenshotService] ============================================')
    console.log('[ScreenshotService] 🆔 SETTING STAFF USER ID DIRECTLY')
    console.log('[ScreenshotService] Staff User ID:', staffUserId)
    console.log('[ScreenshotService] ============================================')
    
    this.staffUserId = staffUserId
    
    if (staffUserId) {
      console.log('[ScreenshotService] ✅ Staff user ID set successfully')
    } else {
      console.warn('[ScreenshotService] ⚠️ Staff user ID cleared')
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
