/**
 * Sync Service
 * 
 * Handles syncing performance metrics to the API
 */

const { net } = require('electron')
const config = require('../config/trackerConfig')

class SyncService {
  constructor() {
    this.queue = []
    this.isSyncing = false
    this.syncInterval = null
    this.sessionToken = null
    this.retryCount = 0
    this.lastSyncTime = null
    this.syncEnabled = true
  }

  /**
   * Start the sync service
   */
  start(sessionToken) {
    if (this.syncInterval) {
      this.log('Sync service already running')
      return
    }

    this.sessionToken = sessionToken
    this.syncEnabled = true
    
    this.log('Starting sync service...')
    
    // Sync immediately
    this.sync()
    
    // Then sync periodically
    this.syncInterval = setInterval(() => {
      this.sync()
    }, config.SYNC_INTERVAL)
    
    this.log('Sync service started')
  }

  /**
   * Stop the sync service
   */
  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
    
    this.syncEnabled = false
    this.log('Sync service stopped')
  }

  /**
   * Set session token for authentication
   */
  setSessionToken(token) {
    this.sessionToken = token
    this.log('Session token updated')
  }

  /**
   * Sync metrics to API
   */
  async sync() {
    if (!this.syncEnabled || this.isSyncing) {
      return
    }

    this.isSyncing = true
    this.log('Starting sync...')

    try {
      // Get metrics from tracker
      const performanceTracker = require('./performanceTracker')
      const metrics = performanceTracker.getMetricsForAPI()

      // Send to API (will automatically get session cookie)
      const success = await this.sendMetrics(metrics)
      
      if (success) {
        this.lastSyncTime = Date.now()
        this.retryCount = 0
        this.log('Sync successful')
      } else {
        this.handleSyncFailure()
      }
    } catch (error) {
      this.log(`Sync error: ${error.message}`)
      this.handleSyncFailure()
    } finally {
      this.isSyncing = false
    }
  }

  /**
   * Get session cookie from Electron's cookie store
   */
  async getSessionCookie() {
    const { session } = require('electron')
    
    try {
      const cookies = await session.defaultSession.cookies.get({
        url: config.API_BASE_URL
      })
      
      // Try different possible cookie names
      const possibleNames = [
        'next-auth.session-token',
        'authjs.session-token',
        '__Secure-next-auth.session-token',
        '__Secure-authjs.session-token'
      ]
      
      for (const name of possibleNames) {
        const cookie = cookies.find(c => c.name === name)
        if (cookie) {
          this.log(`Found session cookie: ${name}`)
          return cookie.value
        }
      }
      
      this.log('No session cookie found in Electron cookie store')
      this.log(`Available cookies: ${cookies.map(c => c.name).join(', ')}`)
      return null
    } catch (error) {
      this.log(`Error getting cookies: ${error.message}`)
      return null
    }
  }

  /**
   * Send metrics to API
   */
  async sendMetrics(metrics) {
    return new Promise(async (resolve) => {
      const url = `${config.API_BASE_URL}${config.API_PERFORMANCE_ENDPOINT}`
      
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🚀 [SyncService] SENDING METRICS TO API')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`📍 URL: ${url}`)
      console.log(`📊 Metrics Summary:`)
      console.log(`   🖱️  Mouse: ${metrics.mouseMovements} movements, ${metrics.mouseClicks} clicks`)
      console.log(`   ⌨️  Keystrokes: ${metrics.keystrokes}`)
      console.log(`   ✅ Active Time: ${metrics.activeTime} min`)
      console.log(`   🖥️  Screen Time: ${metrics.screenTime} min`)
      console.log(`   🌐 URLs: ${metrics.urlsVisited} count, ${metrics.visitedUrls?.length || 0} array items`)
      console.log(`   📱 Apps: ${metrics.applicationsUsed?.length || 0} apps`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
      
      // Check if session cookie exists (for logging purposes)
      const sessionToken = await this.getSessionCookie()
      if (!sessionToken) {
        console.log('⚠️  [SyncService] Warning: No session cookie found, request may fail with 401')
      } else {
        console.log('✅ [SyncService] Session cookie found, proceeding with sync')
      }
      
      // Create request
      const request = net.request({
        method: 'POST',
        url: url
      })

      // Set headers
      request.setHeader('Content-Type', 'application/json')
      
      // Manually set cookie if available
      if (sessionToken) {
        // Try to find the exact cookie name that was found
        const { session } = require('electron')
        const cookies = await session.defaultSession.cookies.get({ url: config.API_BASE_URL })
        const sessionCookie = cookies.find(c => c.name === 'authjs.session-token' || c.name === 'next-auth.session-token')
        
        if (sessionCookie) {
          request.setHeader('Cookie', `${sessionCookie.name}=${sessionCookie.value}`)
          this.log(`Set cookie header: ${sessionCookie.name}`)
        }
      }

      // Handle response
      request.on('response', (response) => {
        let data = ''

        response.on('data', (chunk) => {
          data += chunk
        })

        response.on('end', () => {
          if (response.statusCode >= 200 && response.statusCode < 300) {
            console.log(`✅ [SyncService] Metrics sent successfully! Status: ${response.statusCode}`)
            try {
              const parsed = JSON.parse(data)
              if (parsed.metric) {
                console.log(`📊 [SyncService] Server confirmed update:`)
                console.log(`   🖱️  Mouse: ${parsed.metric.mouseMovements} movements, ${parsed.metric.mouseClicks} clicks`)
                console.log(`   ⌨️  Keystrokes: ${parsed.metric.keystrokes}`)
                console.log(`   🌐 URLs: ${parsed.metric.urlsVisited}`)
              }
            } catch (e) {
              // Ignore parse errors
            }
            resolve(true)
          } else {
            console.error(`❌ [SyncService] API returned error: ${response.statusCode}`)
            console.error(`Response body: ${data}`)
            resolve(false)
          }
        })
      })

      // Handle errors
      request.on('error', (error) => {
        this.log(`Network error: ${error.message}`)
        resolve(false)
      })

      // Send the data
      request.write(JSON.stringify(metrics))
      request.end()
    })
  }

  /**
   * Handle sync failure with retry logic
   */
  handleSyncFailure() {
    this.retryCount++
    
    if (this.retryCount < config.MAX_RETRY_ATTEMPTS) {
      this.log(`Sync failed, will retry (attempt ${this.retryCount}/${config.MAX_RETRY_ATTEMPTS})`)
      
      // Schedule retry
      setTimeout(() => {
        if (this.syncEnabled) {
          this.sync()
        }
      }, config.RETRY_DELAY * this.retryCount) // Exponential backoff
    } else {
      this.log('Max retry attempts reached, will try again on next interval')
      this.retryCount = 0
    }
  }

  /**
   * Force immediate sync
   */
  async forcSync() {
    this.log('Force sync requested')
    await this.sync()
  }

  /**
   * Get sync status
   */
  getStatus() {
    return {
      isEnabled: this.syncEnabled,
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      queueSize: this.queue.length,
      retryCount: this.retryCount,
      hasSessionToken: !!this.sessionToken,
    }
  }

  /**
   * Clear queue (for testing)
   */
  clearQueue() {
    this.queue = []
    this.log('Queue cleared')
  }

  log(message) {
    if (config.DEBUG) {
      console.log(`[SyncService] ${message}`)
    }
  }
}

module.exports = new SyncService()


